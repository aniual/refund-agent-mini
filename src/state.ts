//定义业务数据和 Agent 状

export type RefundSummary = {
    shop: string;
    days: number;
    refundAmount: number;
    refundCount: number;
    refundRate: string;
    orderCount: number;
}


export type RefundedProduct = {
    productName: string;
    refundAmount: number;
    refundCount: number;
};

export type RefundReason = {
    reason: string;
    percentage: string;
};

export type RefundTrendPoint = {
    week: string;
    refundAmount: number;
};

export type RefundActionDraft = {
    status: "draft_created";
    shop: string;
    actionType: "create_discount" | "send_email" | "create_ticket";
    reason: string;
    message: string;
};


export type ApprovalRequest = {
    toolName: string;
    args: Record<string, unknown>;
    status: "pending";
    reason: string;
};


export type AgentState = {
    summary?: RefundSummary;
    topProducts?: RefundedProduct[];
    reasons?: RefundReason[];
    trend?: RefundTrendPoint[];
    actionDraft?: RefundActionDraft;
    pendingApproval?: ApprovalRequest;
    errors: string[];
    failedToolAttempts: Record<string, number>;
};

export function createInitialAgentState(): AgentState {
    return {
        errors: [],
        failedToolAttempts: {},
    };
}


export function applyToolResultToState(state: AgentState, toolName: string, data: unknown): void {
    switch (toolName) {
        case "getRefundSummary":
            state.summary = data as RefundSummary;
            return;
        case "getTopRefundProducts":
            state.topProducts = data as RefundedProduct[];
            return;
        case "getRefundReasons":
            state.reasons = data as RefundReason[];
            return;
        case "getRefundTrend":
            state.trend = data as RefundTrendPoint[];
            return;
        case "createRefundActionDraft":
            state.actionDraft = data as RefundActionDraft;
            state.pendingApproval = undefined;
            return;
        default:
            state.errors.push(`No state handler for tool: ${toolName}`);
    }
}