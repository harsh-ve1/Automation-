import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Loader2 } from "lucide-react";
import { Workflow } from "./Dashboard";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AssistantSidebarProps {
  workflow: Workflow | null;
  onWorkflowMutated: (updated: Workflow) => void;
}

export default function AssistantSidebar({ workflow, onWorkflowMutated }: AssistantSidebarProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I am your personal AI automation engineer. 🤖\n\nI can help you build workflows from scratch, add notification steps (e.g. 'Add Slack notify step'), answer troubleshooting questions, or explain technical aspects of integrations.\n\nHow can I help you today?"
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          workflowId: workflow ? workflow.id : null,
          message: userMsg,
          chatHistory: messages
        })
      });

      const data: any = await res.json();

      setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);

      if (data.updatedWorkflow) {
        onWorkflowMutated(data.updatedWorkflow);
      }
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: "assistant", content: "I encountered a minor connection issue. Could you try asking again?" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-slate-50 border-l border-slate-200 dark:bg-zinc-900/40 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-slate-200/60 p-5 dark:border-zinc-800">
        <div className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-400">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-100">
            FlowMagic Assistant
          </h3>
          <p className="text-[10px] text-slate-400 dark:text-zinc-500">
            {workflow ? `Assisting with: ${workflow.name}` : "Build automations on the fly"}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`flex gap-2.5 max-w-[85%] ${
              m.role === "user" ? "ml-auto flex-row-reverse" : ""
            }`}
          >
            <div className={`rounded-xl p-3 text-xs leading-relaxed ${
              m.role === "user"
                ? "bg-indigo-600 text-white rounded-tr-none dark:bg-indigo-500"
                : "bg-white text-slate-700 border border-slate-200/60 rounded-tl-none dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-300"
            }`}>
              {/* Simple format returns as paragraphs */}
              {m.content.split("\n").map((line, lid) => (
                <p key={lid} className={lid > 0 ? "mt-1.5" : ""}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="rounded-xl bg-white border border-slate-200/60 rounded-tl-none p-3 text-xs dark:bg-zinc-950 dark:border-zinc-800">
              <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="border-t border-slate-200/60 p-4 dark:border-zinc-800">
        <div className="flex gap-2 bg-white rounded-xl border border-slate-200/80 px-3 py-2 focus-within:border-indigo-500 dark:bg-zinc-950 dark:border-zinc-800 dark:focus-within:border-indigo-500">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to 'add a Slack notify step'..."
            className="flex-1 bg-transparent text-xs text-slate-800 outline-none dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="rounded-lg bg-indigo-50 p-1.5 text-indigo-600 hover:bg-indigo-100 disabled:opacity-40 dark:bg-indigo-950/40 dark:text-indigo-400"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>
    </div>
  );
}
