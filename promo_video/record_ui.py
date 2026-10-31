"""Record Token Economy page and Ecosystem Map with Playwright.

Each recording ~10s with scripted camera motion:
- Token Economy: open, hover a model, change the slider, let numbers tick.
- Ecosystem Map: scroll to map, pan the dependency graph, hover a node.

Playwright produces WebM; we transcode to MP4 trimmed to the useful window.
"""
import asyncio
import pathlib
import subprocess
from playwright.async_api import async_playwright

URL = "https://agent-toolkit-hub.preview.emergentagent.com"
OUT = pathlib.Path("/app/promo_video/out/ui")
OUT.mkdir(parents=True, exist_ok=True)


async def record_token_economy(playwright):
    rec_dir = OUT / "rec_token"
    rec_dir.mkdir(exist_ok=True)
    browser = await playwright.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
    ctx = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(rec_dir),
        record_video_size={"width": 1920, "height": 1080},
        color_scheme="dark",
    )
    page = await ctx.new_page()
    # Ensure dark theme is applied before navigation
    await page.add_init_script("""
        try { localStorage.setItem('theme','dark'); } catch(e){}
    """)
    await page.goto(f"{URL}/tokeneconomy", wait_until="networkidle", timeout=45000)
    # ensure dark
    cls = await page.evaluate("() => document.documentElement.className")
    if "dark" not in cls:
        tb = page.locator('[data-testid="theme-toggle-button"]')
        if await tb.count():
            await tb.first.click()
            await page.wait_for_timeout(500)
    await page.wait_for_timeout(1500)

    # Slow mouse camera moves and small scrolls over ~9 seconds
    await page.mouse.move(960, 540, steps=20)
    await page.wait_for_timeout(900)
    # scroll to show pricing cards area
    await page.evaluate("window.scrollBy({top:220,left:0,behavior:'smooth'})")
    await page.wait_for_timeout(1400)
    # hover a model picker if present
    picker = page.locator('[data-testid*="model"], button:has-text("Claude")').first
    try:
        await picker.hover(timeout=1500)
    except Exception:
        pass
    await page.wait_for_timeout(900)
    # try sliding an input if slider exists
    slider = page.locator('input[type="range"]').first
    try:
        box = await slider.bounding_box()
        if box:
            await page.mouse.move(box["x"] + 20, box["y"] + box["height"] / 2)
            await page.mouse.down()
            await page.mouse.move(box["x"] + box["width"] * 0.75, box["y"] + box["height"] / 2, steps=25)
            await page.mouse.up()
    except Exception:
        pass
    await page.wait_for_timeout(1200)
    await page.evaluate("window.scrollBy({top:200,left:0,behavior:'smooth'})")
    await page.wait_for_timeout(1500)
    await page.evaluate("window.scrollBy({top:-120,left:0,behavior:'smooth'})")
    await page.wait_for_timeout(1200)

    await ctx.close()
    await browser.close()

    webm = next(rec_dir.glob("*.webm"))
    out = OUT / "02_token_ui.mp4"
    # Trim first 1s warm-up, take 8s, encode h264 1280x720
    subprocess.run([
        "ffmpeg", "-y", "-ss", "1.0", "-i", str(webm), "-t", "8",
        "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30",
        "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "18",
        str(out),
    ], check=True)
    print(f"Token UI -> {out} ({out.stat().st_size//1024} KB)")
    return out


async def record_ecosystem(playwright):
    rec_dir = OUT / "rec_eco"
    rec_dir.mkdir(exist_ok=True)
    browser = await playwright.chromium.launch(headless=True, args=["--disable-dev-shm-usage"])
    ctx = await browser.new_context(
        viewport={"width": 1920, "height": 1080},
        record_video_dir=str(rec_dir),
        record_video_size={"width": 1920, "height": 1080},
        color_scheme="dark",
    )
    page = await ctx.new_page()
    await page.add_init_script("""
        try { localStorage.setItem('theme','dark'); } catch(e){}
    """)
    await page.goto(URL, wait_until="networkidle", timeout=45000)
    cls = await page.evaluate("() => document.documentElement.className")
    if "dark" not in cls:
        tb = page.locator('[data-testid="theme-toggle-button"]')
        if await tb.count():
            await tb.first.click()
            await page.wait_for_timeout(500)
    await page.wait_for_timeout(800)

    # Scroll to the ecosystem map
    await page.evaluate("""
        () => {
            const el = document.querySelector('.react-flow');
            if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        }
    """)
    await page.wait_for_timeout(2000)

    # Simulate pan/zoom motion
    rf = await page.evaluate(
        "() => { const r = document.querySelector('.react-flow').getBoundingClientRect(); "
        "return {cx: r.left + r.width/2, cy: r.top + r.height/2}; }"
    )
    cx, cy = rf["cx"], rf["cy"]
    # Hover a node for subtle highlight
    node = page.locator('.react-flow__node').first
    try:
        await node.hover()
    except Exception:
        pass
    await page.wait_for_timeout(800)
    # Zoom in a touch with mouse wheel
    await page.mouse.move(cx, cy)
    for _ in range(5):
        await page.mouse.wheel(0, -40)
        await page.wait_for_timeout(80)
    await page.wait_for_timeout(900)
    # Pan: drag canvas slowly
    try:
        await page.mouse.move(cx, cy)
        await page.mouse.down()
        await page.mouse.move(cx - 140, cy + 40, steps=30)
        await page.mouse.up()
    except Exception:
        pass
    await page.wait_for_timeout(1000)
    # Click fit view to recentre
    fit = page.locator('[data-testid="ecosystem-fit-view-button"]')
    try:
        await fit.click()
    except Exception:
        pass
    await page.wait_for_timeout(1800)

    await ctx.close()
    await browser.close()

    webm = next(rec_dir.glob("*.webm"))
    out = OUT / "03_ecosystem_ui.mp4"
    subprocess.run([
        "ffmpeg", "-y", "-ss", "1.5", "-i", str(webm), "-t", "8",
        "-vf", "scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,fps=30",
        "-an", "-c:v", "libx264", "-pix_fmt", "yuv420p",
        "-preset", "medium", "-crf", "18",
        str(out),
    ], check=True)
    print(f"Ecosystem UI -> {out} ({out.stat().st_size//1024} KB)")
    return out


async def main():
    async with async_playwright() as p:
        token = await record_token_economy(p)
        eco = await record_ecosystem(p)
    print("done:", token, eco)


if __name__ == "__main__":
    asyncio.run(main())
