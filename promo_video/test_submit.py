import os, time, requests, json
from urllib.parse import urlparse

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
ENDPOINT = "bytedance/seedance-2.5/text-to-video"
HEADERS = {
    "Authorization": f"Bearer {KEY}",
    "Content-Type": "application/json",
}

payload = {
    "prompt": "Cinematic macro shot of a developer workstation at night: fingers resting on a backlit mechanical keyboard, warm amber glow from a single desk lamp, a floating holographic 'TOKEN SPEND $8,420' hovering above the keys in soft red light, slow dolly-in, shallow depth of field, moody, film grain, ultra realistic, 24fps, 2.39:1 cinematic feel.",
    "duration": "8",
    "resolution": "720p",
    "aspect_ratio": "16:9",
    "generate_audio": False,
    "end_user_id": "surgical-ai-hub-promo"
}

submit = requests.post(
    f"{BASE}/proxy",
    headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{ENDPOINT}"},
    json=payload,
    timeout=60,
)
print("submit status:", submit.status_code)
print("submit body:", submit.text[:800])
