( () => {
  'use strict';
  const PHONE = window.EV_WHATSAPP || '51932200162';
  let PRODUCTS = [];
  let CATEGORIES = ["Todos"];
  const KEYS = 'ev_cart_v1';
  const byId = id => document.getElementById(id);
  const escape = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const store = () => { try { return JSON.parse(localStorage.getItem(KEYS) || '{}') || {} } catch { return {} } };
  let cart = store();

  function cleanCart() {
    cart = Object.fromEntries(Object.entries(cart).filter(([id, selected]) => PRODUCTS.some(p => p.id === id) && Boolean(selected)).map(([id]) => [id, true]));
  }

  function save() {
    cleanCart();
    try { localStorage.setItem(KEYS, JSON.stringify(cart)) } catch { }
    updateCart();
  }

  const wa = text => 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(text);

  function nav(active) {
    const links = [['index.html', 'Inicio'], ['servicios.html', 'Servicios'], ['domicilio.html', 'A domicilio'], ['nosotros.html', 'Nosotros'], ['index.html#locales', 'Nuestra sede']];
    return links.map(([url, name]) => `<a href="${url}" class="${active === url ? 'ev-current' : ''}">${name}</a>`).join('');
  }

  function initializeSmartHeader() {
    const paginasPermitidas = [
        "",
        "index.html",
        "servicios.html",
        "nosotros.html",
        "domicilio.html"
    ];

    const paginaActual =
        window.location.pathname.split("/").pop();

    if (!paginasPermitidas.includes(paginaActual)) return;

    const header = document.getElementById("site-header");

    if (!header) return;

    let scrollAnterior = window.scrollY;
    let pendiente = false;

    
    
    function controlarHeader() {
      const scrollActual = window.scrollY;
      const diferencia = scrollActual - scrollAnterior;

      // Verificar si el menú móvil está abierto
      const menuAbierto = document
          .getElementById("ev-mobile-nav")
          ?.classList.contains("ev-open");

      // Si el menú está abierto, mantener visible el header
      if (menuAbierto) {
          header.classList.remove("ev-header-hidden");
          scrollAnterior = scrollActual;
          pendiente = false;
          return;
      }

      // Mostrar el encabezado cerca del inicio
      if (scrollActual <= 80) {
          header.classList.remove("ev-header-hidden");

      } else if (diferencia > 5) {
          // Ocultar al bajar
          header.classList.add("ev-header-hidden");

      } else if (diferencia < -5) {
          // Mostrar al subir
          header.classList.remove("ev-header-hidden");
      }

      scrollAnterior = scrollActual;
      pendiente = false;
    }

    window.addEventListener("scroll", function () {

        if (!pendiente) {
            window.requestAnimationFrame(controlarHeader);
            pendiente = true;
        }

    }, { passive: true });
  }

  function initializeShell() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const header = byId('site-header');
    if (header) header.innerHTML = 
    `<header class="ev-header">
      <div class="ev-container ev-header-inner">
        <a class="ev-brand" href="index.html">
          <img src="img/logo.jpg" alt="Logo de Espacio Vital">
          <span><strong>ESPACIO VITAL</strong><small>Masajes Terapéuticos</small></span>
        </a>

        <nav class="ev-nav" aria-label="Navegación principal">${nav(page)}
          <a class="ev-cta" target="_blank" rel="noopener noreferrer" href="${wa('Hola Espacio Vital, quisiera realizar una consulta o reserva.')}">
            <i class="fab fa-whatsapp"></i> Contáctanos
          </a>
        </nav>

        <div class="ev-actions">
          <!-- Carrito de servicios -->
          <button class="ev-cart-trigger" id="ev-cart-trigger" type="button" aria-label="Abrir carrito" aria-haspopup="dialog" aria-controls="ev-cart-panel">
            <i class="fas fa-shopping-cart"></i>
            <span class="ev-cart-badge" id="ev-cart-badge">0</span>
          </button>

          <!-- Acceso al administrador -->
          <a href="admin.html"
            class="ev-login-trigger"
            aria-label="Iniciar sesión como administrador"
            title="Acceso administrativo" hidden>
            <i class="fas fa-user-lock"></i>
          </a>

          <!-- Menú de navegación móvil -->
          <button class="ev-menu-trigger" id="ev-menu-trigger" type="button" aria-label="Abrir menú" aria-expanded="false" aria-controls="ev-mobile-nav">
            <i class="fas fa-bars"></i>
          </button>
        </div>
      </div>
      
      <nav class="ev-mobile-nav" id="ev-mobile-nav" aria-label="Navegación móvil">${nav(page)}
        <a class="ev-cta" href="${wa('Hola Espacio Vital, quisiera realizar una consulta.')}">
          <i class="fab fa-whatsapp"></i> Consultar por WhatsApp
        </a>
      </nav>
    </header>`;

    const footer = byId('site-footer');
    if (footer) footer.innerHTML =
    `<footer class="ev-footer">
      <div class="ev-container ev-footer-grid">
        <div class="ev-footer-brand">
          <a class="ev-brand" href="index.html">
            <img src="img/logo.jpg" alt="Logo de Espacio Vital">
            <span>
              <strong>ESPACIO VITAL</strong>
              <small>Masajes Terapéuticos</small>
            </span>
          </a>
          <p>Masajes terapéuticos y bienestar integral para tu día a día.</p>
        </div>
        <div>
          <b>Explora</b>
          <a href="servicios.html">Servicios</a>
          <a href="domicilio.html">A domicilio</a>
          <a href="nosotros.html">Nosotros</a>
        </div>
        <div>
          <b>Encuéntranos</b>
          <p>Av. Modelo 51, Grupo 22, Mz. P, Lt 3<br>Villa El Salvador, Lima, Perú</p>
          <a href="${wa('Hola Espacio Vital, deseo solicitar información.')}" target="_blank" rel="noopener noreferrer">
            <i class="fab fa-whatsapp"></i> +51 932 200 162
          </a>
        </div>
      </div>
      <div class="ev-container ev-footer-bottom">
        © ${new Date().getFullYear()} Espacio Vital · Todos los derechos reservados · Pedidos y consultas por WhatsApp
      </div>
    </footer>`;

    document.body.insertAdjacentHTML('beforeend', `
<div class="ev-overlay" id="ev-overlay" hidden></div>
<aside id="ev-cart-panel" class="ev-drawer" role="dialog" aria-modal="true" aria-label="Carrito de servicios" aria-hidden="true" tabindex="-1">
<div class="ev-drawer-head"><div><span class="ev-mini-label">TUS SERVICIOS</span><h2>Mi carrito <span id="ev-cart-count"></span></h2></div><button type="button" class="ev-icon-button" data-close-cart aria-label="Cerrar carrito"><i class="fas fa-times"></i></button></div>
<div class="ev-drawer-items" id="ev-cart-items"></div>
<div class="ev-drawer-bottom"><small>Selecciona los servicios que deseas consultar. La disponibilidad y las formas de pago se coordinarán directamente por WhatsApp.</small><button type="button" id="ev-checkout-btn" class="ev-primary-button"><i class="fab fa-whatsapp"></i> Solicitar productos</button></div></aside>
<div class="ev-payment-layer" id="ev-payment-layer" hidden>
<div class="ev-payment-dialog" role="dialog" aria-modal="true" aria-labelledby="ev-payment-title" tabindex="-1"><button type="button" class="ev-icon-button ev-payment-close" id="ev-payment-close" aria-label="Cerrar"><i class="fas fa-times"></i></button><span class="ev-mini-label">ÚLTIMO PASO</span><h2 id="ev-payment-title">Datos para tu consulta</h2><p>Completa tus datos para preparar tu consulta por WhatsApp. Los campos con * son obligatorios.</p>
<form id="ev-consult-form"><div class="ev-contact-fields"><label>Nombres *<input name="nombres" type="text" autocomplete="given-name" maxlength="100" required placeholder="Tus nombres"></label><label>Apellidos *<input name="apellidos" type="text" autocomplete="family-name" maxlength="100" required placeholder="Tus apellidos"></label><label>Correo electrónico (opcional)<input name="correo" type="email" autocomplete="email" maxlength="160" placeholder="correo@ejemplo.com"></label><label>Número de celular *<input name="celular" type="tel" autocomplete="tel" inputmode="tel" pattern="[+0-9() -]{7,20}" required placeholder="987654321"></label></div>
<div class="ev-payment-info"><strong>Medios de pago disponibles (informativo)</strong><div><span><i class="fas fa-money-bill-wave"></i> Efectivo (en el local)</span><span><i class="fas fa-mobile-alt"></i> Yape</span></div><small>La elección del medio de pago se coordina con la empresa. Aquí no se realiza ningún cobro.</small></div>
<div class="ev-pay-footer"><button id="ev-whatsapp-order" type="submit" class="ev-primary-button" disabled><i class="fab fa-whatsapp"></i> Consultar Pedido</button></div></form>
</div></div>`);

    byId('ev-menu-trigger').addEventListener('click', () => {
      const menu = byId('ev-mobile-nav');
      const boton = byId('ev-menu-trigger');
      const header = byId('site-header');

      const abierto = !menu.classList.contains('ev-open');

      // Abrir o cerrar menú
      menu.classList.toggle('ev-open', abierto);

      boton.setAttribute('aria-expanded', String(abierto));

      // Mantener visible el encabezado en movil
      if (abierto) {
          header.classList.remove('ev-header-hidden');
      }
    });
    byId('ev-cart-trigger').addEventListener('click', openCart);
    document.querySelectorAll('[data-close-cart]').forEach(b => b.addEventListener('click', closeCart));
    byId('ev-overlay').addEventListener('click', closeCart);
    byId('ev-checkout-btn').addEventListener('click', openPayment);
    byId('ev-payment-close').addEventListener('click', closePayment);
    byId('ev-payment-layer').addEventListener('click', e => { if (e.target === byId('ev-payment-layer')) closePayment(); });
    byId('ev-consult-form').addEventListener('input', validateConsult);
    byId('ev-consult-form').addEventListener('change', validateConsult);
    byId('ev-consult-form').addEventListener('submit', submitOrder);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { if (!byId('ev-payment-layer').hidden) closePayment(); else closeCart(); } });
    document.addEventListener('click', e => { const b = e.target.closest('[data-add-service]'); if (b) { addService(b.dataset.addService); } });
    byId('ev-cart-items').addEventListener('click', e => { const b = e.target.closest('[data-cart-action]'); if (!b) return; const id = b.dataset.id; if (!cart[id]) return; if (b.dataset.cartAction === 'remove') delete cart[id]; save(); });
  }

  function addService(id) {
    if (!PRODUCTS.some(p => p.id === id)) return;
    cart[id] = true;
    save();
    openCart();
  }

  function getItems() {
    cleanCart();
    return PRODUCTS.filter(p => cart[p.id]);
  }

  function updateCart() {
    const list = getItems(), count = list.length;
    byId('ev-cart-badge').textContent = count;
    byId('ev-cart-count').textContent = `(${count})`;
    byId('ev-cart-items').innerHTML = list.length ? list.map(p => `<article class="ev-cart-item"><img src="${p.image}" alt="" loading="lazy"><div class="ev-cart-details"><b>${escape(p.name)}</b><div class="ev-item-controls"><button class="ev-remove" aria-label="Eliminar ${escape(p.name)}" title="Eliminar" data-cart-action="remove" data-id="${p.id}"><i class="fas fa-trash-alt"></i> Eliminar</button></div></div></article>`).join('') : `<div class="ev-cart-empty"><i class="fas fa-shopping-basket"></i><h3>Tu lista está vacía</h3><p>Explora los tratamientos y agrega el que te interese consultar.</p><a href="servicios.html">Ver servicios <i class="fas fa-arrow-right"></i></a></div>`;
    byId('ev-checkout-btn').disabled = !list.length;
  }

  let lastFocused = null;
  function lockScroll() { document.body.classList.add('ev-no-scroll'); }
  function unlockScroll() { if (byId('ev-payment-layer').hidden && byId('ev-overlay').hidden) document.body.classList.remove('ev-no-scroll'); }
  function openCart() { lastFocused = document.activeElement; byId('ev-overlay').hidden = false; byId('ev-cart-panel').classList.add('ev-active'); byId('ev-cart-panel').setAttribute('aria-hidden', 'false'); lockScroll(); byId('ev-cart-panel').focus(); }
  function closeCart() { byId('ev-overlay').hidden = true; byId('ev-cart-panel').classList.remove('ev-active'); byId('ev-cart-panel').setAttribute('aria-hidden', 'true'); unlockScroll(); lastFocused?.focus?.(); }
  function openPayment() { if (!getItems().length) return; byId('ev-payment-layer').hidden = false; lockScroll(); validateConsult(); byId('ev-consult-form').elements.namedItem('nombres').focus(); }
  function closePayment() { byId('ev-payment-layer').hidden = true; unlockScroll(); byId('ev-checkout-btn').focus(); }

  function validateConsult() {
    const f = byId('ev-consult-form');
    const fields = ['nombres', 'apellidos', 'celular'];
    const completed = fields.every(n => f.elements.namedItem(n).value.trim().length > 0);
    byId('ev-whatsapp-order').disabled = !(completed && f.checkValidity());
  }

  function submitOrder(e) {
    e.preventDefault();
    const form = byId('ev-consult-form');
    if (!form.reportValidity() || !['nombres', 'apellidos', 'celular'].every(n => form.elements.namedItem(n).value.trim())) return;
    const items = getItems(); if (!items.length) return;
    const get = n => form.elements.namedItem(n).value.trim();
    const msg = ['Hola, Espacio Vital. Deseo consultar por los siguientes servicios:', '', '*Datos del cliente:*', `Nombres: ${get('nombres')}`, `Apellidos: ${get('apellidos')}`, `Celular: ${get('celular')}`, `Correo: ${get('correo') || 'No proporcionado'}`, '', '*Servicios de interés:*', ...items.map((p, i) => `${i + 1}. ${p.name}`), '', '¿Podrían brindarme información sobre disponibilidad y condiciones de estos servicios? Gracias.'];
    const url = wa(msg.join('\n'));
    const w = window.open(url, '_blank'); if (w) w.opener = null; else window.location.assign(url);
    closePayment();
  }

  function startCatalog() {
    const host = byId('ev-service-list'); if (!host) return;
    const q = byId('ev-filter-search'), cat = byId('ev-filter-category'), count = byId('ev-filter-count'), none = byId('ev-services-empty');
    const wanted = new URLSearchParams(location.search).get('categoria');
    const cats = CATEGORIES;
    let selected = cats.includes(wanted) ? wanted : 'Todos';
    const render = () => {
      const term = (q.value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      const normalized = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
      cat.innerHTML = cats.map(c => `<button type="button" class="${selected === c ? 'is-active' : ''}" data-category="${escape(c)}" aria-pressed="${c === selected}">${escape(c)} <span>${c === 'Todos' ? PRODUCTS.length : PRODUCTS.filter(p => p.category === c).length}</span></button>`).join('');
      const filtered = PRODUCTS.filter(p => (selected === 'Todos' || p.category === selected) && (!term || normalized(p.name + ' ' + p.description + ' ' + p.category).includes(term)));
      count.textContent = `${filtered.length} ${filtered.length === 1 ? 'servicio' : 'servicios'} · ${selected}`;
      none.hidden = filtered.length > 0;
      host.innerHTML = filtered.map(p => `<article class="ev-service-card"><div class="ev-service-photo"><img src="${p.image}" alt="Imagen referencial de ${escape(p.name)}" loading="lazy" onerror="this.src='img/logo.jpg'"><span class="ev-service-label"><i class="fas fa-spa"></i> Servicio</span></div>
<div class="ev-service-body"><div class="ev-service-title-line"><h3>${escape(p.name)}</h3></div><p>${escape(p.description)}</p><div class="ev-service-meta"><span><i class="fas fa-tag"></i> ${escape(p.category)}</span><span><i class="fas fa-map-marker-alt"></i> Villa El Salvador</span></div><button type="button" class="ev-service-add" data-add-service="${p.id}"><i class="fas fa-cart-plus"></i> Agregar al carrito</button></div></article>`).join('');
    };
    cat.addEventListener('click', e => { const btn = e.target.closest('[data-category]'); if (!btn) return; selected = btn.dataset.category; const url = new URL(location.href); if (selected === 'Todos') url.searchParams.delete('categoria'); else url.searchParams.set('categoria', selected); history.replaceState(null, '', url.pathname + url.search); render(); });
    q.addEventListener('input', render);
    render();
  }

  function startSlider() {
    const slider = byId('ev-hero-slider'); if (!slider) return;
    const slides = [...slider.querySelectorAll('.ev-hero-slide')], dots = [...slider.querySelectorAll('[data-slide-to]')]; let index = 0, interval = null;
    function show(n) {
      index = (n + slides.length) % slides.length;
      slides.forEach((s, i) => { const active = i === index; s.classList.toggle('is-active', active); s.setAttribute('aria-hidden', String(!active)); s.querySelectorAll('a').forEach(a => a.tabIndex = active ? 0 : -1); });
      dots.forEach((d, i) => { d.classList.toggle('is-active', i === index); d.setAttribute('aria-label', 'Mostrar diapositiva ' + (i + 1)); d.setAttribute('aria-pressed', String(i === index)); });
    }
    const stop = () => { clearInterval(interval); interval = null }, start = () => { stop(); interval = setInterval(() => show(index + 1), 6000); };
    slider.querySelectorAll('[data-slide-direction]').forEach(b => b.addEventListener('click', () => { show(index + Number(b.dataset.slideDirection)); start(); }));
    dots.forEach(b => b.addEventListener('click', () => { show(Number(b.dataset.slideTo)); start(); }));
    slider.addEventListener('mouseenter', stop); slider.addEventListener('mouseleave', start); slider.addEventListener('focusin', stop); slider.addEventListener('focusout', e => { if (!slider.contains(e.relatedTarget)) start(); });
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    show(0); if (!matchMedia('(prefers-reduced-motion: reduce)').matches) start();
  }

  function startQuoteForm() {
    const form = byId('ev-quote-form'); if (!form) return;
    form.addEventListener('submit', e => {
      e.preventDefault(); if (!form.reportValidity()) return;
      const get = n => form.elements.namedItem(n)?.value.trim() || '';
      const text = ['Hola Espacio Vital, deseo cotizar un servicio a domicilio.', '', 'Nombre: ' + get('nombre'), 'Servicio: ' + get('servicio'), 'Distrito: ' + get('distrito'), 'Cantidad de personas: ' + get('personas'), 'Dirección / referencia: ' + (get('direccion') || 'Por coordinar'), 'Celular: ' + get('telefono'), 'Fecha deseada: ' + (get('fecha') || 'Por coordinar'), '', 'Por favor, confirmen disponibilidad y cotización.'].join('\n');
      const url = wa(text); const tab = window.open(url, '_blank'); if (tab) tab.opener = null; else location.href = url;
    });
  }

  async function loadCatalog() {
    try {
      const response = await fetch('/api/servicios', { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      const data = await response.json();
      PRODUCTS = (data.servicios || []).map(s => ({ id: String(s.id), name: s.nombre, description: s.descripcion, category: s.categoria, image: s.imagen_url || 'img/logo.jpg' }));
      CATEGORIES = ['Todos', ...(data.categorias || []).map(c => c.nombre)];
      updateCart(); startCatalog();
    } catch (err) {
      console.error('No se pudo cargar el catálogo:', err);
      const host = byId('ev-service-list'); if (host) host.innerHTML = '<p role="alert">No fue posible cargar los servicios. Inténtalo nuevamente más tarde.</p>';
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    initializeShell();
    initializeSmartHeader();
    startSlider();
    startQuoteForm();
    loadCatalog();
  });
} ) ();