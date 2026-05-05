"""
Reordena las secciones del index-backup y aplica una capa visual moderna.
Genera: index.html (la página principal de MTG redisenada)
Conserva: index-backup-before-interfast-redesign-2026-04-29.html (intacto)
"""
import re
from pathlib import Path

ROOT = Path(__file__).parent
SRC = ROOT / "index-backup-before-interfast-redesign-2026-04-29.html"
OUT = ROOT / "index.html"

html = SRC.read_text(encoding="utf-8")

# ─────────────────────────────────────────────────────────────
# 1) PARTIR el documento en cabecera + secciones + cola
# ─────────────────────────────────────────────────────────────
# La 1ra sección (hero) empieza en la línea que contiene <section id="hero"
# La última sección termina justo antes del comentario "FOOTER"
hero_start = html.index('<section id="hero"')
footer_marker = '<!-- ═══════════════════════════════════════════════════════════\n     FOOTER'
footer_start = html.index(footer_marker)

head = html[:hero_start]
sections_blob = html[hero_start:footer_start]
tail = html[footer_start:]

# ─────────────────────────────────────────────────────────────
# 2) DIVIDIR sections_blob en bloques por <section id="X" ...>
#    Cada bloque incluye: comentario opcional encima + <section>...</section> + blank line
# ─────────────────────────────────────────────────────────────
# Patrón: opcional bloque de comentario decorativo, luego <section id="...">
SECTION_RE = re.compile(
    r'(?:<!-- ═{20,}.*?═{20,} -->\s*\n)?'   # comentario decorativo opcional
    r'<section id="([a-z\-]+)"[^>]*>'        # apertura
    r'.*?'                                    # contenido
    r'</section>\s*\n',                       # cierre + newline
    re.DOTALL
)

blocks = {}
order_original = []
for m in SECTION_RE.finditer(sections_blob):
    sid = m.group(1)
    blocks[sid] = m.group(0)
    order_original.append(sid)

print("Original order:", order_original)

# ─────────────────────────────────────────────────────────────
# 3) NUEVO ORDEN LÓGICO (narrativa: hook → quiénes somos → qué hacemos → cómo → prueba → llamado)
# ─────────────────────────────────────────────────────────────
new_order = [
    "hero",          # 1. Hook visual
    "about",         # 2. ⭐ QUIÉNES SOMOS — movido al inicio
    "stats-strip",   # 3. Trayectoria/números
    "trustbar",      # 4. Partners
    "solutions",     # 5. Soluciones (qué hacemos)
    "markets",       # 6. Mercados (a quién servimos)
    "how",           # 7. Cómo funciona (proceso)
    "dash-sec",      # 8. Demo del dashboard
    "visualization", # 9. Visualización
    "comparativa",   # 10. Con/sin medidor
    "benefits",      # 11. Beneficios
    "simulator",     # 12. Calculadora ROI
    "video-sec",     # 13. Videos
    "productos",     # 14. Catálogo
    "servicios",     # 15. Servicios
    "emporia-eco",   # 16. Ecosistema Emporia
    "coverage",      # 17. Cobertura geográfica
    "gallery-sec",   # 18. Galería
    "testimonials",  # 19. Testimonios
    "faq",           # 20. FAQ
    "cta-sec",       # 21. CTA final
]

# Verificar que no perdemos secciones
missing = set(blocks.keys()) - set(new_order)
extra = set(new_order) - set(blocks.keys())
assert not missing, f"Secciones que existen pero no incluí en new_order: {missing}"
assert not extra, f"Secciones en new_order que no existen en el HTML: {extra}"

new_sections_blob = "\n".join(blocks[sid] for sid in new_order)

# ─────────────────────────────────────────────────────────────
# 4) CAPA DE ESTILO MODERNO — se inyecta al final del <style> existente
# ─────────────────────────────────────────────────────────────
MODERN_CSS = r"""
/* ═══════════════════════════════════════════════════════════════════
   ✨ MTG REDISEÑO 2026 — capa visual moderna
   ═══════════════════════════════════════════════════════════════════ */

/* ── Variables refinadas ── */
:root{
  --mtg-blue:#1e3a8a;
  --mtg-blue-2:#2563eb;
  --mtg-blue-deep:#0b1e4d;
  --mtg-orange:#f59e0b;
  --mtg-orange-2:#fb923c;
  --mtg-glow:rgba(245,158,11,.35);
  --grad-hero:linear-gradient(135deg,#0b1e4d 0%,#1e3a8a 45%,#2563eb 100%);
  --grad-warm:linear-gradient(135deg,#f59e0b 0%,#fb923c 100%);
  --grad-cool:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);
  --shadow-soft:0 20px 60px -20px rgba(11,30,77,.35);
  --shadow-glow:0 10px 40px -10px rgba(245,158,11,.45);
}

/* ── Hero más cinematográfico ── */
#hero .slide-overlay{
  background:linear-gradient(120deg,rgba(11,30,77,.92) 0%,rgba(30,58,138,.78) 45%,rgba(37,99,235,.55) 100%) !important;
}
#hero .slide-h1{
  font-weight:800 !important;
  letter-spacing:-.03em;
  text-shadow:0 4px 30px rgba(0,0,0,.4);
}
#hero .slide-h1 em{
  background:var(--grad-warm);
  -webkit-background-clip:text;
  background-clip:text;
  -webkit-text-fill-color:transparent;
  font-style:normal;
  filter:drop-shadow(0 2px 12px var(--mtg-glow));
}
#hero .slide-eyebrow{
  background:rgba(245,158,11,.15);
  border:1px solid rgba(245,158,11,.4);
  backdrop-filter:blur(10px);
  padding:8px 16px;
  border-radius:999px;
  display:inline-flex;
  align-items:center;
  gap:8px;
}
#hero .slide-eyebrow-dot{
  width:8px;height:8px;border-radius:50%;
  background:#22c55e;
  box-shadow:0 0 0 0 rgba(34,197,94,.6);
  animation:mtg-pulse 2s infinite;
}
@keyframes mtg-pulse{
  0%{box-shadow:0 0 0 0 rgba(34,197,94,.6)}
  70%{box-shadow:0 0 0 12px rgba(34,197,94,0)}
  100%{box-shadow:0 0 0 0 rgba(34,197,94,0)}
}

/* ── Hero stats: glass effect ── */
.hero-stats{
  background:rgba(11,30,77,.65) !important;
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  border-top:1px solid rgba(255,255,255,.08);
}
.hs-num span{
  background:var(--grad-warm);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  font-weight:800;
  letter-spacing:-.02em;
}

/* ── Botones premium ── */
.btn-primary{
  background:var(--grad-warm) !important;
  border:0 !important;
  box-shadow:var(--shadow-glow);
  position:relative;
  overflow:hidden;
  transition:transform .25s cubic-bezier(.4,0,.2,1),box-shadow .25s;
}
.btn-primary::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.35) 50%,transparent 70%);
  transform:translateX(-100%);
  transition:transform .6s ease;
}
.btn-primary:hover{transform:translateY(-2px);box-shadow:0 14px 50px -8px var(--mtg-glow)}
.btn-primary:hover::before{transform:translateX(100%)}

.btn-outline{
  border:2px solid rgba(255,255,255,.6) !important;
  backdrop-filter:blur(8px);
  transition:.25s cubic-bezier(.4,0,.2,1);
}
.btn-outline:hover{
  background:#fff !important;color:var(--mtg-blue-deep) !important;
  transform:translateY(-2px);
  box-shadow:0 12px 30px rgba(0,0,0,.2);
}

/* ── About section: protagonismo ── */
#about{
  background:linear-gradient(180deg,#0b1e4d 0%,#0f2360 100%);
  position:relative;
  overflow:hidden;
}
#about::before{
  content:'';position:absolute;
  top:-200px;right:-200px;
  width:500px;height:500px;
  background:radial-gradient(circle,rgba(245,158,11,.18) 0%,transparent 70%);
  pointer-events:none;
}
#about::after{
  content:'';position:absolute;
  bottom:-200px;left:-200px;
  width:600px;height:600px;
  background:radial-gradient(circle,rgba(37,99,235,.25) 0%,transparent 70%);
  pointer-events:none;
}
#about .container{position:relative;z-index:1}
#about .s-title span{
  background:var(--grad-warm);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
}
#about .a-card{
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.1);
  backdrop-filter:blur(12px);
  border-radius:14px;
  padding:20px;
  transition:all .3s cubic-bezier(.4,0,.2,1);
}
#about .a-card:hover{
  background:rgba(245,158,11,.08);
  border-color:rgba(245,158,11,.4);
  transform:translateY(-4px);
  box-shadow:0 12px 40px rgba(245,158,11,.15);
}
#about .a-ico{
  background:var(--grad-warm);
  color:#fff;
  border-radius:10px;
  padding:10px;
  width:44px;height:44px;
  display:flex;align-items:center;justify-content:center;
  box-shadow:0 6px 20px var(--mtg-glow);
}
#about .astat{
  background:rgba(255,255,255,.04);
  border:1px solid rgba(255,255,255,.08);
  border-radius:12px;
  padding:18px 14px;
  transition:.25s ease;
}
#about .astat:hover{border-color:rgba(245,158,11,.4);transform:translateY(-3px)}
#about .astat-v{
  background:var(--grad-warm);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  font-weight:800;
  letter-spacing:-.02em;
}
#about .about-img-wrap{
  position:relative;
  border-radius:20px;
  overflow:hidden;
  box-shadow:0 30px 80px rgba(0,0,0,.4);
}
#about .about-img-wrap::after{
  content:'';position:absolute;inset:0;
  background:linear-gradient(180deg,transparent 50%,rgba(11,30,77,.6) 100%);
  pointer-events:none;
}
#about .about-img-badge{
  background:rgba(255,255,255,.95) !important;
  backdrop-filter:blur(20px);
  border:1px solid rgba(255,255,255,.4);
  box-shadow:0 12px 40px rgba(0,0,0,.3) !important;
}
#about .about-img-badge .aib-icon{
  background:var(--grad-warm) !important;
  box-shadow:0 6px 20px var(--mtg-glow);
}

/* ── Tag uniforme con marca ── */
.tag{
  background:rgba(245,158,11,.1) !important;
  border:1px solid rgba(245,158,11,.3) !important;
  color:var(--mtg-orange) !important;
  font-weight:700;
}
.tag-dot{
  background:var(--mtg-orange) !important;
  box-shadow:0 0 12px var(--mtg-glow);
  animation:mtg-pulse-orange 2s infinite;
}
@keyframes mtg-pulse-orange{
  0%,100%{opacity:1;transform:scale(1)}
  50%{opacity:.7;transform:scale(1.2)}
}

/* ── S-title títulos con gradient highlight ── */
.s-title span{
  background:linear-gradient(120deg,var(--mtg-blue-2) 0%,var(--mtg-orange) 100%);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
}

/* ── Cards de productos: hover con tilt sutil ── */
#productos .prod-card,
#solutions .sol-card,
#servicios .serv-card,
#markets .mkt-card,
#benefits .ben-item,
.a-card{
  transition:all .35s cubic-bezier(.4,0,.2,1) !important;
}
#productos .prod-card:hover,
#solutions .sol-card:hover,
#servicios .serv-card:hover,
#markets .mkt-card:hover{
  transform:translateY(-6px) scale(1.01);
  box-shadow:0 25px 60px -15px rgba(11,30,77,.25) !important;
}

/* ── Section dividers más limpios ── */
.sec{position:relative}
.sec + .sec{border-top:1px solid rgba(11,30,77,.06)}

/* ── Stats-strip más impactante ── */
#stats-strip{
  background:linear-gradient(135deg,#fff 0%,#f8fafc 100%);
  border-bottom:1px solid #e2e8f0;
}
#stats-strip .ss-val{
  background:var(--grad-cool);
  -webkit-background-clip:text;background-clip:text;
  -webkit-text-fill-color:transparent;
  font-weight:800;
  letter-spacing:-.02em;
}
#stats-strip .ss-icon{
  background:linear-gradient(135deg,rgba(37,99,235,.1),rgba(245,158,11,.1));
  border-radius:50%;
  width:60px;height:60px;
  display:flex;align-items:center;justify-content:center;
  margin:0 auto 12px;
  color:var(--mtg-blue-2);
}

/* ── Comparativa table más visual ── */
#comparativa .comp-bad{background:linear-gradient(180deg,#fef2f2,#fff5f5) !important}
#comparativa .comp-good{background:linear-gradient(180deg,#eff6ff,#f0f9ff) !important}

/* ── Dashboard demo: esquinas redondeadas ── */
#dash-sec .dash-shell,
.dash-shell{
  border-radius:18px !important;
  overflow:hidden;
  box-shadow:0 30px 80px -20px rgba(11,30,77,.4);
}

/* ── FAQ: animación fluida ── */
.faq-item{
  border-radius:12px !important;
  overflow:hidden;
  transition:all .25s ease;
  border:1px solid rgba(11,30,77,.08) !important;
}
.faq-item:hover{border-color:rgba(245,158,11,.3) !important}

/* ── CTA final: gradient bold ── */
#cta-sec{
  background:var(--grad-hero) !important;
  position:relative;
  overflow:hidden;
}
#cta-sec::before{
  content:'';position:absolute;
  top:-100px;right:-100px;
  width:400px;height:400px;
  background:radial-gradient(circle,rgba(245,158,11,.25) 0%,transparent 70%);
}

/* ── Nav sticky con blur ── */
#nav.scrolled,
#nav{
  backdrop-filter:blur(16px);
  -webkit-backdrop-filter:blur(16px);
  transition:background .3s ease;
}

/* ── Scroll reveal mejorado ── */
.rv{
  opacity:0;
  transform:translateY(20px);
  transition:opacity .7s cubic-bezier(.4,0,.2,1),transform .7s cubic-bezier(.4,0,.2,1);
}
.rv.in,.rv.show{opacity:1;transform:translateY(0)}

/* ── Loading screen smoother ── */
#loader{
  background:var(--grad-hero) !important;
}

/* ── Footer gradient sutil ── */
footer{
  background:linear-gradient(180deg,#0b1e4d 0%,#050d2a 100%) !important;
}

/* ── Responsive: about en mobile ── */
@media(max-width:780px){
  #about{padding:60px 0 !important}
  #about::before,#about::after{display:none}
  #about .a-card{padding:16px}
  #about .about-stats{grid-template-columns:1fr 1fr 1fr;gap:8px}
  #about .astat-v{font-size:1.6rem}
}

/* ── Smooth scroll global ── */
html{scroll-behavior:smooth}

/* ── Respeto a usuarios con motion reduced ── */
@media(prefers-reduced-motion:reduce){
  *,*::before,*::after{
    animation-duration:.01ms !important;
    transition-duration:.01ms !important;
  }
}
"""

# Inyectar la capa moderna ANTES del </style> de cierre
head_new = head.replace('</style>', MODERN_CSS + '\n</style>', 1)

# ─────────────────────────────────────────────────────────────
# 5) Reescribir el documento final
# ─────────────────────────────────────────────────────────────
final = head_new + new_sections_blob + tail
OUT.write_text(final, encoding="utf-8")

print(f"✓ Generado: {OUT.name}")
print(f"  Líneas: {len(final.splitlines())}")
print(f"  Nuevo orden: {new_order}")
