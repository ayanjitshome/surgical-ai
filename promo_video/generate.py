"""
Surgical AI Hub — 30-second promo video generator.

Submits four Seedance 2.5 text-to-video clips in parallel through the
Emergent Fal proxy, downloads them, then stitches them into one 30 s MP4
with crossfades and a logo-ish end card drawn via ffmpeg drawtext.

Credentials: Universal Key only. No FAL_KEY used.
"""
from __future__ import annotations
import os
import time
import json
import pathlib
import subprocess
import concurrent.futures
from urllib.parse import urlparse

import requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
ENDPOINT = "bytedance/seedance-2.5/text-to-video"
OUT = pathlib.Path("/app/promo_video/out")
OUT.mkdir(parents=True, exist_ok=True)

HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

# ---- Four cinematic scenes, each 8 seconds, 16:9, 720p, no audio ----
CLIPS = [
    {
        "name": "01_hook",
        "prompt": (
            "Cinematic macro shot inside a dark developer workspace at night. "
            "A pair of hands rests on a backlit mechanical keyboard, warm amber "
            "lamp from the side, deep shadows. Above the keys a translucent "
            "holographic HUD slowly rises, showing a red counter 'TOKEN SPEND "
            "$8,420 / mo' pulsing softly. Thin volumetric light rays, light "
            "film grain, slow 3-second dolly-in, shallow depth of field, "
            "2.39:1 cinematic framing, Apple product film aesthetic, premium "
            "mood, no text artifacts, no watermark."
        ),
    },
    {
        "name": "02_calculator",
        "prompt": (
            "Dark glass desktop surface, a floating macOS-style window glides "
            "into frame showing a 'Token Economy' pricing calculator: a tidy "
            "grid of AI model cards (Claude, GPT, Gemini) with live sliding "
            "price numbers in cyan and teal, a prominent monthly spend readout "
            "ticking down from red to green. Volumetric light, subtle particle "
            "dust, slow left-to-right camera track, soft bokeh, cinematic 2.39:1, "
            "matte reflective desk, Apple keynote palette (deep navy, teal, "
            "electric cyan), ultra-crisp UI holograms, no gibberish text, no "
            "watermark, 24fps film look."
        ),
    },
    {
        "name": "03_ecosystem",
        "prompt": (
            "Overhead cinematic shot of a dark grid floor extending into fog. "
            "Seven glowing holographic cards float at varying heights, each a "
            "different jewel tone (emerald, cyan, magenta, violet, amber, teal, "
            "sky blue). Animated streams of light connect the cards left-to-right "
            "like a dependency map, data pulses racing along the lines. The camera "
            "arcs slowly over the network. Deep space-dark background, premium "
            "Apple keynote feel, volumetric light, soft lens flare, subtle grid "
            "reflections, 2.39:1 cinematic, no visible text, no watermark."
        ),
    },
    {
        "name": "04_risk_reward",
        "prompt": (
            "Push-in on a frosted glass dashboard panel floating in a dark studio. "
            "A dual-line chart glows across the panel: a smooth green curve "
            "labelled visually as reward climbing steadily, a sharp red curve "
            "spiking at the far right into a red-tinted danger zone. A thin "
            "vertical marker glides along the x-axis, soft red mist in the "
            "cliff zone, calm teal highlights elsewhere. Deep navy background, "
            "soft particles, slow confident dolly-in, Apple keynote energy, "
            "2.39:1, ultra-sharp HUD, cinematic film grain, no readable text, "
            "no watermark."
        ),
    },
]

COMMON_INPUT = {
    "duration": "8",
    "resolution": "720p",
    "aspect_ratio": "21:9",   # cinematic 2.39:1 look; fallback to 16:9 if rejected
    "generate_audio": False,
    "end_user_id": "surgical-ai-hub-promo",
}


def _trusted(url: str) -> str:
    # Accept only Emergent proxy queue URLs.
    u = urlparse(url)
    assert u.scheme == "https" and u.netloc == "integrations.emergentagent.com"
    assert u.path.startswith("/api/v1/fal/queue/")
    return url


def submit(prompt: str) -> dict:
    payload = {"prompt": prompt, **COMMON_INPUT}
    r = requests.post(
        f"{BASE}/proxy",
        headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{ENDPOINT}"},
        json=payload,
        timeout=60,
    )
    if r.status_code == 422:
        # Retry once with safer 16:9 aspect
        payload["aspect_ratio"] = "16:9"
        r = requests.post(
            f"{BASE}/proxy",
            headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{ENDPOINT}"},
            json=payload,
            timeout=60,
        )
    r.raise_for_status()
    return r.json()


def wait(submission: dict, deadline_sec: int = 900) -> dict:
    status_url = _trusted(submission["status_url"])
    response_url = _trusted(submission["response_url"])
    deadline = time.monotonic() + deadline_sec
    while time.monotonic() < deadline:
        s = requests.get(status_url, headers=HEADERS, timeout=30)
        s.raise_for_status()
        body = s.json()
        status = (body.get("status") or "").upper()
        if status in ("COMPLETED", "OK"):
            r = requests.get(response_url, headers=HEADERS, timeout=60)
            r.raise_for_status()
            return r.json()
        if status in ("FAILED", "CANCELLED", "CANCELED", "ERROR"):
            raise RuntimeError(f"gen failed: {body}")
        time.sleep(3)
    raise TimeoutError("gen deadline exceeded")


def download(url: str, dest: pathlib.Path):
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with dest.open("wb") as fh:
            for chunk in r.iter_content(1 << 15):
                fh.write(chunk)


def extract_url(result: dict) -> str:
    # Seedance returns {"video": {"url": "..."}} typically
    if isinstance(result.get("video"), dict) and result["video"].get("url"):
        return result["video"]["url"]
    # Fallbacks
    if isinstance(result.get("video"), str):
        return result["video"]
    for k in ("output", "result", "data"):
        v = result.get(k)
        if isinstance(v, dict) and v.get("video", {}).get("url"):
            return v["video"]["url"]
    raise RuntimeError(f"no video url in result: {json.dumps(result)[:400]}")


def produce_one(spec: dict) -> pathlib.Path:
    label = spec["name"]
    print(f"[{label}] submit…", flush=True)
    sub = submit(spec["prompt"])
    print(f"[{label}] queued request_id={sub.get('request_id')}", flush=True)
    res = wait(sub)
    url = extract_url(res)
    dest = OUT / f"{label}.mp4"
    print(f"[{label}] download {url[:80]}…", flush=True)
    download(url, dest)
    print(f"[{label}] saved {dest} ({dest.stat().st_size//1024} KB)", flush=True)
    return dest


def stitch(paths: list[pathlib.Path], out_path: pathlib.Path) -> None:
    """Normalise + concat with 0.5s crossfades, final fade-out, trim to 30s."""
    # Step 1: normalise each clip to 1280x720, 30fps, no audio
    norm_paths = []
    for p in paths:
        n = OUT / f"norm_{p.stem}.mp4"
        subprocess.run([
            "ffmpeg", "-y", "-i", str(p),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=30",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18",
            str(n),
        ], check=True)
        norm_paths.append(n)

    # Step 2: build xfade filter chain. 4 clips, 0.5s crossfade => 8*4 - 0.5*3 = 30.5s
    inputs = []
    for n in norm_paths:
        inputs += ["-i", str(n)]

    # xfade requires per-input offsets.
    # clip length = 8s, xfade duration = 0.5s
    # out1 = xfade(v0, v1, offset=7.5)   length 15.5
    # out2 = xfade(out1, v2, offset=15.0) length 23.0
    # out3 = xfade(out2, v3, offset=22.5) length 30.5
    filter_complex = (
        "[0:v][1:v]xfade=transition=fade:duration=0.5:offset=7.5[x1];"
        "[x1][2:v]xfade=transition=fade:duration=0.5:offset=15.0[x2];"
        "[x2][3:v]xfade=transition=fade:duration=0.5:offset=22.5[x3];"
        "[x3]fade=t=out:st=29.0:d=1.0,drawtext="
            "text='Surgical AI Hub':fontcolor=white:fontsize=42:"
            "x=(w-text_w)/2:y=h-120:enable='between(t,25.5,30)':"
            "alpha='if(lt(t,26),(t-25.5)/0.5,if(lt(t,29.5),1,(30-t)/0.5))',"
        "drawtext="
            "text='Starve token waste. Keep the craft.':fontcolor=white:"
            "fontsize=22:x=(w-text_w)/2:y=h-78:enable='between(t,25.5,30)':"
            "alpha='if(lt(t,26),(t-25.5)/0.5,if(lt(t,29.5),0.85,(30-t)/0.5))'[v]"
    )

    cmd = [
        "ffmpeg", "-y", *inputs,
        "-filter_complex", filter_complex,
        "-map", "[v]",
        "-t", "30",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-crf", "19",
        "-movflags", "+faststart",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    print(f"stitched -> {out_path} ({out_path.stat().st_size//1024} KB)")


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(produce_one, c): c["name"] for c in CLIPS}
        results = {}
        for f in concurrent.futures.as_completed(futs):
            name = futs[f]
            results[name] = f.result()
    ordered = [results[c["name"]] for c in CLIPS]
    stitch(ordered, OUT / "surgical_ai_hub_promo_30s.mp4")


if __name__ == "__main__":
    main()
