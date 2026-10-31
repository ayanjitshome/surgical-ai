"""Final mix for v2 product-demo promo.

Timeline (seconds, with 0.5s crossfades between neighbours):
  intro       0.0 - 5.5
  ecosystem   5.0 - 12.0
  risk        11.5 - 18.5
  token       18.0 - 25.0
  decide      24.5 - 31.5
  guidance    31.0 - 38.0
  playbook    37.5 - 44.5
  builder     44.0 - 51.0
  outro       50.5 - 56.0

Audio bed: music.wav at vol=0.18, with 9 VO tracks placed at absolute
offsets at vol=1.0. 1s music fade-in, 1.5s music fade-out at 54.5s.
"""
import pathlib, subprocess

V = pathlib.Path("/app/promo_video/v2")
UI = V / "ui"
OUT = V / "surgical_ai_hub_demo_v2.mp4"


def ff(args):
    subprocess.run(args, check=True)


# --- 1. Prep intro and outro clips from the nature footage ---
# Intro: nature[0..5.5], mild darken, title + GitHub text
intro_mp4 = V / "intro.mp4"
ff([
    "ffmpeg", "-y", "-ss", "0", "-i", str(V / "nature.mp4"), "-t", "5.5",
    "-vf",
        "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        "fps=30,"
        # dark gradient overlay (vignette-ish)
        "boxblur=4:1,"
        "eq=brightness=-0.08:saturation=0.85,"
        # Big centred title fading in and holding
        "drawtext=text='SURGICAL AI HUB':fontcolor=white:fontsize=84:"
            "x=(w-text_w)/2:y=(h-text_h)/2-30:"
            "box=0:borderw=0:"
            "alpha='if(lt(t,0.6),t/0.6,1)',"
        # Tagline just under
        "drawtext=text='The agentic AI coding toolkit':fontcolor=0xBFCFE6:"
            "fontsize=28:x=(w-text_w)/2:y=(h/2)+58:"
            "alpha='if(lt(t,1.1),max(0,(t-0.5)/0.6),1)',"
        # GitHub pill at the bottom
        "drawtext=text='github.com/ayanjitshome/surgical-ai':fontcolor=white:"
            "fontsize=22:x=(w-text_w)/2:y=h-110:"
            "alpha='if(lt(t,2.0),max(0,(t-1.4)/0.6),1)'",
    "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "medium", "-crf", "18",
    str(intro_mp4),
])

# Outro: nature[2.5..8.0], heavier darken, CTA text
outro_mp4 = V / "outro.mp4"
ff([
    "ffmpeg", "-y", "-ss", "2.5", "-i", str(V / "nature.mp4"), "-t", "5.5",
    "-vf",
        "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,"
        "fps=30,"
        "boxblur=6:1,"
        "eq=brightness=-0.18:saturation=0.75,"
        # Primary CTA
        "drawtext=text='Try it on GitHub':fontcolor=white:fontsize=78:"
            "x=(w-text_w)/2:y=(h-text_h)/2-40:"
            "alpha='if(lt(t,0.6),t/0.6,1)',"
        # Repo url below
        "drawtext=text='github.com/ayanjitshome/surgical-ai':fontcolor=0xBFCFE6:"
            "fontsize=36:x=(w-text_w)/2:y=(h/2)+54:"
            "alpha='if(lt(t,1.2),max(0,(t-0.6)/0.6),1)',"
        # Micro-tagline
        "drawtext=text='Star  Clone  Ship':fontcolor=white:fontsize=22:"
            "x=(w-text_w)/2:y=h-120:"
            "alpha='if(lt(t,1.8),max(0,(t-1.2)/0.6),min(1,(5.5-t)/0.5))'",
    "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "medium", "-crf", "18",
    str(outro_mp4),
])

# --- 2. Normalise every UI scene to 1920x1080 / 30fps / 7.0s ---
scenes = [
    intro_mp4,
    UI / "01_ecosystem.mp4",
    UI / "02_risk_reward.mp4",
    UI / "03_token.mp4",
    UI / "04_decide.mp4",
    UI / "05_guidance.mp4",
    UI / "06_playbook.mp4",
    UI / "07_builder.mp4",
    outro_mp4,
]
assert all(p.exists() for p in scenes)

normed = []
# intro and outro are already 1920x1080 / 30fps - keep as-is
for i, p in enumerate(scenes):
    out = V / f"nh_{i:02d}_{p.stem}.mp4"
    if i == 0 or i == len(scenes) - 1:
        # already prepared
        ff(["ffmpeg", "-y", "-i", str(p),
            "-vf", "setsar=1,fps=30",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18", str(out)])
    else:
        ff([
            "ffmpeg", "-y", "-i", str(p),
            "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,"
                   "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
                   "setsar=1,fps=30,"
                   # Pad the end by holding the last frame so chained xfades
                   # never run out of source. Any clip shorter than 7s gets
                   # extended; any longer clip is cut by -t 7.0 below.
                   "tpad=stop_mode=clone:stop_duration=1.5",
            "-t", "7.0",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18", str(out),
        ])
    normed.append(out)

# --- 3. Build the stitched silent video with xfades ---
# Lengths: intro 5.5, ui*7=7.0 each, outro 5.5. Xfade dur = 0.5s.
# Offsets at which xfade begins (= previous cumulative length - 0.5):
#   i1 at 5.0, i2 at 11.5, i3 at 18.0, i4 at 24.5, i5 at 31.0,
#   i6 at 37.5, i7 at 44.0, i8 at 50.5.
XFADE = 0.5
lengths = [5.5, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 7.0, 5.5]
offsets = []
cum = 0.0
for L in lengths[:-1]:
    cum += L
    offsets.append(cum - XFADE)
    cum -= XFADE

silent = V / "silent_v2.mp4"
inputs = []
for n in normed:
    inputs += ["-i", str(n)]

filt_parts = []
# Normalise timebase/PTS on every input so chained xfades align
for i in range(len(normed)):
    filt_parts.append(f"[{i}:v]settb=AVTB,setpts=PTS-STARTPTS,fps=30[v{i}]")
prev = "[v0]"
for i in range(1, len(normed)):
    nxt = f"[v{i}]"
    tag = f"[x{i}]"
    filt_parts.append(
        f"{prev}{nxt}xfade=transition=fade:duration={XFADE}:offset={offsets[i-1]:.2f}{tag}"
    )
    prev = tag
# Final fade to black at the very end
total_dur = sum(lengths) - (len(normed) - 1) * XFADE  # 56s
filt_parts.append(
    f"{prev}fade=t=out:st={total_dur-0.6:.2f}:d=0.6[v]"
)
filter_complex = ";".join(filt_parts)

ff([
    "ffmpeg", "-y", *inputs,
    "-filter_complex", filter_complex,
    "-map", "[v]",
    "-t", f"{total_dur:.2f}",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "slow", "-crf", "19",
    "-movflags", "+faststart",
    str(silent),
])

# --- 4. Build the audio bed: music at low vol + 9 VO at offsets ---
vo_files = [
    (V / "vo_01_intro.mp3",         0.3),
    (V / "vo_02_ecosystem.mp3",     5.3),
    (V / "vo_03_risk_reward.mp3",  11.8),
    (V / "vo_04_token_economy.mp3",18.3),
    (V / "vo_05_decide.mp3",       24.8),
    (V / "vo_06_guidance.mp3",     31.3),
    (V / "vo_07_playbook.mp3",     37.8),
    (V / "vo_08_builder.mp3",      44.3),
    (V / "vo_09_outro.mp3",        50.8),
]

audio_inputs = ["-i", str(V / "music.wav")]
for p, _ in vo_files:
    audio_inputs += ["-i", str(p)]

# Music fade and ducking: static low vol works since VO is louder.
# Also apply a gentle sidechain by just dropping music to 0.12 whenever VO plays.
# Keep it simple here: static vol=0.18, fade in/out.
music_f = ("[1:a]volume=0.18,"
           "afade=t=in:st=0:d=1.0,"
           f"afade=t=out:st={total_dur-1.5:.2f}:d=1.5,"
           "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo[music]")

vo_filters = []
vo_labels = []
for idx, (_p, off) in enumerate(vo_files):
    inp = idx + 2  # 0=silent video, 1=music, 2..10=VO
    lbl = f"vo{idx+1}"
    delay_ms = int(off * 1000)
    vo_filters.append(
        f"[{inp}:a]adelay={delay_ms}|{delay_ms},"
        "volume=1.0,"
        "aformat=sample_fmts=fltp:sample_rates=48000:channel_layouts=stereo"
        f"[{lbl}]"
    )
    vo_labels.append(f"[{lbl}]")

mix = ("[music]" + "".join(vo_labels)
       + f"amix=inputs={1+len(vo_files)}:duration=longest:dropout_transition=3[a]")

afilter = ";".join([music_f] + vo_filters + [mix])

OUT.unlink(missing_ok=True)
ff([
    "ffmpeg", "-y",
    "-i", str(silent),
    *audio_inputs,
    "-filter_complex", afilter,
    "-map", "0:v", "-map", "[a]",
    "-t", f"{total_dur:.2f}",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-shortest",
    "-movflags", "+faststart",
    str(OUT),
])
print(f"DONE -> {OUT} ({OUT.stat().st_size//1024} KB)")
