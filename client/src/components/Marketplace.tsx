import { Star, Download, Sparkles } from "lucide-react";

export interface Template {
  id: string;
  name: string;
  prompt: string;
  description: string;
  icon: string;
  category: string;
  triggerPlatform: string;
  stepsCount: number;
}

interface MarketplaceProps {
  onInstall: (prompt: string) => void;
  loading: boolean;
}

export default function Marketplace({ onInstall, loading }: MarketplaceProps) {
  const templates: Template[] = [
    {
      id: "tmpl-1",
      name: "Saves Email Invoices to Google Drive",
      prompt: "When I receive a Gmail invoice, download the file and save it in Google Drive Invoices folder",
      description: "Tired of downloading invoices and re-uploading them? This auto-detects invoices in your mail, extracts them, and organizes them perfectly.",
      icon: "📁",
      category: "Documents",
      triggerPlatform: "gmail",
      stepsCount: 2
    },
    {
      id: "tmpl-2",
      name: "Stripe Charge to Slack Alerts",
      prompt: "Whenever a payment succeeded on Stripe, send detailed channel alert in Slack sales",
      description: "Keep your sales team aligned! Sends automated notification cards containing customer detail, formatted amount, and currency to Slack.",
      icon: "💳",
      category: "Sales",
      triggerPlatform: "stripe",
      stepsCount: 1
    },
    {
      id: "tmpl-3",
      name: "AI Email Inbound Summarizer",
      prompt: "When I get an email, run OpenAI GPT summarizing the contents and notify Slack",
      description: "Get smart briefings without reading hundreds of words. Combines GPT-4 summaries and Slack channels to keep everyone in the loop.",
      icon: "🤖",
      category: "Artificial Intelligence",
      triggerPlatform: "gmail",
      stepsCount: 2
    },
    {
      id: "tmpl-4",
      name: "Discord Event Logging to Notion Database",
      prompt: "When a webhook event is caught, append title row in Notion Invoices Table",
      description: "Maintain a complete audit log of system webhooks inside Notion. Highly structured database entries made in real time.",
      icon: "🎮",
      category: "Data Management",
      triggerPlatform: "webhook",
      stepsCount: 1
    },
    {
      id: "tmpl-5",
      name: "Daily SMS / Twilio Team Reports",
      prompt: "Every Monday morning at 9am, create summary row of Google Drive and message WhatsApp to team",
      description: "Start the week organized! Generates daily scheduled summaries and delivers templates to WhatsApp phone lines automatically.",
      icon: "📱",
      category: "Scheduling",
      triggerPlatform: "scheduler",
      stepsCount: 2
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100 flex items-center gap-2">
            🛍️ Automation Recipe Marketplace
          </h2>
          <p className="text-xs text-slate-400 dark:text-zinc-500">
            Browse and install top automation blueprints built by automation engineers. Explanations are simple and child-friendly.
          </p>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3.5 py-1.5 text-xs font-semibold text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Star className="h-4 w-4 text-amber-500 fill-current" />
          5,000+ Active Templates
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id}
            className="group relative rounded-2xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/30 card-shadow flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-3xl">{tmpl.icon}</span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-slate-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {tmpl.category}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 leading-snug">
                  {tmpl.name}
                </h3>
                <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {tmpl.description}
                </p>
              </div>

              {/* Explains template logic simply */}
              <div className="rounded-xl bg-slate-50 p-3.5 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-900">
                <div className="flex items-center gap-1 text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                  <Sparkles className="h-3.5 w-3.5" /> Simple English
                </div>
                <p className="mt-1 text-[10px] text-slate-400 dark:text-zinc-500 italic">
                  &quot;{tmpl.prompt}&quot;
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50 dark:border-zinc-800/20 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                {tmpl.stepsCount} steps pipeline
              </span>
              <button
                type="button"
                onClick={() => onInstall(tmpl.prompt)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Download className="h-3.5 w-3.5" />
                Install Template
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
