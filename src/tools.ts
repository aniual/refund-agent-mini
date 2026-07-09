import { z } from 'zod';
//执行工具

export type ToolExecutionStatus =
    | "success"
    | "failed"
    | "approval_required"
    | "blocked";

export type ToolResult<T = unknown> = {
    status: ToolExecutionStatus;
    data?: T;
    error?: string;
}

export type ToolRiskLevel = "read" | "write" | "dangerous";

export type ToolDefinition = {
    name: string;
    description: string;
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    schema: z.ZodType;
    execute: (args: unknown) => Promise<ToolResult>;
}


export const tools: Record<string, ToolDefinition> = {
    getRefundSummary: {
        name: 'getRefundSummary',
        description: 'Get refund summary for a shop within a date range.',
        riskLevel: "read",
        requiresApproval: false,
        schema: z.object({
            shop: z.string(),
            days: z.coerce.number().int().positive(),
        }),
        execute: async (args: unknown) => {
            const parsed = tools.getRefundSummary.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    status: "failed",
                    error: "Invalid arguments for getRefundSummary",
                };
            }
            return {
                status: "success",
                data: {
                    shop: parsed.data.shop,
                    days: parsed.data.days,
                    refundAmount: 1280.5,
                    refundCount: 14,
                    refundRate: "8.2%",
                    orderCount: 171,
                },
            };
        },
    },

    getTopRefundProducts: {
        name: "getTopRefundProducts",
        description: "Get top refunded products for a shop",
        riskLevel: "read",
        requiresApproval: false,
        schema: z.object({
            shop: z.string(),
            days: z.coerce.number().int().positive(),
            limit: z.coerce.number().int().positive().default(5),
        }),
        execute: async (args: unknown) => {
            const parsed = tools.getTopRefundProducts.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    status: "failed",
                    error: "Invalid arguments for getTopRefundProducts",
                };
            }
            return {
                status: "success",
                data: [
                    {
                        productName: "Fabric Sofa Bed",
                        refundAmount: 520,
                        refundCount: 5,
                    },
                    {
                        productName: "Wooden Coffee Table",
                        refundAmount: 310,
                        refundCount: 3,
                    },
                    {
                        productName: "Dining Chair Set",
                        refundAmount: 240,
                        refundCount: 4,
                    },
                ],
            };
        }
    },

    getRefundReasons: {
        name: "getRefundReasons",
        description: "Get major refund reasons for a shop",
        riskLevel: "read",
        requiresApproval: false,
        schema: z.object({
            shop: z.string(),
            days: z.coerce.number().int().positive(),
        }),
        execute: async (args: unknown) => {
            const parsed = tools.getRefundReasons.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    status: "failed",
                    error: "Invalid arguments for getRefundReasons",
                };
            }
            return {
                status: "success",
                data: [
                    {
                        reason: "Size or dimension mismatch",
                        percentage: "36%",
                    },
                    {
                        reason: "Shipping damage",
                        percentage: "28%",
                    },
                    {
                        reason: "Changed mind",
                        percentage: "19%",
                    },
                    {
                        reason: "Other",
                        percentage: "17%",
                    },
                ],
            };
        }
    },

    getRefundTrend: {
        name: "getRefundTrend",
        description: "Get refund trend for a shop",
        riskLevel: "read",
        requiresApproval: false,
        schema: z.object({
            shop: z.string(),
            days: z.coerce.number().int().positive(),
        }),
        execute: async (args: unknown) => {
            const parsed = tools.getRefundTrend.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    status: "failed",
                    error: "Invalid arguments for getRefundTrend",
                };
            }
            return {
                status: "success",
                data: [
                    { "week": "Week 1", "refundAmount": 220 },
                    { "week": "Week 2", "refundAmount": 310 },
                    { "week": "Week 3", "refundAmount": 280 },
                    { "week": "Week 4", "refundAmount": 470 }
                ],
            };
        }
    },

    createRefundActionDraft: {
        name: "createRefundActionDraft",
        description: "Create a draft action plan for refund reduction. This does not execute real refunds.",
        riskLevel: "write",
        requiresApproval: true,
        schema: z.object({
            shop: z.string(),
            actionType: z.enum(["create_discount", "send_email", "create_ticket"]),
            reason: z.string(),
        }),
        execute: async (args: unknown) => {
            const parsed = tools.createRefundActionDraft.schema.safeParse(args);

            if (!parsed.success) {
                return {
                    status: "failed",
                    error: "Invalid arguments for createRefundActionDraft",
                };
            }
            return {
                status: "success",
                data: {
                    status: "draft_created",
                    shop: parsed.data.shop,
                    actionType: parsed.data.actionType,
                    reason: parsed.data.reason,
                    message: "Draft action created. Human approval is required before execution.",
                },
            };
        }
    }
};
