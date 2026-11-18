#!/usr/bin/env python3
"""Génère les logos Laboulette (mascotte d'origine + mot vectorisé).

Polices OFL : Lilita One (mot « LABOU ») et Bungee (étiquette « LETTE »).
Le mot complet se lit LABOULETTE, en un seul nom.
"""
from __future__ import annotations

import math
import shutil
from pathlib import Path

import cairosvg
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "logo"
FONT_L = TTFont("/tmp/LilitaOne-Regular.ttf")
FONT_B = TTFont("/tmp/Bungee-Regular.ttf")

COAL = "#161211"
CREAM = "#fff3e0"
RED = "#e8392a"
EMBER = "#ff8a1f"
YELLOW = "#ffc83d"
BROWN = "#4a3c37"
BLACK = "#000000"
WHITE = "#ffffff"


def text_path(font, text, size, x, baseline, skew_deg=0.0):
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upem = font["head"].unitsPerEm
    scale = size / upem
    hmtx = font["hmtx"]
    shear = math.tan(math.radians(skew_deg))
    parts = []
    cursor = 0.0
    for ch in text:
        name = cmap.get(ord(ch))
        if name is None:
            cursor += size * 0.33
            continue
        pen = SVGPathPen(gs)
        # px = x+cursor + scale*gx + scale*shear*gy ; py = baseline - scale*gy
        tpen = TransformPen(pen, (scale, 0, scale * shear, -scale, x + cursor, baseline))
        gs[name].draw(tpen)
        parts.append(pen.getCommands() or "")
        adv, _lsb = hmtx[name]
        cursor += adv * scale
    return "".join(parts), cursor


def rrect(x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    return (
        f"M{x+r:.2f} {y:.2f} H{x+w-r:.2f} "
        f"A{r:.2f} {r:.2f} 0 0 1 {x+w:.2f} {y+r:.2f} "
        f"V{y+h-r:.2f} A{r:.2f} {r:.2f} 0 0 1 {x+w-r:.2f} {y+h:.2f} "
        f"H{x+r:.2f} A{r:.2f} {r:.2f} 0 0 1 {x:.2f} {y+h-r:.2f} "
        f"V{y+r:.2f} A{r:.2f} {r:.2f} 0 0 1 {x+r:.2f} {y:.2f} Z"
    )


def mascot_color(clip_id):
    return f'''<g>
<path d="M14.5 59.5 H47.5 A4.5 4.5 0 0 1 47.5 68.5 H14.5 A4.5 4.5 0 0 1 14.5 59.5 Z" fill="{YELLOW}"/>
<path d="M6.5 81.5 H43.5 A4.5 4.5 0 0 1 43.5 90.5 H6.5 A4.5 4.5 0 0 1 6.5 81.5 Z" fill="{EMBER}"/>
<path d="M18.5 103.5 H47.5 A4.5 4.5 0 0 1 47.5 112.5 H18.5 A4.5 4.5 0 0 1 18.5 103.5 Z" fill="{RED}"/>
<path d="M38 180 L78 157 Q82 155 86 157 L103 167 L128 151 Q132 149 136 151 L180 180 Z" fill="{RED}"/>
<clipPath id="{clip_id}"><circle cx="112" cy="82" r="56"/></clipPath>
<circle cx="112" cy="82" r="56" fill="{EMBER}"/>
<g clip-path="url(#{clip_id})">
  <circle cx="106" cy="75" r="56" fill="{COAL}"/>
  <path d="M72 70 Q82 46 108 40 Q86 52 80 74 Q76 76 72 70 Z" fill="{BROWN}"/>
</g>
<g transform="rotate(-14 112 82)">
  <path d="M86.5 80 A9.5 9.5 0 1 0 105.5 80 A9.5 9.5 0 1 0 86.5 80 Z M122 70 L141 78 L122 87 L126 78 Z M84 99 Q86 96 90 97 Q113 104 138 93 Q142 92 142 96 Q138 126 110 126 Q86 124 84 99 Z" fill="{CREAM}"/>
  <path d="M100 118 Q110 108 122 116 Q118 125 110 125 Q103 124 100 118 Z" fill="{RED}"/>
</g>
<path d="M168 12 Q171 27 186 30 Q171 33 168 48 Q165 33 150 30 Q165 27 168 12 Z" fill="{YELLOW}"/>
</g>'''


def mascot_mono(fill):
    # Même construction que le symbole monochrome d'origine : détails évidés.
    return f'''<g fill="{fill}">
<path d="M14.5 59.5 H47.5 A4.5 4.5 0 0 1 47.5 68.5 H14.5 A4.5 4.5 0 0 1 14.5 59.5 Z"/>
<path d="M6.5 81.5 H43.5 A4.5 4.5 0 0 1 43.5 90.5 H6.5 A4.5 4.5 0 0 1 6.5 81.5 Z"/>
<path d="M18.5 103.5 H47.5 A4.5 4.5 0 0 1 47.5 112.5 H18.5 A4.5 4.5 0 0 1 18.5 103.5 Z"/>
<path d="M38 180 L78 157 Q82 155 86 157 L103 167 L128 151 Q132 149 136 151 L180 180 Z"/>
<path fill-rule="evenodd" transform="rotate(-14 112 82)" d="M56 82 A56 56 0 1 1 168 82 A56 56 0 1 1 56 82 Z M86.5 80 A9.5 9.5 0 1 0 105.5 80 A9.5 9.5 0 1 0 86.5 80 Z M122 70 L141 78 L122 87 L126 78 Z M84 99 Q86 96 90 97 Q113 104 138 93 Q142 92 142 96 Q138 126 110 126 Q86 124 84 99 Z"/>
<path d="M168 12 Q171 27 186 30 Q171 33 168 48 Q165 33 150 30 Q165 27 168 12 Z"/>
</g>'''


def wrap_mascot(kind, clip_id, tx, ty, scale):
    inner = mascot_color(clip_id) if kind == "color" else mascot_mono(COAL if kind == "noir" else WHITE)
    return f'<g transform="translate({tx:.2f} {ty:.2f}) scale({scale:.4f}) translate(-2 -12)">{inner}</g>'


def wordmark(ink, badge_fill, badge_text, shadow, x, baseline, name_size=84, badge_size=44):
    """LABOU (Lilita, penché) + étiquette LETTE (Bungee). Retourne (svg, largeur, haut, bas)."""
    name_d, name_w = text_path(FONT_L, "LABOU", name_size, x, baseline, skew_deg=-8)
    # ascent visuelle Lilita ≈ 0.92 * size
    name_top = baseline - name_size * 0.90
    name_bot = baseline + name_size * 0.20
    gap = name_size * 0.06
    bx = x + name_w + gap
    text_d, text_w = text_path(FONT_B, "LETTE", badge_size, 0, 0, 0)
    pad_x = badge_size * 0.42
    pad_y = badge_size * 0.28
    bw = text_w + pad_x * 2
    bh = badge_size * 1.28
    # centre optique du mot Lilita
    optical = (name_top + baseline) / 2 + name_size * 0.04
    by = optical - bh / 2
    text_baseline = by + pad_y + badge_size * 0.78
    text_d, _ = text_path(FONT_B, "LETTE", badge_size, bx + pad_x, text_baseline, 0)
    cx = bx + bw / 2
    cy = by + bh / 2
    shadow_svg = ""
    if shadow:
        shadow_svg = f'<rect x="{bx+5:.2f}" y="{by+5:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh*0.18:.2f}" fill="{YELLOW}"/>'
    if badge_text == "knockout":
        badge_svg = (
            f'<path fill="{badge_fill}" fill-rule="evenodd" d="{rrect(bx, by, bw, bh, bh*0.18)} {text_d}"/>'
        )
    else:
        badge_svg = (
            f'<rect x="{bx:.2f}" y="{by:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh*0.18:.2f}" fill="{badge_fill}"/>'
            f'<path d="{text_d}" fill="{badge_text}"/>'
        )
    svg = (
        f'<path d="{name_d}" fill="{ink}"/>'
        f'<g transform="rotate(-3 {cx:.2f} {cy:.2f})">{shadow_svg}{badge_svg}</g>'
    )
    right = bx + bw + 8
    top = min(name_top, by) - 4
    bot = max(name_bot, by + bh + (8 if shadow else 2))
    return svg, right - x, top, bot


def svg_doc(view, body, title):
    w, h = view
    return (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.2f} {h:.2f}" '
        f'width="{w:.0f}" height="{h:.0f}" role="img">\n'
        f'<title>{title}</title>\n{body}\n</svg>\n'
    )


MODES = {
    "couleur": dict(folder="couleur", slug="couleur", mascot="color", ink=COAL, badge=RED, letters=CREAM, shadow=True, title="Laboulette"),
    "couleur-fond-fonce": dict(folder="couleur-fond-fonce", slug="couleur-fond-fonce", mascot="color", ink=CREAM, badge=RED, letters=CREAM, shadow=True, title="Laboulette"),
    "noir": dict(folder="noir", slug="noir", mascot="noir", ink=BLACK, badge=BLACK, letters="knockout", shadow=False, title="Laboulette"),
    "blanc": dict(folder="blanc", slug="blanc", mascot="blanc", ink=WHITE, badge=WHITE, letters="knockout", shadow=False, title="Laboulette"),
}


def build_horizontal(mode):
    m = MODES[mode]
    scale = 1.02
    tx, ty = 4, 10
    # mascot bbox after transform, approx height 168*scale
    mascot_w = 184 * scale
    baseline = ty + 118
    wm, _ww, top, bot = wordmark(m["ink"], m["badge"], m["letters"], m["shadow"], tx + mascot_w + 22, baseline, 80, 42)
    body = wrap_mascot(m["mascot"], "ball-" + mode, tx, ty, scale) + wm
    height = max(ty + 168 * scale + 16, bot + 14)
    width = tx + mascot_w + 22 + _ww + 16
    # recompute with real right
    return svg_doc((width, height), body, m["title"]), width, height


def wordmark_stacked(ink, badge_fill, badge_text, shadow, cx, top, name_size=96, badge_size=46):
    """LABOU au-dessus de l'étiquette LETTE, centré sur cx. Retourne svg, gauche, droite, bas."""
    _d, name_w = text_path(FONT_L, "LABOU", name_size, 0, 0, skew_deg=-8)
    name_x = cx - name_w / 2
    baseline = top + name_size * 0.92
    name_d, name_w = text_path(FONT_L, "LABOU", name_size, name_x, baseline, skew_deg=-8)
    _td, text_w = text_path(FONT_B, "LETTE", badge_size, 0, 0, 0)
    pad_x = badge_size * 0.46
    pad_y = badge_size * 0.30
    bw = text_w + pad_x * 2
    bh = badge_size * 1.32
    bx = cx - bw / 2
    by = baseline + name_size * 0.18 + 8
    text_baseline = by + pad_y + badge_size * 0.78
    text_d, _ = text_path(FONT_B, "LETTE", badge_size, bx + pad_x, text_baseline, 0)
    mx = bx + bw / 2
    my = by + bh / 2
    shadow_svg = ""
    if shadow:
        shadow_svg = f'<rect x="{bx+5:.2f}" y="{by+5:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh*0.18:.2f}" fill="{YELLOW}"/>'
    if badge_text == "knockout":
        badge_svg = f'<path fill="{badge_fill}" fill-rule="evenodd" d="{rrect(bx, by, bw, bh, bh*0.18)} {text_d}"/>'
    else:
        badge_svg = (
            f'<rect x="{bx:.2f}" y="{by:.2f}" width="{bw:.2f}" height="{bh:.2f}" rx="{bh*0.18:.2f}" fill="{badge_fill}"/>'
            f'<path d="{text_d}" fill="{badge_text}"/>'
        )
    svg = (
        f'<path d="{name_d}" fill="{ink}"/>'
        f'<g transform="rotate(-3 {mx:.2f} {my:.2f})">{shadow_svg}{badge_svg}</g>'
    )
    left = min(name_x, bx) - 6
    right = max(name_x + name_w, bx + bw) + (12 if shadow else 8)
    bot = by + bh + (10 if shadow else 4)
    return svg, left, right, bot


def build_vertical(mode):
    m = MODES[mode]
    scale = 1.28
    mascot_w = 184 * scale
    mascot_h = 176 * scale
    _svg, left, right, bot = wordmark_stacked(m["ink"], m["badge"], m["letters"], m["shadow"], 0, 0)
    word_w = right - left
    width = max(mascot_w, word_w) + 36
    cx = width / 2
    ty = 6
    top = ty + mascot_h + 4
    wm, left, right, bot = wordmark_stacked(m["ink"], m["badge"], m["letters"], m["shadow"], cx, top)
    # recentre si le mot dépasse
    overflow_l = min(0, left - 12)
    overflow_r = max(0, right - (width - 12))
    if overflow_l or overflow_r:
        width = width - overflow_l + overflow_r
        cx = width / 2
        wm, left, right, bot = wordmark_stacked(m["ink"], m["badge"], m["letters"], m["shadow"], cx, top)
    tx = (width - mascot_w) / 2
    body = wrap_mascot(m["mascot"], "ballv-" + mode, tx, ty, scale) + wm
    height = bot + 14
    return svg_doc((width, height), body, m["title"]), width, height


def build_symbol(mode):
    m = MODES[mode]
    scale = 0.97
    tx, ty = 10, 16
    body = wrap_mascot(m["mascot"], "balls-" + mode, tx, ty, scale)
    side = 200
    return svg_doc((side, side), body, m["title"] + " — symbole"), side, side


def export_svg(svg, path, long_side_targets=(2000, 512)):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(svg, encoding="utf-8")
    # pdf
    pdf = path.with_suffix(".pdf")
    cairosvg.svg2pdf(bytestring=svg.encode(), write_to=str(pdf))
    stem = path.stem
    for px in long_side_targets:
        png = path.with_name(f"{stem}_{px}px.png")
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png), output_width=px if "horizontal" in stem or "vertical" in stem else px)


def render_png(svg, width):
    return cairosvg.svg2png(bytestring=svg.encode(), output_width=width)


def build_favicon_svg():
    # Carré crème, mascotte centrée, comme l'icône d'origine.
    scale = 0.78
    mascot_w = 184 * scale
    mascot_h = 172 * scale
    side = 200
    tx = (side - mascot_w) / 2 - 2
    ty = (side - mascot_h) / 2 + 6
    body = (
        f'<rect width="200" height="200" rx="46" fill="{CREAM}"/>'
        + wrap_mascot("color", "ball-ico", tx, ty, scale)
    )
    return svg_doc((200, 200), body, "Laboulette")


def build_maskable_svg(side=512):
    scale = side / 200 * 0.62
    mascot_w = 184 * scale
    mascot_h = 172 * scale
    tx = (side - mascot_w) / 2 - 2
    ty = (side - mascot_h) / 2 + side * 0.02
    body = f'<rect width="{side}" height="{side}" fill="{CREAM}"/>' + wrap_mascot("color", "ball-mask", tx, ty, scale)
    return svg_doc((side, side), body, "Laboulette")


def save_ico(png_paths_or_images, dest):
    images = []
    for im in png_paths_or_images:
        if not isinstance(im, Image.Image):
            im = Image.open(im)
        images.append(im.convert("RGBA"))
    images[0].save(dest, format="ICO", sizes=[(im.width, im.height) for im in images], append_images=images[1:])


def planche(files):
    """files: list of (png_path, bg) arranged in rows."""
    from PIL import ImageDraw, ImageFont

    pad = 36
    label_h = 36
    rows = []
    # group already prepared as list of rows of PIL images with bg
    # We'll receive composited row images.
    return


def main():
    if OUT.exists():
        shutil.rmtree(OUT)
    OUT.mkdir()
    builders = {"horizontal": build_horizontal, "vertical": build_vertical, "symbole": build_symbol}
    written = []
    for mode, meta in MODES.items():
        folder = OUT / meta["folder"]
        folder.mkdir()
        for layout, fn in builders.items():
            svg, _w, _h = fn(mode)
            name = f"laboulette_{layout}_{meta['slug']}.svg"
            path = folder / name
            path.write_text(svg, encoding="utf-8")
            cairosvg.svg2pdf(bytestring=svg.encode(), write_to=str(path.with_suffix(".pdf")))
            for px in (2000, 512):
                png = path.with_name(f"{path.stem}_{px}px.png")
                cairosvg.svg2png(bytestring=svg.encode(), write_to=str(png), output_width=px)
            written.append(path)
            print("ok", path.relative_to(ROOT))

    ico = OUT / "icone"
    ico.mkdir()
    fav = build_favicon_svg()
    (ico / "favicon.svg").write_text(fav, encoding="utf-8")
    (ico / "icone.pdf").write_bytes(cairosvg.svg2pdf(bytestring=fav.encode()))
    for px, filename in ((16, "favicon-16px.png"), (32, "favicon-32px.png"), (180, "apple-touch-icon.png"), (192, "icone-192px.png"), (512, "icone-512px.png")):
        cairosvg.svg2png(bytestring=fav.encode(), write_to=str(ico / filename), output_width=px, output_height=px)
    # 48 for ico
    p48 = ico / "_48.png"
    cairosvg.svg2png(bytestring=fav.encode(), write_to=str(p48), output_width=48, output_height=48)
    save_ico([ico / "favicon-16px.png", ico / "favicon-32px.png", p48], ico / "favicon.ico")
    p48.unlink()
    shutil.copy(ico / "favicon.ico", ROOT / "favicon.ico")

    mask = build_maskable_svg(512)
    app_icons = ROOT / "app" / "icons"
    app_icons.mkdir(parents=True, exist_ok=True)
    (app_icons / "favicon.svg").write_text(fav, encoding="utf-8")
    for px, filename in ((192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png"), (16, "favicon-16.png")):
        cairosvg.svg2png(bytestring=fav.encode(), write_to=str(app_icons / filename), output_width=px, output_height=px)
    for px, filename in ((192, "icon-maskable-192.png"), (512, "icon-maskable-512.png")):
        svg = build_maskable_svg(px)
        cairosvg.svg2png(bytestring=svg.encode(), write_to=str(app_icons / filename), output_width=px, output_height=px)
    shutil.copy(ico / "favicon.ico", app_icons / "favicon.ico")

    make_planche()
    write_lisezmoi()
    print("done")


def make_planche():
    from PIL import Image, ImageDraw, ImageFont

    def load(folder, layout, slug):
        return Image.open(OUT / folder / f"laboulette_{layout}_{slug}_512px.png").convert("RGBA")

    cells = []
    specs = [
        ("Couleur, fond clair", "couleur", "couleur", (255, 243, 224, 255)),
        ("Couleur, fond foncé", "couleur-fond-fonce", "couleur-fond-fonce", (22, 18, 17, 255)),
        ("Noir", "noir", "noir", (255, 250, 242, 255)),
        ("Blanc", "blanc", "blanc", (22, 18, 17, 255)),
    ]
    layouts = [("horizontal", 640), ("vertical", 280), ("symbole", 220)]
    pad = 28
    label_h = 54
    row_imgs = []
    for title, folder, slug, bg in specs:
        imgs = []
        for layout, box_w in layouts:
            im = load(folder, layout, slug)
            # fit inside a card
            if layout == "horizontal":
                card_w, card_h = 680, 250
            elif layout == "vertical":
                card_w, card_h = 280, 360
            else:
                card_w, card_h = 250, 250
            canvas = Image.new("RGBA", (card_w, card_h), bg)
            scale = min((card_w - 24) / im.width, (card_h - 24) / im.height)
            nw, nh = max(1, int(im.width * scale)), max(1, int(im.height * scale))
            resized = im.resize((nw, nh), Image.Resampling.LANCZOS)
            canvas.alpha_composite(resized, ((card_w - nw) // 2, (card_h - nh) // 2))
            imgs.append(canvas)
        gap = 16
        row_w = sum(i.width for i in imgs) + gap * (len(imgs) - 1)
        row_h = max(i.height for i in imgs)
        row = Image.new("RGBA", (row_w, row_h + label_h), (255, 250, 242, 255))
        draw = ImageDraw.Draw(row)
        draw.text((8, 8), title, fill=(22, 18, 17, 255))
        x = 0
        for im in imgs:
            row.alpha_composite(im, (x, label_h + (row_h - im.height)))
            x += im.width + gap
        row_imgs.append(row)

    width = max(r.width for r in row_imgs) + pad * 2
    height = pad + sum(r.height + 18 for r in row_imgs) + pad
    board = Image.new("RGBA", (width, height), (255, 243, 224, 255))
    y = pad
    for r in row_imgs:
        board.alpha_composite(r, (pad, y))
        y += r.height + 18
    dest = OUT / "planche-logos.png"
    board.convert("RGB").save(dest, "PNG", optimize=True)
    print("planche", dest, board.size)


def write_lisezmoi():
    (OUT / "LISEZMOI.txt").write_text(
        """LABOULETTE — LOGOS

Anciennement « La Gaillette ». Le nom de la marque est désormais Laboulette, en un seul mot.

Concept : la boule ronde (la gaillette, le gros charbon du Borinage, qui est aussi une boulette)
file à toute vitesse au-dessus de deux mini-terrils, avec un clin d'œil, un grand sourire et une étincelle.
Bord braise orange : c'est du charbon qui chauffe.

Le mot se lit LABOULETTE.
  « LABOU » : Lilita One, légèrement penchée.
  « LETTE » : Bungee, dans l'étiquette rouge (ou évidée en monochrome).

Dossiers
  couleur/              logo couleur, pour fond clair
  couleur-fond-fonce/   logo couleur, texte crème, pour fond foncé (en-tête du site)
  noir/                 monochrome noir (détails évidés, vraiment transparents)
  blanc/                monochrome blanc, pour fond foncé ou coloré
  icone/                favicon.svg, favicon.ico (16/32/48), favicon 16 et 32 px, apple-touch-icon 180 px, icônes 192 et 512 px, icone.pdf

Chaque dossier de variante contient horizontal, vertical et symbole, en :
  .svg (vectoriel, texte vectorisé en chemins), _2000px.png et _512px.png (fond transparent), .pdf (vectoriel)

Palette : charbon #161211 · crème #fff3e0 · rouge vif #e8392a · braise #ff8a1f · jaune #ffc83d
Typographies (SIL Open Font License, vectorisées dans les fichiers) :
  Lilita One et Bungee.
Taille minimale conseillée du logo horizontal : 160 px de large. En dessous, utiliser le symbole seul.
""",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
