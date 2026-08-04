from PIL import Image
from pathlib import Path

public = Path("public")
app = Path("src/app")
src = public / "logo.png"
im = Image.open(src).convert("RGBA")
print("original", im.size, src.stat().st_size)

backup = public / "logo-original.png"
if not backup.exists():
    backup.write_bytes(src.read_bytes())

web = im.copy()
web.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
web.save(public / "logo.png", "PNG", optimize=True)
print("web logo", web.size, (public / "logo.png").stat().st_size)

w, h = im.size
side = min(w, h)
left = (w - side) // 2
top = max(0, (h - side) // 6)
mark = im.crop((left, top, left + side, top + side))


def save_png(path: Path, size: int) -> None:
    out = mark.resize((size, size), Image.Resampling.LANCZOS)
    out.save(path, "PNG", optimize=True)
    print(path, path.stat().st_size)


save_png(app / "icon.png", 512)
save_png(app / "apple-icon.png", 180)

icons = [mark.resize((s, s), Image.Resampling.LANCZOS) for s in (16, 32, 48)]
icons[0].save(
    app / "favicon.ico",
    format="ICO",
    sizes=[(16, 16), (32, 32), (48, 48)],
)
print("favicon.ico", (app / "favicon.ico").stat().st_size)

logo_og = im.copy()
logo_og.thumbnail((720, 420), Image.Resampling.LANCZOS)
base = Image.new("RGBA", (1200, 630), (244, 242, 239, 255))
lx = (1200 - logo_og.width) // 2
ly = (630 - logo_og.height) // 2
base.paste(logo_og, (lx, ly), logo_og)
base.convert("RGB").save(public / "og.png", "PNG", optimize=True)
print("og", (public / "og.png").stat().st_size)

header = im.copy()
header.thumbnail((480, 200), Image.Resampling.LANCZOS)
header.save(public / "logo-mark.png", "PNG", optimize=True)
print("logo-mark", header.size, (public / "logo-mark.png").stat().st_size)
