"""Split scripts/aria-source.webp into layers for cursor-tracking eyes.

Run from mainframe/:  python3 scripts/make-eyes.py   (needs Pillow + numpy)

Outputs (public/):
  aria-base.webp       face with the irises painted out (bare sclera)
  aria-eye-mask.png    alpha = eye opening (clips the moving irises)
  aria-iris-l.png / aria-iris-r.png   iris + pupil sprites (full discs)
  aria-lid-shadow.png  soft upper-lid shadow drawn over the irises
Prints the sprite geometry used by src/components/BackgroundCharacter.tsx.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SRC = 'scripts/aria-source.webp'
OUT = 'public/'
SS = 4  # supersampling for smooth mask edges

# Hand-traced from the 1024px source. Upper lid runs corner->corner over the
# top, lower lid runs back underneath. Iris = (cx, cy, r).
EYES = {
    'l': dict(
        iris=(421, 379.5, 17.5),
        upper=[(379.5, 382.5), (385, 377), (391, 372.5), (398, 368.5), (405, 365.5),
               (413, 364), (421, 363.5), (429, 364), (437, 365.5), (443, 369),
               (448, 373.5), (453, 380), (458, 389.5)],
        lower=[(452, 392.5), (445, 394), (437, 396), (429, 397), (421, 397.2),
               (412, 396.8), (404, 395), (397, 391.5), (391, 388), (385, 385.5)],
    ),
    'r': dict(
        iris=(578, 362, 17.5),
        upper=[(543, 381), (547, 374.5), (551, 368), (556, 361), (561, 355),
               (567, 350.5), (574, 348.3), (582, 348), (590, 348.8), (597, 350.5),
               (603, 354), (607.5, 358), (611, 362.5)],
        lower=[(607, 366.5), (601, 371), (595, 375.5), (588, 378.6), (579, 380),
               (570, 380.2), (562, 379.6), (555, 378.6), (549, 380)],
    ),
}

im = Image.open(SRC).convert('RGB')
a = np.asarray(im).astype(np.float32)
H, W, _ = a.shape
yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)

# ---- Eye-opening mask (antialiased) ----
big = Image.new('L', (W * SS, H * SS), 0)
d = ImageDraw.Draw(big)
for e in EYES.values():
    poly = e['upper'] + e['lower']
    d.polygon([(x * SS, y * SS) for x, y in poly], fill=255)
mask_img = big.resize((W, H), Image.LANCZOS).filter(ImageFilter.GaussianBlur(0.5))
# White with alpha = opening, so it works as a CSS alpha mask everywhere.
Image.merge('LA', (Image.new('L', (W, H), 255), mask_img)).save(OUT + 'aria-eye-mask.png')
soft = np.asarray(mask_img).astype(np.float32) / 255

base = a.copy()
shadow = np.zeros((H, W), np.float32)
geo = {}

for k, e in EYES.items():
    cx, cy, r = e['iris']
    dist = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2)
    inside = soft > 0.98

    # -- iris sprite: full disc, lid-hidden part filled with rim colour --
    pad = 2
    x0, y0 = int(np.floor(cx - r - pad)), int(np.floor(cy - r - pad))
    size = int(np.ceil(2 * (r + pad))) + 1
    sl = (slice(y0, y0 + size), slice(x0, x0 + size))
    crop = a[sl].copy()
    dd = dist[sl]
    vis = inside[sl]
    mid_col = np.median(crop[vis & (dd > r * 0.55) & (dd < r * 0.8)], axis=0)
    rim_col = np.median(crop[vis & (dd > r * 0.85) & (dd < r * 0.98)], axis=0)
    t = np.clip((dd - r * 0.55) / (r * 0.45), 0, 1)[..., None]
    fill = mid_col * (1 - t) + rim_col * t
    hidden = ~vis
    crop[hidden] = fill[hidden]
    alpha = np.clip((r + 0.6 - dd) / 1.2, 0, 1)
    Image.fromarray(np.dstack([crop, alpha * 255]).astype(np.uint8), 'RGBA') \
        .save(OUT + f'aria-iris-{k}.png')
    geo[k] = dict(x=x0, y=y0, size=size, cx=cx, cy=cy)

    # -- base: paint the iris out with shaded sclera --
    sclera_px = inside & (dist > r + 2.5) & (dist < r + 12)
    px = a[sclera_px]
    lum = px @ np.array([0.299, 0.587, 0.114], np.float32)
    sc = px[lum >= np.percentile(lum, 70)].mean(axis=0)  # lit sclera, not lid-shadowed
    xs = [p[0] for p in e['upper']]
    ex0, ex1 = min(xs), max(xs)
    ecx, hw = (ex0 + ex1) / 2, (ex1 - ex0) / 2
    shade = 1 - 0.10 * np.clip(np.abs(xx - ecx) / hw, 0, 1) ** 2
    fillc = sc[None, None, :] * shade[..., None]
    w = np.clip((r + 5 - dist) / 4.0, 0, 1) * soft  # iris disc + feather
    base = base * (1 - w[..., None]) + fillc * w[..., None]

    # -- upper-lid shadow: falls off below the lid line --
    ux = np.array([p[0] for p in e['upper']])
    uy = np.array([p[1] for p in e['upper']])
    lid_y = np.interp(xx, ux, uy)
    below = yy - lid_y
    band = (xx >= ex0) & (xx <= ex1)
    shadow = np.maximum(shadow, np.where(band & (below > -2), np.exp(-np.clip(below, 0, None) / 3.5) * 0.55, 0))

# Blend so the sclera ring just outside the painted area matches too.
Image.fromarray(np.clip(base, 0, 255).astype(np.uint8)).save(OUT + 'aria-base.webp', quality=92)

shadow *= soft
sh = np.zeros((H, W, 4), np.uint8)
sh[..., 0], sh[..., 1], sh[..., 2] = 55, 32, 28
sh[..., 3] = np.clip(shadow * 255, 0, 255).astype(np.uint8)
Image.fromarray(sh, 'RGBA').save(OUT + 'aria-lid-shadow.png')

print(geo)
