"""Hybrid final cut.

Scene order (8s each, 0.5s crossfade, 30s total):
  01_hook        -> generative keyboard shot (existing)
  02_token_ui    -> real recorded Token Economy UI
  03_ecosystem_ui-> real recorded Ecosystem Map UI
  04_risk_reward -> generative risk-vs-reward HUD (existing)

Then music bed muxed in, 1s fade-in / 1.5s fade-out.
Then a 9:16 vertical variant via smart centre-crop.
"""
import pathlib
import subprocess
import requests

OUT = pathlib.Path("/app/promo_video/out")
UI = OUT / "ui"
# Fetch music
MUSIC_URL = "https://v3b.fal.media/files/b/0ab0a50b/r1GmUZXkr_yymqMcAA97E_generated.wav"
music_wav = OUT / "music.wav"
if not music_wav.exists():
    with requests.get(MUSIC_URL, stream=True, timeout=120) as r:
        r.raise_for_status()
        with music_wav.open("wb") as f:
            for ch in r.iter_content(1 << 15):
                f.write(ch)
    print(f"music saved {music_wav} ({music_wav.stat().st_size//1024} KB)")

# Normalise all four scenes to 1280x720/30fps
scenes = [
    OUT / "01_hook.mp4",            # generative, already downloaded
    UI / "02_token_ui.mp4",         # real UI capture
    UI / "03_ecosystem_ui.mp4",     # real UI capture
    OUT / "04_risk_reward.mp4",     # generative, already downloaded
]
assert all(p.exists() for p in scenes), [str(p) for p in scenes]

normed = []
for p in scenes:
    n = OUT / f"nh_{p.stem}.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-i", str(p),
        "-vf", "scale=1280:720:force_original_aspect_ratio=decrease,"
               "pad=1280:720:(ow-iw)/2:(oh-ih)/2:black,fps=30",
        "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "18",
        str(n),
    ], check=True)
    normed.append(n)

# --- Build the stitched silent 30s cut ---
silent_out = OUT / "hybrid_30s_silent.mp4"
inputs = []
for n in normed:
    inputs += ["-i", str(n)]

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

subprocess.run([
    "ffmpeg", "-y", *inputs,
    "-filter_complex", filter_complex,
    "-map", "[v]", "-t", "30",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "slow", "-crf", "19",
    "-movflags", "+faststart",
    str(silent_out),
], check=True)
print(f"silent hybrid -> {silent_out} ({silent_out.stat().st_size//1024} KB)")

# --- Mux music onto the silent cut ---
final_16x9 = OUT / "surgical_ai_hub_promo_30s_final.mp4"
subprocess.run([
    "ffmpeg", "-y",
    "-i", str(silent_out),
    "-i", str(music_wav),
    "-filter_complex",
        # 1s fade-in on music, 1.5s fade-out at 28.5s
        "[1:a]afade=t=in:st=0:d=1.0,afade=t=out:st=28.5:d=1.5,"
        "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo,"
        "volume=0.85[a]",
    "-map", "0:v", "-map", "[a]",
    "-t", "30",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k",
    "-shortest",
    "-movflags", "+faststart",
    str(final_16x9),
], check=True)
print(f"final 16:9 w/ music -> {final_16x9} ({final_16x9.stat().st_size//1024} KB)")

# --- Vertical 9:16 cut via smart centre-crop ---
#   Source 1280x720 -> target 1080x1920. Scale height to 1920, keep aspect,
#   then center-crop width to 1080. For the Token Economy and Map scenes,
#   the main UI panel sits roughly in horizontal centre, so a straight centre
#   crop works. The generative scenes are centre-weighted compositions.
final_9x16 = OUT / "surgical_ai_hub_promo_30s_vertical.mp4"
subprocess.run([
    "ffmpeg", "-y", "-i", str(final_16x9),
    "-vf",
        "scale=-2:1920,"
        "crop=1080:1920:(iw-1080)/2:0,"
        "setsar=1",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "slow", "-crf", "20",
    "-c:a", "copy",
    "-movflags", "+faststart",
    str(final_9x16),
], check=True)
print(f"final 9:16 -> {final_9x16} ({final_9x16.stat().st_size//1024} KB)")

print("DONE.")
