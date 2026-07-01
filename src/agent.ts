import { mockLlmDecide, type AgentMessage } from "./mockLlm.js";
import { tools } from "./tools.js";

export type AgentRunOptions = {
    userInput: string;
    maxSteps?: number;
    autoApproveWriteTools?: boolean;
}

type AuditLogEntry = {
    step: number;
    toolName: string;
    riskLevel: string;
    requiresApproval: boolean;
    approved: boolean;
    args: Record<string, unknown>;
    success: boolean;
    error?: string;
    timestamp: string;
}

export async function runRefundAgent(options: AgentRunOptions) {
    const maxSteps = options.maxSteps ?? 8;
    const autoApproveWriteTools = options.autoApproveWriteTools ?? false;

    const messages: AgentMessage[] = [
        {
            role: "system",
            content: `
                You are a Shopify refund analysis agent.
You must not invent business data.
If refund data is needed, call tools first.
Read-only tools can be executed automatically.
Write tools require human approval unless autoApproveWriteTools is enabled.
Dangerous tools must never be executed automatically.
After all required data is collected, produce a practical business analysis.
            `.trim(),
        },
        {
            role: "user",
            content: options.userInput,
        }
    ];

    const trace: Array<Record<string, unknown>> = [];
    const auditLogs: AuditLogEntry[] = [];

    for (let step = 1; step <= maxSteps; step++) {
        console.log(`\n--- Agent Step ${step} ---`);

        const decision = await mockLlmDecide(messages);

        trace.push({
            step,
            decision,
        });

        if (decision.type === 'tool_call') {
            const tool = tools[decision.toolName];

            if (!tool) {
                throw new Error(`Tool ${decision.toolName} not found`);
            }

            const approved = !tool.requiresApproval || (tool.riskLevel === "write" && autoApproveWriteTools);

            if (tool.riskLevel === "dangerous") {
                const error = `Dangerous tool blocked: ${decision.toolName}`;

                auditLogs.push({
                    step,
                    toolName: decision.toolName,
                    riskLevel: tool.riskLevel,
                    requiresApproval: tool.requiresApproval,
                    approved,
                    args: decision.args,
                    success: false,
                    error,
                    timestamp: new Date().toISOString(),
                });

                messages.push({
                    role: "tool",
                    name: decision.toolName,
                    content: JSON.stringify(
                        {
                            success: false,
                            error,
                        },
                        null,
                        2,
                    ),
                });
                continue;
            }

            if (!approved) {
                const error = `Tool requires human approval: ${decision.toolName}`;

                console.log(error);

                auditLogs.push({
                    step,
                    toolName: decision.toolName,
                    riskLevel: tool.riskLevel,
                    requiresApproval: tool.requiresApproval,
                    approved,
                    args: decision.args,
                    success: false,
                    error,
                    timestamp: new Date().toISOString(),
                });

                messages.push({
                    role: "tool",
                    name: decision.toolName,
                    content: JSON.stringify(
                        {
                            success: false,
                            error,
                            approvalRequired: true,
                        },
                        null,
                        2,
                    ),
                });

                continue;
            }

            console.log(`Calling tool: ${decision.toolName}`);
            console.log(`Risk level: ${tool.riskLevel}`);
            console.log(`Args: ${JSON.stringify(decision.args, null, 2)}`);

            const result = await tool.execute(decision.args);

            console.log(`Tool result: ${JSON.stringify(result, null, 2)}`);

            auditLogs.push({
                step,
                toolName: decision.toolName,
                riskLevel: tool.riskLevel,
                requiresApproval: tool.requiresApproval,
                approved,
                args: decision.args,
                success: result.success,
                error: result.error,
                timestamp: new Date().toISOString(),
            });


            messages.push({
                role: "tool",
                name: decision.toolName,
                content: JSON.stringify(result.data ?? result.error, null, 2),
            });
            continue;
        }

        if (decision.type === 'final_answer') {
            console.log(`\n--- Final Answer ---`);

            return {
                answer: decision.content,
                messages,
                trace,
                auditLogs,
            };
        }
    }

    throw new Error(`Agent reached max steps of ${maxSteps}`);
}