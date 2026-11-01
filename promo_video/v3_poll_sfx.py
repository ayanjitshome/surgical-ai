"""Retry just the 4 SFX request-ids with 502-tolerance."""
import json, pathlib, time, requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
H = {"Authorization": f"Bearer {KEY}"}
V = pathlib.Path("/app/promo_video/v3")

sub = json.loads((V / "submit.json").read_text())
sfx_jobs = []
for key, entry in sub.items():
    if not key.startswith("s:"):
        continue
    name, (endpoint, _s, body) = entry
    sfx_jobs.append((name, endpoint, body["request_id"]))


def ns(ep):
    return "/".join(ep.split("/")[:2])


def retrying_get(url, attempts=10):
    for i in range(attempts):
        r = requests.get(url, headers=H, timeout=30)
        if r.ok:
            return r
        if r.status_code in (502, 503, 504, 429):
            time.sleep(3 + i)
            continue
        r.raise_for_status()
    return r


for name, ep, rid in sfx_jobs:
    print(f"[{name}] polling ...")
    for _ in range(60):
        s = retrying_get(f"{BASE}/queue/{ns(ep)}/requests/{rid}/status")
        js = s.json() if s.ok else {}
        st = js.get("status", "").upper()
        if st == "COMPLETED":
            break
        if st in ("FAILED", "ERROR"):
            print(f"[{name}] FAILED {js}")
            break
        time.sleep(3)
    r = retrying_get(f"{BASE}/queue/{ns(ep)}/requests/{rid}")
    jr = r.json()
    url = (jr.get("audio_file", {}).get("url") if isinstance(jr.get("audio_file"), dict) else None) \
          or (jr.get("audio", {}).get("url") if isinstance(jr.get("audio"), dict) else None) \
          or jr.get("audio_url") or jr.get("url")
    if isinstance(url, dict):
        url = url.get("url")
    if not url:
        print(f"[{name}] no url: {json.dumps(jr)[:200]}")
        continue
    out = V / f"{name}.mp3"
    with requests.get(url, stream=True, timeout=120) as dl:
        dl.raise_for_status()
        with out.open("wb") as f:
            for ch in dl.iter_content(1 << 15):
                f.write(ch)
    print(f"[{name}] -> {out} ({out.stat().st_size//1024} KB)")
