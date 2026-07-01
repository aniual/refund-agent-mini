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
        content: string;
    };

export async function mockLlmDecide(
    messages: AgentMessage[]
): Promise<LlmDecision> {
    const toolMessages = messages.filter((message) => message.role === "tool");

    const hasSummary = toolMessages.some(
        (message) => message.name === "getRefundSummary"
    );

    const hasTopProducts = toolMessages.some(
        (message) => message.name === "getTopRefundProducts"
    );

    const hasReason = toolMessages.some(
        (message) => message.name === "getRefundReasons"
    );

    const hasRefundTrend  = toolMessages.some(
        (message) => message.name === "getRefundTrend"
    );

    const hasActionDraft = toolMessages.some(
        (message) => message.name === "createRefundActionDraft"
    );

    if (!hasSummary) {
        return {
            type: "tool_call",
            toolName: "getRefundSummary",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!hasTopProducts) {
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

    if (!hasReason) {
        return {
            type: "tool_call",
            toolName: "getRefundReasons",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!hasRefundTrend ) {
        return {
            type: "tool_call",
            toolName: "getRefundTrend",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                days: 30,
            },
        };
    }

    if (!hasActionDraft) {
        return {
            type: "tool_call",
            toolName: "createRefundActionDraft",
            args: {
                shop: "demo-furniture-store.myshopify.com",
                actionType: "create_ticket",
                reason: "Refund trend increased from Week 1 to Week 4. Merchant should review product description, packaging, and carrier performance.",
            },
        };
    }

    const summary = toolMessages.find(
        (message) => message.name === "getRefundSummary"
    );

    const products = toolMessages.find(
        (message) => message.name === "getTopRefundProducts"
    );

    const reasons = toolMessages.find(
        (message) => message.name === "getRefundReasons"
    );

    const refund = toolMessages.find(
        (message) => message.name === "getRefundTrend"
    );

    return {
        type: "final_answer",
        content: JSON.stringify(
            {
                title: "Refund Analysis Report",
                summary: summary?.content,
                topProducts: products?.content,
                reasons: reasons?.content,
                trend: refund?.content,
                riskLevel: "medium",
                recommendations: [
                    "Review Fabric Sofa Bed size description and product images.",
                    "Add size comparison visuals to product pages.",
                    "Review packaging and carrier performance for shipping damage.",
                    "Monitor refund trend weekly.",
                ],
                requiresHumanReview: true,
            },
            null,
            2
        ),
    };
}