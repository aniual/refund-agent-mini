import { runRefundAgent } from './agent.js';

async function main() {
    const result = await runRefundAgent({
        userInput: "Please analyze my Shopify store refund performance in the last 30 days.",
        maxSteps: 8,
        autoApproveWriteTools: false,
    })

    console.log("Agent Answer:", result.answer);
    console.log("\n--- Audit Logs ---");
    console.log(JSON.stringify(result.auditLogs, null, 2));
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
  });