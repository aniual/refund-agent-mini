import { z } from 'zod';

export type ToolResult = {
    success: boolean;
    data?: unknown;
    error?: string;
}

export type ToolRiskLevel = "read" | "write" | "dangerous";

export type ToolDefinition = {
    name: string;
    description: string;
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    schema: z.ZodObject<any>;
    execute: (args: any) => Promise<ToolResult>;
}


export const tools: Record<string, ToolDefinition> = {
    getRefundSummary: {
        name: 'getRefundSummary',
        description: 'Get refund summary for a shop within a date range.',
        riskLevel: "read",
        requiresApproval: false,
        schema: z.object({
            shop: z.string(),
            days: z.number().int().positive(),
        }),
        execute: async (args: any) => {
            const parsed = tools.getRefundSummary.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    success: false,
                    error: "Invalid arguments for getRefundSummary",
                };
            }
            return {
                success: true,
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
            days: z.number().int().positive(),
            limit: z.number().int().positive().default(5),
        }),
        execute: async (args: any) => {
            const parsed = tools.getTopRefundProducts.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    success: false,
                    error: "Invalid arguments for getTopRefundProducts",
                };
            }
            return {
                success: true,
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
            days: z.number().int().positive(),
        }),
        execute: async (args: any) => {
            const parsed = tools.getRefundReasons.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    success: false,
                    error: "Invalid arguments for getRefundReasons",
                };
            }
            return {
                success: true,
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
            days: z.number().int().positive(),
        }),
        execute: async (args: any) => {
            const parsed = tools.getRefundTrend.schema.safeParse(args);
            if (!parsed.success) {
                return {
                    success: false,
                    error: "Invalid arguments for getRefundTrend",
                };
            }
            return {
                success: true,
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
        execute: async (args: any) => {
            const parsed = tools.createRefundActionDraft.schema.safeParse(args);

            if (!parsed.success) {
                return {
                    success: false,
                    error: "Invalid arguments for createRefundActionDraft",
                };
            }
            return {
                success: true,
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
