"""v3 UI capture - just Ecosystem Hub and Risk & Reward in dark mode.

Each page gets a 10-second recording so we have plenty of raw material
to carve into multiple short beat-synced inserts.
"""
import asyncio, pathlib, subprocess
from playwright.async_api import async_playwright

URL = "https://agent-toolkit-hub.preview.emergentagent.com"
OUT = pathlib.Path("/app/promo_video/v3/ui")
OUT.mkdir(parents=True, exist_ok=True)

PAGES = [
    ("eco", "/", [
        ("wait", 1200),
        ("scroll", 220),
        ("fit_view", None),
        ("wait", 900),
        ("hover_zoom", ".react-flow__node"),
        ("wait", 900),
        ("scroll", -220),
        ("wait", 600),
        ("scroll", 400),
        ("wait", 900),
    ]),
    ("risk", "/risk-reward", [
        ("wait", 1000),
        ("scroll", 260),
        ("wait", 900),
        ("scroll", 300),
        ("wait", 900),
        ("scroll", 420),
        ("wait", 1200),
        ("scroll", -500),
        ("wait", 1000),
    ]),
]


async def act(page, actions):
    for action in actions:
        kind = action[0]; arg = action[1] if len(action) > 1 else None
        if kind == "wait":
            await page.wait_for_timeout(arg)
        elif kind == "scroll":
            await page.evaluate(
                f"window.scrollBy({{top:{arg},left:0,behavior:'smooth'}})")
            await page.wait_for_timeout(700)
        elif kind == "hover_zoom":
            try:
                await page.locator(arg).first.hover(timeout=1500)
            except Exception:
                pass
            await page.wait_for_timeout(600)
        elif kind == "fit_view":
            try:
                await page.locator('[data-testid="ecosystem-fit-view-button"]')\
                    .first.click(timeout=1200)
            except Exception:
                pass
            await page.wait_for_timeout(600)


async def rec(pw, slug, path, actions):
    rdir = OUT / f"rec_{slug}"
    rdir.mkdir(exist_ok=True)
    b = await pw.chromium.launch(headless=True,
                                 args=["--disable-dev-shm-usage"])
    ctx = await b.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(rdir),
        record_video_size={"width": 1920, "height": 1080},
        color_scheme="dark",
    )
    page = await ctx.new_page()
    await page.add_init_script("try{localStorage.setItem('theme','dark')}"
                               "catch(e){}")
    await page.goto(f"{URL}{path}", wait_until="networkidle", timeout=45000)
    cls = await page.evaluate("()=>document.documentElement.className")
    if "dark" not in cls:
        tb = page.locator('[data-testid="theme-toggle-button"]').first
        if await tb.count():
            await tb.click()
            await page.wait_for_timeout(500)
    await page.wait_for_timeout(900)
    await act(page, actions)
    await page.wait_for_timeout(400)
    await ctx.close()
    await b.close()
    webm = next(rdir.glob("*.webm"))
    out = OUT / f"{slug}.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-ss", "1.0", "-i", str(webm), "-t", "10",
        "-vf", "scale=1920:1080:force_original_aspect_ratio=increase,"
               "crop=1920:1080,fps=30",
        "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "18", str(out),
    ], check=True)
    print(f"[{slug}] -> {out}")


async def main():
    async with async_playwright() as pw:
        for args in PAGES:
            await rec(pw, *args)


asyncio.run(main())
