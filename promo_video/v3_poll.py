"""Poll every job in /app/promo_video/v3/submit.json and download results.
   Structure matches v2_poll.py but tolerant of the different submit shape:
     "v:name" -> ("name", (endpoint, 200, body))
     "music"  -> ("music", (endpoint, 200, body))
     "s:name" -> ("name", (endpoint, 200, body))
"""
import concurrent.futures as cf
import json, pathlib, time, requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
H = {"Authorization": f"Bearer {KEY}"}
V = pathlib.Path("/app/promo_video/v3")

subs = json.loads((V / "submit.json").read_text())
jobs = []
for key, entry in subs.items():
    name, inner = entry
    endpoint, status, body = inner
    req_id = body.get("request_id")
    if not req_id:
        continue
    if key.startswith("v:"):
        jobs.append((name, endpoint, req_id, "mp4"))
    elif key == "music":
        jobs.append(("music", endpoint, req_id, "wav"))
    elif key.startswith("s:"):
        jobs.append((name, endpoint, req_id, "mp3"))


def ns(ep):
    return "/".join(ep.split("/")[:2])


def poll(name, ep, rid, ext, max_wait=360):
    t0 = time.time()
    while time.time() - t0 < max_wait:
        s = requests.get(
            f"{BASE}/queue/{ns(ep)}/requests/{rid}/status",
            headers=H, timeout=30)
        if not s.ok:
            time.sleep(5); continue
        st = s.json().get("status", "").upper()
        if st == "COMPLETED":
            r = requests.get(f"{BASE}/queue/{ns(ep)}/requests/{rid}",
                             headers=H, timeout=60)
            r.raise_for_status()
            jr = r.json()
            if "video" in jr and isinstance(jr["video"], dict):
                url = jr["video"].get("url")
            elif "audio_file" in jr and isinstance(jr["audio_file"], dict):
                url = jr["audio_file"].get("url")
            elif "audio" in jr and isinstance(jr["audio"], dict):
                url = jr["audio"].get("url")
            else:
                url = jr.get("audio_url") or jr.get("url")
                if isinstance(url, dict):
                    url = url.get("url")
            if not url:
                return name, None
            out = V / f"{name}.{ext}"
            with requests.get(url, stream=True, timeout=120) as dl:
                dl.raise_for_status()
                with out.open("wb") as f:
                    for ch in dl.iter_content(1 << 15):
                        f.write(ch)
            return name, out
        if st in ("FAILED", "ERROR"):
            return name, None
        time.sleep(4)
    return name, None


# Poll everything in parallel so we're done in max(single job) not sum.
results = {}
with cf.ThreadPoolExecutor(max_workers=10) as ex:
    futs = {ex.submit(poll, *j): j[0] for j in jobs}
    for f in cf.as_completed(futs):
        n, p = f.result()
        results[n] = str(p) if p else None
        print(n, "->", p)

(V / "download.json").write_text(json.dumps(results, indent=2))
print("download.json written")
