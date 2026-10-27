# Genererer Henvisningers logofiler i public/ (ordmaerke, hvid version, app-ikon).
# Ordmaerket er skrifttypen "Nothing You Could Do" (Kimberly Geswein, SIL OFL 1.1,
# se docs/licenses/NothingYouCouldDo-OFL.txt) omdannet til vektorstier, saa logoet
# ikke afhaenger af en installeret skrifttype. Koer:
#   python3 scripts/henvisninger-logo.py <sti/til/NothingYouCouldDo.ttf> public
import math, sys
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.recordingPen import RecordingPen

font_path, out_dir = sys.argv[1], sys.argv[2]
font = TTFont(font_path)
gs = font.getGlyphSet()
cmap = font.getBestCmap()
hmtx = font["hmtx"]
upm = font["head"].unitsPerEm
INK = "#1C1917"
ANGLE = -5  # samme haeldning som i tegningerne

def layout(text, dotless_at=None):
    """Glyffer paa en linje. dotless_at: indeks hvor 'i' skal vaere prikloes."""
    x, items = 0, []
    for i, ch in enumerate(text):
        name = cmap[ord(ch)]
        if dotless_at is not None and i == dotless_at:
            name = cmap.get(0x0131) or name
        items.append((name, x))
        x += hmtx[name][0]
    return items, x

def contours(name):
    rec = RecordingPen(); gs[name].draw(rec)
    out, cur = [], []
    for op, args in rec.value:
        cur.append((op, args))
        if op in ("closePath", "endPath"):
            out.append(cur); cur = []
    return out

def contour_bounds(c):
    bp = BoundsPen(None)
    for op, args in c: getattr(bp, op)(*args)
    return bp.bounds

def kept(name, drop_dot):
    cs = contours(name)
    if drop_dot and len(cs) > 1:
        # i-prikken: den kontur der ligger hoejest (stoerst nederste y).
        cs.remove(max(cs, key=lambda c: contour_bounds(c)[1]))
    return cs

def glyph_path(name, dx, drop_dot=False):
    pen = SVGPathPen(None)
    tp = TransformPen(pen, (1, 0, 0, -1, dx, 0))  # y op -> SVG y ned
    for c in kept(name, drop_dot):
        for op, args in c: getattr(tp, op)(*args)
    return pen.getCommands()

def glyph_bounds(name, drop_dot=False):
    bp = BoundsPen(None)
    for c in kept(name, drop_dot):
        for op, args in c: getattr(bp, op)(*args)
    return bp.bounds

# Fluebenet fra tegningerne (54x54-boks), y nedad som SVG.
TICK = [(6, 30), (10, 33), (15, 39), (19, 46), (26, 30), (36, 15), (50, 4)]
def tick_path(cx, bottom_y, width):
    s = width / 44.0  # fluebenets bredde i boksen (6..50)
    ox, oy = cx - 28 * s, bottom_y - 46 * s
    p = [(ox + x * s, oy + y * s) for x, y in TICK]
    f = lambda q: f"{q[0]:.1f} {q[1]:.1f}"
    return (f"M{f(p[0])} C{f(p[1])} {f(p[2])} {f(p[3])} C{f(p[4])} {f(p[5])} {f(p[6])}", 9.5 * s)

def rotated_bbox(pts, ang):
    a = math.radians(ang)
    xs = [x * math.cos(a) - y * math.sin(a) for x, y in pts]
    ys = [x * math.sin(a) + y * math.cos(a) for x, y in pts]
    return min(xs), min(ys), max(xs), max(ys)

def build(with_tick, color=INK):
    text = "henvisninger"
    items, width = layout(text)
    paths, pts = [], []
    for idx, (name, dx) in enumerate(items):
        drop = with_tick and idx == 4  # det foerste i: fluebenet erstatter prikken
        d = glyph_path(name, dx, drop)
        if d: paths.append(d)
        b = glyph_bounds(name, drop)
        if b: pts += [(dx + b[0], -b[1]), (dx + b[2], -b[3]), (dx + b[0], -b[3]), (dx + b[2], -b[1])]
    extra = ""
    if with_tick:
        name, dx = items[4]
        b = glyph_bounds(name, True)
        cx = dx + (b[0] + b[2]) / 2
        top = -b[3]  # toppen af det prikloese i (SVG-koordinater)
        # Mindre end bogstaverne, tydeligt over stammen, og stregen saa tyk som
        # skriftens egen pen, saa fluebenet ligner noget skrevet med samme pen.
        tw = upm * 0.32
        bottom = top - upm * 0.19
        d, _ = tick_path(cx + tw * 0.18, bottom, tw)
        sw = upm * 0.048
        extra = f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{sw:.1f}" stroke-linecap="round" stroke-linejoin="round"/>'
        pts += [(cx - tw * 0.6, bottom - tw * 1.1), (cx + tw * 0.9, bottom - tw * 1.1)]
    x0, y0, x1, y1 = rotated_bbox(pts, ANGLE)
    pad = upm * 0.06
    vb = f"{x0 - pad:.0f} {y0 - pad:.0f} {x1 - x0 + 2 * pad:.0f} {y1 - y0 + 2 * pad:.0f}"
    body = "".join(f'<path d="{d}"/>' for d in paths)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Henvisninger">'
            f'<g transform="rotate({ANGLE})"><g fill="{color}">{body}</g>{extra}</g></svg>\n')

def app_icon(bg="#1C1917", fg="#FAF8F4"):
    d, sw = tick_path(512, 700, 470)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" role="img" aria-label="Henvisninger">'
            f'<rect width="1024" height="1024" rx="232" fill="{bg}"/>'
            f'<path d="{d}" fill="none" stroke="{fg}" stroke-width="{sw * 0.85:.1f}" stroke-linecap="round" stroke-linejoin="round"/></svg>\n')

open(f"{out_dir}/henvisninger-logo.svg", "w").write(build(False))
open(f"{out_dir}/henvisninger-logo-flueben.svg", "w").write(build(True))
open(f"{out_dir}/henvisninger-logo-hvid.svg", "w").write(build(False, "#FAF8F4"))
open(f"{out_dir}/henvisninger-appikon.svg", "w").write(app_icon())
print("upm", upm, "dotless", cmap.get(0x0131))
