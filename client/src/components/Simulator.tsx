import { X, Play, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Workflow } from "./Dashboard";

export interface ExecutionResult {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "success" | "failed" | "running";
  triggerPayload: any;
  stepsResults: Array<{
    stepId: string;
    name: string;
    status: "success" | "failed";
    error?: string;
    output?: any;
    inputUsed?: any;
  }>;
  startedAt: string;
  completedAt?: string;
  durationMs?: number;
  errorMessage?: string;
}

interface SimulatorProps {
  workflow: Workflow | null;
  execution: ExecutionResult | null;
  onSimulate: () => void;
  onClose: () => void;
  loading: boolean;
}

export default function Simulator({ workflow, execution, onSimulate, onClose, loading }: SimulatorProps) {
  if (!workflow) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-lg border-l border-slate-200 bg-white shadow-2xl transition duration-300 dark:border-zinc-800 dark:bg-zinc-950 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-zinc-900">
        <div>
          <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-100">
            Interactive Automation Testbed
          </h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Simulate and verify your workflow with dynamic sandboxed inputs
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:text-zinc-500 dark:hover:bg-zinc-900"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Active Workflow Summary */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/20 p-4 dark:border-indigo-950/20 dark:bg-indigo-950/5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider">
              Testing:
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
              {workflow.name}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400 italic">
            &quot;{workflow.prompt}&quot;
          </p>
        </div>

        {/* Simulator CTA Trigger */}
        <div className="rounded-xl border border-slate-100 p-5 text-center dark:border-zinc-900 dark:bg-zinc-900/10 space-y-3">
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Trigger a simulated webhook or event with sample data to run this workflow instantly!
          </p>
          <button
            type="button"
            onClick={onSimulate}
            disabled={loading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Executing Pipeline...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                Simulate Live Event
              </>
            )}
          </button>
        </div>

        {/* Live Terminal logs */}
        {execution && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Execution Logs
              </span>
              <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase ${
                execution.status === "success"
                  ? "bg-green-50 text-green-700 dark:bg-green-950/20 dark:text-green-400"
                  : execution.status === "failed"
                    ? "bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
                    : "bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
              }`}>
                {execution.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-amber-500" />}
                {execution.status === "success" && <CheckCircle className="h-3 w-3 text-green-500" />}
                {execution.status === "failed" && <AlertCircle className="h-3 w-3 text-rose-500" />}
                {execution.status}
              </span>
            </div>

            {/* Simulated Output Terminal Console */}
            <div className="rounded-2xl bg-slate-950 p-5 font-mono text-[11px] leading-relaxed text-zinc-300 border border-zinc-800 shadow-inner space-y-4">
              {/* Trigger Detection Log */}
              <div>
                <span className="text-emerald-400">⚡ [TRIGGER]</span> Detected event on platform <strong className="text-white">{workflow.trigger.platform.toUpperCase()}</strong>:
                <pre className="mt-1 max-h-32 overflow-y-auto text-zinc-500 bg-black/40 p-2.5 rounded-lg border border-zinc-900 scrollbar">
                  {JSON.stringify(execution.triggerPayload, null, 2)}
                </pre>
              </div>

              {/* Step Logs */}
              {execution.stepsResults.map((step, idx) => (
                <div key={step.stepId} className="border-t border-zinc-900 pt-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-400">⚙️ [STEP {idx + 1}] {step.name.toUpperCase()}</span>
                    <span className={step.status === "success" ? "text-emerald-500" : "text-rose-500"}>
                      ● {step.status}
                    </span>
                  </div>

                  {/* Evaluated variables */}
                  <div>
                    <span className="text-zinc-500">Compiled inputs:</span>
                    <pre className="text-zinc-400 ml-2 bg-black/20 p-2 rounded">
                      {JSON.stringify(step.inputUsed, null, 2)}
                    </pre>
                  </div>

                  {/* Output details */}
                  {step.status === "success" && step.output && (
                    <div>
                      <span className="text-zinc-500">Returned payload:</span>
                      <pre className="text-emerald-300 ml-2 bg-black/20 p-2 rounded max-h-24 overflow-y-auto">
                        {JSON.stringify(step.output, null, 2)}
                      </pre>
                    </div>
                  )}

                  {step.status === "failed" && step.error && (
                    <div className="text-rose-400 bg-rose-950/20 p-2 rounded border border-rose-900/40">
                      Error: {step.error}
                    </div>
                  )}
                </div>
              ))}

              {/* Final Complete Message */}
              {execution.status === "success" && (
                <div className="border-t border-zinc-900 pt-3 text-emerald-400 flex items-center gap-1.5 font-semibold text-xs">
                  <CheckCircle className="h-4 w-4" />
                  Successfully completed in {execution.durationMs}ms! All apps updated.
                </div>
              )}

              {execution.status === "failed" && (
                <div className="border-t border-zinc-900 pt-3 text-rose-400 flex items-center gap-1.5 font-semibold text-xs">
                  <AlertCircle className="h-4 w-4" />
                  Execution Failed: {execution.errorMessage}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
