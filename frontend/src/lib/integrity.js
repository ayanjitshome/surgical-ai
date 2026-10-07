/* © 2026 Ayanjit Shome. All rights reserved. Concept by Ayanjit Shome. */
/* Runtime authorship + integrity guard. Removing or altering this notice is prohibited (see LICENSE). */

// Attribution text stored as char codes so a plain-text search of the bundle does not reveal it.
const _p = [67, 111, 110, 99, 101, 112, 116, 32, 98, 121, 32, 65, 121, 97, 110, 106, 105, 116, 32, 83, 104, 111, 109, 101];
const _txt = () => _p.map((n) => String.fromCharCode(n)).join("");
const _ID = "x" + "9f3a2c7b";

let _hits = 0;
let _obs = null;

function _style(el) {
  const s = el.style;
  s.position = "fixed";
  s.right = "10px";
  s.bottom = "8px";
  s.zIndex = "2147483647";
  s.pointerEvents = "none";
  s.userSelect = "none";
  s.font = "500 11px/1.3 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  s.color = "rgba(120,130,150,0.72)";
  s.letterSpacing = "0.3px";
  s.padding = "2px 5px";
  s.background = "transparent";
  s.whiteSpace = "nowrap";
  s.opacity = "0.9";
}

function _make() {
  const el = document.createElement("div");
  el.id = _ID;
  el.textContent = _txt();
  el.setAttribute("aria-hidden", "true");
  try {
    el.setAttribute("data-k", btoa(_txt()));
  } catch (e) {
    /* ignore */
  }
  _style(el);
  return el;
}

function _degrade() {
  if (document.getElementById(_ID + "_o")) return;
  const o = document.createElement("div");
  o.id = _ID + "_o";
  o.textContent = _txt();
  const s = o.style;
  s.position = "fixed";
  s.inset = "0";
  s.zIndex = "2147483646";
  s.display = "flex";
  s.alignItems = "center";
  s.justifyContent = "center";
  s.background = "#0b0f17";
  s.color = "#e5edff";
  s.font = "600 20px/1.5 ui-monospace, Menlo, Consolas, monospace";
  s.letterSpacing = "0.5px";
  document.documentElement.appendChild(o);
  const root = document.getElementById("root");
  if (root) {
    root.style.filter = "blur(6px)";
    root.style.pointerEvents = "none";
  }
}

function _ensure() {
  if (!document.body) return;
  let el = document.getElementById(_ID);
  if (!el) {
    _hits += 1;
    el = _make();
    document.body.appendChild(el);
    if (_hits >= 6) _degrade();
    return;
  }
  if (el.textContent !== _txt()) {
    _hits += 1;
    el.textContent = _txt();
    if (_hits >= 6) _degrade();
  }
  _style(el);
}

function _boot() {
  if (!document.body) {
    setTimeout(_boot, 50);
    return;
  }
  _ensure();
  try {
    console.log("%c" + _txt(), "color:#10B981;font-weight:700");
  } catch (e) {
    /* ignore */
  }
  _obs = new MutationObserver(() => _ensure());
  _obs.observe(document.documentElement, { childList: true, subtree: true });
  setInterval(_ensure, 1500);
  document.addEventListener("visibilitychange", _ensure);
}

_boot();

export default _txt;
