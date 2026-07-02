//决定下一步
import type { AgentState } from "./state.js";


export type AgentMessage = {
    role: "user" | "assistant" | "tool" | "system";
    content: string;
    name?: string;
};

export type LlmDecision =
    | {
        type: "tool_call";
        toolName: string;
        args: Record<string, unknown>;
    }
    | {
        type: "final_answer";
    };

export async function mockLlmDecide(
    state: AgentState
): Promise<LlmDecision> {
    if (!state.summary) {
        return {
            type: "tool_call",
            toolName: "getRefundSummary",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!state.topProducts) {
        return {
            type: "tool_call",
            toolName: "getTopRefundProducts",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
                limit: 5,
            },
        };
    }

    if (!state.reasons) {
        return {
            type: "tool_call",
            toolName: "getRefundReasons",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!state.trend) {
        return {
            type: "tool_call",
            toolName: "getRefundTrend",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!state.actionDraft && !state.pendingApproval) {
        return {
            type: "tool_call",
            toolName: "createRefundActionDraft",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                actionType: "create_ticket",
                reason: "Refund trend increased. Review product descriptions, packaging, and carrier performance.",
            },
        };
    }

    return {
        type: "final_answer",
    };
}