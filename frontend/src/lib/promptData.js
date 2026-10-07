// Shared prompt data + generator used by the Prompt Playbook and Prompt Builder pages.

// Per-tool directive the agent should be told to honour when the tool is active.
export const TOOL_DIRECTIVES = {
  graft: "Treat the grafted file slice as the complete scope. Do not request files outside it, if something essential seems missing, say so instead of pulling the whole repo.",
  serena: "Stay within the token budget. Fetch specific symbols/functions via retrieval rather than pasting whole files, and keep your answer focused on the task.",
  graphify: "Resolve \"where is X defined / used\" through the structural graph (symbols, call edges, imports), never full-text grep or read many files to find them.",
  "codebase-memory": "Consult persistent memory for existing conventions and prior decisions before asking. Record any new architectural decision you make so future sessions inherit it.",
  archify: "Obey the injected architectural invariants and layering rules. Every proposed change must pass `archify check`, do not introduce cross-layer imports.",
  ponytail: "Write the minimum code that solves the task: reuse what already exists, prefer stdlib and native platform features, and avoid new dependencies, wrappers and abstractions. One line beats a class. Never cut validation, security, error handling or accessibility.",
  agentsview: "This session's token usage is measured. Prefer the smallest sufficient context, avoid restating the obvious, and flag any step that would blow the budget.",
};

export const AGENTS = [
  { v: "claude", l: "Claude", env: "VSCode via Claude Code", note: "Show a brief plan before editing, then make precise, minimal multi-file changes." },
  { v: "copilot", l: "GitHub Copilot", env: "VSCode with GitHub Copilot Chat", note: "Keep changes small and inline-review friendly; avoid broad rewrites." },
  { v: "codex", l: "Codex", env: "the Codex CLI sandbox", note: "Apply edits as patches and run the project's tests and linters before finishing." },
  { v: "antigravity", l: "Antigravity", env: "the Antigravity agentic IDE", note: "Work autonomously across files, but surface your plan and verify each step as you go." },
];

export const buildPrompt = ({ task, languages, platform, agentLabel, agentEnv, agentNote, activeIds, tools, constraints, output, validation }) => {
  const active = tools.filter((t) => activeIds.includes(t.id));
  const contextLines = active.length
    ? active.map((t) => `- **${t.name}** (${t.layer_name}): ${TOOL_DIRECTIVES[t.id]}`).join("\n")
    : "- (no context tools active, work only from what is pasted below)";

  const langLine = languages?.trim() ? languages.trim() : "not specified";
  const constraintLines = constraints?.trim()
    ? constraints.trim().split("\n").map((l) => `- ${l.replace(/^[-*]\s*/, "")}`).join("\n")
    : "- Make the smallest change that fully satisfies the objective.\n- Do not modify unrelated files or reformat untouched code.";
  const outputLine = output?.trim() ? output.trim() : "A brief plan, then a unified diff limited to the files you change.";
  const defaultValidation = `1. Does the change stay inside the provided context scope (Graft slice)?
2. Did you use the structural graph / memory instead of re-reading files?
3. Does it respect the architectural invariants (no cross-layer imports)?
4. Is this the smallest change that fully meets the objective?
5. Is the output in the exact format requested above?`;
  const validationLines = validation?.trim()
    ? validation.trim().split("\n").filter((l) => l.trim()).map((l, i) => `${i + 1}. ${l.trim().replace(/^\d+[.)]\s*/, "").replace(/^[-*]\s*/, "")}`).join("\n")
    : defaultValidation;

  return `# ROLE & OBJECTIVE
You are ${agentLabel}, an AI coding agent working in ${agentEnv}. Complete exactly one task, operating strictly within the constraints of the context tools listed below.
- Agent operating note: ${agentNote}

**Objective:** ${task?.trim() || "<describe the single concrete task here>"}

# AVAILABLE CONTEXT, rely on your tooling, do not rebuild it
${contextLines}

# REPOSITORY
- Primary language(s): ${langLine}
- Target platform: ${platform}

# CONSTRAINTS
${constraintLines}
- Ask a clarifying question only if truly blocked, otherwise proceed with the most reasonable interpretation and note the assumption.

# EXPECTED OUTPUT
${outputLine}

# VALIDATION, run this checklist before you answer
${validationLines}`;
};
