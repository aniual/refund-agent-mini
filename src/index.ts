import { runRefundAgent } from './agent.js';

async function main() {
    const result = await runRefundAgent({
        userInput: "Please analyze my Shopify store refund performance in the last 30 days.",
        maxSteps: 8,
        autoApproveWriteTools: true,
    })

    console.log("Agent Answer:", JSON.stringify(result.report, null, 2));
    console.log("\n--- Agent State ---");
    console.log(
        JSON.stringify(result.state, null, 2)
    );

    console.log("\n--- Audit Logs ---");
    console.log(
        JSON.stringify(result.auditLogs, null, 2)
    );
}

main().catch((error) => {
    const message =
        error instanceof Error
            ? error.message
            : "Unknown application error";

    console.error(message);
    process.exitCode = 1;
});