import { useState } from "react";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Save
} from "lucide-react";
import { Workflow } from "./Dashboard";

interface VisualEditorProps {
  workflow: Workflow;
  onSave: (updated: Workflow) => void;
  onClose: () => void;
}

export default function VisualEditor({ workflow, onSave, onClose }: VisualEditorProps) {
  const [editedWf, setEditedWf] = useState<Workflow>({ ...workflow });
  const [addingToStep, setAddingToStep] = useState(false);

  const availablePlatforms = [
    { name: "Slack", value: "slack", action: "send_message", desc: "Notify a team channel" },
    { name: "Discord", value: "discord", action: "send_message", desc: "Post to a server webhook" },
    { name: "Google Drive", value: "google_drive", action: "save_file", desc: "Upload and organize files" },
    { name: "WhatsApp", value: "whatsapp", action: "send_message", desc: "Send WhatsApp template alert" },
    { name: "SMS / Twilio", value: "twilio", action: "send_message", desc: "Send clean mobile text alerts" },
    { name: "Notion", value: "notion", action: "create_row", desc: "Append database page" },
    { name: "OpenAI GPT-4", value: "openai", action: "analyze_invoice", desc: "Process and extract content using AI" }
  ];

  // Helper to extract list of available output tokens for mapping selection
  const getOutputTokens = (stepIdx: number) => {
    const tokens = [
      { label: "Trigger ID", value: "{{trigger.id}}", group: "Trigger" },
      { label: "Trigger Subject", value: "{{trigger.subject}}", group: "Trigger" },
      { label: "Trigger Body/Text", value: "{{trigger.body}}", group: "Trigger" },
      { label: "Customer Name", value: "{{trigger.customer_name}}", group: "Trigger" },
      { label: "Amount Formatted", value: "{{trigger.amount_formatted}}", group: "Trigger" },
    ];

    for (let i = 0; i < stepIdx; i++) {
      const step = editedWf.steps[i];
      if (step.platform === "openai") {
        tokens.push({ label: `AI Step [${i+1}] Response`, value: `{{${step.id}.text}}`, group: `Step ${i+1}` });
      } else if (step.platform === "google_drive") {
        tokens.push({ label: `Drive Step [${i+1}] File URL`, value: `{{${step.id}.url}}`, group: `Step ${i+1}` });
      } else if (step.platform === "notion") {
        tokens.push({ label: `Notion Step [${i+1}] Page URL`, value: `{{${step.id}.url}}`, group: `Step ${i+1}` });
      }
    }
    return tokens;
  };

  const updateTriggerConfig = (key: string, val: any) => {
    setEditedWf(prev => ({
      ...prev,
      trigger: {
        ...prev.trigger,
        config: { ...prev.trigger.config, [key]: val }
      }
    }));
  };

  const updateStepConfig = (stepId: string, key: string, val: any) => {
    setEditedWf(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          config: { ...step.config, [key]: val }
        };
      })
    }));
  };

  const updateStepMapping = (stepId: string, key: string, val: string) => {
    setEditedWf(prev => ({
      ...prev,
      steps: prev.steps.map(step => {
        if (step.id !== stepId) return step;
        return {
          ...step,
          mapping: { ...step.mapping, [key]: val }
        };
      })
    }));
  };

  const addStep = (platform: string, action: string) => {
    const newStepId = `step-${editedWf.steps.length + 1}-${platform}`;
    const newStep = {
      id: newStepId,
      platform,
      action,
      config: {},
      mapping: {
        text: "New automation event processed!",
        fileName: "invoice_{{trigger.id}}.txt",
        fileContent: "Transaction detail log",
        title: "Automated Log Entry"
      }
    };

    setEditedWf(prev => ({
      ...prev,
      steps: [...prev.steps, newStep]
    }));
    setAddingToStep(false);
  };

  const removeStep = (stepId: string) => {
    setEditedWf(prev => ({
      ...prev,
      steps: prev.steps.filter(s => s.id !== stepId)
    }));
  };

  const handleSave = () => {
    onSave(editedWf);
  };

  return (
    <div className="space-y-6">
      {/* Visual Editor Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/60 pb-5 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={editedWf.name}
                onChange={(e) => setEditedWf(prev => ({ ...prev, name: e.target.value }))}
                className="bg-transparent text-lg font-bold text-slate-800 outline-none hover:bg-slate-100/50 focus:bg-slate-100 px-1 rounded dark:text-zinc-100 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
              />
            </div>
            <p className="text-xs text-slate-400 dark:text-zinc-500">
              Editing AI-compiled workflow
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            <Save className="h-4 w-4" />
            Save & Activate
          </button>
        </div>
      </div>

      {/* Editor Body Timeline */}
      <div className="relative mx-auto max-w-2xl space-y-8 py-4">
        {/* Continuous Timeline Vertical Line */}
        <div className="absolute left-[39px] top-6 bottom-6 w-0.5 bg-slate-200 dark:bg-zinc-800" />

        {/* 1. TRIGGER BLOCK */}
        <div className="relative flex gap-6">
          {/* Connector Badge */}
          <div className="z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-xl font-bold text-amber-500 dark:bg-amber-950/20 dark:text-amber-400">
              ⚡
            </div>
          </div>

          <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-900/40 card-shadow">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">
              Step 1: The Trigger Event
            </span>
            <h4 className="mt-1 text-sm font-semibold text-slate-800 dark:text-zinc-100">
              Whenever a new event happens on {editedWf.trigger.platform.toUpperCase()}
            </h4>
            <p className="mt-1 text-xs text-slate-400 dark:text-zinc-500">
              This block detects incoming events and triggers the downstream pipeline instantly.
            </p>

            {/* Custom fields based on trigger platform */}
            <div className="mt-4 grid grid-cols-1 gap-3 pt-4 border-t border-slate-100 dark:border-zinc-800/40 sm:grid-cols-2">
              {editedWf.trigger.platform === "gmail" && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Gmail Folder
                    </label>
                    <input
                      type="text"
                      value={editedWf.trigger.config.folder || "INBOX"}
                      onChange={(e) => updateTriggerConfig("folder", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      Subject Filter Word
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. invoice"
                      value={editedWf.trigger.config.subjectFilter || ""}
                      onChange={(e) => updateTriggerConfig("subjectFilter", e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                </>
              )}

              {editedWf.trigger.platform === "stripe" && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Stripe Webhook Event Type
                  </label>
                  <input
                    type="text"
                    value={editedWf.trigger.config.event || "charge.succeeded"}
                    onChange={(e) => updateTriggerConfig("event", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              )}

              {editedWf.trigger.platform === "scheduler" && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Schedules Execution Frequency
                  </label>
                  <input
                    type="text"
                    value={editedWf.trigger.config.schedule || "every day"}
                    onChange={(e) => updateTriggerConfig("schedule", e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>
              )}

              {editedWf.trigger.platform === "webhook" && (
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    Custom Webhook Receive Url
                  </label>
                  <div className="rounded-xl border border-slate-200 bg-slate-100/50 px-3 py-2 text-xs text-slate-500 dark:border-zinc-800 dark:bg-zinc-900 select-all">
                    http://localhost:3001/api/webhooks/catch/{editedWf.id}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 2. ACTION BLOCKS */}
        {editedWf.steps.map((step, idx) => {
          const tokens = getOutputTokens(idx);
          return (
            <div key={step.id} className="relative flex gap-6">
              {/* Connector Badge */}
              <div className="z-10 flex h-20 w-20 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900/60">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-xl font-bold text-indigo-500 dark:bg-indigo-950/20 dark:text-amber-400">
                  {idx + 2}
                </div>
              </div>

              <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-6 dark:border-zinc-800/80 dark:bg-zinc-900/40 card-shadow">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                    Step {idx + 2}: Action ({step.platform.replace("_", " ")})
                  </span>
                  <button
                    type="button"
                    onClick={() => removeStep(step.id)}
                    className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-500 dark:hover:bg-rose-950/20 dark:hover:text-rose-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <h4 className="mt-1 text-sm font-semibold text-slate-800 dark:text-zinc-100">
                  {step.platform.replace("_", " ").toUpperCase()}: {step.action.replace("_", " ")}
                </h4>

                {/* Simplified Parameter Configuration Mapping inputs */}
                <div className="mt-4 space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800/40">
                  {/* TEXT/MESSAGE FIELD */}
                  {(step.platform === "slack" || step.platform === "discord" || step.platform === "twilio" || step.platform === "whatsapp") && (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Message Notification Text
                        </label>
                        {/* Interactive Dynamic Data Token Injector Dropdown */}
                        <select
                          onChange={(e) => {
                            if (e.target.value) {
                              const currentVal = step.mapping.text || "";
                              updateStepMapping(step.id, "text", currentVal + " " + e.target.value);
                              e.target.value = "";
                            }
                          }}
                          className="text-[10px] bg-slate-50 text-indigo-600 border border-slate-100 rounded px-1.5 py-0.5 outline-none dark:bg-zinc-900 dark:border-zinc-800 dark:text-indigo-400"
                        >
                          <option value="">+ Insert Data</option>
                          {tokens.map((tok, tid) => (
                            <option key={tid} value={tok.value}>{tok.label}</option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        value={step.mapping.text || ""}
                        onChange={(e) => updateStepMapping(step.id, "text", e.target.value)}
                        placeholder="Write message content..."
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        rows={3}
                      />
                    </div>
                  )}

                  {/* SLACK CHANNEL */}
                  {step.platform === "slack" && (
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                        Slack Channel Name
                      </label>
                      <input
                        type="text"
                        value={step.config.channel || "general"}
                        onChange={(e) => updateStepConfig(step.id, "channel", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                      />
                    </div>
                  )}

                  {/* GOOGLE DRIVE FIELDS */}
                  {step.platform === "google_drive" && (
                    <>
                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Folder Name
                          </label>
                          <input
                            type="text"
                            value={step.config.folderName || "Invoices"}
                            onChange={(e) => updateStepConfig(step.id, "folderName", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                            Save Filename
                          </label>
                          <input
                            type="text"
                            value={step.mapping.fileName || ""}
                            onChange={(e) => updateStepMapping(step.id, "fileName", e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Save File Content Attachment
                        </label>
                        <input
                          type="text"
                          value={step.mapping.fileContent || ""}
                          onChange={(e) => updateStepMapping(step.id, "fileContent", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </>
                  )}

                  {/* OPENAI FIELDS */}
                  {step.platform === "openai" && (
                    <>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          AI Reasoning Prompt
                        </label>
                        <input
                          type="text"
                          value={step.config.prompt || ""}
                          onChange={(e) => updateStepConfig(step.id, "prompt", e.target.value)}
                          placeholder="e.g. extract invoice sum and customer list"
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Text context to feed to AI
                        </label>
                        <input
                          type="text"
                          value={step.mapping.emailText || ""}
                          onChange={(e) => updateStepMapping(step.id, "emailText", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </>
                  )}

                  {/* NOTION ROW */}
                  {step.platform === "notion" && (
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Database Name
                        </label>
                        <input
                          type="text"
                          value={step.config.databaseId || "Notion Invoices Table"}
                          onChange={(e) => updateStepConfig(step.id, "databaseId", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                          Row Title Value
                        </label>
                        <input
                          type="text"
                          value={step.mapping.title || ""}
                          onChange={(e) => updateStepMapping(step.id, "title", e.target.value)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {/* 3. ADD STEP DROPDOWN BUTTON */}
        <div className="relative flex gap-6">
          <div className="z-10 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-50/40 dark:bg-zinc-900/20">
            <button
              type="button"
              onClick={() => setAddingToStep(!addingToStep)}
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white shadow hover:bg-indigo-500 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 flex items-center">
            {addingToStep ? (
              <div className="w-full rounded-2xl border border-indigo-200 bg-white p-5 space-y-4 dark:border-indigo-950 dark:bg-zinc-900 card-shadow">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500">
                  Select integration app to insert:
                </span>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {availablePlatforms.map((plat) => (
                    <button
                      key={plat.value}
                      type="button"
                      onClick={() => addStep(plat.value, plat.action)}
                      className="flex flex-col items-start rounded-xl border border-slate-100 bg-slate-50/40 p-3 text-left hover:border-indigo-300 hover:bg-indigo-50/20 dark:border-zinc-800/40 dark:bg-zinc-950/20"
                    >
                      <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                        {plat.name}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 mt-0.5">
                        {plat.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingToStep(true)}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                + Add another action step to flow
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
