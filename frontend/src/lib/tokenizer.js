/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome.
 *
 * Real BPE token count for the Prompt Builder. We lazy-load gpt-tokenizer's
 * o200k_base encoding (used by GPT-4o / GPT-5 and a reasonable proxy for
 * Claude's SentencePiece-ish BPE) so the ~1MB encoding table only hits users
 * who visit the Prompt Builder. Falls back to the chars/4 heuristic while the
 * module is loading, so the chip never reads "0" or blocks typing.
 */

let encoderPromise = null;

async function getEncoder() {
  if (!encoderPromise) {
    encoderPromise = import(
      /* webpackChunkName: "tokenizer" */ "gpt-tokenizer/encoding/o200k_base"
    ).then((mod) => (text) => mod.encode(text).length);
  }
  return encoderPromise;
}

export function estimateTokens(text) {
  // Fast heuristic for immediate render: GPT/Claude average ~4 chars per token.
  if (!text) return 0;
  return Math.max(1, Math.round(text.length / 4));
}

export async function countTokens(text) {
  if (!text) return 0;
  try {
    const encode = await getEncoder();
    return encode(text);
  } catch {
    return estimateTokens(text);
  }
}
