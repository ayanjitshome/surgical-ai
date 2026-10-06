import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getTool } from "@/lib/api";
import { useMeta } from "@/hooks/useData";
import { CodeBlock } from "@/components/CodeBlock";
import { platformIcon } from "@/lib/icons";
import { Check, ChevronDown, CircleHelp, ArrowLeft, ArrowRight, CheckCircle2, Circle, PartyPopper, FileCode2, ShieldQuestion } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Wizard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: tool } = useQuery({ queryKey: ["tool", id], queryFn: () => getTool(id) });
  const { data: meta } = useMeta();

  const [platform, setPlatform] = useState(null);
  const [step, setStep] = useState(0);
  const [verified, setVerified] = useState({});
  const [openTrouble, setOpenTrouble] = useState(false);

  if (!tool || !meta) return <div className="p-8 font-mono text-muted-c">Loading wizard…</div>;

  const steps = tool.setup_steps || [];
  const platforms = meta.platforms || [];

  // Platform selection gate
  if (!platform) {
    return (
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 fade-up" data-testid="wizard-platform-select">
        <Link to={`/tools/${tool.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c mb-6">
          <ArrowLeft className="w-4 h-4" /> {tool.name}
        </Link>
        <div className="font-mono text-xs uppercase tracking-[0.25em] font-semibold mb-3" style={{ color: tool.color }}>{"// guided setup"}</div>
        <h1 className="font-mono text-3xl font-bold text-primary-c">Set up {tool.name}</h1>
        <p className="text-secondary-c mt-2">First, where are you running VSCode? Commands and troubleshooting adapt to your platform.</p>
        <div className="grid sm:grid-cols-3 gap-3 mt-7">
          {platforms.map((p) => {
            const Icon = platformIcon(p.id);
            return (
              <button key={p.id} data-testid={`wizard-platform-${p.id}`} onClick={() => setPlatform(p.id)}
                className="surface-card border border-c rounded-xl p-5 flex flex-col items-center gap-2.5 transition-all hover:border-bright-c hover:scale-[1.02]">
                <Icon className="w-7 h-7" style={{ color: tool.color }} />
                <span className="font-medium text-primary-c">{p.name}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const allVerified = steps.length > 0 && steps.every((_, i) => verified[i]);
  const isLast = step === steps.length - 1;
  const current = steps[step];
  const PlatIcon = platformIcon(platform);
  const override = current?.platform_overrides?.[platform];
  const stepCommands = override?.commands || current?.commands || [];
  const platformTip = override?.note;

  // Completion screen
  if (step >= steps.length) {
    return (
      <div className="max-w-2xl mx-auto px-5 py-16 text-center fade-up" data-testid="wizard-complete">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: `${tool.color}22` }}>
          <PartyPopper className="w-8 h-8" style={{ color: tool.color }} />
        </div>
        <h1 className="font-mono text-2xl font-bold text-primary-c">{tool.name} is set up</h1>
        <p className="text-secondary-c mt-2">
          {allVerified ? "All validation checkpoints passed." : "You skipped some checkpoints - revisit them if the agent misbehaves."}
        </p>
        <div className="flex items-center justify-center gap-3 mt-7">
          <button onClick={() => navigate("/")} data-testid="wizard-back-to-map" className="px-5 py-2.5 rounded-md border border-bright-c text-primary-c hover:surface-card">Back to ecosystem map</button>
          <button onClick={() => navigate("/guidance")} data-testid="wizard-next-tool" className="px-5 py-2.5 rounded-md font-semibold text-black" style={{ background: tool.color }}>What to install next</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-5 sm:px-8 py-8 fade-up" data-testid={`wizard-${tool.id}`}>
      <div className="flex items-center justify-between mb-5">
        <Link to={`/tools/${tool.id}`} className="inline-flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c">
          <ArrowLeft className="w-4 h-4" /> {tool.name}
        </Link>
        <button onClick={() => setPlatform(null)} data-testid="wizard-change-platform" className="flex items-center gap-1.5 text-sm text-muted-c hover:text-primary-c font-mono">
          <PlatIcon className="w-4 h-4" /> {platform} ▾
        </button>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-7">
        {steps.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <button onClick={() => setStep(i)} data-testid={`wizard-step-dot-${i}`} className="flex items-center gap-2">
              <span className={cn("w-7 h-7 rounded-full flex items-center justify-center font-mono text-xs border-2 shrink-0 transition-colors",
                verified[i] ? "text-black" : i === step ? "text-primary-c" : "text-muted-c")}
                style={{ borderColor: verified[i] || i === step ? tool.color : "var(--line-bright)", background: verified[i] ? tool.color : "transparent" }}>
                {verified[i] ? <Check className="w-4 h-4" /> : i + 1}
              </span>
            </button>
            {i < steps.length - 1 && <div className="h-0.5 flex-1 rounded" style={{ background: verified[i] ? tool.color : "var(--line)" }} />}
          </div>
        ))}
      </div>

      {/* Step body */}
      <div key={step} className="fade-up">
        <div className="font-mono text-xs text-muted-c mb-1">Step {step + 1} of {steps.length}</div>
        <h2 className="font-mono text-2xl font-bold text-primary-c">{current.title}</h2>
        <p className="text-secondary-c mt-2 leading-relaxed">{current.description}</p>

        {platformTip && (
          <div className="mt-4 flex items-start gap-2.5 rounded-lg p-3 border" style={{ borderColor: `${tool.color}55`, background: `${tool.color}14` }} data-testid={`platform-tip-${step}`}>
            <PlatIcon className="w-4 h-4 mt-0.5 shrink-0" style={{ color: tool.color }} />
            <p className="text-sm text-secondary-c leading-relaxed"><span className="font-mono text-xs uppercase tracking-wider" style={{ color: tool.color }}>{platform} · </span>{platformTip}</p>
          </div>
        )}

        {stepCommands.length > 0 && (
          <div className="mt-4">
            {stepCommands.map((cmd, ci) => (
              <CodeBlock key={ci} code={cmd} label={`${platform} • terminal`} testId={`setup-step-command-copy-button-${step}-${ci}`} />
            ))}
          </div>
        )}

        {current.snippet && (
          <div className="mt-2">
            <div className="flex items-center gap-1.5 font-mono text-xs text-muted-c mb-1"><FileCode2 className="w-3.5 h-3.5" /> file snippet</div>
            <CodeBlock code={current.snippet} label="config" testId={`setup-step-snippet-copy-button-${step}`} />
          </div>
        )}

        {/* Validation checkpoint */}
        <div className="mt-5 rounded-lg border p-4" style={{ borderColor: verified[step] ? tool.color : "var(--line-bright)", background: "var(--bg-card)" }} data-testid={`validation-checkpoint-${step}`}>
          <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider mb-2" style={{ color: tool.color }}>
            <ShieldQuestion className="w-4 h-4" /> Validation checkpoint
          </div>
          {current.validation?.command && <CodeBlock code={current.validation.command} label="verify" testId={`validation-command-copy-${step}`} />}
          <p className="text-sm text-secondary-c mt-2"><span className="text-primary-c font-medium">Expected:</span> {current.validation?.expected}</p>
          <button
            onClick={() => setVerified((v) => ({ ...v, [step]: !v[step] }))}
            data-testid={`mark-verified-button-${step}`}
            className={cn("mt-3 flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors",
              verified[step] ? "text-black" : "border border-bright-c text-primary-c hover:surface-card")}
            style={verified[step] ? { background: tool.color } : {}}
          >
            {verified[step] ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />}
            {verified[step] ? "Verified" : "Mark step tested & verified"}
          </button>
        </div>

        {/* Troubleshooting */}
        {current.troubleshooting?.length > 0 && (
          <div className="mt-4 rounded-lg border border-c surface-card overflow-hidden">
            <button onClick={() => setOpenTrouble((o) => !o)} data-testid={`troubleshooting-toggle-${step}`} className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-primary-c">
              <span className="flex items-center gap-2"><CircleHelp className="w-4 h-4" style={{ color: "#F59E0B" }} /> Common failure modes ({current.troubleshooting.length})</span>
              <ChevronDown className={cn("w-4 h-4 transition-transform", openTrouble && "rotate-180")} />
            </button>
            {openTrouble && (
              <div className="px-4 pb-4 space-y-3 border-t border-c pt-3">
                {current.troubleshooting.map((tr, ti) => (
                  <div key={ti} data-testid={`troubleshooting-item-${step}-${ti}`}>
                    <div className="font-mono text-sm text-primary-c flex items-start gap-2"><span style={{ color: "#F43F5E" }}>✗</span> {tr.problem}</div>
                    <div className="text-sm text-secondary-c ml-5 mt-0.5 flex items-start gap-2"><span style={{ color: "#10B981" }}>→</span> {tr.solution}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav */}
      <div className="flex items-center justify-between mt-8 pt-5 border-t border-c">
        <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} data-testid="wizard-prev-button"
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-md border border-bright-c text-primary-c hover:surface-card disabled:opacity-40">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <button onClick={() => setStep((s) => s + 1)} data-testid="wizard-next-button"
          className="flex items-center gap-1.5 px-5 py-2.5 rounded-md font-semibold text-black" style={{ background: tool.color }}>
          {isLast ? "Finish setup" : "Next step"} <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
