"""Submit three async job families to Fal in parallel:
   1. One nature intro clip (Seedance 2.5, 8s, cinematic drone-forest).
   2. One subtle background music bed (CassetteAI, 60s, minimal corporate).
   3. Nine voiceover segments (ElevenLabs multilingual-v2, professional female).
"""
import concurrent.futures as cf
import json
import pathlib
import requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
HEADERS = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
OUT = pathlib.Path("/app/promo_video/v2")
OUT.mkdir(parents=True, exist_ok=True)


def submit(endpoint, payload):
    r = requests.post(
        f"{BASE}/proxy",
        headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{endpoint}"},
        json=payload, timeout=60,
    )
    r.raise_for_status()
    j = r.json()
    return endpoint, j.get("request_id"), j


# --- 1. Nature intro clip (one 8s wide drone shot over forest at sunrise) ---
nature_job = {
    "endpoint": "bytedance/seedance-2.5/text-to-video",
    "payload": {
        "prompt": (
            "Cinematic aerial drone shot gliding slowly forward over a misty "
            "pine forest at golden hour, soft rays breaking through fog, "
            "subtle particles in the air, calm, peaceful, no people, "
            "no watermark, no text, no logos, 2.39:1 widescreen, "
            "professional product keynote b-roll"
        ),
        "duration": "8",
        "resolution": "720p",
        "aspect_ratio": "16:9",
        "generate_audio": False,
        "end_user_id": "surgical-ai-hub-promo-v2",
    },
}

# --- 2. Background music (minimal corporate, 60s so we never run out) ---
music_job = {
    "endpoint": "cassetteai/music-generator",
    "payload": {
        "prompt": (
            "Minimal modern corporate underscore for a software product demo, "
            "soft piano arpeggio, warm pad, subtle synth bass pulse, "
            "clean, uplifting but restrained, no vocals, 85 BPM, "
            "sits quietly under a female voiceover, Apple keynote energy"
        ),
        "duration": 60,
    },
}

# --- 3. Voiceover segments ---
# ElevenLabs multilingual-v2 voice: Sarah (default professional female).
# Keep every line em-dash-free; app's Vale ethic.
VOICE_ID = "Sarah"
MODEL_ID = "eleven_multilingual_v2"

VO_SCRIPT = [
    ("01_intro",          "Surgical A I Hub. An open source toolkit for mastering agentic A I coding."),
    ("02_ecosystem",      "Begin at the Ecosystem Hub. A dependency map of seven tools that work together to keep your A I coder efficient and surgical."),
    ("03_risk_reward",    "The Risk and Reward dashboard shows which tasks are worth delegating to A I, and which still deserve a human eye."),
    ("04_token_economy",  "Model every token with the Token Economy calculator. Live pricing from thirty two models and instant monthly projections."),
    ("05_decide",         "The Decision Guide answers one question. Which tool should you adopt first, based on your actual workflow."),
    ("06_guidance",       "Weigh each tool against the next in Adoption and Tradeoffs. Honest side by side comparisons without the hype."),
    ("07_playbook",       "The Prompt Playbook. A library of battle tested prompt patterns, organised by stage of your workflow."),
    ("08_builder",        "Compose, measure, and refine prompts in the Prompt Builder. Live token count and real cost as you type."),
    ("09_outro",          "Everything is open source on GitHub. Clone the repo and ship better A I code tonight."),
]


def submit_vo(seg_id, text):
    payload = {
        "text": text,
        "voice": VOICE_ID,
        "model_id": MODEL_ID,
        "stability": 0.5,
        "similarity_boost": 0.75,
        "style": 0.0,
    }
    endpoint = "fal-ai/elevenlabs/tts/multilingual-v2"
    r = requests.post(
        f"{BASE}/proxy",
        headers={**HEADERS, "X-Fal-Target-Url": f"https://queue.fal.run/{endpoint}"},
        json=payload, timeout=60,
    )
    return seg_id, endpoint, r.status_code, r.json() if r.ok else r.text


# Submit all in parallel
tasks = {}
with cf.ThreadPoolExecutor(max_workers=11) as ex:
    futs = {
        ex.submit(submit, nature_job["endpoint"], nature_job["payload"]): "nature",
        ex.submit(submit, music_job["endpoint"], music_job["payload"]): "music",
    }
    for seg_id, text in VO_SCRIPT:
        futs[ex.submit(submit_vo, seg_id, text)] = f"vo:{seg_id}"
    for f in cf.as_completed(futs):
        name = futs[f]
        try:
            res = f.result()
        except Exception as e:
            res = {"error": str(e)}
        tasks[name] = res
        print(name, "->", json.dumps(res, default=str)[:220])

(OUT / "submit_log.json").write_text(json.dumps(tasks, indent=2, default=str))
print("submit_log.json written")
