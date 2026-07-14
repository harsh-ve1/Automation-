import { db, Workflow, WorkflowStep, Execution, ExecutionStepResult } from "./db";

// Active SSE clients to broadcast real-time run updates
export type SseBroadcaster = (data: any) => void;
let clients: SseBroadcaster[] = [];

export function addSseClient(client: SseBroadcaster) {
  clients.push(client);
}

export function removeSseClient(client: SseBroadcaster) {
  clients = clients.filter(c => c !== client);
}

export function broadcast(event: string, data: any) {
  clients.forEach(c => c({ event, data }));
}

/**
 * Resolves templated values in a string (e.g., "Hello {{trigger.name}}! Output is {{step-1.text}}")
 */
export function resolveTemplate(
  template: string,
  triggerPayload: any,
  stepOutputs: Record<string, any>
): string {
  if (typeof template !== "string") return template;

  return template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (match, pathStr) => {
    const trimmedPath = pathStr.trim();
    const parts = trimmedPath.split(".");

    let current: any = null;
    if (parts[0] === "trigger") {
      current = triggerPayload;
    } else {
      current = stepOutputs[parts[0]];
    }

    for (let i = 1; i < parts.length; i++) {
      if (current === null || current === undefined) {
        return "";
      }
      current = current[parts[i]];
    }

    if (current === null || current === undefined) {
      return "";
    }

    if (typeof current === "object") {
      return JSON.stringify(current);
    }
    return String(current);
  });
}

/**
 * Executes a single workflow step with real outbound HTTP calls if credentials exist,
 * or beautiful, authentic simulated runs if credentials are not configured.
 */
async function executeStep(
  step: WorkflowStep,
  triggerPayload: any,
  stepOutputs: Record<string, any>
): Promise<any> {
  // Resolve mapped inputs
  const resolvedInputs: Record<string, any> = {};
  for (const [key, template] of Object.entries(step.mapping)) {
    resolvedInputs[key] = resolveTemplate(template, triggerPayload, stepOutputs);
  }

  // Merge step config as fallbacks
  const inputs = { ...step.config, ...resolvedInputs };

  // Fetch credentials if available
  const connection = db.getConnection(step.platform);
  const isReal = connection?.connected && connection.config;
  const config = connection?.config || {};

  switch (step.platform) {
    case "openai":
    case "openai_model":
    case "claude":
    case "anthropic": {
      const prompt = inputs.prompt || inputs.text || "Summarize this content";
      const userText = inputs.emailText || inputs.text || "";

      if (isReal && config.apiKey) {
        // Real OpenAI API call
        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              messages: [
                { role: "system", content: "You are a helpful automation assistant." },
                { role: "user", content: `${prompt}\n\nInput Content:\n${userText}` }
              ]
            })
          });
          const json: any = await res.json();
          const responseText = json.choices?.[0]?.message?.content;
          return { text: responseText, raw: json };
        } catch (err: any) {
          throw new Error(`Real OpenAI execution failed: ${err.message}`);
        }
      } else {
        // High fidelity mock AI logic
        await new Promise(r => setTimeout(r, 600));
        let contentSummary = "Extracted Invoice details: total $450.00, company Acme Corp, due date 2026-08-12.";
        if (userText.toLowerCase().includes("unpaid")) {
          contentSummary += " WARNING: Invoice is currently UNPAID.";
        }
        return {
          text: `[Simulated OpenAI Assistant Response]\nBased on prompt: "${prompt}", here is the extraction:\n${contentSummary}`,
          extractedAmount: 450.00,
          currency: "USD",
          status: userText.toLowerCase().includes("unpaid") ? "unpaid" : "paid",
          company: "Acme Corp",
          dueDate: "2026-08-12"
        };
      }
    }

    case "slack": {
      const text = inputs.text || "Hello from Automation Platform!";
      const channel = inputs.channel || "general";

      if (isReal && config.webhookUrl) {
        // Real Slack Webhook
        try {
          const res = await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text, channel })
          });
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          return { success: true, message: "Slack notification sent successfully." };
        } catch (err: any) {
          throw new Error(`Real Slack Webhook post failed: ${err.message}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 400));
        return {
          success: true,
          channel: channel,
          message: `[Simulated Slack Notification] Sent message to #${channel}: "${text}"`
        };
      }
    }

    case "discord": {
      const text = inputs.text || "Hello from Automation Platform!";

      if (isReal && config.webhookUrl) {
        try {
          const res = await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: text })
          });
          if (!res.ok) throw new Error(`HTTP status ${res.status}`);
          return { success: true, message: "Discord webhook sent." };
        } catch (err: any) {
          throw new Error(`Real Discord post failed: ${err.message}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 400));
        return {
          success: true,
          message: `[Simulated Discord Webhook] Posted content: "${text}"`
        };
      }
    }

    case "google_drive": {
      const folderName = inputs.folderName || "Root";
      const fileName = inputs.fileName || "document.txt";
      const fileContent = inputs.fileContent || "";

      if (isReal && config.accessToken) {
        // Call Real Google Drive APIs
        try {
          const metadata = { name: fileName, mimeType: "application/pdf" };
          const form = new FormData();
          form.append("metadata", new Blob([JSON.stringify(metadata)], { type: "application/json" }));
          form.append("file", new Blob([fileContent], { type: "text/plain" }));

          const res = await fetch("https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart", {
            method: "POST",
            headers: { "Authorization": `Bearer ${config.accessToken}` },
            body: form
          });
          const json = await res.json();
          return { success: true, fileId: json.id, fileName, url: `https://drive.google.com/file/d/${json.id}` };
        } catch (err: any) {
          throw new Error(`Real Google Drive upload failed: ${err.message}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 500));
        return {
          success: true,
          fileId: "drive-simulated-id-78219",
          fileName,
          folder: folderName,
          path: `/My Drive/${folderName}/${fileName}`,
          url: `https://drive.google.com/file/d/drive-simulated-id-78219/view`
        };
      }
    }

    case "twilio":
    case "whatsapp": {
      const to = inputs.to || "+15550199";
      const message = inputs.text || inputs.message || "Reminder from Automation Engine";

      if (isReal && config.accountSid && config.authToken) {
        // Real Twilio API Call
        try {
          const auth = Buffer.from(`${config.accountSid}:${config.authToken}`).toString("base64");
          const endpoint = step.platform === "whatsapp" ? "WhatsApp" : "SMS";
          const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
            method: "POST",
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": `Basic ${auth}`
            },
            body: new URLSearchParams({
              To: step.platform === "whatsapp" ? `whatsapp:${to}` : to,
              From: config.fromPhone || "+15550000",
              Body: message
            })
          });
          const json: any = await res.json();
          if (json.error_message) throw new Error(json.error_message);
          return { success: true, sid: json.sid, status: json.status };
        } catch (err: any) {
          throw new Error(`Real Twilio Message failed: ${err.message}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 450));
        return {
          success: true,
          sid: "SM-simulated-twilio-998822",
          to,
          messageType: step.platform,
          log: `[Simulated ${step.platform.toUpperCase()}] Delivered to ${to}: "${message}"`
        };
      }
    }

    case "notion": {
      const databaseId = inputs.databaseId || "notion-db-id";
      const title = inputs.title || "New Automation Row";

      if (isReal && config.apiKey) {
        try {
          const res = await fetch("https://api.notion.com/v1/pages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${config.apiKey}`,
              "Content-Type": "application/json",
              "Notion-Version": "2022-06-28"
            },
            body: JSON.stringify({
              parent: { database_id: databaseId },
              properties: {
                Name: { title: [{ text: { content: title } }] }
              }
            })
          });
          const json = await res.json();
          return { success: true, pageId: json.id, url: json.url };
        } catch (err: any) {
          throw new Error(`Real Notion page creation failed: ${err.message}`);
        }
      } else {
        await new Promise(r => setTimeout(r, 500));
        return {
          success: true,
          pageId: "notion-page-sim-45211",
          database: databaseId,
          title,
          url: `https://notion.so/notion-page-sim-45211`
        };
      }
    }

    default:
      throw new Error(`Unsupported integration platform: ${step.platform}`);
  }
}

/**
 * Sequential runner for Workflows.
 */
export async function runWorkflow(workflowId: string, triggerPayload: any): Promise<Execution> {
  const workflow = db.getWorkflow(workflowId);
  if (!workflow) {
    throw new Error(`Workflow with ID ${workflowId} not found`);
  }

  const executionId = `run-${Math.random().toString(36).substring(2, 11)}`;
  const startTime = Date.now();

  const execution: Execution = {
    id: executionId,
    workflowId: workflow.id,
    workflowName: workflow.name,
    status: "running",
    triggerPayload,
    stepsResults: [],
    startedAt: new Date().toISOString()
  };

  // Add execution to DB immediately as 'running'
  db.addExecution(execution);
  broadcast("RUN_STARTED", execution);

  const stepOutputs: Record<string, any> = {};
  let overallSuccess = true;
  let finalErrorMessage: string | undefined = undefined;

  for (const step of workflow.steps) {
    const stepResult: ExecutionStepResult = {
      stepId: step.id,
      name: `${step.platform.replace("_", " ")}: ${step.action.replace("_", " ")}`,
      status: "success",
      inputUsed: {}
    };

    // Keep track of evaluated input for execution logs
    const evaluatedInputs: Record<string, any> = {};
    for (const [key, val] of Object.entries(step.mapping)) {
      evaluatedInputs[key] = resolveTemplate(val, triggerPayload, stepOutputs);
    }
    stepResult.inputUsed = { ...step.config, ...evaluatedInputs };

    // Retry block
    let attempts = 0;
    const maxRetries = 2;
    let stepOutput: any = null;
    let stepError: string | null = null;

    while (attempts < maxRetries) {
      try {
        stepError = null;
        stepOutput = await executeStep(step, triggerPayload, stepOutputs);
        break;
      } catch (err: any) {
        attempts++;
        stepError = err.message;
        if (attempts < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 300)); // Short pause before retry
        }
      }
    }

    if (stepError) {
      stepResult.status = "failed";
      stepResult.error = stepError;
      execution.stepsResults.push(stepResult);
      overallSuccess = false;
      finalErrorMessage = `Step '${stepResult.name}' failed after retry: ${stepError}`;
      break;
    } else {
      stepResult.status = "success";
      stepResult.output = stepOutput;
      stepOutputs[step.id] = stepOutput;
      execution.stepsResults.push(stepResult);
    }

    // Broadcast intermediate status updates
    broadcast("RUN_STEP_COMPLETED", { executionId, stepResult });
  }

  execution.status = overallSuccess ? "success" : "failed";
  execution.completedAt = new Date().toISOString();
  execution.durationMs = Date.now() - startTime;
  if (finalErrorMessage) {
    execution.errorMessage = finalErrorMessage;
  }

  // Save the updated run status to DB
  db.updateExecution(execution);
  broadcast("RUN_FINISHED", execution);

  return execution;
}
