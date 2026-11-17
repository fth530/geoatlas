"""Generate GeoKPSS app icons from the bundled Turkey GeoJSON.

Outputs:
  assets/images/icon.png          - 1024x1024 opaque icon (gradient + white Turkey)
  assets/images/adaptive-icon.png - 1024x1024 transparent foreground for Android adaptive icon
"""
import json
import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
GEOJSON = ROOT / "data" / "turkiye_iller.json"
ICON = ROOT / "assets" / "images" / "icon.png"
ADAPTIVE = ROOT / "assets" / "images" / "adaptive-icon.png"

SIZE = 1024
PRIMARY_TOP = (86, 106, 226)    # #566AE2
PRIMARY_BOTTOM = (56, 74, 190)  # #384ABE
SILHOUETTE = (255, 255, 255, 255)


def collect_rings():
    data = json.loads(GEOJSON.read_text(encoding="utf-8"))
    rings = []
    cos_lat = math.cos(math.radians(39.0))
    for feature in data["features"]:
        geom = feature["geometry"]
        polys = [geom["coordinates"]] if geom["type"] == "Polygon" else geom["coordinates"]
        for poly in polys:
            if poly and poly[0]:
                rings.append([(lon * cos_lat, -lat) for lon, lat in poly[0]])
    return rings


def fit_transform(rings, box, pad):
    xs = [p[0] for ring in rings for p in ring]
    ys = [p[1] for ring in rings for p in ring]
    min_x, max_x, min_y, max_y = min(xs), max(xs), min(ys), max(ys)
    w, h = max_x - min_x, max_y - min_y
    scale = min((box - 2 * pad) / w, (box - 2 * pad) / h)
    ox = (box - w * scale) / 2 - min_x * scale
    oy = (box - h * scale) / 2 - min_y * scale
    return scale, ox, oy


def draw_turkey(draw, rings, scale, ox, oy, offset=(0, 0), fill=SILHOUETTE):
    for ring in rings:
        pts = [(x * scale + ox + offset[0], y * scale + oy + offset[1]) for x, y in ring]
        draw.polygon(pts, fill=fill)


def make_icon():
    rings = collect_rings()
    img = Image.new("RGBA", (SIZE, SIZE))
    px = img.load()
    for y in range(SIZE):
        t = y / (SIZE - 1)
        r = int(PRIMARY_TOP[0] + (PRIMARY_BOTTOM[0] - PRIMARY_TOP[0]) * t)
        g = int(PRIMARY_TOP[1] + (PRIMARY_BOTTOM[1] - PRIMARY_TOP[1]) * t)
        b = int(PRIMARY_TOP[2] + (PRIMARY_BOTTOM[2] - PRIMARY_TOP[2]) * t)
        for x in range(SIZE):
            px[x, y] = (r, g, b, 255)
    draw = ImageDraw.Draw(img)
    scale, ox, oy = fit_transform(rings, SIZE, pad=80)
    # nudge silhouette slightly above optical center
    draw_turkey(draw, rings, scale, ox, oy, offset=(0, -18))
    img.convert("RGB").save(ICON)
    print(f"icon -> {ICON}")


def make_adaptive():
    rings = collect_rings()
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    # adaptive safe zone ~ 66% center circle; keep silhouette within ~62% width
    scale, ox, oy = fit_transform(rings, int(SIZE * 0.62), pad=0)
    draw_turkey(draw, rings, scale, ox + SIZE * 0.19, oy + SIZE * 0.19)
    img.save(ADAPTIVE)
    print(f"adaptive -> {ADAPTIVE}")


if __name__ == "__main__":
    make_icon()
    make_adaptive()
