import { db, Workflow, WorkflowStep, WorkflowTrigger } from "./db";

/**
 * Normalizes platform names from user phrases
 */
function identifyPlatform(word: string): string | null {
  const w = word.toLowerCase();
  if (w.includes("slack")) return "slack";
  if (w.includes("discord")) return "discord";
  if (w.includes("drive") || w.includes("google drive")) return "google_drive";
  if (w.includes("gmail") || w.includes("email")) return "gmail";
  if (w.includes("whatsapp")) return "whatsapp";
  if (w.includes("twilio") || w.includes("sms")) return "twilio";
  if (w.includes("stripe") || w.includes("payment") || w.includes("charge")) return "stripe";
  if (w.includes("openai") || w.includes("gpt") || w.includes("ai") || w.includes("claude") || w.includes("llm")) return "openai";
  if (w.includes("notion")) return "notion";
  return null;
}

/**
 * Compiles a natural language request into a robust, structured workflow.
 * Uses real OpenAI API if key is connected in db under "openai" or process.env,
 * otherwise falls back to a highly sophisticated rule-based compiler that works instantly.
 */
export async function compileWorkflow(prompt: string): Promise<Workflow> {
  const openaiConn = db.getConnection("openai");
  const apiKey = openaiConn?.config?.apiKey || process.env.OPENAI_API_KEY;

  if (apiKey) {
    try {
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          temperature: 0.1,
          messages: [
            {
              role: "system",
              content: `You are an expert AI automation compiler. You translate user requests into structured automation workflows.
Respond ONLY with a valid JSON object matching this TypeScript interface:
{
  "name": string (short clean name like "Gmail Invoices to Slack"),
  "trigger": {
    "type": "webhook" | "schedule" | "event",
    "platform": "gmail" | "stripe" | "webhook" | "scheduler",
    "config": Record<string, any>
  },
  "steps": Array<{
    "id": string (unique ID e.g. "step-1-slack"),
    "platform": "google_drive" | "slack" | "twilio" | "whatsapp" | "openai" | "discord" | "notion",
    "action": string (e.g. "save_file", "send_message", "create_row", "gpt_prompt"),
    "config": Record<string, any>,
    "mapping": Record<string, string> (maps values using double curly braces, e.g. {"text": "New payment: {{trigger.amount}}"} or {"emailText": "{{trigger.body}}"} or {"text": "{{step-1-openai.text}}"})
  }>
}

Ensure mappings are correct. If step 2 needs the output of step 1, map it like: "{{step-1-openai.text}}" or similar. No formatting markup (like \`\`\`json) should surround the JSON in your response.`
            },
            { role: "user", content: prompt }
          ]
        })
      });

      const data: any = await res.json();
      const content = data.choices?.[0]?.message?.content?.trim();
      if (content) {
        const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
        const parsed = JSON.parse(cleaned);
        const wfId = `wf-${Math.random().toString(36).substring(2, 11)}`;
        return {
          id: wfId,
          name: parsed.name || "Custom Automation",
          prompt,
          active: false,
          trigger: parsed.trigger,
          steps: parsed.steps,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.warn("Real OpenAI compile failed or timed out, using smart local parser fallback...", err);
    }
  }

  // Smart local parser fallback
  await new Promise(r => setTimeout(r, 400)); // Simulate thinking for premium feel

  const p = prompt.toLowerCase();

  // 1. Identify Trigger
  let trigger: WorkflowTrigger = {
    type: "webhook",
    platform: "webhook",
    config: {}
  };

  let name = "Custom Automation";

  if (p.includes("gmail") || p.includes("email") || p.includes("invoice")) {
    trigger = {
      type: "event",
      platform: "gmail",
      config: { folder: "INBOX", subjectFilter: p.includes("invoice") ? "invoice" : "" }
    };
    name = "Gmail Processing Automation";
  } else if (p.includes("stripe") || p.includes("payment") || p.includes("charge") || p.includes("sale")) {
    trigger = {
      type: "webhook",
      platform: "stripe",
      config: { event: "charge.succeeded" }
    };
    name = "Stripe Sales Integration";
  } else if (p.includes("monday") || p.includes("every day") || p.includes("schedule") || p.includes("am") || p.includes("pm") || p.includes("hour")) {
    trigger = {
      type: "schedule",
      platform: "scheduler",
      config: { schedule: p.includes("monday") ? "every Monday at 9:00 AM" : "every day" }
    };
    name = "Scheduled Team Sync";
  }

  // 2. Identify Steps
  const steps: WorkflowStep[] = [];

  // Standard split by transitional words
  const flowWords = p.split(/\bthen\b|\band\b|\bnext\b|\bsave\b|\bsend\b|\bnotify\b|\bcreate\b/);

  let stepIndex = 1;
  const triggerPrefix = "trigger";

  // Check for AI Extraction/AI Prompt step
  if (p.includes("ai") || p.includes("summarize") || p.includes("gpt") || p.includes("openai") || p.includes("claude") || p.includes("analyze")) {
    steps.push({
      id: `step-${stepIndex}-ai`,
      platform: "openai",
      action: "analyze_invoice",
      config: { prompt: "Extract invoice details such as company, amount, and payment status." },
      mapping: { emailText: `{{${triggerPrefix}.body}}` }
    });
    stepIndex++;
  }

  // Check for Google Drive Step
  if (p.includes("drive") || p.includes("google drive") || p.includes("folder")) {
    const isAiFirst = steps.some(s => s.platform === "openai");
    steps.push({
      id: `step-${stepIndex}-drive`,
      platform: "google_drive",
      action: "save_file",
      config: { folderName: "Automation Files" },
      mapping: {
        fileName: "file_{{trigger.id}}.txt",
        fileContent: isAiFirst ? "{{step-1-ai.text}}" : "{{trigger.body}}"
      }
    });
    stepIndex++;
  }

  // Check for Slack Notification
  if (p.includes("slack") || p.includes("alert") || p.includes("channel")) {
    const isAiFirst = steps.find(s => s.platform === "openai");
    const isDriveFirst = steps.find(s => s.platform === "google_drive");
    let textMapping = `⚠️ New Automation Alert: Event detected on ${trigger.platform}!`;
    if (isAiFirst) {
      textMapping = `🤖 AI Summary: {{${isAiFirst.id}.text}}`;
    } else if (trigger.platform === "stripe") {
      textMapping = `🎉 Stripe payment received from {{trigger.customer_name}}! Amount: {{trigger.amount_formatted}}.`;
    }

    steps.push({
      id: `step-${stepIndex}-slack`,
      platform: "slack",
      action: "send_message",
      config: { channel: "general" },
      mapping: { text: textMapping }
    });
    stepIndex++;
  }

  // Check for Discord Notification
  if (p.includes("discord")) {
    const isAiFirst = steps.find(s => s.platform === "openai");
    steps.push({
      id: `step-${stepIndex}-discord`,
      platform: "discord",
      action: "send_message",
      config: {},
      mapping: { text: isAiFirst ? `🤖 AI Insight: {{${isAiFirst.id}.text}}` : `Notification: New ${trigger.platform} event!` }
    });
    stepIndex++;
  }

  // Check for Notion Row creation
  if (p.includes("notion") || p.includes("database") || p.includes("table")) {
    steps.push({
      id: `step-${stepIndex}-notion`,
      platform: "notion",
      action: "create_row",
      config: { databaseId: "Invoices" },
      mapping: { title: "Automated entry - ID: {{trigger.id}}" }
    });
    stepIndex++;
  }

  // Check for Twilio / SMS / WhatsApp
  if (p.includes("sms") || p.includes("text") || p.includes("whatsapp") || p.includes("phone")) {
    const isAiFirst = steps.find(s => s.platform === "openai");
    steps.push({
      id: `step-${stepIndex}-twilio`,
      platform: p.includes("whatsapp") ? "whatsapp" : "twilio",
      action: "send_message",
      config: { to: "+15550199" },
      mapping: { text: isAiFirst ? `AI Update: {{${isAiFirst.id}.text}}` : `New update regarding {{trigger.id}}!` }
    });
    stepIndex++;
  }

  // Fallback: if no steps identified, add a friendly AI assistant logging step
  if (steps.length === 0) {
    steps.push({
      id: `step-1-ai`,
      platform: "openai",
      action: "gpt_prompt",
      config: { prompt: `Analyze the query: "${prompt}" and recommend workflow items.` },
      mapping: { text: `{{trigger.body}}` }
    });
  }

  // Refine Name based on steps
  if (steps.length > 0) {
    const platformsJoined = steps.map(s => s.platform.replace("_", " ")).map(name => name.charAt(0).toUpperCase() + name.slice(1));
    const triggerCapitalized = trigger.platform.charAt(0).toUpperCase() + trigger.platform.slice(1);
    name = `${triggerCapitalized} to ${platformsJoined.join(" & ")}`;
  }

  const wfId = `wf-${Math.random().toString(36).substring(2, 11)}`;
  return {
    id: wfId,
    name,
    prompt,
    active: false,
    trigger,
    steps,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

/**
 * Handle interactive conversation with the always-on Assistant sidebar
 */
export async function chatWithAssistant(
  workflowId: string | null,
  message: string,
  chatHistory: { role: "user" | "assistant"; content: string }[]
): Promise<{ reply: string; updatedWorkflow?: Workflow }> {
  const m = message.toLowerCase();

  // If no workflow is active, assist in compiling a new workflow
  if (!workflowId) {
    if (m.includes("automate") || m.includes("when") || m.includes("every")) {
      try {
        const wf = await compileWorkflow(message);
        db.saveWorkflow(wf);
        return {
          reply: `I have compiled a brand new automation based on your request: **"${wf.name}"**!\n\nI added a trigger for **${wf.trigger.platform.toUpperCase()}** and configured **${wf.steps.length} steps** (${wf.steps.map(s => s.platform.toUpperCase()).join(", ")}).\n\nYou can now see it displayed. Would you like to connect your apps or run a simulation?`,
          updatedWorkflow: wf
        };
      } catch (err) {
        return {
          reply: "I understand you want to build an automation! Could you describe the triggers and actions in simple terms? For example: 'When I get a Stripe payment, notify Slack.'"
        };
      }
    }
    return {
      reply: "Hi there! I am your personal Automation Assistant. 🤖\n\nI can help you build any integration instantly. Just type what you want, e.g., *'Whenever a Stripe payment happens, notify Discord and save details to Google Drive'*!"
    };
  }

  // Active workflow exists - perform direct workflow mutation or answer questions!
  const wf = db.getWorkflow(workflowId);
  if (!wf) {
    return { reply: "I couldn't find the requested workflow. Let's create a new one!" };
  }

  // Question: Why did it fail?
  if (m.includes("fail") || m.includes("error") || m.includes("broken") || m.includes("why")) {
    const execs = db.getExecutions().filter(e => e.workflowId === wf.id);
    const lastFailed = execs.find(e => e.status === "failed");
    if (lastFailed) {
      const failedStep = lastFailed.stepsResults.find(s => s.status === "failed");
      return {
        reply: `Ah, I see! The last run failed at step **${failedStep?.name || "unknown"}**.\n\n**Reason**: \`${failedStep?.error || "Connection timeout"}\`.\n\n**How to fix**: This usually means your credentials/API key for that service has expired or is invalid. Click **'Connections'** in the side bar to reconnect, then try again!`
      };
    } else {
      return {
        reply: "Your workflow runs look completely healthy (100% success rate)! If you are experiencing any issues, explain them to me and I will fix them right up."
      };
    }
  }

  // Mutation: "Add a Slack step"
  if (m.includes("add slack") || m.includes("notify slack") || m.includes("message slack")) {
    const stepId = `step-${wf.steps.length + 1}-slack`;
    wf.steps.push({
      id: stepId,
      platform: "slack",
      action: "send_message",
      config: { channel: "general" },
      mapping: { text: "Automation Alert! Workflow processed successfully." }
    });
    db.saveWorkflow(wf);
    return {
      reply: "Success! I have added a new **Slack Notification step** to your workflow. You can view and edit it in the editor.",
      updatedWorkflow: wf
    };
  }

  // Mutation: "Add Discord"
  if (m.includes("add discord") || m.includes("discord")) {
    const stepId = `step-${wf.steps.length + 1}-discord`;
    wf.steps.push({
      id: stepId,
      platform: "discord",
      action: "send_message",
      config: {},
      mapping: { text: "Event notification from Automation Engine!" }
    });
    db.saveWorkflow(wf);
    return {
      reply: "I've added a **Discord Notification step** to the end of your workflow. Let me know if you want to customize the message content!",
      updatedWorkflow: wf
    };
  }

  // Mutation: "Delete steps"
  if (m.includes("delete") || m.includes("remove")) {
    if (wf.steps.length > 1) {
      const removed = wf.steps.pop();
      db.saveWorkflow(wf);
      return {
        reply: `Got it! I have removed the last step (**${removed?.platform.toUpperCase()}**). Your workflow has been updated.`,
        updatedWorkflow: wf
      };
    } else {
      return { reply: "You must keep at least one action step in your automation!" };
    }
  }

  // General assistance reply
  return {
    reply: `I am looking at your active automation **"${wf.name}"**.\n\nI can:\n- **Add steps** (e.g. "Add a Slack alert")\n- **Remove the last step** ("Delete the last step")\n- **Help troubleshoot** ("Why did it fail?")\n- **Explain how it works** in simple words.\n\nWhat would you like to do?`
  };
}
