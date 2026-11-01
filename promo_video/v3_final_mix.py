"""v3 final mix v2 — fix zoompan freeze and move text to dedicated black cards.

Timeline (40 s):

  00.0 - 03.0  teaser_macro
  03.0 - 05.3  studio_void          text "Developers." at 3.5
  05.3 - 06.0  whoosh_streaks       whoosh SFX
  06.0 - 09.5  tower_drop           "SURGICAL AI HUB" + tagline, impact at 6.0
  09.5 - 10.0  whoosh_streaks       whoosh
  10.0 - 11.5  BLACK CARD            "Your Ecosystem. Reimagined."
  11.5 - 16.0  eco UI glass panel
  16.0 - 16.5  whoosh_streaks       whoosh
  16.5 - 18.0  BLACK CARD            "Risk vs. Reward."
  18.0 - 23.0  risk UI glass panel
  23.0 - 23.5  whoosh_streaks       whoosh
  23.5 - 32.0  studio_void volley    stats punches at 24, 26, 28, 30
  32.0 - 40.0  BLACK CTA             impact at 32.0
"""
import pathlib, subprocess

V = pathlib.Path("/app/promo_video/v3")
UI = V / "ui"
OUT = V / "surgical_ai_hub_reveal_v3.mp4"

TOTAL = 40.0


def ff(args):
    subprocess.run(args, check=True)


# =========================================================================
# 1. Audio bed - music + synthesized SFX
# =========================================================================
WHOOSH_AT = [5.3, 9.5, 16.0, 23.0]
IMPACT_AT = [6.0, 32.0]
CLICK_AT  = [3.5, 6.1, 10.1, 16.6, 24.0, 26.0, 28.0, 30.0, 32.6, 34.0]

audio_mix = V / "audio_mix.wav"

sfx_filters, sfx_labels = [], []
inputs = ["-i", str(V / "music.wav")]
sfx_filters.append(
    f"[0:a]volume=0.85,afade=t=in:st=0:d=0.4,"
    f"afade=t=out:st={TOTAL-1.2:.2f}:d=1.2[music]"
)
sfx_labels.append("[music]")

WHOOSH_FG = ("anoisesrc=d=0.6:c=white:r=48000,"
             "highpass=f=800,lowpass=f=4000,"
             "afade=t=in:st=0:d=0.08,afade=t=out:st=0.35:d=0.25,"
             "volume=1.0")
IMPACT_FG = ("sine=frequency=55:duration=1.2:sample_rate=48000,volume=1.2,"
             "afade=t=in:st=0:d=0.01,afade=t=out:st=0.5:d=0.7")
CLICK_FG  = ("sine=frequency=2200:duration=0.04:sample_rate=48000,volume=0.55,"
             "afade=t=in:st=0:d=0.002,afade=t=out:st=0.015:d=0.025")

idx = 0
for off in WHOOSH_AT:
    idx += 1
    inputs += ["-f", "lavfi", "-t", "0.6", "-i", WHOOSH_FG]
    sfx_filters.append(
        f"[{idx}:a]adelay={int(off*1000)}|{int(off*1000)},volume=0.9[w{idx}]")
    sfx_labels.append(f"[w{idx}]")
for off in IMPACT_AT:
    idx += 1
    inputs += ["-f", "lavfi", "-t", "1.2", "-i", IMPACT_FG]
    sfx_filters.append(
        f"[{idx}:a]adelay={int(off*1000)}|{int(off*1000)},volume=1.6[i{idx}]")
    sfx_labels.append(f"[i{idx}]")
for off in CLICK_AT:
    idx += 1
    inputs += ["-f", "lavfi", "-t", "0.1", "-i", CLICK_FG]
    sfx_filters.append(
        f"[{idx}:a]adelay={int(off*1000)}|{int(off*1000)},volume=0.7[c{idx}]")
    sfx_labels.append(f"[c{idx}]")

amix = (";".join(sfx_filters) + ";" + "".join(sfx_labels)
        + f"amix=inputs={len(sfx_labels)}:duration=longest:"
          "dropout_transition=3:normalize=0[a]")
ff(["ffmpeg", "-y", *inputs, "-filter_complex", amix, "-map", "[a]",
    "-t", f"{TOTAL:.2f}", "-c:a", "pcm_s16le", str(audio_mix)])


# =========================================================================
# 2. Build each segment at exact length. NO zoompan. Trust source motion.
# For the UI scenes, trim away the first 0.6s to skip the light-mode flash.
# =========================================================================
BASELINE = ("scale=1920:1080:force_original_aspect_ratio=increase,"
            "crop=1920:1080,setsar=1,fps=30")
PAD_PRE  = "tpad=stop_mode=clone:stop_duration=2"

def glass(sat=1.05, contrast=1.0, brightness=-0.03):
    return (
        f"eq=brightness={brightness}:contrast={contrast}:saturation={sat},"
        "scale=1654:930:flags=lanczos,"
        "pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black,"
        "drawbox=x=132:y=74:w=1655:h=931:color=0x00e5ff@0.18:t=2"
    )

seg_specs = [
    # name, source, start_offset, length, filter (no zoompan)
    ("s01_teaser",   V/"teaser_macro.mp4",   0.0, 3.0,
        f"{BASELINE},eq=brightness=-0.05:contrast=1.1:saturation=1.08"),
    ("s02_void1",    V/"studio_void.mp4",    0.0, 2.3,
        f"{BASELINE},eq=brightness=-0.08:contrast=1.1"),
    ("s03_whoosh1",  V/"whoosh_streaks.mp4", 0.0, 0.7,
        f"{BASELINE},setpts=0.6*PTS,eq=contrast=1.25"),
    ("s04_tower",    V/"tower_drop.mp4",     0.0, 3.5,
        f"{BASELINE},eq=brightness=-0.02:contrast=1.1:saturation=1.1"),
    ("s05_whoosh2",  V/"whoosh_streaks.mp4", 0.0, 0.5,
        f"{BASELINE},setpts=0.55*PTS,hflip,eq=contrast=1.25"),
    ("s06_card_eco", None,                   0.0, 1.5, None),   # BLACK card
    ("s07_eco",      UI/"eco.mp4",           1.0, 4.5,
        f"{BASELINE},{glass()}"),
    ("s08_whoosh3",  V/"whoosh_streaks.mp4", 0.0, 0.5,
        f"{BASELINE},setpts=0.55*PTS,eq=contrast=1.25"),
    ("s09_card_risk", None,                  0.0, 1.5, None),   # BLACK card
    ("s10_risk",     UI/"risk.mp4",          1.0, 5.0,
        f"{BASELINE},{glass()}"),
    ("s11_whoosh4",  V/"whoosh_streaks.mp4", 0.0, 0.5,
        f"{BASELINE},setpts=0.55*PTS,hflip,eq=contrast=1.25"),
    ("s12_volley",   V/"studio_void.mp4",    0.0, 8.5,
        f"{BASELINE},eq=brightness=-0.08:contrast=1.1,setpts=1.7*PTS"),
    ("s13_cta",      None,                   0.0, 8.0, None),   # BLACK CTA
]

seg_files = []
for name, src, ss, length, vf in seg_specs:
    out = V / f"seg_{name}.mp4"
    seg_files.append((name, out, length))
    if src is None:
        ff([
            "ffmpeg", "-y",
            "-f", "lavfi", "-i",
            f"color=c=black:s=1920x1080:r=30:d={length}",
            "-vf", "setsar=1",
            "-t", f"{length}",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18", str(out),
        ])
    else:
        ff([
            "ffmpeg", "-y", "-ss", f"{ss}", "-i", str(src),
            "-vf", vf + "," + PAD_PRE,
            "-t", f"{length}",
            "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
            "-preset", "medium", "-crf", "18", str(out),
        ])


# =========================================================================
# 3. Concat (hard cuts, Apple-style)
# =========================================================================
list_file = V / "concat.txt"
list_file.write_text("\n".join(
    f"file '{p}'" for _n, p, _l in seg_files))

concat_mp4 = V / "concat.mp4"
ff(["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(list_file),
    "-vf", "setsar=1,fps=30",
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "slow", "-crf", "19",
    "-an", str(concat_mp4)])


# =========================================================================
# 4. Typography. Text now sits on dedicated black cards or clean sky over
#    the generative shots. Never on top of the UI itself.
# =========================================================================
def punch(text, start, hold, size, y_expr="(h-text_h)/2",
          color="white", border=False):
    end = start + hold
    fo_start = end - 0.3
    alpha = (f"if(lt(t,{start}),0,"
             f"if(lt(t,{start+0.15}),(t-{start})/0.15,"
             f"if(lt(t,{fo_start}),1,"
             f"if(lt(t,{end}),(1-(t-{fo_start})/0.3),0))))")
    extra = ""
    if border:
        extra = ":bordercolor=0x1a1a1a:borderw=2"
    return (f"drawtext=text='{text}':fontcolor={color}:fontsize={size}:"
            f"x=(w-text_w)/2:y={y_expr}:alpha='{alpha}'{extra}")

TEXTS = [
    # Tension phase
    ("Developers.",                   3.5, 1.6, 68,  "(h-text_h)/2",          "0xBFCFE6"),
    # Drop
    ("SURGICAL AI HUB",               6.15, 3.2, 110, "(h-text_h)/2-40",      "white"),
    ("The agentic AI coding toolkit", 6.6,  2.8, 32,  "(h/2)+70",             "0x8EBBD9"),
    # Ecosystem black card
    ("Your Ecosystem.",              10.1, 1.3, 92,  "(h-text_h)/2-50",      "white"),
    ("Reimagined.",                  10.6, 0.8, 92,  "(h-text_h)/2+40",      "0x4FD1C5"),
    # Risk black card
    ("Risk vs. Reward.",             16.6, 1.3, 100, "(h-text_h)/2",         "white"),
    # Stats volley
    ("Blazing Fast.",                23.8, 1.9, 118, "(h-text_h)/2-30",      "white"),
    ("32 Models.",                   25.8, 1.9, 118, "(h-text_h)/2-30",      "0x4FD1C5"),
    ("Live Pricing.",                27.8, 1.9, 118, "(h-text_h)/2-30",      "0xF2A6A6"),
    ("Fully Open Source.",           29.8, 2.0, 112, "(h-text_h)/2-30",      "white"),
    # CTA
    ("Available now on GitHub",       32.6, 7.1, 90, "(h-text_h)/2-70",      "white"),
    ("github.com/ayanjitshome/surgical-ai",
                                      34.0, 5.5, 42, "(h/2)+40",             "0x4FD1C5"),
    ("Star  Clone  Ship",             35.5, 3.8, 24, "h-130",                "0x7a8a9a"),
]

vf_final = ",".join(punch(*args) for args in TEXTS) + ",format=yuv420p"

final_mp4 = V / "composed.mp4"
ff(["ffmpeg", "-y", "-i", str(concat_mp4),
    "-vf", vf_final,
    "-c:v", "libx264", "-pix_fmt", "yuv420p",
    "-preset", "slow", "-crf", "19",
    "-an", str(final_mp4)])


# =========================================================================
# 5. Mux
# =========================================================================
OUT.unlink(missing_ok=True)
ff(["ffmpeg", "-y",
    "-i", str(final_mp4), "-i", str(audio_mix),
    "-map", "0:v", "-map", "1:a",
    "-t", f"{TOTAL:.2f}",
    "-c:v", "copy",
    "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-ac", "2",
    "-shortest", "-movflags", "+faststart",
    str(OUT)])
print(f"DONE -> {OUT} ({OUT.stat().st_size//1024} KB)")
