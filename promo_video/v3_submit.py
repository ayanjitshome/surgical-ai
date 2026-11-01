"""v3 Apple-reveal trailer. Fire all async generation jobs in parallel.

Clips  (Seedance 2.5, 5 s @ 720p, 16:9, silent):
  teaser_macro  - extreme macro of neon code on glass, slow push in
  studio_void   - infinite dark studio, slow dolly over black
  whoosh_streaks- neon cyan/magenta light streaks whipping across
  tower_drop    - monolith rising from below, pulsing edge light

Music  (CassetteAI, 45 s) : driving electronic trailer bass with beat drop

SFX    (ElevenLabs sound-effects) :
  sfx_whoosh    - crisp whoosh transition
  sfx_impact    - bass drop / cinematic impact
  sfx_click     - crisp mechanical UI click
  sfx_riser     - trailer riser leading into the drop
"""
import concurrent.futures as cf
import json, pathlib, requests

KEY = "sk-emergent-625A7D5C266E84bF0A"
BASE = "https://integrations.emergentagent.com/api/v1/fal"
H = {"Authorization": f"Bearer {KEY}", "Content-Type": "application/json"}
OUT = pathlib.Path("/app/promo_video/v3")
OUT.mkdir(parents=True, exist_ok=True)


def submit(endpoint, payload, timeout=60):
    r = requests.post(
        f"{BASE}/proxy",
        headers={**H, "X-Fal-Target-Url": f"https://queue.fal.run/{endpoint}"},
        json=payload, timeout=timeout,
    )
    return endpoint, r.status_code, (r.json() if r.ok else r.text)


def video_job(name, prompt):
    return name, submit(
        "bytedance/seedance-2.5/text-to-video",
        {
            "prompt": prompt + " Dark infinite studio space. Deep black "
                      "background. Volumetric edge lighting. Neon cyan "
                      "and magenta accents. Cinematic Apple keynote reveal. "
                      "No text, no watermark, no logos.",
            "duration": "5",
            "resolution": "720p",
            "aspect_ratio": "16:9",
            "generate_audio": False,
            "end_user_id": "surgical-ai-hub-promo-v3",
        },
    )


def music_job():
    return "music", submit(
        "cassetteai/music-generator",
        {
            "prompt": "Driving cinematic trailer with heavy electronic bass, "
                      "aggressive sub bass pulse, dark synth stabs, "
                      "snappy percussion, tense riser into a massive beat "
                      "drop at 6 seconds, then sustained high energy drive "
                      "for 35 more seconds, final impact at 32s, "
                      "128 BPM, premium Apple reveal trailer energy, "
                      "no vocals, no voices",
            "duration": 45,
        },
    )


def sfx_job(name, prompt, dur):
    return name, submit(
        "fal-ai/elevenlabs/sound-effects",
        {"text": prompt, "duration_seconds": dur, "prompt_influence": 0.7},
    )


video_prompts = [
    ("teaser_macro",
        "Extreme macro slow push-in on softly glowing cyan code and UI "
        "elements etched into a dark glass slab. Shallow depth of field. "
        "Subtle particles floating. Mysterious reveal."),
    ("studio_void",
        "Slow aerial drift across a jet-black infinite studio floor with "
        "faint rim light on the horizon line. Cinematic tension before a "
        "product reveal. Very dark, minimal."),
    ("whoosh_streaks",
        "Fast horizontal light streaks in neon cyan and magenta whipping "
        "left to right with heavy motion blur, bokeh particles, "
        "high-energy trailer transition shot."),
    ("tower_drop",
        "A massive floating glass monolith rising from below, slow "
        "dramatic push-in from a low angle, pulsing edge lighting in "
        "cyan, dust particles catching the light."),
]

sfx_prompts = [
    ("sfx_whoosh",   "Crisp cinematic whoosh transition sound effect, high "
                     "impact, no reverb tail, premium trailer SFX", 1.0),
    ("sfx_impact",   "Massive deep bass drop impact, cinematic trailer "
                     "sub-bomb, short decay, premium sound design", 1.6),
    ("sfx_click",    "Crisp mechanical UI click, premium software interface, "
                     "very short", 0.5),
    ("sfx_riser",    "Tense cinematic trailer riser, builds in intensity, "
                     "rising synth and white noise, resolves at the end", 3.0),
]


tasks = {}
with cf.ThreadPoolExecutor(max_workers=10) as ex:
    futs = {
        ex.submit(video_job, n, p): f"v:{n}" for n, p in video_prompts
    }
    futs[ex.submit(music_job)] = "music"
    for n, p, d in sfx_prompts:
        futs[ex.submit(sfx_job, n, p, d)] = f"s:{n}"
    for f in cf.as_completed(futs):
        key = futs[f]
        try:
            res = f.result()
        except Exception as e:
            res = ("err", str(e))
        tasks[key] = res
        print(key, "->", json.dumps(res, default=str)[:200])

(OUT / "submit.json").write_text(json.dumps(tasks, indent=2, default=str))
print("submit.json written")
