"""Record 7 UI pages via Playwright. Order and themes:

  1. Ecosystem Hub       `/`             dark
  2. Risk & Reward       `/risk-reward`  light  (subtle light-mode reveal)
  3. Token Economy       `/tokeneconomy` dark
  4. Decision Guide      `/decide`       light
  5. Adoption & Tradeoffs `/guidance`    dark
  6. Prompt Playbook     `/prompt`       dark
  7. Prompt Builder      `/prompt/builder` light

Each captured at 1920x1080, trimmed to 7s MP4 after a 1s warm-up.
"""
import asyncio
import pathlib
import subprocess
from playwright.async_api import async_playwright

URL = "https://agent-toolkit-hub.preview.emergentagent.com"
OUT = pathlib.Path("/app/promo_video/v2/ui")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("01_ecosystem", "/",                "dark",
        [("scroll", 180), ("hover", ".react-flow__node"),
         ("wait", 500),  ("fit_view", None),
         ("scroll", 100), ("wait", 1200)]),
    ("02_risk_reward", "/risk-reward",   "light",
        [("wait", 800), ("scroll", 240),
         ("wait", 900), ("scroll", 240),
         ("wait", 800), ("scroll", -300)]),
    ("03_token", "/tokeneconomy",        "dark",
        [("wait", 700), ("scroll", 220),
         ("hover", 'button:has-text("Antigravity")'),
         ("slider_drag", 'input[type="range"]:nth-of-type(1)'),
         ("wait", 900), ("scroll", 180)]),
    ("04_decide", "/decide",             "light",
        [("wait", 700), ("scroll", 160),
         ("click_first", '[role="radio"], input[type="radio"] + label, button[data-testid*="option"]'),
         ("wait", 1200), ("scroll", 220)]),
    ("05_guidance", "/guidance",         "dark",
        [("wait", 600), ("scroll", 260),
         ("wait", 900), ("scroll", 260),
         ("wait", 900), ("scroll", 260)]),
    ("06_playbook", "/prompt",           "dark",
        [("wait", 600), ("scroll", 220),
         ("hover", '[data-testid*="playbook"], article, .card'),
         ("wait", 900), ("scroll", 260),
         ("wait", 800)]),
    ("07_builder", "/prompt/builder",    "light",
        [("wait", 600),
         ("type", 'textarea, [role="textbox"], [contenteditable="true"]',
             "You are a surgical AI coder. "
             "Make every token work twice as hard. "
             "Keep context lean. Return only the diff."),
         ("wait", 1500), ("scroll", 180),
         ("wait", 900)]),
]


async def set_theme(page, want):
    cls = await page.evaluate("() => document.documentElement.className")
    is_dark = "dark" in cls
    if (want == "dark") != is_dark:
        tb = page.locator('[data-testid="theme-toggle-button"]').first
        if await tb.count():
            await tb.click()
            await page.wait_for_timeout(500)


async def run_actions(page, actions):
    for action in actions:
        kind = action[0]
        arg = action[1] if len(action) > 1 else None
        extra = action[2] if len(action) > 2 else None
        if kind == "wait":
            await page.wait_for_timeout(arg)
        elif kind == "scroll":
            await page.evaluate(f"window.scrollBy({{top:{arg},left:0,behavior:'smooth'}})")
            await page.wait_for_timeout(900)
        elif kind == "hover":
            try:
                await page.locator(arg).first.hover(timeout=1500)
            except Exception:
                pass
            await page.wait_for_timeout(700)
        elif kind == "click_first":
            try:
                await page.locator(arg).first.click(timeout=1500)
            except Exception:
                pass
            await page.wait_for_timeout(600)
        elif kind == "slider_drag":
            try:
                sl = page.locator(arg).first
                box = await sl.bounding_box()
                if box:
                    await page.mouse.move(box["x"] + 20, box["y"] + box["height"] / 2)
                    await page.mouse.down()
                    await page.mouse.move(box["x"] + box["width"] * 0.75,
                                          box["y"] + box["height"] / 2, steps=25)
                    await page.mouse.up()
            except Exception:
                pass
            await page.wait_for_timeout(800)
        elif kind == "type":
            text_to_type = extra or "You are a surgical AI coder."
            try:
                field = page.locator(arg).first
                await field.click(timeout=1500)
                try:
                    await field.fill("")
                except Exception:
                    pass
                await field.type(text_to_type, delay=25)
            except Exception:
                pass
            await page.wait_for_timeout(1200)
        elif kind == "fit_view":
            try:
                await page.locator('[data-testid="ecosystem-fit-view-button"]').first.click(timeout=1000)
            except Exception:
                pass
            await page.wait_for_timeout(900)


async def record_page(playwright, slug, path, theme, actions):
    rec_dir = OUT / f"rec_{slug}"
    rec_dir.mkdir(exist_ok=True)
    browser = await playwright.chromium.launch(
        headless=True, args=["--disable-dev-shm-usage"])
    ctx = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(rec_dir),
        record_video_size={"width": 1920, "height": 1080},
        color_scheme=theme,
    )
    page = await ctx.new_page()
    await page.add_init_script(
        f"try {{ localStorage.setItem('theme','{theme}'); }} catch(e){{}}")
    await page.goto(f"{URL}{path}", wait_until="networkidle", timeout=45000)
    await set_theme(page, theme)
    await page.wait_for_timeout(900)
    await run_actions(page, actions)
    await page.wait_for_timeout(400)
    await ctx.close()
    await browser.close()

    webm = next(rec_dir.glob("*.webm"))
    out = OUT / f"{slug}.mp4"
    # Trim first 1.2s warm-up and take 7s.
    subprocess.run([
        "ffmpeg", "-y", "-ss", "1.2", "-i", str(webm), "-t", "7",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,"
               "crop=1920:1080,fps=30",
        "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "18",
        str(out),
    ], check=True)
    print(f"[{slug}] -> {out} ({out.stat().st_size//1024} KB)")


async def main():
    import sys
    only = sys.argv[1] if len(sys.argv) > 1 else None
    async with async_playwright() as p:
        for args in PAGES:
            if only and args[0] != only:
                continue
            await record_page(p, *args)


if __name__ == "__main__":
    asyncio.run(main())
