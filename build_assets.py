#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Lore Master — actifs visuels pour build.py (polices, favicon, logos, PWA).

API (tout est déterministe et hors-ligne ; aucune ressource externe) :

    fonts_css()                      -> str   @font-face (woff2 en base64, sous-ensemble français) pour /*@@FONTS@@*/
    favicon_html()                   -> str   <link>/<meta> (icônes en data-URI, manifest, theme-color) pour <!--@@FAVICON@@-->
    logo_uri()                       -> str   data-URI de l’icône (d20 sur livre) pour <img class="brand-img"> / .brand img
    banner_uri()                     -> str   data-URI du logo « LORE MASTER » (bandeau d’accueil .hero-banner)
    write_pwa_assets(outdir, version)-> list  écrit icon-192.png, icon-512.png, icon-maskable-512.png,
                                              manifest.webmanifest et sw.js dans outdir ; renvoie les noms écrits
    make_derivatives()               -> None  régénère assets/*.png|webp depuis assets/orig/ (appelé au besoin)

En ligne de commande :  python3 build_assets.py            (dérivés + assets/_fonts.css pour les pages de démo)
                        python3 build_assets.py --pwa DIR  (écrit aussi les fichiers PWA dans DIR)

Dépendances : Pillow, fontTools (+ brotli pour woff2) ; polices OFL dans node_modules/@fontsource (npm install).
"""
import base64, io, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(HERE, 'assets')
ORIG = os.path.join(ASSETS, 'orig')
FONT_CACHE = os.path.join(ASSETS, 'fonts')
NAVY = (17, 24, 39)          # fond de l’icône d’origine
THEME_COLOR = '#111827'      # barre d’état du navigateur (marine du logo)
BG_COLOR = '#E8DABA'         # fond d’écran de démarrage de la PWA (parchemin)

def _node_modules():
    for p in (os.environ.get('LM_NODE_MODULES'), os.environ.get('FM_NODE_MODULES'),
              os.path.join(HERE, 'node_modules') + '/', '/tmp/claude-0/fonts/node_modules/'):
        if p and os.path.isdir(os.path.join(p, '@fontsource')):
            return p
    raise SystemExit('node_modules/@fontsource introuvable — lancer « npm install »')

def _b64(data):
    return base64.b64encode(data).decode('ascii')

# ───────────────────────── polices ─────────────────────────
# (famille CSS, paquet fontsource, [(graisse, style)], graisses déclarées dans @font-face)
FONTS = [
    ('Cinzel',           'cinzel',          [(400, 'normal'), (700, 'normal')], None),
    ('Uncial Antiqua',   'uncial-antiqua',  [(400, 'normal')], '400 900'),
    ('MedievalSharp',    'medievalsharp',   [(400, 'normal')], '400 900'),
    ('IM Fell English',  'im-fell-english', [(400, 'normal'), (400, 'italic')], '400 900'),
    ('EB Garamond',      'eb-garamond',     [(500, 'normal'), (700, 'normal'), (400, 'italic')], None),
    ('Almendra',         'almendra',        [(400, 'normal'), (700, 'normal'), (400, 'italic')], None),
    ('Cinzel Decorative','cinzel-decorative',[(400, 'normal'), (700, 'normal')], None),
    ('Cormorant Garamond','cormorant-garamond',[(500, 'normal'), (700, 'normal'), (500, 'italic')], None),
    ('Pirata One',       'pirata-one',      [(400, 'normal')], '400 900'),
    ('Metamorphous',     'metamorphous',    [(400, 'normal')], '400 900'),
]
# caractères conservés : ASCII, Latin-1 (accents français), œ Œ Ÿ, typographie (’ « » … – — €), flèches/puces utiles
UNICODES = ([(0x20, 0x7E), (0xA0, 0xFF), (0x152, 0x153), (0x178, 0x178), (0x2013, 0x2014), (0x2018, 0x201E),
             (0x2022, 0x2022), (0x2026, 0x2026), (0x20AC, 0x20AC), (0x2190, 0x2193), (0x2713, 0x2713)])

def _subset(src, dst):
    from fontTools import subset
    opts = subset.Options()
    opts.flavor = 'woff2'
    opts.layout_features = ['kern', 'liga', 'clig', 'calt', 'ccmp', 'locl', 'mark', 'mkmk', 'lnum', 'tnum', 'pnum', 'onum']
    opts.name_IDs = [1, 2]
    opts.notdef_outline = True
    opts.drop_tables += ['DSIG']
    f = subset.load_font(src, opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=[c for a, b in UNICODES for c in range(a, b + 1)])
    s.subset(f)
    subset.save_font(f, dst, opts)

def _font_bytes(pkg, w, style):
    nm = '%s-latin-%d-%s.woff2' % (pkg, w, style)
    src = os.path.join(_node_modules(), '@fontsource', pkg, 'files', nm)
    dst = os.path.join(FONT_CACHE, nm)
    if not (os.path.exists(dst) and os.path.getmtime(dst) >= os.path.getmtime(src)):
        os.makedirs(FONT_CACHE, exist_ok=True)
        try:
            _subset(src, dst)
        except Exception as e:                      # fontTools/brotli absents : police complète
            sys.stderr.write('  (sous-ensemble impossible pour %s : %s — police complète)\n' % (nm, e))
            return open(src, 'rb').read()
    return open(dst, 'rb').read()

def fonts_css():
    out = []
    for fam, pkg, faces, rng in FONTS:
        for w, style in faces:
            data = _font_bytes(pkg, w, style)
            out.append('@font-face{font-family:"%s";font-style:%s;font-weight:%s;font-display:swap;src:url(data:font/woff2;base64,%s) format("woff2")}'
                       % (fam, style, rng or w, _b64(data)))
    return '\n'.join(out) + '\n'

# ───────────────────────── images ─────────────────────────
def _img(name):
    from PIL import Image
    return Image.open(os.path.join(ORIG, name))

def _square_icon(size, safe=1.0, opaque=True):
    """Icône carrée : l’original (788²) mis à l’échelle ; safe<1 ajoute une marge (maskable)."""
    from PIL import Image
    src = _img('icon_source.png').convert('RGBA')
    bg = Image.new('RGBA', (size, size), NAVY + (255,))
    inner = max(1, int(round(size * safe)))
    ic = src.resize((inner, inner), Image.LANCZOS)
    off = (size - inner) // 2
    bg.alpha_composite(ic, (off, off))
    return bg.convert('RGB') if opaque else bg

def _png_bytes(im):
    b = io.BytesIO()
    im.save(b, 'PNG', optimize=True)
    return b.getvalue()

def _webp_bytes(im, q=84):
    b = io.BytesIO()
    im.save(b, 'WEBP', quality=q, method=6)
    return b.getvalue()

def make_derivatives():
    """assets/ : favicons, icônes PWA, logo d’en-tête et bandeau, à partir de assets/orig/."""
    from PIL import Image
    os.makedirs(ASSETS, exist_ok=True)
    for old in ('logo128.png', 'logo256.png', 'logo_full.jpg', 'logo_full.png', 'icon512_maskable.png', 'icon192.png', 'icon512.png'):
        p = os.path.join(ASSETS, old)
        if os.path.exists(p):
            os.remove(p)
    w = lambda n, data: open(os.path.join(ASSETS, n), 'wb').write(data)
    # icône « nette » : à 32 px le détail du d20 se perd, on recadre sur le cœur du dé
    core = _img('icon_source.png').convert('RGBA').crop((140, 120, 650, 630)).resize((64, 64), Image.LANCZOS)
    for s in (32, 64):
        fav = core.resize((s, s), Image.LANCZOS) if s != 64 else core
        bg = Image.new('RGBA', (s, s), NAVY + (255,))
        bg.alpha_composite(fav)
        w('fav%d.png' % s, _png_bytes(bg.convert('RGB')))
    w('apple180.png', _png_bytes(_square_icon(180, .86)))
    w('icon-192.png', _png_bytes(_square_icon(192)))
    w('icon-512.png', _png_bytes(_square_icon(512)))
    w('icon-maskable-512.png', _png_bytes(_square_icon(512, .70)))   # zone de sécurité Android : 80 % → on garde 70 %
    w('brand128.webp', _webp_bytes(_square_icon(128), 88))           # en-tête (.brand img)
    w('brand128.png', _png_bytes(_square_icon(128)))                 # repli sans WebP
    ban = _img('logo_wordmark.jpg').convert('RGB')
    w('banner1000.webp', _webp_bytes(ban.resize((1000, round(1000 * ban.height / ban.width)), Image.LANCZOS), 82))
    w('banner600.webp', _webp_bytes(ban.resize((600, round(600 * ban.height / ban.width)), Image.LANCZOS), 82))

def _asset(name):
    p = os.path.join(ASSETS, name)
    if not os.path.exists(p):
        make_derivatives()
    return open(p, 'rb').read()

def logo_uri():
    """Icône de l’en-tête (128 px, WebP). Navigateurs sans WebP : quasi inexistants en 2026."""
    return 'data:image/webp;base64,' + _b64(_asset('brand128.webp'))

def banner_uri():
    """Bandeau « LORE MASTER » (1000 px de large, WebP) — à poser dans <div class="hero-banner">."""
    return 'data:image/webp;base64,' + _b64(_asset('banner1000.webp'))

def favicon_html(manifest='manifest.webmanifest'):
    parts = ['<link rel="icon" type="image/png" sizes="64x64" href="data:image/png;base64,%s">' % _b64(_asset('fav64.png')),
             '<link rel="icon" type="image/png" sizes="32x32" href="data:image/png;base64,%s">' % _b64(_asset('fav32.png')),
             '<link rel="apple-touch-icon" href="data:image/png;base64,%s">' % _b64(_asset('apple180.png')),
             '<meta name="theme-color" content="%s">' % THEME_COLOR,
             '<meta name="apple-mobile-web-app-capable" content="yes">',
             '<meta name="mobile-web-app-capable" content="yes">',
             '<meta name="apple-mobile-web-app-title" content="Lore Master">']
    if manifest:
        parts.append('<link rel="manifest" href="%s">' % manifest)
    return '\n'.join(parts)

# ───────────────────────── PWA ─────────────────────────
SW_JS = r'''/* Lore Master — service worker (v%(v)s). Aucune donnée personnelle n’est mise en cache : seulement l’interface. */
var V = "lm-v%(v)s";
var CORE = ["./", "icon-192.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", function (e) {
  self.skipWaiting();
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).catch(function () {}));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k.indexOf("lm-v") === 0 && k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (u.origin !== self.location.origin) return;            /* Supabase, etc. : jamais touchés */
  var icon = /\.(png|webp|svg|ico|webmanifest)$/i.test(u.pathname);
  if (icon) {                                                /* icônes : cache d’abord */
    e.respondWith(caches.match(r).then(function (hit) {
      return hit || fetch(r).then(function (res) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); return res; });
    }));
    return;
  }
  e.respondWith(fetch(r).then(function (res) {               /* pages et données : réseau d’abord, cache en secours */
    if (res && res.ok) { var cp = res.clone(); caches.open(V).then(function (c) { c.put(r, cp); }); }
    return res;
  }).catch(function () {
    return caches.match(r).then(function (hit) { return hit || (r.mode === "navigate" ? caches.match("./") : Response.error()); });
  }));
});
'''

def write_pwa_assets(outdir, version):
    """Écrit les icônes, le manifest et sw.js dans outdir ; renvoie la liste des fichiers écrits."""
    os.makedirs(outdir, exist_ok=True)
    version = re.sub(r'[^\w.-]', '', str(version)) or '0'
    files = {}
    for src, dst in (('icon-192.png', 'icon-192.png'), ('icon-512.png', 'icon-512.png'), ('icon-maskable-512.png', 'icon-maskable-512.png')):
        files[dst] = _asset(src)
    manifest = {
        'name': 'Lore Master', 'short_name': 'Lore Master',
        'description': 'Quiz de culture fantasy, jeux de rôle et Moyen Âge — en classe ou entre amis.',
        'lang': 'fr', 'dir': 'ltr', 'start_url': './', 'scope': './', 'id': './',
        'display': 'standalone', 'orientation': 'any',
        'theme_color': THEME_COLOR, 'background_color': BG_COLOR,
        'categories': ['games', 'education'],
        'icons': [
            {'src': 'icon-192.png', 'sizes': '192x192', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icon-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'any'},
            {'src': 'icon-maskable-512.png', 'sizes': '512x512', 'type': 'image/png', 'purpose': 'maskable'},
        ],
    }
    files['manifest.webmanifest'] = json.dumps(manifest, ensure_ascii=False, indent=2).encode('utf-8')
    files['sw.js'] = (SW_JS % {'v': version}).encode('utf-8')
    for n, data in files.items():
        with open(os.path.join(outdir, n), 'wb') as f:
            f.write(data)
    return sorted(files)

def main(argv):
    make_derivatives()
    css = fonts_css()
    open(os.path.join(ASSETS, '_fonts.css'), 'w', encoding='utf-8').write(css)   # utilisé par assets/demo.html (non versionné)
    print('dérivés écrits dans assets/ ; polices : %d Ko (base64)' % (len(css) // 1024))
    if '--pwa' in argv:
        d = argv[argv.index('--pwa') + 1]
        print('PWA :', ', '.join(write_pwa_assets(d, 'dev')), '→', d)

if __name__ == '__main__':
    main(sys.argv[1:])
