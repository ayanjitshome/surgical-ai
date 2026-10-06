import { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";
import { toast } from "sonner";
import { useTheme } from "@/context/ThemeContext";

const PALETTES = {
  dark: { body: "#0B0F17", header: "#111827", code: "#93C5FD", label: "#64748B", copy: "#94A3B8", copyHover: "rgba(255,255,255,0.06)" },
  light: { body: "#F8FAFC", header: "#EEF2F7", code: "#1E293B", label: "#64748B", copy: "#475569", copyHover: "rgba(15,23,42,0.05)" },
};

export const CodeBlock = ({ code, label = "bash", testId }) => {
  const [copied, setCopied] = useState(false);
  const { theme } = useTheme();
  const p = PALETTES[theme] || PALETTES.dark;

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
    <div className="rounded-lg border border-c overflow-hidden my-3" style={{ background: p.body }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-c" style={{ background: p.header }}>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full" style={{ background: "#F43F5E" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#F59E0B" }} />
          <span className="w-3 h-3 rounded-full" style={{ background: "#10B981" }} />
          <span className="ml-3 font-mono text-xs flex items-center gap-1.5" style={{ color: p.label }}>
            <Terminal className="w-3.5 h-3.5" /> {label}
          </span>
        </div>
        <button
          data-testid={testId}
          onClick={copy}
          className="flex items-center gap-1.5 font-mono text-xs px-2.5 py-1 rounded-md transition-colors"
          style={{ color: copied ? "#10B981" : p.copy }}
          onMouseEnter={(e) => (e.currentTarget.style.background = p.copyHover)}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="px-4 py-3 overflow-x-auto font-mono text-sm leading-relaxed" style={{ color: p.code }}>
        <code>{code}</code>
      </pre>
    </div>
  );
};
