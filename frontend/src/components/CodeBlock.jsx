import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { toast } from "sonner";

export const CodeBlock = ({ code, label = "bash", testId }) => {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className="rounded-lg border border-c overflow-hidden my-3" style={{ background: "#0B0F17" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-c" style={{ background: "#111827" }}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#F43F5E" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} />
          <span className="ml-3 font-mono text-xs flex items-center gap-1.5" style={{ color: "#64748B" }}>
            <Terminal className="w-3.5 h-3.5" /> {label}
          </span>
        </div>
        <button
          data-testid={testId}
          onClick={copy}
          className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md transition-colors hover:bg-white/5"
          style={{ color: copied ? "#10B981" : "#94A3B8" }}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto font-mono text-sm leading-relaxed" style={{ color: "#93C5FD" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
