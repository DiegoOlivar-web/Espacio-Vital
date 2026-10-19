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

  const notice = s => {
    $('notice').textContent = s;
  };

  async function api(path, options = {}) {
    const res = await fetch(path, {
      credentials: 'same-origin',
      cache: 'no-store',
      ...options,
      headers: {
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
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

  async function load() {
    catalog = await api('/api/servicios');
    render();
  }

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
          <button data-kind="categoria" data-action="delete" data-id="${c.id}">Eliminar</button>
        </div>
      </article>
    `).join('') || '<p>No hay categorías.</p>';

    $('service-list').innerHTML = catalog.servicios.map(s => `
      <article class="item">
        <div>
          <strong>${escape(s.nombre)}</strong>
          <p>${escape(s.categoria)} · ${escape(s.descripcion)}</p>
        </div>
        <div class="item-actions">
          <button data-kind="servicio" data-action="edit" data-id="${s.id}">Editar</button>
          <button data-kind="servicio" data-action="delete" data-id="${s.id}">Eliminar</button>
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

  function reset(kind) {
    const f = $(kind === 'categoria' ? 'category-form' : 'service-form');
    f.reset();
    f.elements.id.value = '';
    $(kind === 'categoria' ? 'category-submit' : 'service-submit').textContent = 
      kind === 'categoria' ? 'Guardar categoría' : 'Guardar servicio';
  }

  function edit(kind, id) {
    const record = kind === 'categoria' 
      ? catalog.categorias.find(x => x.id === id) 
      : catalog.servicios.find(x => x.id === id);
      
    if (!record) return;
    
    const f = $(kind === 'categoria' ? 'category-form' : 'service-form');
    
    for (const name of ['id', 'nombre', 'descripcion', 'imagen_url', 'categoria_id']) {
      if (f.elements[name]) f.elements[name].value = record[name] ?? '';
    }
    
    $(kind === 'categoria' ? 'category-submit' : 'service-submit').textContent = 'Guardar cambios';
    f.scrollIntoView({ behavior: 'smooth' });
  }

  async function submit(kind, event) {
    event.preventDefault();
    const f = event.currentTarget;
    
    if (!f.reportValidity()) return;
    
    const values = Object.fromEntries(new FormData(f));
    const id = values.id;
    const method = id ? 'PUT' : 'POST';
    const payload = { ...values, entidad: kind };
    
    if (id) payload.id = Number(id);
    if (kind === 'servicio') payload.categoria_id = Number(values.categoria_id);
    
    try {
      await api('/api/servicios', { method, body: JSON.stringify(payload) });
      reset(kind);
      await load();
      notice(kind === 'categoria' ? 'Categoría guardada' : 'Servicio guardado');
    } catch (e) {
      notice(e.message);
    }
  }

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
      notice('Registro eliminado');
    } catch (e) {
      notice(e.message);
    }
  }

  $('login-form').addEventListener('submit', async e => {
    e.preventDefault();
    const f = e.currentTarget;
    try {
      await api('/api/login', { method: 'POST', body: JSON.stringify(Object.fromEntries(new FormData(f))) });
      f.reset();
      showDashboard();
      await load();
      notice('Sesión iniciada');
    } catch (err) {
      notice(err.message);
    }
  });

  $('logout').addEventListener('click', async () => {
    try {
      await api('/api/login', { method: 'DELETE' });
    } catch (e) {
      notice(e.message);
    }
    showLogin();
  });

  $('reload').addEventListener('click', async () => {
    try {
      await load();
      notice('Catálogo actualizado');
    } catch (e) {
      notice(e.message);
    }
  });

  $('category-form').addEventListener('submit', e => submit('categoria', e));$('service-form').addEventListener('submit', e => submit('servicio', e));
  $('category-cancel').addEventListener('click', () => reset('categoria'));$('service-cancel').addEventListener('click', () => reset('servicio'));
  $('category-list').addEventListener('click', onListClick);$('service-list').addEventListener('click', onListClick);

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