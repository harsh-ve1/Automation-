import { Express, Request, Response } from "express";
import { db, Workflow } from "./db";
import { runWorkflow, addSseClient, removeSseClient } from "./engine";
import { compileWorkflow, chatWithAssistant } from "./ai";

export function registerRoutes(app: Express) {
  // Real-time SSE Endpoint
  app.get("/api/events", (req: Request, res: Response) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const onEvent = (data: any) => {
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    };

    addSseClient(onEvent);

    req.on("close", () => {
      removeSseClient(onEvent);
    });
  });

  // Analytics
  app.get("/api/analytics", (req: Request, res: Response) => {
    res.json(db.getAnalytics());
  });

  // Workflows CRUD
  app.get("/api/workflows", (req: Request, res: Response) => {
    res.json(db.getWorkflows());
  });

  app.get("/api/workflows/:id", (req: Request, res: Response) => {
    const wf = db.getWorkflow(req.params.id);
    if (!wf) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.json(wf);
  });

  app.post("/api/workflows", async (req: Request, res: Response) => {
    try {
      const { prompt, workflow } = req.body;

      if (workflow) {
        // Direct save/create
        const saved = db.saveWorkflow(workflow);
        res.json(saved);
        return;
      }

      if (!prompt) {
        res.status(400).json({ error: "Missing prompt or workflow definition" });
        return;
      }

      const compiled = await compileWorkflow(prompt);
      const saved = db.saveWorkflow(compiled);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put("/api/workflows/:id", (req: Request, res: Response) => {
    const existing = db.getWorkflow(req.params.id);
    if (!existing) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const updated: Workflow = {
      ...existing,
      ...req.body,
      id: existing.id // protect ID
    };

    db.saveWorkflow(updated);
    res.json(updated);
  });

  app.delete("/api/workflows/:id", (req: Request, res: Response) => {
    const success = db.deleteWorkflow(req.params.id);
    if (!success) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }
    res.json({ success: true });
  });

  // Connections CRUD
  app.get("/api/connections", (req: Request, res: Response) => {
    res.json(db.getConnections());
  });

  app.post("/api/connections", (req: Request, res: Response) => {
    const { platform, name, config } = req.body;
    if (!platform || !name) {
      res.status(400).json({ error: "Platform and Name are required" });
      return;
    }

    const saved = db.saveConnection({
      platform,
      name,
      connected: true,
      connectedAt: new Date().toISOString(),
      config: config || {}
    });

    res.json(saved);
  });

  app.delete("/api/connections/:platform", (req: Request, res: Response) => {
    const success = db.deleteConnection(req.params.platform);
    if (!success) {
      res.status(404).json({ error: "Connection not found" });
      return;
    }
    res.json({ success: true });
  });

  // Executions List
  app.get("/api/executions", (req: Request, res: Response) => {
    res.json(db.getExecutions());
  });

  // Simulation & Manual Webhook triggers
  app.post("/api/executions/simulate", async (req: Request, res: Response) => {
    try {
      const { workflowId, payload } = req.body;
      if (!workflowId) {
        res.status(400).json({ error: "workflowId is required" });
        return;
      }

      const workflow = db.getWorkflow(workflowId);
      if (!workflow) {
        res.status(404).json({ error: "Workflow not found" });
        return;
      }

      // Default smart payload based on workflow trigger type
      const defaultPayload: Record<string, any> = {
        id: Math.floor(Math.random() * 100000).toString(),
        subject: "Invoice for your subscription - Acme Corp",
        body: "Hi Team, here is our monthly invoice total of $450.00 for Acme services. It is currently unpaid. Please process.",
        attachment: "PDF_INVOICE_ATTACHMENT_BYTES_128A",
        customer_name: "Jane Doe",
        amount: 45000,
        amount_formatted: "$450.00",
        currency: "USD"
      };

      const finalPayload = { ...defaultPayload, ...payload };

      // Execute sequentially
      const executionResult = await runWorkflow(workflowId, finalPayload);
      res.json(executionResult);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Chat Assistant Sidebar conversation
  app.post("/api/assistant/chat", async (req: Request, res: Response) => {
    try {
      const { workflowId, message, chatHistory } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      const response = await chatWithAssistant(workflowId || null, message, chatHistory || []);
      res.json(response);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
}
