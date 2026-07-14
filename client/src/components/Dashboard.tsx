import { useState } from "react";
import {
  Zap,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Clock,
  DollarSign,
  Loader2,
  Power,
  Play,
  Settings,
  Trash2,
  ChevronRight,
  Info
} from "lucide-react";

export interface Workflow {
  id: string;
  name: string;
  prompt: string;
  active: boolean;
  trigger: {
    type: string;
    platform: string;
    config: any;
  };
  steps: Array<{
    id: string;
    platform: string;
    action: string;
    config: any;
    mapping: any;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface Analytics {
  totalRuns: number;
  successes: number;
  failures: number;
  successRate: number;
  timeSavedMinutes: number;
  moneySaved: number;
  automationScore: number;
  activeWorkflowsCount: number;
}

interface DashboardProps {
  analytics: Analytics;
  workflows: Workflow[];
  onCreateFromPrompt: (prompt: string) => void;
  onSelectWorkflow: (wf: Workflow) => void;
  onToggleActive: (wf: Workflow) => void;
  onDeleteWorkflow: (id: string) => void;
  onSimulate: (wf: Workflow) => void;
  loading: boolean;
}

export default function Dashboard({
  analytics,
  workflows,
  onCreateFromPrompt,
  onSelectWorkflow,
  onToggleActive,
  onDeleteWorkflow,
  onSimulate,
  loading
}: DashboardProps) {
  const [prompt, setPrompt] = useState("");

  const suggestions = [
    {
      text: "Save Gmail invoice attachments to Google Drive and summarize with AI",
      label: "Invoice Manager",
      icon: "📁"
    },
    {
      text: "Whenever a customer pays on Stripe, post details to Slack sales-alerts",
      label: "Instant Notifications",
      icon: "💳"
    },
    {
      text: "Every morning at 9:00 AM, extract summary of Notion database and send SMS",
      label: "Daily Report",
      icon: "📱"
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || loading) return;
    onCreateFromPrompt(prompt);
  };

  return (
    <div className="space-y-10">
      {/* Universal Magic Prompt Section */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white p-8 dark:border-zinc-800/80 dark:bg-zinc-900/60 linear-glow card-shadow">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            AI-First Automation Engine
          </div>
          <h2 className="text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-50">
            Describe your dream automation
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400">
            Explain what you want in simple English. FlowMagic will handle the apps, connections, data mappings, and scheduling automatically.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. When I get a Gmail invoice, extract summary with AI and notify Slack..."
              className="flex-1 rounded-2xl border border-slate-200 bg-slate-50/50 px-5 py-4 text-sm font-medium outline-none transition duration-150 focus:border-indigo-500 focus:bg-white focus:ring-2 focus:ring-indigo-100 dark:border-zinc-800 dark:bg-zinc-950 dark:focus:border-indigo-500 dark:focus:bg-zinc-950 dark:focus:ring-indigo-950/20"
            />
            <button
              type="submit"
              disabled={loading || !prompt.trim()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-4 text-sm font-semibold text-white transition hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <>
                  Automate
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Suggestions Grid */}
          <div className="mt-8 pt-6 border-t border-slate-100 dark:border-zinc-800/50">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
              Try these instant starters:
            </span>
            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setPrompt(s.text)}
                  className="flex flex-col items-start rounded-2xl border border-slate-100 bg-slate-50/30 p-4 text-left transition hover:border-indigo-300 hover:bg-indigo-50/10 dark:border-zinc-800/40 dark:bg-zinc-950/20 dark:hover:border-indigo-500/30"
                >
                  <span className="text-lg">{s.icon}</span>
                  <span className="mt-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                    {s.label}
                  </span>
                  <span className="mt-1 text-xs text-slate-500 line-clamp-2 dark:text-zinc-400">
                    {s.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {/* Runs Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-zinc-800/60 dark:bg-zinc-900/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Total Runs</span>
            <div className="rounded-lg bg-blue-50 p-2 text-blue-500 dark:bg-blue-950/20 dark:text-blue-400">
              <Play className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
              {analytics.totalRuns}
            </span>
            <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">executions</span>
          </div>
        </div>

        {/* Success rate Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-zinc-800/60 dark:bg-zinc-900/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Success Rate</span>
            <div className="rounded-lg bg-green-50 p-2 text-green-500 dark:bg-green-950/20 dark:text-green-400">
              <TrendingUp className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
              {analytics.successRate}%
            </span>
            <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">overall</span>
          </div>
        </div>

        {/* Hours Saved Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-zinc-800/60 dark:bg-zinc-900/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Hours Saved</span>
            <div className="rounded-lg bg-violet-50 p-2 text-violet-500 dark:bg-violet-950/20 dark:text-violet-400">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
              {(analytics.timeSavedMinutes / 60).toFixed(1)}
            </span>
            <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">estimated hrs</span>
          </div>
        </div>

        {/* Money Saved Card */}
        <div className="rounded-2xl border border-slate-200/60 bg-white p-5 dark:border-zinc-800/60 dark:bg-zinc-900/40 card-shadow">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 dark:text-zinc-500">Money Saved</span>
            <div className="rounded-lg bg-emerald-50 p-2 text-emerald-500 dark:bg-emerald-950/20 dark:text-emerald-400">
              <DollarSign className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-slate-800 dark:text-zinc-100">
              ${analytics.moneySaved}
            </span>
            <span className="ml-2 text-xs text-slate-400 dark:text-zinc-500">at $20/hr</span>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-zinc-100">
            Your Active Automations ({workflows.filter(w => w.active).length})
          </h3>
          <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 dark:border-zinc-800 dark:bg-zinc-900/30 dark:text-zinc-400">
            <Zap className="h-3.5 w-3.5 text-indigo-500" />
            Automation Score: {analytics.automationScore}/100
          </div>
        </div>

        {workflows.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-zinc-800 dark:bg-zinc-900/20 card-shadow">
            <Zap className="h-10 w-10 text-slate-300 dark:text-zinc-700" />
            <span className="mt-4 text-sm font-semibold text-slate-700 dark:text-zinc-300">
              No automations built yet
            </span>
            <p className="mt-1 max-w-xs text-xs text-slate-400 dark:text-zinc-500">
              Explain what you want to automate in the prompt box above, or click on a quick starter to build your first flow!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {workflows.map((wf) => (
              <div
                key={wf.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 md:flex-row md:items-center dark:border-zinc-800/80 dark:bg-zinc-900/30 dark:hover:border-zinc-700 card-shadow"
              >
                {/* Workflow Left Column */}
                <div className="space-y-1 max-w-xl">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-800 dark:text-zinc-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                      {wf.name}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {wf.trigger.platform} trigger
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 line-clamp-1 dark:text-zinc-500 italic">
                    &quot;{wf.prompt}&quot;
                  </p>
                  {/* Step pills */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
                      Steps:
                    </span>
                    <span className="rounded bg-indigo-50/50 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400">
                      {wf.trigger.platform} trigger
                    </span>
                    {wf.steps.map((s) => (
                      <span key={s.id} className="flex items-center gap-1">
                        <ChevronRight className="h-3 w-3 text-slate-300 dark:text-zinc-700" />
                        <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600 dark:bg-zinc-800 dark:text-zinc-400">
                          {s.platform.replace("_", " ")}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workflow Actions Column */}
                <div className="mt-4 flex flex-wrap items-center gap-2 md:mt-0">
                  {/* Test button */}
                  <button
                    type="button"
                    onClick={() => onSimulate(wf)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Simulate
                  </button>

                  {/* Customize button */}
                  <button
                    type="button"
                    onClick={() => onSelectWorkflow(wf)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
                  >
                    <Settings className="h-3.5 w-3.5" />
                    Configure
                  </button>

                  {/* Toggle Active */}
                  <button
                    type="button"
                    onClick={() => onToggleActive(wf)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${
                      wf.active
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                        : "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" />
                    {wf.active ? "Active" : "Inactive"}
                  </button>

                  {/* Delete button */}
                  <button
                    type="button"
                    onClick={() => onDeleteWorkflow(wf.id)}
                    className="rounded-xl p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Helpful tips card */}
      <div className="rounded-2xl border border-indigo-100/60 bg-indigo-50/20 p-5 dark:border-indigo-950/20 dark:bg-indigo-950/5 flex gap-3 card-shadow">
        <Info className="h-5 w-5 text-indigo-500 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="text-xs font-semibold text-indigo-900 dark:text-indigo-300">
            How FlowMagic Simulator works
          </span>
          <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
            By clicking <strong className="font-semibold text-slate-700 dark:text-zinc-300">Simulate</strong>, FlowMagic executes your workflow instantly using smart, real-world sandboxed inputs. You can watch your data flow through each integration step-by-step with zero risk of breaking production data.
          </p>
        </div>
      </div>
    </div>
  );
}
