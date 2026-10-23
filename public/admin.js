(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  
  const escape = s => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[c]));

  let catalog = { categorias: [], servicios: [] };
  let heroSlides = [];

  const notice = s => {
    $('notice').textContent = s;
  };

  // ── API helper ───────────────────────────────────────────────────────────
  async function api(path, options = {}) {
    const isFormData = options.body instanceof FormData;
    const res = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        // No establecer Content-Type para FormData (el browser lo hace con boundary)
        ...(options.body && !isFormData ? { 'Content-Type': 'application/json' } : {}),
        ...options.headers
      }
    });
    
    const data = await res.json().catch(() => ({}));
    
    if (!res.ok) {
      if (res.status === 401 && path !== '/api/login') showLogin();
      throw Error(data.error || `Error ${res.status}`);
    }
    
    return data;
  }

  // ── Upload de imagen ─────────────────────────────────────────────────────
  /**
   * Sube un archivo File al endpoint /api/upload y devuelve la URL pública.
   * @param {File} file
   * @param {string} [oldUrl] URL del blob anterior para eliminar
   */
  async function uploadImage(file, oldUrl = '') {
    const fd = new FormData();
    fd.append('file', file);
    if (oldUrl) fd.append('old_url', oldUrl);
    const data = await api('/api/upload', { method: 'POST', body: fd });
    return data.url;
  }

  // ── Vistas ───────────────────────────────────────────────────────────────
  function showLogin() {
    localStorage.removeItem('ev_admin_logged');
    $('dashboard').hidden = true;
    $('login-view').hidden = false;
    $('logout').hidden = true;
  }

  function showDashboard() {
    localStorage.setItem('ev_admin_logged', '1');
    $('dashboard').hidden = false;
    $('login-view').hidden = true;
    $('logout').hidden = false;
  }

  // ── Tabs ─────────────────────────────────────────────────────────────────
  function switchTab(name) {
    document.querySelectorAll('.tab').forEach(t => {
      const active = t.dataset.tab === name;
      t.classList.toggle('is-active', active);
      t.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    document.querySelectorAll('.tab-pane').forEach(p => {
      p.hidden = p.id !== `pane-${name}`;
    });
  }

  document.querySelectorAll('.tab').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // ── Carga de datos ───────────────────────────────────────────────────────
  async function load() {
    [catalog, heroSlides] = await Promise.all([
      api('/api/servicios'),
      api('/api/hero?admin=1')
    ]);
    render();
    renderHero();
  }

  // ── Render: Tratamientos ─────────────────────────────────────────────────
  function render() {
    $('category-list').innerHTML = catalog.categorias.map(c => `
      <article class="item">
        <div>
          <strong>${escape(c.nombre)}</strong>
          <p>${escape(c.descripcion)}</p>
          <small>${c.servicios.length} servicios</small>
        </div>
        <div class="item-actions">
          <button data-kind="categoria" data-action="edit" data-id="${c.id}">Editar</button>
          <button data-kind="categoria" data-action="delete" data-id="${c.id}" class="btn-danger">Eliminar</button>
        </div>
      </article>
    `).join('') || '<p>No hay categorías.</p>';

    $('service-list').innerHTML = catalog.servicios.map(s => `
      <article class="item">
        ${s.imagen_url ? `<img class="item-thumb" src="${escape(s.imagen_url)}" alt="" loading="lazy">` : '<div class="item-thumb item-thumb--empty">📷</div>'}
        <div>
          <strong>${escape(s.nombre)}</strong>
          <p>${escape(s.categoria)} · ${escape(s.descripcion)}</p>
        </div>
        <div class="item-actions">
          <button data-kind="servicio" data-action="edit" data-id="${s.id}">Editar</button>
          <button data-kind="servicio" data-action="delete" data-id="${s.id}" class="btn-danger">Eliminar</button>
        </div>
      </article>
    `).join('') || '<p>No hay servicios.</p>';

    const selected = $('service-form').elements.categoria_id.value;
    
    $('service-form').elements.categoria_id.innerHTML = '<option value="">Selecciona una categoría</option>' + 
      catalog.categorias.map(c => `<option value="${c.id}">${escape(c.nombre)}</option>`).join('');
      
    if (catalog.categorias.some(c => String(c.id) === selected)) {
      $('service-form').elements.categoria_id.value = selected;
    }
  }

  // ── Render: Hero Slider ──────────────────────────────────────────────────
  function renderHero() {
    if (!heroSlides.length) {
      $('hero-list').innerHTML = '<p>No hay paneles en el Hero Slider.</p>';
      return;
    }
    $('hero-list').innerHTML = heroSlides.map((s, i) => `
      <article class="item hero-item" data-id="${s.id}">
        ${s.imagen_url ? `<img class="item-thumb hero-thumb" src="${escape(s.imagen_url)}" alt="" loading="lazy">` : '<div class="item-thumb item-thumb--empty">🖼️</div>'}
        <div style="flex:1;min-width:0">
          <strong class="font-cinzel">${escape(s.titulo)}</strong>
          <p>${escape(s.eyebrow)} · ${escape(s.parrafo).slice(0, 60)}${s.parrafo.length > 60 ? '…' : ''}</p>
          <span class="badge ${s.activo ? 'badge-on' : 'badge-off'}">${s.activo ? 'Visible' : 'Oculto'}</span>
        </div>
        <div class="item-actions">
          <div class="order-arrows">
            <button type="button" data-hero-action="up" data-id="${s.id}" ${i === 0 ? 'disabled' : ''} title="Mover arriba" aria-label="Mover panel arriba">↑</button>
            <button type="button" data-hero-action="down" data-id="${s.id}" ${i === heroSlides.length - 1 ? 'disabled' : ''} title="Mover abajo" aria-label="Mover panel abajo">↓</button>
          </div>
          <button type="button" data-hero-action="edit" data-id="${s.id}">Editar</button>
          <button type="button" data-hero-action="delete" data-id="${s.id}" class="btn-danger">Eliminar</button>
        </div>
      </article>
    `).join('');
  }

  // ── Reset de formularios ─────────────────────────────────────────────────
  function reset(kind) {
    const f = $(kind === 'categoria' ? 'category-form' : 'service-form');
    f.reset();
    f.elements.id.value = '';
    $(kind === 'categoria' ? 'category-submit' : 'service-submit').textContent = 
      kind === 'categoria' ? 'Guardar categoría' : 'Guardar servicio';
    if (kind === 'servicio') clearImagePreview('service');
  }

  function resetHero() {
    $('hero-form').reset();
    $('hero-form').elements.id.value = '';
    $('hero-form').elements.imagen_url.value = '';
    $('hero-activo').checked = true;
    $('hero-submit').textContent = 'Guardar panel';
    $('hero-form-title').textContent = 'Nuevo panel';
    clearImagePreview('hero');
  }

  // ── Upload zone UI ───────────────────────────────────────────────────────
  function setupUploadZone(prefix) {
    const zone   = $(`${prefix}-upload-zone`);
    const input  = $(`${prefix}-file-input`);
    const preview= $(`${prefix}-img-preview`);
    const ph     = $(`${prefix}-upload-placeholder`);
    const img    = $(`${prefix}-preview-img`);
    const clear  = $(`${prefix}-img-clear`);

    // Click en la zona → abrir selector
    zone.addEventListener('click', e => {
      if (e.target !== clear) input.click();
    });
    zone.addEventListener('keydown', e => {
      if ((e.key === 'Enter' || e.key === ' ') && e.target !== clear) {
        e.preventDefault(); input.click();
      }
    });

    // Drag & drop
    zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('drag-over'); });
    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));
    zone.addEventListener('drop', e => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      const file = e.dataTransfer?.files?.[0];
      if (file) applyFilePreview(prefix, file);
    });

    // File input change
    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (file) applyFilePreview(prefix, file);
    });

    // Limpiar imagen
    clear.addEventListener('click', e => {
      e.stopPropagation();
      clearImagePreview(prefix);
    });
  }

  function applyFilePreview(prefix, file) {
    const img = $(`${prefix}-preview-img`);
    const preview = $(`${prefix}-img-preview`);
    const ph = $(`${prefix}-upload-placeholder`);

    const reader = new FileReader();
    reader.onload = e => {
      img.src = e.target.result;
      preview.hidden = false;
      ph.hidden = true;
    };
    reader.readAsDataURL(file);
  }

  function clearImagePreview(prefix) {
    const img    = $(`${prefix}-preview-img`);
    const preview= $(`${prefix}-img-preview`);
    const ph     = $(`${prefix}-upload-placeholder`);
    const input  = $(`${prefix}-file-input`);

    img.src = '';
    preview.hidden = true;
    ph.hidden = false;
    if (input) input.value = '';

    // Limpiar imagen_url oculto del formulario si corresponde
    const form = prefix === 'service' ? $('service-form') : $('hero-form');
    if (form?.elements?.imagen_url) form.elements.imagen_url.value = '';
  }

  function showExistingImage(prefix, url) {
    if (!url) { clearImagePreview(prefix); return; }
    const img    = $(`${prefix}-preview-img`);
    const preview= $(`${prefix}-img-preview`);
    const ph     = $(`${prefix}-upload-placeholder`);
    img.src = url;
    preview.hidden = false;
    ph.hidden = true;
  }

  // ── Editar: Tratamientos ─────────────────────────────────────────────────
  function edit(kind, id) {
    const record = kind === 'categoria' 
      ? catalog.categorias.find(x => x.id === id) 
      : catalog.servicios.find(x => x.id === id);
      
    if (!record) return;
    
    const f = $(kind === 'categoria' ? 'category-form' : 'service-form');
    
    for (const name of ['id', 'nombre', 'descripcion', 'categoria_id']) {
      if (f.elements[name]) f.elements[name].value = record[name] ?? '';
    }

    if (kind === 'servicio') {
      // Guardar URL actual en el hidden field
      f.elements.imagen_url.value = record.imagen_url ?? '';
      showExistingImage('service', record.imagen_url);
    }
    
    $(kind === 'categoria' ? 'category-submit' : 'service-submit').textContent = 'Guardar cambios';
    f.scrollIntoView({ behavior: 'smooth' });
  }

  // ── Submit: Tratamientos ─────────────────────────────────────────────────
  async function submit(kind, event) {
    event.preventDefault();
    const f = event.currentTarget;
    
    if (!f.reportValidity()) return;
    
    const id = f.elements.id.value;
    const method = id ? 'PUT' : 'POST';

    let imagen_url = kind === 'servicio' ? (f.elements.imagen_url.value || '') : undefined;

    // Si hay un archivo nuevo seleccionado → subirlo primero
    if (kind === 'servicio') {
      const fileInput = $('service-file-input');
      if (fileInput.files.length > 0) {
        notice('Subiendo imagen…');
        const oldUrl = f.elements.imagen_url.value || '';
        try {
          imagen_url = await uploadImage(fileInput.files[0], oldUrl);
        } catch (e) {
          notice('Error al subir la imagen: ' + e.message);
          return;
        }
      }
    }

    const values = Object.fromEntries(new FormData(f));
    const payload = { entidad: kind, nombre: values.nombre, descripcion: values.descripcion };
    
    if (id) payload.id = Number(id);
    if (kind === 'servicio') {
      payload.categoria_id = Number(values.categoria_id);
      payload.imagen_url = imagen_url;
    }
    
    try {
      await api('/api/servicios', { method, body: JSON.stringify(payload) });
      reset(kind);
      await load();
      notice(kind === 'categoria' ? 'Categoría guardada ✓' : 'Servicio guardado ✓');
    } catch (e) {
      notice(e.message);
    }
  }

  // ── Click en lista de Tratamientos ───────────────────────────────────────
  async function onListClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    
    const { kind, action } = btn.dataset;
    const id = Number(btn.dataset.id);
    
    if (action === 'edit') return edit(kind, id);
    
    if (!confirm(`¿Eliminar ${kind} #${id}? Esta acción no se puede deshacer.`)) return;
    
    try {
      await api('/api/servicios', { method: 'DELETE', body: JSON.stringify({ entidad: kind, id }) });
      await load();
      notice('Registro eliminado ✓');
    } catch (e) {
      notice(e.message);
    }
  }

  // ── Editar: Hero ─────────────────────────────────────────────────────────
  function editHero(id) {
    const slide = heroSlides.find(s => s.id === id);
    if (!slide) return;

    const f = $('hero-form');
    f.elements.id.value = slide.id;
    f.elements.imagen_url.value = slide.imagen_url ?? '';
    f.elements.eyebrow.value = slide.eyebrow ?? '';
    f.elements.titulo.value = slide.titulo ?? '';
    f.elements.parrafo.value = slide.parrafo ?? '';
    f.elements.boton_texto.value = slide.boton_texto ?? '';
    f.elements.boton_href.value = slide.boton_href ?? '';
    $('hero-activo').checked = !!slide.activo;

    showExistingImage('hero', slide.imagen_url);
    $('hero-submit').textContent = 'Guardar cambios';
    $('hero-form-title').textContent = 'Editar panel';
    f.scrollIntoView({ behavior: 'smooth' });

    // Cambiar a pestaña hero si no está activa
    switchTab('hero');
  }

  // ── Submit: Hero ─────────────────────────────────────────────────────────
  $('hero-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    if (!f.reportValidity()) return;

    const fileInput = $('hero-file-input');
    let imagen_url = f.elements.imagen_url.value || '';

    if (fileInput.files.length > 0) {
      notice('Subiendo imagen…');
      const oldUrl = f.elements.imagen_url.value || '';
      try {
        imagen_url = await uploadImage(fileInput.files[0], oldUrl);
      } catch (err) {
        notice('Error al subir la imagen: ' + err.message);
        return;
      }
    }

    const id = f.elements.id.value;
    const method = id ? 'PUT' : 'POST';
    const payload = {
      titulo: f.elements.titulo.value,
      eyebrow: f.elements.eyebrow.value,
      parrafo: f.elements.parrafo.value,
      boton_texto: f.elements.boton_texto.value,
      boton_href: f.elements.boton_href.value,
      imagen_url,
      activo: $('hero-activo').checked,
    };
    if (id) payload.id = Number(id);

    try {
      await api('/api/hero', { method, body: JSON.stringify(payload) });
      resetHero();
      await load();
      notice('Panel del Hero guardado ✓');
    } catch (err) {
      notice(err.message);
    }
  });

  // ── Click en lista de Hero ───────────────────────────────────────────────
  $('hero-list').addEventListener('click', async e => {
    const btn = e.target.closest('[data-hero-action]');
    if (!btn) return;

    const action = btn.dataset.heroAction;
    const id = Number(btn.dataset.id);

    if (action === 'edit') return editHero(id);

    if (action === 'delete') {
      const slide = heroSlides.find(s => s.id === id);
      if (!confirm(`¿Eliminar el panel "${slide?.titulo || id}"? Esta acción no se puede deshacer.`)) return;
      try {
        // Intentar eliminar blob de imagen si existe
        if (slide?.imagen_url && slide.imagen_url.includes('vercel-storage.com')) {
          await api('/api/upload', { method: 'DELETE', body: JSON.stringify({ url: slide.imagen_url }) });
        }
        await api('/api/hero', { method: 'DELETE', body: JSON.stringify({ id }) });
        await load();
        notice('Panel eliminado ✓');
      } catch (err) {
        notice(err.message);
      }
      return;
    }

    // Reordenar ↑ / ↓
    if (action === 'up' || action === 'down') {
      const idx = heroSlides.findIndex(s => s.id === id);
      if (idx === -1) return;
      const swapIdx = action === 'up' ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= heroSlides.length) return;

      // Intercambiar orden
      const items = heroSlides.map((s, i) => ({ id: s.id, orden: i + 1 }));
      [items[idx].orden, items[swapIdx].orden] = [items[swapIdx].orden, items[idx].orden];

      try {
        await api('/api/hero', { method: 'PUT', body: JSON.stringify({ accion: 'reorder', items }) });
        await load();
      } catch (err) {
        notice(err.message);
      }
    }
  });

  // ── Eventos globales ─────────────────────────────────────────────────────
  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      f.reset();
      showDashboard();
      await load();
      notice('Sesión iniciada ✓');
    } catch (err) {
      notice(err.message);
    }
  });

  $('logout').addEventListener('click', async () => {
    try { await api('/api/login', { method: 'DELETE' }); } catch (e) { notice(e.message); }
    showLogin();
  });

  $('reload').addEventListener('click', async () => {
    try { await load(); notice('Datos actualizados ✓'); } catch (e) { notice(e.message); }
  });

  $('category-form').addEventListener('submit', e => submit('categoria', e));
  $('service-form').addEventListener('submit', e => submit('servicio', e));
  $('category-cancel').addEventListener('click', () => reset('categoria'));
  $('service-cancel').addEventListener('click', () => reset('servicio'));
  $('category-list').addEventListener('click', onListClick);
  $('service-list').addEventListener('click', onListClick);
  $('hero-cancel').addEventListener('click', resetHero);

  // ── Upload zones setup ───────────────────────────────────────────────────
  setupUploadZone('service');
  setupUploadZone('hero');

  // ── Init ─────────────────────────────────────────────────────────────────
  (async () => {
    try {
      const state = await api('/api/login');
      if (state.authenticated) {
        showDashboard();
        await load();
      } else {
        showLogin();
      }
    } catch (e) {
      showLogin();
      notice(e.message);
    }
  })();
})();