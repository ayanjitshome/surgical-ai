import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import { ArrowRight } from "lucide-react";

export const ToolNode = memo(({ data, selected }) => {
  const { name, tagline, layer_name, token_waste_reduction, color, onOpen, palette } = data;
  const p = palette;
  return (
    <div
      data-testid={`ecosystem-node-${data.id}`}
      role="button"
      tabIndex={0}
      aria-label={`${name}: ${tagline}`}
      onClick={onOpen}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); } }}
      className="rounded-xl border-2 cursor-pointer transition-all duration-200 w-[210px]"
      style={{
        background: p.card,
        borderColor: selected ? color : p.borderBright,
        boxShadow: selected ? `0 0 24px ${color}55` : `0 0 12px ${color}22`,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ background: color, width: 8, height: 8, border: "none" }} />
      <div className="p-3.5">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.18em] px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}66` }}>
            {layer_name}
          </span>
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color, boxShadow: `0 0 8px ${color}` }} />
        </div>
        <div className="font-mono font-bold text-base" style={{ color: p.textPrimary }}>{name}</div>
        <div className="text-xs leading-snug mt-1 line-clamp-2" style={{ color: p.textSecondary }}>{tagline}</div>
        <div className="flex items-center justify-between mt-3 pt-2.5 border-t" style={{ borderColor: p.border }}>
          <span className="font-mono text-xs font-semibold" style={{ color }}>-{token_waste_reduction}</span>
          <span className="flex items-center gap-1 text-[10px] font-mono" style={{ color: p.textMuted }}>
            tokens <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Right} style={{ background: color, width: 8, height: 8, border: "none" }} />
    </div>
  );
});

ToolNode.displayName = "ToolNode";
