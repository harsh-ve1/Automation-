import { useState } from "react";
import { Check, Key, ShieldCheck, AlertCircle, X } from "lucide-react";

export interface Connection {
  platform: string;
  name: string;
  connected: boolean;
  connectedAt: string;
  config: Record<string, any>;
}

interface ConnectionsProps {
  connections: Connection[];
  onConnect: (platform: string, name: string, config: any) => void;
  onDisconnect: (platform: string) => void;
}

export default function Connections({ connections, onConnect, onDisconnect }: ConnectionsProps) {
  const [activeDialog, setActiveDialog] = useState<string | null>(null);
  const [keyInput, setKeyInput] = useState("");
  const [secondaryInput, setSecondaryInput] = useState("");

  const platforms = [
    {
      id: "openai",
      name: "OpenAI GPT-4",
      icon: "🤖",
      desc: "Process data and generate text summaries with AI models",
      keyLabel: "OpenAI API Key",
      keyPlaceholder: "sk-proj-...",
      secondaryLabel: "",
    },
    {
      id: "slack",
      name: "Slack",
      icon: "💬",
      desc: "Send channels message updates and notify teams",
      keyLabel: "Incoming Webhook URL",
      keyPlaceholder: "https://hooks.slack.com/services/...",
      secondaryLabel: "",
    },
    {
      id: "discord",
      name: "Discord",
      icon: "🎮",
      desc: "Deliver beautiful embedded rich alerts to server webhooks",
      keyLabel: "Discord Webhook URL",
      keyPlaceholder: "https://discord.com/api/webhooks/...",
      secondaryLabel: "",
    },
    {
      id: "google",
      name: "Google Workspace",
      icon: "📁",
      desc: "Read Gmail inbox files and save attachments to Google Drive",
      keyLabel: "Google OAuth Secret Token",
      keyPlaceholder: "ya29.a0A...",
      secondaryLabel: "",
    },
    {
      id: "twilio",
      name: "Twilio",
      icon: "📱",
      desc: "Deliver instant automated mobile SMS and voice messages",
      keyLabel: "Account SID",
      keyPlaceholder: "AC...",
      secondaryLabel: "Auth Token",
    },
    {
      id: "stripe",
      name: "Stripe",
      icon: "💳",
      desc: "Monitor charge receipts and refund events automatically",
      keyLabel: "Secret API Key",
      keyPlaceholder: "sk_live_...",
      secondaryLabel: "",
    },
    {
      id: "notion",
      name: "Notion",
      icon: "📓",
      desc: "Sync database records and create nested page rows",
      keyLabel: "Integration Token",
      keyPlaceholder: "secret_...",
      secondaryLabel: "",
    }
  ];

  const getConnectionState = (platformId: string) => {
    return connections.find(c => c.platform === platformId);
  };

  const handleOpenConnect = (platformId: string) => {
    setKeyInput("");
    setSecondaryInput("");
    setActiveDialog(platformId);
  };

  const handleSaveConnection = (plat: typeof platforms[0]) => {
    if (!keyInput.trim()) return;

    const config: Record<string, any> = {};
    config[plat.keyLabel.toLowerCase().replace(/[^a-z]/g, "")] = keyInput.trim();
    if (plat.secondaryLabel) {
      config[plat.secondaryLabel.toLowerCase().replace(/[^a-z]/g, "")] = secondaryInput.trim();
    }

    onConnect(plat.id, plat.name, config);
    setActiveDialog(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-zinc-100">
          Connected Apps & APIs
        </h2>
        <p className="text-xs text-slate-400 dark:text-zinc-500">
          FlowMagic secure credentials vault uses zero-trust principles to encrypt and manage outbound API configurations.
        </p>
      </div>

      {/* Grid of integrations */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {platforms.map((plat) => {
          const conn = getConnectionState(plat.id);
          return (
            <div
              key={plat.id}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-slate-300 dark:border-zinc-800/80 dark:bg-zinc-900/30 card-shadow flex flex-col justify-between min-h-[170px]"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{plat.icon}</span>
                    <h3 className="text-sm font-semibold text-slate-800 dark:text-zinc-200">
                      {plat.name}
                    </h3>
                  </div>
                  {conn ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400">
                      <Check className="h-3 w-3" />
                      Connected
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2.5 py-0.5 text-[10px] font-semibold text-slate-400 dark:bg-zinc-800/50 dark:text-zinc-500">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400 leading-relaxed">
                  {plat.desc}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-50 dark:border-zinc-800/20 flex items-center justify-between">
                {conn ? (
                  <>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                      Encrypted and active
                    </span>
                    <button
                      type="button"
                      onClick={() => onDisconnect(plat.id)}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300"
                    >
                      Disconnect
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 flex items-center gap-1">
                      <Key className="h-3 w-3" /> Setup required
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenConnect(plat.id)}
                      className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400"
                    >
                      Connect
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Security note */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/10 flex gap-3 card-shadow items-center">
        <ShieldCheck className="h-6 w-6 text-indigo-500" />
        <div className="space-y-0.5">
          <span className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
            Enterprise-Grade Security Vault
          </span>
          <p className="text-[11px] text-slate-400 dark:text-zinc-500 leading-relaxed">
            All connection credentials and access keys are fully encrypted symmetrically on our database and decrypted only inside memory buffers when triggering automation requests. Zero plain-text leaks possible.
          </p>
        </div>
      </div>

      {/* Connection Dialog Box */}
      {activeDialog && (() => {
        const plat = platforms.find(p => p.id === activeDialog)!;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 dark:border-zinc-800/60">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{plat.icon}</span>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100">
                    Connect {plat.name}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveDialog(null)}
                  className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-4 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                    {plat.keyLabel}
                  </label>
                  <input
                    type="password"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder={plat.keyPlaceholder}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                  />
                </div>

                {plat.secondaryLabel && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-zinc-500">
                      {plat.secondaryLabel}
                    </label>
                    <input
                      type="password"
                      value={secondaryInput}
                      onChange={(e) => setSecondaryInput(e.target.value)}
                      placeholder="Auth Secret Key Token"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs outline-none focus:bg-white dark:border-zinc-800 dark:bg-zinc-950"
                    />
                  </div>
                )}

                <div className="rounded-xl bg-indigo-50/20 p-3 border border-indigo-100/50 text-[10px] text-slate-500 dark:bg-indigo-950/10 dark:border-indigo-900/30 flex gap-2">
                  <AlertCircle className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <span>
                    Don&apos;t have credentials? In sandbox mode, leaving connections disconnected executes beautiful simulated runs perfectly. Click save with a placeholder to force real outbound handlers!
                  </span>
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveDialog(null)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveConnection(plat)}
                  disabled={!keyInput.trim()}
                  className="rounded-xl bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                >
                  Save Connection
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
