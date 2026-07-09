import { mockLlmDecide, type AgentMessage } from "./mockLlm.js";
import { realLlmDecide } from "./realLlm.js";
import { tools } from "./tools.js";
import { applyToolResultToState, createInitialAgentState } from "./state.js";
import { buildRefundAnalysisReport } from "./report.js";
import type { ToolExecutionStatus, ToolRiskLevel } from "./tools.js";
//循环、权限、状态更新
export type AgentRunOptions = {
    userInput: string;
    maxSteps?: number;
    autoApproveWriteTools?: boolean;
}

type AuditLogEntry = {
    step: number;
    toolName: string;
    riskLevel: ToolRiskLevel;
    requiresApproval: boolean;
    approved: boolean;
    args: Record<string, unknown>;
    status: ToolExecutionStatus;
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

    const state = createInitialAgentState();
    const trace: Array<Record<string, unknown>> = [];
    const auditLogs: AuditLogEntry[] = [];

    for (let step = 1; step <= maxSteps; step++) {
        console.log(`\n--- Agent Step ${step} ---`);

        // const decision = await mockLlmDecide(state);
        const decision = await realLlmDecide(state);

        trace.push({
            step,
            decision,
            stateSnapshot: structuredClone(state),
            timestamp: new Date().toISOString(),
        });

        if (decision.type === 'final_answer') {
            console.log(`\n--- Final Answer ---`);

            return {
                report: buildRefundAnalysisReport(state),
                state,
                messages,
                trace,
                auditLogs,
            };
        }

        const tool = tools[decision.toolName];

        if (!tool) {
            const error = `Tool not found: ${decision.toolName}`;
            state.errors.push(error);
            throw new Error(error);
        }

        if (tool.riskLevel === "dangerous") {
            const error = `Dangerous tool blocked: ${decision.toolName}`;
            state.errors.push(error);

            auditLogs.push({
                step,
                toolName: decision.toolName,
                riskLevel: tool.riskLevel,
                requiresApproval: tool.requiresApproval,
                approved: false,
                args: decision.args,
                status: "blocked",
                error,
                timestamp: new Date().toISOString(),
            });

            messages.push({
                role: "tool",
                name: decision.toolName,
                content: JSON.stringify(
                    {
                        status: "blocked",
                        error,
                    }),
            });
            continue;
        }

        const approved = !tool.requiresApproval || (tool.riskLevel === "write" && autoApproveWriteTools);

        if (!approved) {
            const error = `Tool requires human approval: ${decision.toolName}`;

            state.pendingApproval = {
                toolName: decision.toolName,
                args: decision.args,
                status: "pending",
                reason: error,
            }

            auditLogs.push({
                step,
                toolName: decision.toolName,
                riskLevel: tool.riskLevel,
                requiresApproval: tool.requiresApproval,
                approved: false,
                args: decision.args,
                status: "approval_required",
                error,
                timestamp: new Date().toISOString(),
            });

            messages.push({
                role: "tool",
                name: decision.toolName,
                content: JSON.stringify(
                    {
                        status: "approval_required",
                        error,
                    }),
            });

            continue;
        }

        console.log(`Calling tool: ${decision.toolName}`);
        console.log(`Risk level: ${tool.riskLevel}`);
        console.log(`Args: ${JSON.stringify(decision.args, null, 2)}`);

        try{
            const result = await tool.execute(decision.args);
            console.log(`Tool result: ${JSON.stringify(result, null, 2)}`);

            if (result.status  === "success") {
                applyToolResultToState(state, decision.toolName, result.data);
            }else{
                const errorMessage = result.error ?? `Tool failed: ${decision.toolName}`
                state.errors.push(errorMessage);
                state.failedToolAttempts[decision.toolName] = (state.failedToolAttempts[decision.toolName] ?? 0) + 1;

                if (state.failedToolAttempts[decision.toolName] >= 2) {
                    throw new Error(`Tool ${decision.toolName} failed too many times: ${errorMessage}`);
                }
            }

            auditLogs.push({
                step,
                toolName: decision.toolName,
                riskLevel: tool.riskLevel,
                requiresApproval: tool.requiresApproval,
                approved,
                args: decision.args,
                status: result.status,
                error: result.error,
                timestamp: new Date().toISOString(),
            });

            messages.push({
                role: "tool",
                name: decision.toolName,
                content: JSON.stringify({
                    status: result.status,
                    data: result.data,
                    error: result.error,
                }),
            });
        }catch(error){
            const errorMessage = error instanceof Error ? error.message : "Unknown tool execution error";

            state.errors.push(errorMessage);
            auditLogs.push({
                step,
                toolName: decision.toolName,
                riskLevel: tool.riskLevel,
                requiresApproval: tool.requiresApproval,
                approved,
                args: decision.args,
                status: "failed",
                error: errorMessage,
                timestamp: new Date().toISOString(),
            })
            messages.push({
                role: "tool",
                name: decision.toolName,
                content: JSON.stringify({
                    status: "failed",
                    error: errorMessage,
                }),
            });
        }
    }

    throw new Error(`Agent reached max steps of ${maxSteps}`);
}