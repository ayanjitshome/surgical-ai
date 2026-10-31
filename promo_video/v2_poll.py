"""Poll every submitted job in /app/promo_video/v2/submit_log.json until done,
   then download: nature.mp4, music.wav, and the nine vo_XX.mp3 files.
"""
import json
import pathlib
import time
import requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
H = {"Authorization": f"Bearer {KEY}"}
OUT = pathlib.Path("/app/promo_video/v2")

log = json.loads((OUT / "submit_log.json").read_text())

# normalise submit_log entries into (local_name, endpoint, request_id)
jobs = []
for name, payload in log.items():
    if name == "nature":
        endpoint, req_id, _ = payload
        jobs.append(("nature", endpoint, req_id, "mp4"))
    elif name == "music":
        endpoint, req_id, _ = payload
        jobs.append(("music", endpoint, req_id, "wav"))
    else:
        # vo:XX
        seg, endpoint, status, body = payload
        req_id = body.get("request_id")
        if req_id:
            jobs.append((f"vo_{seg}", endpoint, req_id, "mp3"))


def status_url(endpoint, req_id):
    # Fal queue status pattern (uses endpoint namespace only for elevenlabs)
    # from first-time experience: fal-ai/elevenlabs/* status uses
    # queue/fal-ai/elevenlabs/requests/<id>/status
    parts = endpoint.split("/")
    namespace = "/".join(parts[:2])  # e.g. fal-ai/elevenlabs or bytedance/seedance-2.5 or cassetteai/music-generator
    return f"{BASE}/queue/{namespace}/requests/{req_id}/status"


def result_url(endpoint, req_id):
    parts = endpoint.split("/")
    namespace = "/".join(parts[:2])
    return f"{BASE}/queue/{namespace}/requests/{req_id}"


def poll_one(name, endpoint, req_id, ext, max_wait=360):
    print(f"[{name}] polling {endpoint} / {req_id}")
    t0 = time.time()
    while time.time() - t0 < max_wait:
        s = requests.get(status_url(endpoint, req_id), headers=H, timeout=30)
        if not s.ok:
            print(f"[{name}] status {s.status_code} {s.text[:120]}")
            time.sleep(5); continue
        js = s.json()
        st = js.get("status", "").upper()
        if st == "COMPLETED":
            r = requests.get(result_url(endpoint, req_id), headers=H, timeout=60)
            r.raise_for_status()
            jr = r.json()
            # Figure out the download URL
            if "video" in jr and isinstance(jr["video"], dict):
                url = jr["video"].get("url")
            elif "audio_file" in jr and isinstance(jr["audio_file"], dict):
                url = jr["audio_file"].get("url")
            elif "audio" in jr and isinstance(jr["audio"], dict):
                url = jr["audio"].get("url")
            else:
                # ElevenLabs returns {audio_url: "..."} or {audio: {...}}
                url = jr.get("audio_url") or jr.get("url")
                if isinstance(url, dict):
                    url = url.get("url")
            if not url:
                print(f"[{name}] COMPLETED but no url: {json.dumps(jr)[:300]}")
                return None
            out = OUT / f"{name}.{ext}"
            with requests.get(url, stream=True, timeout=120) as dl:
                dl.raise_for_status()
                with out.open("wb") as f:
                    for ch in dl.iter_content(1 << 15):
                        f.write(ch)
            print(f"[{name}] -> {out} ({out.stat().st_size//1024} KB)")
            return out
        if st in ("FAILED", "ERROR"):
            print(f"[{name}] FAILED: {json.dumps(js)[:300]}")
            return None
        time.sleep(4)
    print(f"[{name}] timeout")
    return None


results = {}
for job in jobs:
    r = poll_one(*job)
    results[job[0]] = str(r) if r else None

(OUT / "download_log.json").write_text(json.dumps(results, indent=2))
print("download_log.json written")
