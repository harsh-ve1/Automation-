import { useState, useEffect } from "react";
import {
  Zap,
  LayoutDashboard,
  Link2,
  ShoppingBag,
  History,
  Sparkles,
  Sun,
  Moon,
  X
} from "lucide-react";

import Dashboard, { Workflow, Analytics } from "./components/Dashboard";
import VisualEditor from "./components/VisualEditor";
import Simulator, { ExecutionResult } from "./components/Simulator";
import AssistantSidebar from "./components/AssistantSidebar";
import Connections, { Connection } from "./components/Connections";
import Marketplace from "./components/Marketplace";

export default function App() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "connections" | "marketplace" | "history">("dashboard");
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [executions, setExecutions] = useState<ExecutionResult[]>([]);
  const [analytics, setAnalytics] = useState<Analytics>({
    totalRuns: 0,
    successes: 0,
    failures: 0,
    successRate: 100,
    timeSavedMinutes: 0,
    moneySaved: 0,
    automationScore: 75,
    activeWorkflowsCount: 0
  });

  const [selectedWorkflow, setSelectedWorkflow] = useState<Workflow | null>(null);
  const [simulationWorkflow, setSimulationWorkflow] = useState<Workflow | null>(null);
  const [activeSimulationRun, setActiveSimulationRun] = useState<ExecutionResult | null>(null);

  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [assistantOpen, setAssistantOpen] = useState(false);

  // Load Initial Data
  useEffect(() => {
    fetchWorkflows();
    fetchConnections();
    fetchExecutions();
    fetchAnalytics();
  }, []);

  // Listen to Server-Sent Real-time Events
  useEffect(() => {
    const eventSource = new EventSource("/api/events");

    eventSource.onmessage = (event) => {
      try {
        const { event: eventName, data } = JSON.parse(event.data);

        if (eventName === "RUN_STARTED") {
          const run: ExecutionResult = data;
          setExecutions(prev => [run, ...prev.filter(e => e.id !== run.id)]);
          // If we are simulating this workflow, show live updates
          if (simulationWorkflow && run.workflowId === simulationWorkflow.id) {
            setActiveSimulationRun(run);
            setSimulating(true);
          }
        } else if (eventName === "RUN_STEP_COMPLETED") {
          const { executionId, stepResult } = data;
          setExecutions(prev => prev.map(e => {
            if (e.id !== executionId) return e;
            const idx = e.stepsResults.findIndex(r => r.stepId === stepResult.stepId);
            const nextResults = [...e.stepsResults];
            if (idx !== -1) {
              nextResults[idx] = stepResult;
            } else {
              nextResults.push(stepResult);
            }
            return { ...e, stepsResults: nextResults };
          }));

          setActiveSimulationRun(current => {
            if (!current || current.id !== executionId) return current;
            const idx = current.stepsResults.findIndex(r => r.stepId === stepResult.stepId);
            const nextResults = [...current.stepsResults];
            if (idx !== -1) {
              nextResults[idx] = stepResult;
            } else {
              nextResults.push(stepResult);
            }
            return { ...current, stepsResults: nextResults };
          });
        } else if (eventName === "RUN_FINISHED") {
          const run: ExecutionResult = data;
          setExecutions(prev => prev.map(e => e.id === run.id ? run : e));

          if (simulationWorkflow && run.workflowId === simulationWorkflow.id) {
            setActiveSimulationRun(run);
            setSimulating(false);
          }
          // Refresh statistics
          fetchAnalytics();
        }
      } catch (err) {
        console.error("Failed to parse server SSE event:", err);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [simulationWorkflow]);

  // Apply dark mode toggling directly to html element
  useEffect(() => {
    const root = window.document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [darkMode]);

  const fetchWorkflows = async () => {
    const res = await fetch("/api/workflows");
    const data = await res.json();
    setWorkflows(data);
  };

  const fetchConnections = async () => {
    const res = await fetch("/api/connections");
    const data = await res.json();
    setConnections(data);
  };

  const fetchExecutions = async () => {
    const res = await fetch("/api/executions");
    const data = await res.json();
    setExecutions(data);
  };

  const fetchAnalytics = async () => {
    const res = await fetch("/api/analytics");
    const data = await res.json();
    setAnalytics(data);
  };

  // Create workflow from natural language prompt
  const handleCreateFromPrompt = async (promptText: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptText })
      });
      const newWf = await res.json();
      setWorkflows(prev => [newWf, ...prev]);
      setSelectedWorkflow(newWf); // Open visual editor instantly
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveWorkflow = async (updated: Workflow) => {
    try {
      const res = await fetch(`/api/workflows/${updated.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const saved = await res.json();
      setWorkflows(prev => prev.map(w => w.id === saved.id ? saved : w));
      setSelectedWorkflow(null);
      fetchAnalytics();
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleActive = async (wf: Workflow) => {
    const updated = { ...wf, active: !wf.active };
    setWorkflows(prev => prev.map(w => w.id === wf.id ? updated : w));

    await fetch(`/api/workflows/${wf.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated)
    });
    fetchAnalytics();
  };

  const handleDeleteWorkflow = async (id: string) => {
    setWorkflows(prev => prev.filter(w => w.id !== id));
    await fetch(`/api/workflows/${id}`, { method: "DELETE" });
    fetchAnalytics();
  };

  // Simulate execution request
  const handleTriggerSimulation = async (wf: Workflow) => {
    setSimulationWorkflow(wf);
    setActiveSimulationRun(null);
    setSimulating(true);

    try {
      await fetch("/api/executions/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workflowId: wf.id })
      });
      fetchExecutions();
    } catch (err) {
      console.error(err);
      setSimulating(false);
    }
  };

  // Manage Connection keys
  const handleConnect = async (platform: string, name: string, config: any) => {
    const res = await fetch("/api/connections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform, name, config })
    });
    const saved = await res.json();
    setConnections(prev => [...prev.filter(c => c.platform !== platform), saved]);
  };

  const handleDisconnect = async (platform: string) => {
    setConnections(prev => prev.filter(c => c.platform !== platform));
    await fetch(`/api/connections/${platform}`, { method: "DELETE" });
  };

  const handleInstallTemplate = (prompt: string) => {
    setActiveTab("dashboard");
    handleCreateFromPrompt(prompt);
  };

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800 dark:bg-zinc-950 dark:text-zinc-100">
      {/* Sidebar navigation left column */}
      <div className="hidden md:flex flex-col w-64 border-r border-slate-200 bg-white p-6 dark:border-zinc-900 dark:bg-zinc-950 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white dark:bg-indigo-500 shadow-lg shadow-indigo-500/20">
            <Zap className="h-5 w-5 fill-current" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-zinc-100">
              FlowMagic
            </h1>
            <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold tracking-widest uppercase">
              Automation OS
            </p>
          </div>
        </div>

        <nav className="mt-10 flex-1 space-y-1">
          <button
            type="button"
            onClick={() => { setActiveTab("dashboard"); setSelectedWorkflow(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
              activeTab === "dashboard" && !selectedWorkflow
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <LayoutDashboard className="h-4 w-4" />
            Workspace Dashboard
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("connections"); setSelectedWorkflow(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
              activeTab === "connections"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <Link2 className="h-4 w-4" />
            Connections Center
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("marketplace"); setSelectedWorkflow(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
              activeTab === "marketplace"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <ShoppingBag className="h-4 w-4" />
            Recipe Marketplace
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab("history"); setSelectedWorkflow(null); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-semibold transition ${
              activeTab === "history"
                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-400"
                : "text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-900/40"
            }`}
          >
            <History className="h-4 w-4" />
            Execution Logs
          </button>
        </nav>

        {/* Footer info card */}
        <div className="rounded-xl bg-slate-50 border border-slate-100 p-4 dark:bg-zinc-900/40 dark:border-zinc-900">
          <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Active Workspace
          </span>
          <p className="text-xs font-bold text-slate-700 mt-1 dark:text-zinc-300">
            Personal Sandbox
          </p>
        </div>
      </div>

      {/* Main content right side column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-200/60 bg-white px-6 flex items-center justify-between dark:border-zinc-900 dark:bg-zinc-950 flex-shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {selectedWorkflow ? `Workflow / ${selectedWorkflow.name}` : activeTab}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* AI Floating button toggle */}
            <button
              type="button"
              onClick={() => setAssistantOpen(!assistantOpen)}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-bold text-indigo-600 hover:bg-indigo-50/20 dark:border-zinc-800 dark:bg-zinc-950 dark:text-indigo-400"
            >
              <Sparkles className="h-3.5 w-3.5 fill-current" />
              AI Engineer
            </button>

            {/* Dark light theme switch */}
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="rounded-xl border border-slate-200 p-2 text-slate-400 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-500 dark:hover:bg-zinc-900"
            >
              {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </header>

        {/* Scrollable Core Pane */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {selectedWorkflow ? (
            <VisualEditor
              workflow={selectedWorkflow}
              onSave={handleSaveWorkflow}
              onClose={() => setSelectedWorkflow(null)}
            />
          ) : (
            <>
              {activeTab === "dashboard" && (
                <Dashboard
                  analytics={analytics}
                  workflows={workflows}
                  onCreateFromPrompt={handleCreateFromPrompt}
                  onSelectWorkflow={setSelectedWorkflow}
                  onToggleActive={handleToggleActive}
                  onDeleteWorkflow={handleDeleteWorkflow}
                  onSimulate={handleTriggerSimulation}
                  loading={loading}
                />
              )}

              {activeTab === "connections" && (
                <Connections
                  connections={connections}
                  onConnect={handleConnect}
                  onDisconnect={handleDisconnect}
                />
              )}

              {activeTab === "marketplace" && (
                <Marketplace
                  onInstall={handleInstallTemplate}
                  loading={loading}
                />
              )}

              {activeTab === "history" && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
                      Recent Execution History
                    </h2>
                    <p className="text-xs text-slate-400 dark:text-zinc-500">
                      A high-fidelity audit trail logging background worker activities and sequential execution step durations.
                    </p>
                  </div>

                  {executions.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/10 flex flex-col items-center justify-center">
                      <History className="h-10 w-10 text-slate-300 dark:text-zinc-700" />
                      <span className="mt-3 text-xs font-semibold text-slate-600 dark:text-zinc-400">
                        No previous runs recorded
                      </span>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-2xl bg-white overflow-hidden dark:border-zinc-800 dark:bg-zinc-900/20 card-shadow">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-100 dark:divide-zinc-800">
                          <thead className="bg-slate-50 dark:bg-zinc-900/50">
                            <tr>
                              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase text-slate-400">Run ID</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase text-slate-400">Workflow Name</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase text-slate-400">Completed</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase text-slate-400">Duration</th>
                              <th className="px-6 py-3 text-left text-[10px] font-bold uppercase text-slate-400">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-zinc-800 text-xs">
                            {executions.map((e) => (
                              <tr key={e.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/20">
                                <td className="px-6 py-4 font-mono text-slate-400 dark:text-zinc-500">{e.id}</td>
                                <td className="px-6 py-4 font-semibold text-slate-700 dark:text-zinc-300">{e.workflowName}</td>
                                <td className="px-6 py-4 text-slate-400 dark:text-zinc-500">{e.completedAt ? new Date(e.completedAt).toLocaleTimeString() : "Pending"}</td>
                                <td className="px-6 py-4 text-slate-500 font-medium">{e.durationMs ? `${e.durationMs}ms` : "—"}</td>
                                <td className="px-6 py-4">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase ${
                                    e.status === "success"
                                      ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                                  }`}>
                                    {e.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Floating sliding right columns for Simulator or Assistant panels */}
      {simulationWorkflow && (
        <Simulator
          workflow={simulationWorkflow}
          execution={activeSimulationRun}
          onSimulate={() => handleTriggerSimulation(simulationWorkflow)}
          onClose={() => { setSimulationWorkflow(null); setActiveSimulationRun(null); }}
          loading={simulating}
        />
      )}

      {assistantOpen && (
        <div className="fixed inset-y-0 right-0 z-50 w-full max-w-sm border-l border-slate-200 bg-white shadow-2xl transition duration-300 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
          <div className="absolute top-4 right-4 z-55">
            <button
              type="button"
              onClick={() => setAssistantOpen(false)}
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <AssistantSidebar
            workflow={selectedWorkflow}
            onWorkflowMutated={(updated) => {
              setWorkflows(prev => prev.map(w => w.id === updated.id ? updated : w));
              setSelectedWorkflow(updated);
            }}
          />
        </div>
      )}
    </div>
  );
}
