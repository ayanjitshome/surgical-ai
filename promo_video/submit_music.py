import requests
KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
ENDPOINT = "cassetteai/music-generator"
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
payload = {
    "prompt": (
        "Cinematic orchestral synth hybrid, slow confident build, deep sub bass, "
        "shimmering atmospheric pads in C minor, soft pulsing arpeggio, subtle "
        "percussion hits, warm string swells, Apple product launch keynote feel, "
        "modern tech promo, 90 BPM, resolves at the end, no vocals, instrumental"
    ),
    "duration": 32,
}
r = requests.post(
    f"{BASE}/proxy",
    headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{ENDPOINT}"},
    json=payload, timeout=60,
)
print("status:", r.status_code)
print(r.text[:600])
