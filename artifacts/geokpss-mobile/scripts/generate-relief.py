"""Generate a static hillshade relief overlay for the Turkey map.

Downloads AWS Terrain Tiles (terrarium PNG, z7) covering the app's
viewBox, computes a hillshade in meter space, and writes a transparent
RGBA PNG sized 2x the SVG viewBox (720x380). Shadowed areas get a
translucent dark-slate tint; lit/sea areas stay transparent.

Run: python scripts/generate-relief.py
"""

import math
import os
import urllib.request

import numpy as np
from PIL import Image

VIEW_W, VIEW_H = 360.0, 190.0
OUT_W, OUT_H = 720, 380  # 2x supersample
MIN_LON, MAX_LAT = 25.75, 42.25
MAX_LON = MIN_LON + VIEW_W / 18.8   # 44.9149
MIN_LAT = MAX_LAT - VIEW_H / 29.1   # 35.7220
Z = 7
N = 2 ** Z
TILE = 256

OUT_DIR = os.path.join(os.path.dirname(__file__), "..", "assets", "images")
OUT_PATH = os.path.join(OUT_DIR, "relief-turkey.png")
CACHE = os.path.join(os.path.dirname(__file__), "..", ".relief-cache")

AZIMUTH = math.radians(315.0)
ALTITUDE = math.radians(45.0)


def tile_range():
    xs, ys = [], []
    for lon in (MIN_LON, MAX_LON):
        xs.append(int((lon + 180.0) / 360.0 * N))
    for lat in (MAX_LAT, MIN_LAT):
        s = math.sin(math.radians(lat))
        ys.append(int((0.5 - 0.25 * math.log((1 + s) / (1 - s)) / math.pi) * N))
    return range(min(xs), max(xs) + 1), range(min(ys), max(ys) + 1)


def fetch_tile(x, y):
    os.makedirs(CACHE, exist_ok=True)
    path = os.path.join(CACHE, f"{Z}-{x}-{y}.png")
    if not os.path.exists(path):
        url = f"https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{Z}/{x}/{y}.png"
        req = urllib.request.Request(url, headers={"User-Agent": "geokpss-relief/1.0"})
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        with open(path, "wb") as fh:
            fh.write(data)
    img = np.asarray(Image.open(path).convert("RGB"), dtype=np.float64)
    elev = img[..., 0] * 256.0 + img[..., 1] + img[..., 2] / 256.0 - 32768.0
    return elev


def lonlat_to_tile_px(lon, lat):
    """Return fractional (gx, gy) in the global z7 pixel grid."""
    gx = (lon + 180.0) / 360.0 * N * TILE
    s = math.sin(math.radians(lat))
    merc = 0.5 - 0.25 * math.log((1 + s) / (1 - s)) / math.pi
    gy = merc * N * TILE
    return gx, gy


def pixel_to_lonlat(px, py):
    vx = px / OUT_W * VIEW_W
    vy = py / OUT_H * VIEW_H
    lon = MIN_LON + vx / 18.8
    lat = MAX_LAT - vy / 29.1
    return lon, lat


def main():
    xs, ys = tile_range()
    print(f"tiles: x={min(xs)}..{max(xs)} y={min(ys)}..{max(ys)}")

    # Global elevation grid in fractional tile-pixel coordinates.
    # We sample directly per output pixel via bilinear interpolation.
    tiles = {}
    for x in xs:
        for y in ys:
            tiles[(x, y)] = fetch_tile(x, y)
            print(f"  fetched {x},{y}")

    def sample(lon, lat):
        gx, gy = lonlat_to_tile_px(lon, lat)
        x0, y0 = int(math.floor(gx)), int(math.floor(gy))
        wx, wy = gx - x0, gy - y0
        elev = 0.0
        wsum = 0.0
        for dx, dy, w in ((0, 0, (1 - wx) * (1 - wy)), (1, 0, wx * (1 - wy)),
                          (0, 1, (1 - wx) * wy), (1, 1, wx * wy)):
            if w == 0:
                continue
            cx, cy = x0 + dx, y0 + dy
            key = (cx // TILE, cy // TILE)
            if key not in tiles:
                continue
            arr = tiles[key]
            elev += arr[cy % TILE, cx % TILE] * w
            wsum += w
        return elev / wsum if wsum else 0.0

    # Gradient sampling distance in degrees (~0.9 km) — finer than one
    # output pixel so slopes stay crisp at map scale.
    dlon = 0.008
    dlat = 0.008

    rgba = np.zeros((OUT_H, OUT_W, 4), dtype=np.uint8)
    lats = MAX_LAT - (np.arange(OUT_H) + 0.5) / OUT_H * VIEW_H / 29.1

    for py in range(OUT_H):
        lat = float(lats[py])
        m_per_px_y = dlat * 111320.0
        m_per_px_x = dlon * 111320.0 * math.cos(math.radians(lat))
        for px in range(OUT_W):
            lon = MIN_LON + (px + 0.5) / OUT_W * (VIEW_W / 18.8)
            e = sample(lon, lat)
            if e < 25.0:  # sea / coast buffer
                continue
            er = sample(lon + dlon, lat)
            el = sample(lon - dlon, lat)
            eu = sample(lon, lat + dlat)
            ed = sample(lon, lat - dlat)
            dzdx = (er - el) / (2 * m_per_px_x)
            dzdy = (eu - ed) / (2 * m_per_px_y)
            slope = math.atan(math.hypot(dzdx, dzdy))
            aspect = math.atan2(dzdy, dzdx)
            hs = (math.cos(ALTITUDE) * math.cos(slope)
                  + math.sin(ALTITUDE) * math.sin(slope) * math.cos(AZIMUTH - aspect))
            # hs in [-1,1] roughly [0,1]; shadow where darker than ~0.72
            darkness = max(0.0, min(1.0, (0.72 - hs) * 2.8))
            alpha = int(darkness * 170)
            if alpha > 0:
                # cool slate shadow tint
                rgba[py, px] = (22, 52, 66, alpha)

    os.makedirs(OUT_DIR, exist_ok=True)
    Image.fromarray(rgba, "RGBA").save(OUT_PATH)
    print(f"wrote {OUT_PATH} ({OUT_W}x{OUT_H})")


if __name__ == "__main__":
    main()
