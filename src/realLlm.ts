import OpenAI from "openai";
import type { AgentState } from "./state.js";
import type { LlmDecision } from "./mockLlm.js";

// 文件作用：
// 1. 把 tools.ts 里的工具定义转换成模型能理解的 tool schema
// 2. 调用 Ollama
// 3. 解析模型返回的 tool call
// 4. 返回 LlmDecision


const client = new OpenAI({
    baseURL: "http://localhost:11434/v1",
    apiKey: "ollama",
});


const MODEL = process.env.OLLAMA_MODEL  ?? "qwen2.5:7b";


type ChatMessage = {
    role: "system" | "user" | "assistant" | "tool";
    content: string;
    name?: string;
}

const ollamaTools: OpenAI.Chat.ChatCompletionTool[] = [
    {
        type: "function",
        function: {
            name: "getRefundSummary",
            description: "Get refund summary for a Shopify store within a date range.",
            parameters: {
                type: "object",
                properties: {
                    shop: {
                        type: "string",
                        description: "Shopify shop domain",
                    },
                    days: {
                        type: "number",
                        description: "Number of days to analyze",
                    },
                },
                required: ["shop", "days"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getTopRefundProducts",
            description:
                "Get top refunded products for a Shopify store.",
            parameters: {
                type: "object",
                properties: {
                    shop: {
                        type: "string",
                        description: "Shopify shop domain",
                    },
                    days: {
                        type: "number",
                        description: "Number of days to analyze",
                    },
                    limit: {
                        type: "number",
                        description: "Maximum number of products to return",
                    },
                },
                required: ["shop", "days", "limit"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getRefundReasons",
            description:
                "Get major refund reasons for a Shopify store.",
            parameters: {
                type: "object",
                properties: {
                    shop: {
                        type: "string",
                        description: "Shopify shop domain",
                    },
                    days: {
                        type: "number",
                        description: "Number of days to analyze",
                    },
                },
                required: ["shop", "days"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "getRefundTrend",
            description:
                "Get weekly refund trend for a Shopify store.",
            parameters: {
                type: "object",
                properties: {
                    shop: {
                        type: "string",
                        description: "Shopify shop domain",
                    },
                    days: {
                        type: "number",
                        description: "Number of days to analyze",
                    },
                },
                required: ["shop", "days"],
                additionalProperties: false,
            },
        },
    },
    {
        type: "function",
        function: {
            name: "createRefundActionDraft",
            description:
                "Create a draft action plan for refund reduction. This does not execute real refunds.",
            parameters: {
                type: "object",
                properties: {
                    shop: {
                        type: "string",
                        description: "Shopify shop domain",
                    },
                    actionType: {
                        type: "string",
                        enum: ["create_discount", "send_email", "create_ticket"],
                    },
                    reason: {
                        type: "string",
                        description: "Why this action draft is recommended",
                    },
                },
                required: ["shop", "actionType", "reason"],
                additionalProperties: false,
            },
        },
    },
];


function buildSystemPrompt(state: AgentState): string {
    return `
You are a Shopify refund analysis agent.

Your job:
1. Analyze refund performance.
2. Use tools to fetch missing data.
3. Do not invent refund data.
4. Call only one tool at a time.
5. If all required data exists, return a final answer.
6. If refund trend is increasing, you may propose createRefundActionDraft.
7. Never request real refunds or payment status changes.

Current structured state:
${JSON.stringify(state, null, 2)}
Decision rules:
- If summary is missing, call getRefundSummary.
- If topProducts is missing, call getTopRefundProducts.
- If reasons is missing, call getRefundReasons.
- If trend is missing, call getRefundTrend.
- If summary, topProducts, reasons, and trend exist, and no actionDraft or pendingApproval exists, call createRefundActionDraft.
- If pendingApproval exists, do not call createRefundActionDraft again.
- If actionDraft exists or pendingApproval exists, provide final answer.
`.trim();;
}

function safeParseToolArgs(rawArgs: string | undefined): Record<string, unknown> {

    if (!rawArgs) {
        return {};
    }

    try {
        const parsed = JSON.parse(rawArgs);
        if (
            parsed !== null &&
            typeof parsed === "object" &&
            !Array.isArray(parsed)
        ) {
            return parsed as Record<string, unknown>;
        }
        return {};
    } catch (error) {
        return {};
    }
}

export async function realLlmDecide(state: AgentState): Promise<LlmDecision> {
    const messages: ChatMessage[] = [
        {
          role: "system",
          content: buildSystemPrompt(state),
        },
        {
          role: "user",
          content:
            "Please analyze my Shopify store refund performance in the last 30 days.",
        },
      ];


    const response = await client.chat.completions.create({
        model: MODEL,
        messages,
        tools: ollamaTools,
        tool_choice: "auto",
        temperature: 0,
    });

    const message = response.choices[0].message;
    const toolCall = message.tool_calls?.[0];

    if (toolCall?.type === "function") {
        return {
            type: "tool_call",
            toolName: toolCall.function.name,
            args: safeParseToolArgs(toolCall.function.arguments),
        }
    }

    return {
        type: "final_answer",
    }

}