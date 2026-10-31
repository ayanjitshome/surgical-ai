"""Resume: poll known request IDs, download, stitch."""
import time, pathlib, subprocess, json, concurrent.futures, requests
from urllib.parse import urlparse

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE_QUEUE = "https://integrations.emergentagent.com/api/v1/fal/queue/bytedance/seedance-2.5/requests"
HEADERS = {"Authorization": f"Bearer {KEY}"}
OUT = pathlib.Path("/app/promo_video/out"); OUT.mkdir(parents=True, exist_ok=True)

REQUESTS = {
    "01_hook":        "01a19422-d58f-7c63-8028-a4258907731d",
    "02_calculator":  "01a19422-d57d-7122-9a55-3f19d2e97961",
    "03_ecosystem":   "01a19422-d522-7d93-ae6d-d28d8b9f6d28",
    "04_risk_reward": "01a19422-d58f-7b80-8510-916567c93cb3",
}


def wait_and_fetch(name: str, req_id: str) -> pathlib.Path:
    status_url = f"{BASE_QUEUE}/{req_id}/status"
    response_url = f"{BASE_QUEUE}/{req_id}"
    deadline = time.monotonic() + 1200
    while time.monotonic() < deadline:
        s = requests.get(status_url, headers=HEADERS, timeout=30)
        s.raise_for_status()
        body = s.json()
        status = (body.get("status") or "").upper()
        if status in ("COMPLETED", "OK"):
            r = requests.get(response_url, headers=HEADERS, timeout=60)
            r.raise_for_status()
            res = r.json()
            # extract url
            v = res.get("video")
            url = v["url"] if isinstance(v, dict) else (v if isinstance(v, str) else None)
            if not url:
                raise RuntimeError(f"[{name}] no video url: {json.dumps(res)[:400]}")
            dest = OUT / f"{name}.mp4"
            print(f"[{name}] downloading…", flush=True)
            with requests.get(url, stream=True, timeout=180) as rr:
                rr.raise_for_status()
                with dest.open("wb") as fh:
                    for chunk in rr.iter_content(1 << 15):
                        fh.write(chunk)
            print(f"[{name}] saved {dest} ({dest.stat().st_size//1024} KB)", flush=True)
            return dest
        if status in ("FAILED", "CANCELLED", "CANCELED", "ERROR"):
            raise RuntimeError(f"[{name}] gen failed: {body}")
        print(f"[{name}] {status} …", flush=True)
        time.sleep(10)
    raise TimeoutError(f"[{name}] deadline exceeded")


def stitch(paths, out_path):
    norm = []
    for p in paths:
        n = OUT / f"norm_{p.stem}.mp4"
        subprocess.run([
            "ffmpeg", "-y", "-i", str(p),
            "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=30",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18", str(n),
        ], check=True)
        norm.append(n)

    inputs = []
    for n in norm: inputs += ["-i", str(n)]

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
        "-map", "[v]", "-t", "30",
        "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "slow", "-crf", "19",
        "-movflags", "+faststart",
        str(out_path),
    ]
    subprocess.run(cmd, check=True)
    print(f"stitched -> {out_path} ({out_path.stat().st_size//1024} KB)")


def main():
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futs = {pool.submit(wait_and_fetch, name, req_id): name for name, req_id in REQUESTS.items()}
        res = {}
        for f in concurrent.futures.as_completed(futs):
            name = futs[f]
            res[name] = f.result()
    ordered = [res["01_hook"], res["02_calculator"], res["03_ecosystem"], res["04_risk_reward"]]
    stitch(ordered, OUT / "surgical_ai_hub_promo_30s.mp4")


if __name__ == "__main__":
    main()
