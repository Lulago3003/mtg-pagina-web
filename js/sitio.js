// Sitio de MTG: menús, modo oscuro, cotización y comparación de equipos,
// filtros del catálogo y de los relojes, y el formulario que arma el WhatsApp.
// Todo funciona sin servidor; sin JavaScript las páginas se leen completas.
(function () {
  var M = window.MTG || { wa: "", t: {}, lineas: {} };
  var T = M.t;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  function fmt(s, v) { return String(s).replace(/\{(\w+)\}/g, function (_, k) { return v[k] != null ? v[k] : ""; }); }
  function waUrl(texto) { return "https://wa.me/" + M.wa + (texto ? "?text=" + encodeURIComponent(texto) : ""); }
  function guardar(clave, valor) { try { localStorage.setItem(clave, JSON.stringify(valor)); } catch (e) {} }
  function cargar(clave, porDefecto) {
    try { var v = JSON.parse(localStorage.getItem(clave)); return v == null ? porDefecto : v; } catch (e) { return porDefecto; }
  }

  /* ---------- menú: paneles, menú del teléfono, WhatsApp flotante ---------- */
  var paneles = $$("[data-panel]");
  function cerrarPaneles(excepto) {
    paneles.forEach(function (b) {
      if (b === excepto) return;
      b.setAttribute("aria-expanded", "false");
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if (p) p.removeAttribute("data-abierto");
    });
  }
  paneles.forEach(function (b) {
    b.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var abrir = b.getAttribute("aria-expanded") !== "true";
      cerrarPaneles(b);
      b.setAttribute("aria-expanded", abrir ? "true" : "false");
      var p = document.getElementById(b.getAttribute("aria-controls"));
      if (p) { if (abrir) p.setAttribute("data-abierto", ""); else p.removeAttribute("data-abierto"); }
    });
  });
  var menu = $("#menu-principal");
  var botonMenu = $("[data-menu-movil]");
  if (botonMenu && menu) {
    botonMenu.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var abrir = botonMenu.getAttribute("aria-expanded") !== "true";
      botonMenu.setAttribute("aria-expanded", abrir ? "true" : "false");
      if (abrir) menu.setAttribute("data-abierto", ""); else menu.removeAttribute("data-abierto");
    });
    $$("a", menu).forEach(function (a) {
      a.addEventListener("click", function () {
        botonMenu.setAttribute("aria-expanded", "false"); menu.removeAttribute("data-abierto"); cerrarPaneles();
      });
    });
  }
  var waBoton = $("[data-wa-boton]"), waMenu = $("[data-wa-menu]");
  if (waBoton && waMenu) {
    waBoton.addEventListener("click", function (ev) {
      ev.stopPropagation();
      var abrir = waBoton.getAttribute("aria-expanded") !== "true";
      waBoton.setAttribute("aria-expanded", abrir ? "true" : "false");
      if (abrir) waMenu.setAttribute("data-abierto", ""); else waMenu.removeAttribute("data-abierto");
    });
  }
  document.addEventListener("click", function (ev) {
    if (!ev.target.closest(".panel-menu")) cerrarPaneles();
    if (waMenu && !ev.target.closest(".wa-flotante")) { waMenu.removeAttribute("data-abierto"); waBoton.setAttribute("aria-expanded", "false"); }
  });

  /* ---------- fotos de fabricantes: respaldo si no cargan ---------- */
  function respaldo(img) {
    var d = document.createElement("span");
    d.textContent = img.getAttribute("data-respaldo");
    d.style.cssText = "font-weight:700;color:#4a5a72;text-align:center;padding:12px;font-size:.95rem";
    img.replaceWith(d);
  }
  $$("img[data-respaldo]").forEach(function (img) {
    if (img.complete && img.naturalWidth === 0) respaldo(img);
    else img.addEventListener("error", function () { respaldo(img); });
  });

  /* ---------- cajones (cotización y comparación) ---------- */
  var ultimoFoco = null;
  function abrirCajon(nombre) {
    var c = $('[data-cajon="' + nombre + '"]');
    if (!c) return;
    ultimoFoco = document.activeElement;
    c.setAttribute("data-abierto", "");
    var cerrar = $("[data-cerrar]", c); if (cerrar) cerrar.focus();
  }
  function cerrarCajones() {
    $$("[data-cajon]").forEach(function (c) { c.removeAttribute("data-abierto"); });
    if (ultimoFoco) ultimoFoco.focus();
  }
  $$("[data-cajon]").forEach(function (c) {
    c.addEventListener("click", function (ev) { if (ev.target === c || ev.target.closest("[data-cerrar]")) cerrarCajones(); });
  });
  document.addEventListener("keydown", function (ev) {
    if (ev.key !== "Escape") return;
    cerrarCajones(); cerrarPaneles();
    if (waMenu) waMenu.removeAttribute("data-abierto");
  });

  /* ---------- cotización y comparación de equipos ---------- */
  var cotizacion = cargar("mtg-cotizacion", []);
  var comparar = [];
  var barra = $("[data-barra-cotizar]");

  function datosDe(tarjeta) { try { return JSON.parse(tarjeta.getAttribute("data-datos")); } catch (e) { return null; } }
  function enCotizacion(id) { return cotizacion.some(function (p) { return p.id === id; }); }
  function miniFoto(p) {
    if (p.img) { var i = document.createElement("img"); i.src = /^https?:/.test(p.img) ? p.img : (M.raiz || "") + p.img; i.alt = ""; return i; }
    var s = document.createElement("span"); s.textContent = p.marca; s.style.cssText = "font-size:.7rem;font-weight:700"; return s;
  }

  function pintarCotizacion() {
    $$("[data-producto]").forEach(function (t) {
      var b = $("[data-cotizar]", t);
      if (!b) return;
      var dentro = enCotizacion(t.getAttribute("data-producto"));
      b.setAttribute("aria-pressed", dentro ? "true" : "false");
      b.textContent = dentro ? T.agregado : T.agregar;
      var c = $("[data-comparar]", t);
      if (c) c.checked = comparar.indexOf(t.getAttribute("data-producto")) >= 0;
    });
    if (barra) {
      var n = cotizacion.length;
      barra.hidden = n === 0 && comparar.length < 2;
      $("[data-barra-texto]", barra).textContent = n === 0 ? "" : (n === 1 ? T.barra1 : fmt(T.barraN, { n: n }));
      $("[data-abrir-cotizar]", barra).hidden = n === 0;
      var bc = $("[data-abrir-comparar]", barra);
      bc.hidden = comparar.length < 2;
      bc.textContent = fmt(T.comparar, { n: comparar.length });
    }
    var lista = $("[data-lista-cotizar]");
    if (lista) {
      lista.innerHTML = "";
      if (!cotizacion.length) {
        var v = document.createElement("li"); v.textContent = T.vacia; v.style.cssText = "display:block;border:0;color:var(--tinta-2)"; lista.appendChild(v);
      }
      cotizacion.forEach(function (p) {
        var li = document.createElement("li");
        var mini = document.createElement("span"); mini.className = "mini"; mini.appendChild(miniFoto(p));
        var txt = document.createElement("span");
        var s = document.createElement("strong"); s.textContent = p.nombre;
        var d = document.createElement("span"); d.textContent = p.marca + ", " + p.linea;
        txt.appendChild(s); txt.appendChild(d);
        var q = document.createElement("button"); q.type = "button"; q.className = "quitar"; q.textContent = T.quitar;
        q.addEventListener("click", function () { cotizacion = cotizacion.filter(function (x) { return x.id !== p.id; }); guardar("mtg-cotizacion", cotizacion); pintarCotizacion(); });
        li.appendChild(mini); li.appendChild(txt); li.appendChild(q); lista.appendChild(li);
      });
      var enviar = $("[data-enviar-cotizar]");
      if (enviar) {
        var texto = T.cotizarWa + "\n" + cotizacion.map(function (p) { return "- " + p.marca + " " + p.nombre; }).join("\n") + "\n" + T.cotizarCierre;
        enviar.href = waUrl(cotizacion.length ? texto : "");
      }
    }
  }

  $$("[data-producto]").forEach(function (t) {
    var b = $("[data-cotizar]", t);
    if (b) b.addEventListener("click", function () {
      var p = datosDe(t); if (!p) return;
      if (enCotizacion(p.id)) cotizacion = cotizacion.filter(function (x) { return x.id !== p.id; });
      else cotizacion.push(p);
      guardar("mtg-cotizacion", cotizacion); pintarCotizacion();
    });
    var c = $("[data-comparar]", t);
    if (c) c.addEventListener("change", function () {
      var id = t.getAttribute("data-producto");
      if (c.checked) {
        if (comparar.length >= 3) { c.checked = false; alert(T.compararMax); return; }
        comparar.push(id);
      } else comparar = comparar.filter(function (x) { return x !== id; });
      pintarCotizacion();
    });
  });
  var vaciar = $("[data-vaciar]");
  if (vaciar) vaciar.addEventListener("click", function () { cotizacion = []; guardar("mtg-cotizacion", cotizacion); pintarCotizacion(); });
  var abrirCot = $("[data-abrir-cotizar]");
  if (abrirCot) abrirCot.addEventListener("click", function () { abrirCajon("cotizar"); });
  var abrirComp = $("[data-abrir-comparar]");
  if (abrirComp) abrirComp.addEventListener("click", function () {
    var cont = $("[data-tabla-comparar]");
    var ps = comparar.map(function (id) { var t = $('[data-producto="' + id + '"]'); return t ? datosDe(t) : null; }).filter(Boolean);
    var tabla = document.createElement("table"); tabla.className = "tabla-comparar";
    var thead = document.createElement("thead"), tr = document.createElement("tr");
    tr.appendChild(document.createElement("th"));
    ps.forEach(function (p) {
      var th = document.createElement("th"); th.scope = "col";
      var f = document.createElement("div"); f.className = "mini-foto"; f.appendChild(miniFoto(p));
      th.appendChild(f); th.appendChild(document.createTextNode(p.nombre)); tr.appendChild(th);
    });
    thead.appendChild(tr); tabla.appendChild(thead);
    var tbody = document.createElement("tbody");
    [[T.marca, function (p) { return p.marca; }], [T.linea, function (p) { return p.linea; }], [T.desc, function (p) { return p.desc; }],
     [T.specs, function (p) { return p.specs.join(". "); }], [T.disp, function (p) { return p.disp === "stock" ? T.stock : T.pedido; }]
    ].forEach(function (fila) {
      var r = document.createElement("tr"), th = document.createElement("th"); th.scope = "row"; th.textContent = fila[0]; r.appendChild(th);
      ps.forEach(function (p) { var td = document.createElement("td"); td.textContent = fila[1](p); r.appendChild(td); });
      tbody.appendChild(r);
    });
    tabla.appendChild(tbody); cont.innerHTML = ""; cont.appendChild(tabla);
    abrirCajon("comparar");
  });
  pintarCotizacion();

  /* ---------- filtros del catálogo de equipos ---------- */
  var rejilla = $("[data-rejilla-catalogo]");
  if (rejilla) {
    var estado = { linea: "todas", marca: "todas", q: "" };
    var tarjetas = $$("[data-producto]", rejilla);
    var conteo = $("[data-conteo-catalogo]"), vacio = $("[data-vacio]"), buscar = $("[data-buscar-input]");
    function filtrar() {
      var n = 0, q = estado.q.toLowerCase().trim();
      tarjetas.forEach(function (t) {
        var ok = (estado.linea === "todas" || t.getAttribute("data-linea") === estado.linea) &&
                 (estado.marca === "todas" || t.getAttribute("data-marca") === estado.marca) &&
                 (!q || t.getAttribute("data-buscar").indexOf(q) >= 0);
        t.hidden = !ok; if (ok) n++;
      });
      if (conteo) conteo.textContent = n === 1 ? T.productos1 : fmt(T.productosN, { n: n });
      if (vacio) {
        vacio.hidden = n > 0;
        var a = $("a", vacio); if (a) a.href = waUrl(fmt(T.buscarWa, { q: estado.q.trim() || "…" }));
        var qq = $("[data-vacio-q]", vacio); if (qq) qq.textContent = estado.q.trim();
      }
      $$("[data-filtro-linea]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filtro-linea") === estado.linea ? "true" : "false"); });
      $$("[data-filtro-marca]").forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filtro-marca") === estado.marca ? "true" : "false"); });
    }
    $$("[data-filtro-linea]").forEach(function (b) { b.addEventListener("click", function () { estado.linea = b.getAttribute("data-filtro-linea"); filtrar(); }); });
    $$("[data-filtro-marca]").forEach(function (b) { b.addEventListener("click", function () { estado.marca = b.getAttribute("data-filtro-marca"); filtrar(); }); });
    if (buscar) buscar.addEventListener("input", function () { estado.q = buscar.value; filtrar(); });
    var params = new URLSearchParams(location.search);
    if (params.get("marca")) estado.marca = params.get("marca");
    if (params.get("q") && buscar) { buscar.value = params.get("q"); estado.q = params.get("q"); }
    var h = location.hash.replace("#", "");
    if (M.lineas[h]) estado.linea = h;
    filtrar();
  }

  /* ---------- catálogo de relojes ---------- */
  var catalogoRelojes = $("[data-catalogo]");
  if (catalogoRelojes) {
    var filtrosR = $$("[data-filtro]"), relojes = $$(".reloj", catalogoRelojes), conteoR = $("[data-conteo]");
    function filtrarR(id, dir) {
      var v = 0;
      filtrosR.forEach(function (b) { b.setAttribute("aria-pressed", b.getAttribute("data-filtro") === id ? "true" : "false"); });
      relojes.forEach(function (r) { var ok = id === "todos" || r.getAttribute("data-categoria") === id; r.hidden = !ok; if (ok) v++; });
      if (conteoR) conteoR.textContent = v === 1 ? T.modelos1 : fmt(T.modelosN, { n: v });
      if (dir && history.replaceState) history.replaceState(null, "", id === "todos" ? location.pathname : "#" + id);
    }
    filtrosR.forEach(function (b) { b.addEventListener("click", function () { filtrarR(b.getAttribute("data-filtro"), true); }); });
    function desdeHash() {
      var id = location.hash.replace("#", "");
      var ok = filtrosR.some(function (b) { return b.getAttribute("data-filtro") === id; });
      filtrarR(ok ? id : "todos", false);
    }
    desdeHash(); window.addEventListener("hashchange", desdeHash);

    relojes.forEach(function (r) {
      var muestras = $$(".muestra", r), foto = $(".reloj-foto img", r), exist = $(".existencias", r);
      var nombreColor = $(".colores-nombre", r), boton = $(".boton-wa", r);
      var modelo = r.getAttribute("data-modelo");
      muestras.forEach(function (m) {
        m.addEventListener("click", function () {
          muestras.forEach(function (o) { o.setAttribute("aria-pressed", o === m ? "true" : "false"); });
          var nombre = m.getAttribute("data-nombre");
          foto.src = m.getAttribute("data-foto");
          foto.classList.toggle("baja", m.getAttribute("data-baja") === "1");
          foto.alt = modelo + ", " + nombre.toLowerCase();
          exist.textContent = m.getAttribute("data-existencias") + " " + T.existencia;
          nombreColor.textContent = nombre;
          boton.href = waUrl(fmt(T.relojWa, { modelo: modelo, color: " " + T.enColor + " " + nombre.toLowerCase() }));
        });
      });
    });
  }

  /* ---------- preguntas por tema ---------- */
  $$("[data-faq-filtro]").forEach(function (b) {
    b.addEventListener("click", function () {
      var tema = b.getAttribute("data-faq-filtro");
      $$("[data-faq-filtro]").forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
      $$("[data-faq-tema]").forEach(function (d) { d.hidden = tema !== "todas" && d.getAttribute("data-faq-tema") !== tema; });
    });
  });

  /* ---------- formulario de contacto: arma el mensaje de WhatsApp ---------- */
  var form = $("[data-formulario]");
  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var v = function (n) { var c = form.elements[n]; return c ? c.value.trim() : ""; };
      var error = $("[data-formulario-error]", form);
      if (!v("nombre") || !v("telefono")) { error.textContent = T.formFalta; error.hidden = false; form.elements[!v("nombre") ? "nombre" : "telefono"].focus(); return; }
      error.hidden = true;
      var tipo = form.elements.tipo ? form.elements.tipo.options[form.elements.tipo.selectedIndex].text : "";
      tipo = tipo.charAt(0).toLowerCase() + tipo.slice(1);
      var texto = fmt(T.formWa, { nombre: v("nombre"), tipo: tipo, mensaje: v("mensaje"), tel: v("telefono"),
                                  correo: v("correo") ? fmt(T.formCorreo, { correo: v("correo") }) : "" });
      window.open(waUrl(texto), "_blank", "noopener");
    });
  }
})();
