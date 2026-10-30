/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome.
 *
 * Shared Token Economy scenario math. Imported by both the Token Economy
 * page (where the calculator lives) and the Home "Will $25 last the month?"
 * strip, so the two always agree on numbers.
 */

export const CACHED_WEIGHT = 0.1;
export const OUTPUT_WEIGHT = 5;
export const STORAGE_KEY = "surgicalai.tokenEconomy.scenario";

export const DEFAULTS = {
  inputTokens: 20000,
  cachedPct: 80,
  outputTokens: 2000,
  promptsPerHour: 8,
  mode: "prompt",
  budgetUsd: 25,
  hoursPerDay: 4,
  daysPerMonth: 20,
  modelId: "claude-sonnet-5-5",
  customInputRate: 3,
  customOutputRate: 15,
};

export const FALLBACK_MODELS = [
  // Anthropic
  { id: "claude-opus-5-5",   label: "Claude Opus 5.5",    vendor: "Anthropic", input: 4.0,  output: 20,   tokWeight: 5, source: "fallback" },
  { id: "claude-opus-5",     label: "Claude Opus 5",      vendor: "Anthropic", input: 5.0,  output: 25,   tokWeight: 5, source: "fallback" },
  { id: "claude-opus-4-8",   label: "Claude Opus 4.8",    vendor: "Anthropic", input: 5.0,  output: 25,   tokWeight: 5, source: "fallback" },
  { id: "claude-opus-4-7",   label: "Claude Opus 4.7",    vendor: "Anthropic", input: 5.0,  output: 25,   tokWeight: 5, source: "fallback" },
  { id: "claude-opus-4-6",   label: "Claude Opus 4.6",    vendor: "Anthropic", input: 5.0,  output: 25,   tokWeight: 5, source: "fallback" },
  { id: "claude-opus-4-5",   label: "Claude Opus 4.5",    vendor: "Anthropic", input: 5.0,  output: 25,   tokWeight: 5, source: "fallback" },
  { id: "claude-sonnet-5-5", label: "Claude Sonnet 5.5",  vendor: "Anthropic", input: 2.0,  output: 10,   tokWeight: 5, source: "fallback" },
  { id: "claude-sonnet-5",   label: "Claude Sonnet 5",    vendor: "Anthropic", input: 2.0,  output: 10,   tokWeight: 5, source: "fallback" },
  { id: "claude-sonnet-4-6", label: "Claude Sonnet 4.6",  vendor: "Anthropic", input: 3.0,  output: 15,   tokWeight: 5, source: "fallback" },
  { id: "claude-haiku-5-5",  label: "Claude Haiku 5.5",   vendor: "Anthropic", input: 0.10, output: 0.50, tokWeight: 5, source: "fallback" },
  { id: "claude-haiku-4-5",  label: "Claude Haiku 4.5",   vendor: "Anthropic", input: 1.0,  output: 5,    tokWeight: 5, source: "fallback" },
  { id: "claude-fable-5",    label: "Claude Fable 5",     vendor: "Anthropic", input: 10,   output: 50,   tokWeight: 5, source: "fallback" },
  { id: "claude-fable-5-1",  label: "Claude Fable 5.1",   vendor: "Anthropic", input: 10,   output: 50,   tokWeight: 5, source: "fallback" },
  // OpenAI - Codex
  { id: "gpt-5-codex",       label: "GPT-5 Codex",        vendor: "OpenAI",    input: 1.25, output: 10,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-1-codex",     label: "GPT-5.1 Codex",      vendor: "OpenAI",    input: 1.25, output: 10,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-2-codex",     label: "GPT-5.2 Codex",      vendor: "OpenAI",    input: 1.75, output: 14,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-3-codex",     label: "GPT-5.3 Codex",      vendor: "OpenAI",    input: 1.75, output: 14,   tokWeight: 8, source: "fallback" },
  // OpenAI - GPT-5 line
  { id: "gpt-5",             label: "GPT-5",              vendor: "OpenAI",    input: 1.25, output: 10,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-1",           label: "GPT-5.1",            vendor: "OpenAI",    input: 1.25, output: 10,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-2",           label: "GPT-5.2",            vendor: "OpenAI",    input: 1.75, output: 14,   tokWeight: 8, source: "fallback" },
  { id: "gpt-5-5",           label: "GPT-5.5",            vendor: "OpenAI",    input: 5.0,  output: 30,   tokWeight: 6, source: "fallback" },
  { id: "gpt-5-6-terra",     label: "GPT-5.6 Terra",      vendor: "OpenAI",    input: 2.0,  output: 12,   tokWeight: 6, source: "fallback" },
  // OpenAI - GPT-6
  { id: "gpt-6-sol",         label: "GPT-6 Sol",          vendor: "OpenAI",    input: 2.0,  output: 10,   tokWeight: 5, source: "fallback" },
  { id: "gpt-6-luna",        label: "GPT-6 Luna",         vendor: "OpenAI",    input: 0.10, output: 0.50, tokWeight: 5, source: "fallback" },
  { id: "gpt-6-astra",       label: "GPT-6 Astra",        vendor: "OpenAI",    input: 10,   output: 50,   tokWeight: 5, source: "fallback" },
  { id: "gpt-6-1-terra",     label: "GPT-6.1 Terra",      vendor: "OpenAI",    input: 1.0,  output: 5,    tokWeight: 5, source: "fallback" },
  // Google
  { id: "gemini-3-1-pro",    label: "Gemini 3.1 Pro",     vendor: "Google",    input: 2.0,  output: 12,   tokWeight: 6, source: "fallback" },
  { id: "gemini-3-flash",    label: "Gemini 3 Flash",     vendor: "Google",    input: 0.50, output: 3,    tokWeight: 6, source: "fallback" },
  { id: "gemini-3-5-flash",  label: "Gemini 3.5 Flash",   vendor: "Google",    input: 1.50, output: 9,    tokWeight: 6, source: "fallback" },
  { id: "gemini-3-8-flash",  label: "Gemini 3.8 Flash",   vendor: "Google",    input: 0.75, output: 3.75, tokWeight: 5, source: "fallback" },
  { id: "gemini-4-argon",    label: "Gemini 4 Argon",     vendor: "Google",    input: 2.0,  output: 10,   tokWeight: 5, source: "fallback" },
  { id: "gemini-2-5-pro",    label: "Gemini 2.5 Pro",     vendor: "Google",    input: 1.25, output: 10,   tokWeight: 8, source: "fallback" },
];

export const CUSTOM_MODEL = { id: "custom", label: "Custom rate", vendor: "You", input: 3, output: 15, tokWeight: 5, source: "fallback" };

export function loadScenario() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed.inputTokens === "number" &&
      typeof parsed.cachedPct === "number" &&
      typeof parsed.outputTokens === "number" &&
      typeof parsed.promptsPerHour === "number"
    ) return parsed;
    return null;
  } catch { return null; }
}

/* Resolve the model row the UI should use for cost math. Picks the matching
 * model from the live pricing list, falls back to FALLBACK_MODELS, then
 * finally to Custom with the scenario's custom rates. */
export function resolveModel(scenario, livePricing) {
  const models = livePricing?.models?.length ? livePricing.models : FALLBACK_MODELS;
  if (scenario.modelId === "custom") {
    return {
      ...CUSTOM_MODEL,
      input: scenario.customInputRate ?? CUSTOM_MODEL.input,
      output: scenario.customOutputRate ?? CUSTOM_MODEL.output,
    };
  }
  return models.find((m) => m.id === scenario.modelId) || models[0];
}

export function computeCosts(scenario, model) {
  const cached = scenario.inputTokens * (scenario.cachedPct / 100);
  const fresh = scenario.inputTokens - cached;
  const outputWeight = scenario.modelId === "custom"
    ? (scenario.customInputRate > 0 ? scenario.customOutputRate / scenario.customInputRate : OUTPUT_WEIGHT)
    : model.tokWeight;
  const costWithCache = cached * CACHED_WEIGHT + fresh + scenario.outputTokens * outputWeight;
  const costNoCache = scenario.inputTokens + scenario.outputTokens * outputWeight;
  const savings = Math.max(0, 1 - costWithCache / costNoCache);
  const usdPerPrompt =
    (cached * CACHED_WEIGHT + fresh) * (model.input / 1_000_000) +
    scenario.outputTokens * (model.output / 1_000_000);
  const usdPerDay = usdPerPrompt * scenario.promptsPerHour * scenario.hoursPerDay;
  const usdPerMonth = usdPerDay * scenario.daysPerMonth;
  const runwayDays = usdPerDay > 0 ? scenario.budgetUsd / usdPerDay : Infinity;
  const monthlyBudgetUsed = scenario.budgetUsd > 0 ? usdPerMonth / scenario.budgetUsd : 0;
  return { costWithCache, costNoCache, savings, usdPerPrompt, usdPerDay, usdPerMonth, runwayDays, monthlyBudgetUsed };
}

export function fmtUsd(n) {
  if (!Number.isFinite(n)) return "$0";
  if (n >= 1000) return "$" + Math.round(n).toLocaleString();
  if (n >= 10) return "$" + n.toFixed(0);
  return "$" + n.toFixed(2);
}
