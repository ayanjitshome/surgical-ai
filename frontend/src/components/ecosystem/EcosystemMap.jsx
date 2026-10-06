import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import {
  ReactFlow, Background, Controls, ControlButton,
  useNodesState, useEdgesState, MarkerType,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ToolNode } from "@/components/ecosystem/ToolNode";
import { useTheme } from "@/context/ThemeContext";
import { Maximize2, Minimize2 } from "lucide-react";

const nodeTypes = { tool: ToolNode };

const LAYERS = ["filesystem", "context-governor", "structural-graph", "output-governor", "agent-interface"];

const PALETTES = {
  dark: {
    primary: "#0B0F17", secondary: "#111827", card: "#161E2E",
    border: "#1E293B", borderBright: "#334155",
    textPrimary: "#F8FAFC", textSecondary: "#94A3B8", textMuted: "#64748B",
  },
  light: {
    primary: "#F8FAFC", secondary: "#FFFFFF", card: "#FFFFFF",
    border: "#E2E8F0", borderBright: "#CBD5E1",
    textPrimary: "#0F172A", textSecondary: "#475569", textMuted: "#64748B",
  },
};

const computePositions = (nodes) => {
  const byLayer = {};
  nodes.forEach((n) => {
    (byLayer[n.layer] = byLayer[n.layer] || []).push(n);
  });
  const pos = {};
  LAYERS.forEach((layer, col) => {
    const group = byLayer[layer] || [];
    const colHeight = group.length * 170;
    const startY = 260 - colHeight / 2;
    group.forEach((n, i) => {
      pos[n.id] = { x: col * 290 + 20, y: startY + i * 170 };
    });
  });
  return pos;
};

export const EcosystemMap = ({ data, onSelect, selectedId }) => {
  const { theme } = useTheme();
  const palette = PALETTES[theme] || PALETTES.dark;
  const positions = useMemo(() => computePositions(data.nodes), [data.nodes]);

  const initialNodes = useMemo(
    () =>
      data.nodes.map((n) => ({
        id: n.id,
        type: "tool",
        position: positions[n.id] || { x: 0, y: 0 },
        data: { ...n, palette, onOpen: () => onSelect(n.id) },
        selected: n.id === selectedId,
      })),
    [data.nodes, positions, onSelect, selectedId, palette]
  );

  const initialEdges = useMemo(
    () =>
      data.edges.map((e) => {
        const src = data.nodes.find((n) => n.id === e.source);
        const color = src?.color || "#64748B";
        return {
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          animated: true,
          style: { stroke: color, strokeWidth: 1.8 },
          labelStyle: { fill: palette.textMuted, fontSize: 10, fontFamily: "JetBrains Mono" },
          labelBgStyle: { fill: palette.secondary, fillOpacity: 0.92 },
          labelBgPadding: [4, 2],
          markerEnd: { type: MarkerType.ArrowClosed, color, width: 16, height: 16 },
        };
      }),
    [data.edges, data.nodes, palette]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Re-apply nodes/edges whenever they are recomputed (e.g. theme toggle),
  // since useNodesState/useEdgesState only read their argument as the initial value.
  useEffect(() => { setNodes(initialNodes); }, [initialNodes, setNodes]);
  useEffect(() => { setEdges(initialEdges); }, [initialEdges, setEdges]);

  const handleNodeClick = useCallback((_, node) => onSelect(node.id), [onSelect]);

  const wrapperRef = useRef(null);
  const rfRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => {
      const active = document.fullscreenElement === wrapperRef.current;
      setIsFullscreen(active);
      // Refit after the viewport resizes (both entering and exiting).
      setTimeout(() => rfRef.current?.fitView({ padding: 0.15 }), 120);
    };
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen?.();
    } else {
      wrapperRef.current?.requestFullscreen?.();
    }
  }, []);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", background: palette.primary }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onInit={(inst) => (rfRef.current = inst)}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.4}
        maxZoom={1.6}
        proOptions={{ hideAttribution: true }}
        style={{ background: palette.primary }}
      >
        <Background color={palette.border} gap={28} size={1.5} />
        <Controls showInteractive={false} showFitView={false}>
          <ControlButton onClick={toggleFullscreen} aria-label={isFullscreen ? "Exit full screen" : "Full screen"} title={isFullscreen ? "Exit full screen" : "Full screen"} data-testid="ecosystem-fullscreen-button">
            {isFullscreen
              ? <Minimize2 size={14} color={palette.textSecondary} />
              : <Maximize2 size={14} color={palette.textSecondary} />}
          </ControlButton>
        </Controls>
      </ReactFlow>
    </div>
  );
};
