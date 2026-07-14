import fs from "fs";
import path from "path";

export interface WorkflowTrigger {
  type: "webhook" | "schedule" | "event";
  platform: string; // e.g. "gmail", "stripe", "webhook", "scheduler"
  config: Record<string, any>;
}

export interface WorkflowStep {
  id: string;
  platform: string; // e.g. "google_drive", "slack", "twilio", "whatsapp", "openai", "discord", "notion"
  action: string;    // e.g. "save_file", "send_message", "create_row", "gpt_prompt", "create_task"
  config: Record<string, any>;
  mapping: Record<string, string>; // maps step inputs to previous step outputs, e.g. { "text": "{{trigger.subject}}" }
}

export interface Workflow {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
  trigger: WorkflowTrigger;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Connection {
  platform: string; // e.g. "google", "slack", "discord", "twilio", "stripe", "notion", "openai"
  name: string;
  connected: boolean;
  connectedAt: string;
  config: Record<string, any>; // Secure token storage
}

export interface ExecutionStepResult {
  stepId: string;
  name: string;
  status: "success" | "failed";
  error?: string;
  output?: any;
  inputUsed?: any;
}

export interface Execution {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "failed" | "running";
  triggerPayload: any;
  stepsResults: ExecutionStepResult[];
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

const DATA_FILE = path.join(__dirname, "../data_store.json");

interface DataStore {
  workflows: Record<string, Workflow>;
  connections: Record<string, Connection>;
  executions: Execution[];
}

const DEFAULT_TEMPLATES: Workflow[] = [
  {
    id: "template-gmail-to-drive",
    name: "Save Email Invoices to Google Drive",
    prompt: "When I receive an email with an invoice, extract the attachment and save it to Google Drive",
    active: false,
    trigger: {
      type: "event",
      platform: "gmail",
      config: { folder: "INBOX", subjectFilter: "invoice" }
    },
    steps: [
      {
        id: "step-1-ai-extract",
        platform: "openai",
        action: "analyze_invoice",
        config: { prompt: "Analyze this email and return a summary of the invoice" },
        mapping: { "emailText": "{{trigger.body}}" }
      },
      {
        id: "step-2-save-drive",
        platform: "google_drive",
        action: "save_file",
        config: { folderName: "Invoices" },
        mapping: { "fileName": "invoice_{{trigger.id}}.pdf", "fileContent": "{{trigger.attachment}}" }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "template-stripe-to-slack",
    name: "Notify Slack of New Stripe Payments",
    prompt: "Notify the team on Slack whenever a customer makes a payment on Stripe",
    active: false,
    trigger: {
      type: "webhook",
      platform: "stripe",
      config: { event: "charge.succeeded" }
    },
    steps: [
      {
        id: "step-1-notify-slack",
        platform: "slack",
        action: "send_message",
        config: { channel: "sales-alerts" },
        mapping: { "text": "🎉 New sale! Customer {{trigger.customer_name}} just paid {{trigger.amount_formatted}}." }
      }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

class Database {
  private data: DataStore = {
    workflows: {},
    connections: {},
    executions: []
  };

  constructor() {
    this.load();
    // Prepopulate with templates if workflows list is empty
    if (Object.keys(this.data.workflows).length === 0) {
      DEFAULT_TEMPLATES.forEach(tmpl => {
        this.data.workflows[tmpl.id] = tmpl;
      });
      this.save();
    }
  }

  private load() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const fileContent = fs.readFileSync(DATA_FILE, "utf-8");
        this.data = JSON.parse(fileContent);
      }
    } catch (err) {
      console.error("Failed to load database. Starting fresh...", err);
    }
  }

  private save() {
    try {
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to save database:", err);
    }
  }

  // Workflows
  getWorkflows(): Workflow[] {
    return Object.values(this.data.workflows);
  }

  getWorkflow(id: string): Workflow | undefined {
    return this.data.workflows[id];
  }

  saveWorkflow(workflow: Workflow): Workflow {
    workflow.updatedAt = new Date().toISOString();
    this.data.workflows[workflow.id] = workflow;
    this.save();
    return workflow;
  }

  deleteWorkflow(id: string): boolean {
    if (this.data.workflows[id]) {
      delete this.data.workflows[id];
      this.save();
      return true;
    }
    return false;
  }

  // Connections / Credentials
  getConnections(): Connection[] {
    return Object.values(this.data.connections);
  }

  getConnection(platform: string): Connection | undefined {
    return this.data.connections[platform];
  }

  saveConnection(connection: Connection): Connection {
    connection.connectedAt = new Date().toISOString();
    this.data.connections[connection.platform] = connection;
    this.save();
    return connection;
  }

  deleteConnection(platform: string): boolean {
    if (this.data.connections[platform]) {
      delete this.data.connections[platform];
      this.save();
      return true;
    }
    return false;
  }

  // Executions
  getExecutions(): Execution[] {
    return this.data.executions;
  }

  getExecution(id: string): Execution | undefined {
    return this.data.executions.find(e => e.id === id);
  }

  addExecution(execution: Execution): Execution {
    this.data.executions.unshift(execution); // Newest first
    // Limit to 100 entries to maintain memory friendliness
    if (this.data.executions.length > 100) {
      this.data.executions.pop();
    }
    this.save();
    return execution;
  }

  updateExecution(execution: Execution): Execution {
    const idx = this.data.executions.findIndex(e => e.id === execution.id);
    if (idx !== -1) {
      this.data.executions[idx] = execution;
      this.save();
    }
    return execution;
  }

  getAnalytics() {
    const execs = this.data.executions;
    const totalRuns = execs.length;
    const successes = execs.filter(e => e.status === "success").length;
    const successRate = totalRuns > 0 ? Math.round((successes / totalRuns) * 100) : 100;

    // Estimate $20 saved per hour, each automation runs instantly and saves ~2 minutes of manual tasking
    const totalSecondsSaved = successes * 120; // 2 minutes per success
    const hoursSaved = totalSecondsSaved / 3600;
    const moneySaved = Math.round(hoursSaved * 20);

    // Calculate dynamic automation score: starts at 75, goes up with success rate and total automations running
    const activeCount = Object.values(this.data.workflows).filter(w => w.active).length;
    const automationScore = Math.min(100, Math.round(70 + (activeCount * 5) + (successRate * 0.2)));

    return {
      totalRuns,
      successes,
      failures: totalRuns - successes,
      successRate,
      timeSavedMinutes: Math.round(totalSecondsSaved / 60),
      moneySaved,
      automationScore,
      activeWorkflowsCount: activeCount
    };
  }
}

export const db = new Database();
