import { db } from "./db";
import { resolveTemplate, runWorkflow } from "./engine";
import { compileWorkflow } from "./ai";

function assert(cond: boolean, msg: string) {
  if (!cond) throw new Error(`Assertion Failed: ${msg}`);
  console.log(`✅ [PASS] ${msg}`);
}

async function runTests() {
  console.log("🧪 Starting Automated Backend Suite...");

  // 1. Test template resolution
  const triggerPayload = { customer_name: "John Doe", amount_formatted: "$120.00" };
  const stepOutputs = { "step-1-ai": { text: "AI Summary of Acme" } };

  const res1 = resolveTemplate("Paid {{trigger.amount_formatted}} by {{trigger.customer_name}}", triggerPayload, stepOutputs);
  assert(res1 === "Paid $120.00 by John Doe", "Template resolution of trigger fields");

  const res2 = resolveTemplate("AI: {{step-1-ai.text}}", triggerPayload, stepOutputs);
  assert(res2 === "AI: AI Summary of Acme", "Template resolution of previous step fields");

  // 2. Test Smart NLP AI compiler fallbacks
  const wf1 = await compileWorkflow("Save Stripe payments to Google Drive and notify Slack");
  assert(wf1.trigger.platform === "stripe", "NLP compiler maps Stripe trigger correctly");
  assert(wf1.steps.some(s => s.platform === "google_drive"), "NLP compiler maps Google Drive action step");
  assert(wf1.steps.some(s => s.platform === "slack"), "NLP compiler maps Slack action step");

  // 3. Test Database operations
  const initialWorkflowsCount = db.getWorkflows().length;
  assert(initialWorkflowsCount > 0, "Database prepopulates standard template workflows");

  // 4. Test Sequential Execution engine
  const demoWf = db.getWorkflows()[0];
  const execution = await runWorkflow(demoWf.id, { id: "test-run-99", body: "Invoice details Acme" });
  assert(execution.status === "success", "Workflow execution completes with success status");
  assert(execution.stepsResults.length === demoWf.steps.length, "All configured steps are executed");

  console.log("\n💯 All backend unit tests passed successfully!");
}

runTests().catch(err => {
  console.error("❌ Test suite failed:", err);
  process.exit(1);
});
