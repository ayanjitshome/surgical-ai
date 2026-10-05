import { Laptop, MonitorDot, TerminalSquare, Box, Server, ShieldCheck, Folder, Scale, GitBranch, Gauge } from "lucide-react";

export const platformIcon = (id) => {
  const map = {
    mac: Laptop,
    windows: MonitorDot,
    wsl: TerminalSquare,
    container: Box,
    "remote-ssh": Server,
    corporate: ShieldCheck,
  };
  return map[id] || Laptop;
};

export const stageIcon = (id) => {
  const map = {
    filesystem: Folder,
    "context-governor": Scale,
    "structural-graph": GitBranch,
    "agent-interface": Gauge,
  };
  return map[id] || Folder;
};
