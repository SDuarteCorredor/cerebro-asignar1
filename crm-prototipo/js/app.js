(function () {
  'use strict';
  var KEY = 'crm-asignar-proto-v1';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); };

  // ---------- Iconos (trazos lineales 24x24, mismo estilo que Cerebro) ----------
  var ICONS = {
    check: '<path d="M5 12l5 5 9-10"/>', lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/>',
    bell: '<path d="M6 9a6 6 0 0112 0c0 6 2 7 2 7H4s2-1 2-7z"/><path d="M10 20a2 2 0 004 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>', board: '<rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="10" rx="1"/><rect x="17" y="4" width="4" height="13" rx="1"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5"/><path d="M16 5a3.5 3.5 0 010 7M18 14.5c2 .5 3.2 2.3 3.5 5.5"/>',
    list: '<path d="M9 6h11M9 12h11M9 18h11"/><path d="M4 6l1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>'
  };
  var ic = function (n, s) { s = s || 16; return '<svg width="' + s + '" height="' + s + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none">' + ICONS[n] + '</svg>'; };

  // ---------- Estado ----------
  var DAY = 864e5;
  var ahora = function () { return new Date(); };
  function iso(daysAgo) { return new Date(Date.now() - daysAgo * DAY).toISOString(); }

  function build() {
    var clientes = window.CLIENTES_DEMO.map(function (d) {
      var c = JSON.parse(JSON.stringify(d));
      c.inicioISO = iso(c.inicio);
      c.chk = {};
      if (c.hechos === 'TODOS') window.PLANTILLA.forEach(function (i) { c.chk[i.id] = { at: iso(Math.max(1, c.inicio - 5)) }; });
      else Object.keys(c.hechos).forEach(function (k) { c.chk[k] = { at: iso(c.hechos[k]) }; });
      delete c.hechos; delete c.inicio;
      return c;
    });
    return { clientes: clientes, role: 'cumplimiento', strict: false, alertDias: 2, slaDesde: 'codigo' };
  }
  var S;
  try { S = JSON.parse(localStorage.getItem(KEY)); } catch (e) { S = null; }
  if (!S || !S.clientes) S = build();
  var save = function () { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* modo privado */ } };

  var byId = function (cod) { return S.clientes.filter(function (c) { return c.codigo === cod; })[0]; };
  var ITEM = {}; window.PLANTILLA.forEach(function (i) { ITEM[i.id] = i; });

  // ---------- Reglas de negocio ----------
  function diasHabiles(desde, hasta) {
    var d = new Date(desde), n = 0; d.setHours(0, 0, 0, 0);
    var h = new Date(hasta); h.setHours(0, 0, 0, 0);
    while (d < h) { d.setDate(d.getDate() + 1); var w = d.getDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }
  // Estado de un ítem: hecha | bloqueada | ok | vencida | escalada
  function estadoItem(c, it) {
    if (c.chk[it.id]) return { k: 'hecha', at: c.chk[it.id].at };
    var inicio = new Date(c.inicioISO);
    var dep = it.dep || [];
    for (var i = 0; i < dep.length; i++) {
      var r = c.chk[dep[i]];
      if (!r) return { k: 'bloqueada', falta: dep[i] };
      if (new Date(r.at) > inicio) inicio = new Date(r.at);
    }
    var t = diasHabiles(inicio, ahora());
    if (t >= S.alertDias && t > it.sla) return { k: 'escalada', t: t };
    if (t > it.sla) return { k: 'vencida', t: t };
    return { k: 'ok', t: t };
  }
  function progreso(c, area) {
    var items = window.PLANTILLA.filter(function (i) { return !area || i.area === area; });
    var hechos = items.filter(function (i) { return c.chk[i.id]; }).length;
    return { hechos: hechos, total: items.length, pct: Math.round(100 * hechos / items.length) };
  }
  // Un cliente se habilita para pedidos solo con todo lo NO posterior hecho + 3 aprobaciones
  function motivosBloqueo(c) {
    var m = [];
    var pend = window.PLANTILLA.filter(function (i) { return !i.post && !c.chk[i.id]; });
    if (pend.length) m.push('Faltan ' + pend.length + ' actividades del checklist');
    window.APROBACIONES.forEach(function (a) { if (!c.aprob[a.id]) m.push('Sin aprobación de ' + a.t.toLowerCase()); });
    return m;
  }
  function alertasGlobales() {
    var out = [];
    S.clientes.forEach(function (c) {
      if (c.etapa === 'activo') return;
      window.PLANTILLA.forEach(function (it) { var e = estadoItem(c, it); if (e.k === 'escalada') out.push({ c: c, it: it, e: e }); });
    });
    return out;
  }
  var puedeEditar = function (area) { return S.role === area; };
  var TAB_PERM = { resumen: null, tarifas: ['comercial', 'cumplimiento', 'gerencia', 'compensacion'], turnos: ['comercial', 'compensacion', 'apertura', 'gerencia'], contratos: ['comercial', 'cumplimiento', 'gerencia'], checklist: null };
  var veTab = function (t) { return !S.strict || !TAB_PERM[t] || TAB_PERM[t].indexOf(S.role) >= 0; };

  // ---------- UI helpers ----------
  var fecha = function (d) { return new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }); };
  var money = function (m) { return '$' + m + ' M/mes'; };
  var etapaDe = function (id) { return window.ETAPAS.filter(function (e) { return e.id === id; })[0]; };
  function toast(msg) {
    var t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t);
    setTimeout(function () { t.remove(); }, 4200);
  }
  function badgeItem(e, it) {
    if (e.k === 'hecha') return '<span class="badge ok">Hecha ' + fecha(e.at) + '</span>';
    if (e.k === 'bloqueada') return '<span class="badge plain">' + ic('lock', 12) + ' Espera: ' + esc(ITEM[e.falta].t) + '</span>';
    if (e.k === 'escalada') return '<span class="badge bad">' + ic('bell', 12) + ' ' + e.t + ' días — alertado al líder</span>';
    if (e.k === 'vencida') return '<span class="badge warn">Vencida (' + e.t + ' d)</span>';
    return '<span class="badge info">SLA ' + it.sla + ' d hábil</span>';
  }

  // ---------- Vistas ----------
  function vPipeline() {
    var cols = window.ETAPAS.map(function (et) {
      var cs = S.clientes.filter(function (c) { return c.etapa === et.id; });
      var total = cs.reduce(function (a, c) { return a + c.valor; }, 0);
      return '<div class="col" data-etapa="' + et.id + '"><h3><i class="stagebar" style="width:14px;background:' + et.c + '"></i>' + et.t + '<span>' + cs.length + ' · $' + total + ' M</span></h3>' +
        cs.map(function (c) {
          var p = progreso(c); var al = window.PLANTILLA.some(function (i) { return estadoItem(c, i).k === 'escalada'; }) && c.etapa !== 'activo';
          return '<div class="deal" draggable="true" data-cod="' + c.codigo + '" data-go="#/cliente/' + c.codigo + '">' +
            '<div class="row"><b>' + esc(c.nombre) + '</b><span class="mono">' + c.codigo + '</span></div>' +
            '<div class="row"><span>' + esc(c.ciudad) + '</span><span>' + money(c.valor) + '</span></div>' +
            '<div class="bar ' + (p.pct === 100 ? 'full' : '') + '"><i style="width:' + p.pct + '%"></i></div>' +
            '<div class="row"><span>Checklist ' + p.pct + '%</span>' + (al ? '<span class="badge bad plain">' + ic('bell', 12) + ' Alerta</span>' : '') + '</div></div>';
        }).join('') + '</div>';
    }).join('');
    return head('Pipeline de ventas', '<a class="btn primary" href="#/nuevo">' + ic('plus') + ' Nuevo cliente</a>') +
      '<p class="muted" style="margin-top:-12px">Arrastra una tarjeta entre etapas. Un cliente <b>no pasa a Activo</b> hasta completar el checklist y las 3 aprobaciones.</p><div class="kanban">' + cols + '</div>';
  }

  function vClientes() {
    var rows = S.clientes.map(function (c) {
      var et = etapaDe(c.etapa), p = progreso(c);
      return '<tr class="link" data-go="#/cliente/' + c.codigo + '"><td><b>' + esc(c.nombre) + '</b><div class="muted mono">' + c.codigo + ' · ' + esc(c.nit) + '</div></td>' +
        '<td>' + esc(c.ciudad) + '</td><td><span class="badge" style="color:' + et.c + '">' + et.t + '</span></td>' +
        '<td style="min-width:140px"><div class="bar"><i style="width:' + p.pct + '%"></i></div><small class="muted">' + p.hechos + '/' + p.total + '</small></td>' +
        '<td>' + c.centros.length + '</td><td>' + money(c.valor) + '</td></tr>';
    }).join('');
    return head('Clientes', '<input class="search" id="q" placeholder="Buscar por nombre, código o NIT…"><a class="btn primary" href="#/nuevo">' + ic('plus') + ' Nuevo cliente</a>') +
      '<div class="card tablewrap"><table id="tabla"><thead><tr><th>Cliente</th><th>Ciudad</th><th>Etapa</th><th>Checklist</th><th>Centros fact.</th><th>Valor</th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  function vPendientes() {
    var area = S.role === 'gerencia' ? null : S.role;
    var matriz = S.clientes.filter(function (c) { return c.etapa !== 'activo'; }).map(function (c) {
      var celdas = Object.keys(window.AREAS).map(function (a) {
        var p = progreso(c, a); var bad = window.PLANTILLA.some(function (i) { return i.area === a && estadoItem(c, i).k === 'escalada'; });
        var cls = bad ? 'cx' : p.pct === 100 ? 'c2' : p.pct > 0 ? 'c1' : 'c0';
        return '<td><span class="chip ' + cls + '">' + p.pct + '%</span></td>';
      }).join('');
      var pa = progreso(c);
      return '<tr class="link" data-go="#/cliente/' + c.codigo + '/checklist"><td><b>' + esc(c.nombre) + '</b></td>' + celdas + '<td><b>' + pa.pct + '%</b></td></tr>';
    }).join('');
    var mis = [];
    S.clientes.forEach(function (c) {
      if (c.etapa === 'activo') return;
      window.PLANTILLA.forEach(function (it) {
        if (area && it.area !== area) return;
        var e = estadoItem(c, it); if (e.k === 'hecha' || e.k === 'bloqueada') return;
        mis.push({ c: c, it: it, e: e });
      });
    });
    var rank = { escalada: 0, vencida: 1, ok: 2 };
    mis.sort(function (a, b) { return rank[a.e.k] - rank[b.e.k]; });
    var lista = mis.length ? mis.map(function (m) {
      return '<tr class="link" data-go="#/cliente/' + m.c.codigo + '/checklist"><td><b>' + esc(m.it.t) + '</b></td><td>' + esc(m.c.nombre) + '</td><td>' + badgeItem(m.e, m.it) + '</td></tr>';
    }).join('') : '<tr><td colspan="3" class="empty">Nada pendiente para tu área.</td></tr>';
    return head('Checklist de ingreso') +
      '<div class="stack"><div class="card tablewrap"><table class="matrix"><thead><tr><th>Cliente en apertura</th>' +
      Object.keys(window.AREAS).map(function (a) { return '<th title="' + esc(window.AREAS[a].nombre) + '" style="color:' + window.AREAS[a].color + '">' + esc(window.AREAS[a].nombre.split(' ')[0]) + '</th>'; }).join('') + '<th>Total</th></tr></thead><tbody>' + matriz + '</tbody></table></div>' +
      '<h2 style="font-size:18px">Lo que le toca a ' + esc(area ? window.AREAS[area].nombre : 'todas las gestiones') + ' ahora</h2>' +
      '<p class="muted" style="margin-top:-8px">Solo aparecen actividades desbloqueadas (sus dependencias ya están hechas). Cambia el rol abajo a la izquierda para ver la bandeja de cada área.</p>' +
      '<div class="card tablewrap"><table><thead><tr><th>Actividad</th><th>Cliente</th><th>Estado</th></tr></thead><tbody>' + lista + '</tbody></table></div></div>';
  }

  function head(t, actions) { return '<div class="top"><h1>' + t + '</h1><div class="grow"></div>' + (actions || '') + '</div>'; }

  function vFicha(cod, tab) {
    var c = byId(cod); if (!c) return head('Cliente no encontrado');
    tab = tab || 'resumen'; if (!veTab(tab)) tab = 'resumen';
    var et = etapaDe(c.etapa), p = progreso(c);
    var tabs = [['resumen', 'Resumen'], ['checklist', 'Checklist'], ['tarifas', 'Tarifas y contratación'], ['turnos', 'Turnos'], ['contratos', 'Contratos']]
      .map(function (t) {
        var ok = veTab(t[0]);
        return '<button class="' + (tab === t[0] ? 'on' : '') + '" ' + (ok ? 'data-go="#/cliente/' + cod + '/' + t[0] + '"' : 'disabled title="Sin acceso con tu rol"') + '>' + (ok ? '' : ic('lock', 13) + ' ') + t[1] + '</button>';
      }).join('');
    var body = { resumen: tResumen, checklist: tChecklist, tarifas: tTarifas, turnos: tTurnos, contratos: tContratos }[tab](c);
    return '<div class="hero"><div class="logo">' + c.codigo + '</div><div><h1 style="font-size:24px">' + esc(c.nombre) + '</h1><div class="muted">NIT ' + esc(c.nit) + ' · ' + esc(c.ciudad) + ' · ' + c.centros.length + ' centro(s) de facturación</div></div>' +
      '<span class="badge" style="color:' + et.c + '">' + et.t + '</span><div class="grow" style="flex:1"></div><div style="min-width:180px"><small class="muted">Checklist ' + p.pct + '%</small><div class="bar ' + (p.pct === 100 ? 'full' : '') + '"><i style="width:' + p.pct + '%"></i></div></div></div>' +
      '<div class="tabs">' + tabs + '</div>' + body;
  }

  function tResumen(c) {
    var mot = motivosBloqueo(c), activo = c.etapa === 'activo';
    var estado = activo ? '<div class="callout ok">' + ic('check', 18) + '<div><b>Habilitado para pedidos.</b> Las tres aprobaciones y el checklist están completos.</div></div>'
      : '<div class="callout bad">' + ic('lock', 18) + '<div><b>No habilitado para pedidos.</b><ul style="margin:4px 0 0;padding-left:18px">' + mot.map(function (m) { return '<li>' + m + '</li>'; }).join('') + '</ul></div></div>';
    var aprob = window.APROBACIONES.map(function (a) {
      var v = c.aprob[a.id];
      return '<div class="item" style="grid-template-columns:1fr auto"><div><b>' + a.t + '</b><small>' + (v ? 'Aprobado ' + fecha(v) : 'Pendiente') + '</small></div>' +
        (v ? '<span class="badge ok">Aprobado</span>' : '<button class="btn sm" data-act="aprobar" data-cod="' + c.codigo + '" data-ap="' + a.id + '" ' + (S.role === a.rol ? '' : 'disabled title="Lo aprueba: ' + esc(window.ROLES[a.rol]) + '"') + '>Aprobar</button>') + '</div>';
    }).join('');
    var centros = c.centros.map(function (x) { return '<tr><td><b>' + esc(x.nombre) + '</b></td><td class="mono">' + esc(x.nit) + '</td><td>' + esc(x.ciudad) + '</td></tr>'; }).join('');
    return '<div class="stack">' + estado + '<div class="grid2">' +
      '<div class="card"><h3>Datos generales</h3><dl class="kv" style="margin-top:12px"><dt>Código</dt><dd class="mono">' + c.codigo + '</dd><dt>Contacto</dt><dd>' + esc(c.contacto.nombre) + '<div class="muted">' + esc(c.contacto.correo) + ' ' + esc(c.contacto.tel) + '</div></dd><dt>Ejecutivo comercial</dt><dd>' + esc(c.resp) + '</dd><dt>ARL / Caja</dt><dd>' + esc(c.ss.arl) + ' (riesgo ' + esc(c.ss.riesgo) + ') · ' + esc(c.ss.ccf) + '</dd><dt>Nómina</dt><dd>IU ' + c.nomina.iu + '% · ' + esc(c.nomina.corte) + ' · pago a ' + esc(c.nomina.pago) + '</dd></dl></div>' +
      '<div class="card"><h3>Aprobaciones para activar</h3><div style="margin-top:8px">' + aprob + '</div>' +
      (activo ? '' : '<button class="btn primary" style="margin-top:12px" data-act="activar" data-cod="' + c.codigo + '">Habilitar para pedidos</button>') + '</div></div>' +
      '<div class="card tablewrap"><div style="padding:16px 20px 4px"><h3>Centros de facturación</h3><small class="muted">Un mismo NIT puede tener varios (ej. Estelar Cali vs. Estelar Blue)</small></div><table><thead><tr><th>Centro</th><th>NIT</th><th>Ciudad</th></tr></thead><tbody>' + centros + '</tbody></table></div></div>';
  }

  function tChecklist(c) {
    var areas = Object.keys(window.AREAS).map(function (a) {
      var A = window.AREAS[a], p = progreso(c, a);
      var mia = puedeEditar(a);
      if (S.strict && !mia && S.role !== 'gerencia') {
        return '<div class="card area" style="--c:' + A.color + '"><header><h3>' + A.nombre + '</h3><span class="badge plain">' + ic('lock', 12) + ' Solo la ve ' + esc(A.resp) + '</span><span class="chip ' + (p.pct === 100 ? 'c2' : 'c0') + '" style="margin-left:auto">' + p.pct + '%</span></header></div>';
      }
      var items = window.PLANTILLA.filter(function (i) { return i.area === a; }).map(function (it) {
        var e = estadoItem(c, it), hecho = e.k === 'hecha', bloq = e.k === 'bloqueada';
        var cls = hecho ? 'done' : bloq ? 'lock' : '';
        var btn = mia && !bloq ? '<button class="btn sm ' + (hecho ? '' : 'ok') + '" data-act="toggle" data-cod="' + c.codigo + '" data-it="' + it.id + '">' + (hecho ? 'Reabrir' : 'Marcar hecha') + '</button>' : '';
        return '<div class="item"><div class="chk ' + cls + '">' + (hecho ? ic('check', 13) : bloq ? ic('lock', 11) : '') + '</div><div><b>' + esc(it.t) + '</b>' + (it.post ? ' <span class="badge info plain">Posterior a la aprobación</span>' : '') + (it.nota ? '<small>' + esc(it.nota) + '</small>' : '') + '<div style="margin-top:4px">' + badgeItem(e, it) + '</div></div><div>' + btn + '</div></div>';
      }).join('');
      return '<div class="card area" style="--c:' + A.color + '"><header><h3>' + A.nombre + '</h3><span class="muted">' + esc(A.resp) + '</span>' + (mia ? '<span class="badge info plain">Puedes editar</span>' : '<span class="badge plain">Solo lectura</span>') + '<span class="chip ' + (p.pct === 100 ? 'c2' : p.pct > 0 ? 'c1' : 'c0') + '" style="margin-left:auto">' + p.hechos + '/' + p.total + '</span></header>' + items + '</div>';
    }).join('');
    var desde = { codigo: 'la creación del código', firma: 'la firma del contrato', operativa: 'la reunión operativa' }[S.slaDesde];
    return '<div class="stack"><div class="callout info">' + ic('bell', 18) + '<div>Los SLA cuentan desde <b>' + desde + '</b>. Si una gestión no completa su parte en <b>' + S.alertDias + ' días hábiles</b>, se alerta al líder de la gestión. <i>(Punto de inicio pendiente de validar con Silvia y Jorge.)</i></div></div>' + areas + '</div>';
  }

  function tTarifas(c) {
    return '<div class="grid2"><div class="card"><h3>Tarifas y negociación</h3><dl class="kv" style="margin-top:12px"><dt>Administración (IU)</dt><dd>' + c.nomina.iu + '%</dd><dt>Estado de negociación</dt><dd>' + esc(c.tarifas.margen) + '</dd><dt>Corte de nómina</dt><dd>' + esc(c.nomina.corte) + '</dd><dt>Plazo de pago</dt><dd>' + esc(c.nomina.pago) + '</dd><dt>Forma de pago</dt><dd>' + esc(c.nomina.formaPago) + '</dd></dl></div>' +
      '<div class="card"><h3>Contratación</h3><dl class="kv" style="margin-top:12px"><dt>Tipos de contrato</dt><dd>' + c.contratacion.tipos.map(function (t) { return '<span class="badge info plain">' + t + '</span> '; }).join('') + '</dd><dt>Validación de personal</dt><dd>' + esc(c.contratacion.validacion) + '</dd><dt>Dotación</dt><dd>' + (c.contratacion.dotacion ? 'Sí, se entrega' : 'No') + '</dd><dt>ARL / póliza</dt><dd>' + esc(c.ss.arl) + ' · riesgo ' + esc(c.ss.riesgo) + '</dd></dl>' +
      '<p class="muted" style="margin-bottom:0">Paula ve aquí tarifas, turnos y póliza al consultar por código (antes no tenía visibilidad).</p></div></div>';
  }

  function tTurnos(c) {
    var rows = c.turnos.map(function (t, i) { return '<tr><td>' + esc(t.cargo) + '</td><td>' + esc(t.turno) + '</td><td>' + t.personas + '</td></tr>'; }).join('');
    var edit = puedeEditar('compensacion');
    return '<div class="stack"><div class="callout info">' + ic('list', 18) + '<div>La tabla de turnos vivía en un Drive de Compensación (doble proceso). Aquí queda en la ficha del cliente.</div></div>' +
      '<div class="card tablewrap"><table><thead><tr><th>Cargo</th><th>Turno</th><th>Personas</th></tr></thead><tbody>' + (rows || '<tr><td colspan="3" class="empty">Sin turnos cargados.</td></tr>') + '</tbody></table></div>' +
      (edit ? '<form class="card" data-form="turno" data-cod="' + c.codigo + '"><h3 style="margin-bottom:12px">Agregar turno</h3><div class="repeat"><label class="f">Cargo<input name="cargo" required></label><label class="f">Turno<input name="turno" required placeholder="Ej. Noche 22:00–06:00"></label><label class="f">Personas<input name="personas" type="number" min="1" required></label><button class="btn primary">Agregar</button></div></form>' : '<p class="muted">Solo Compensación edita los turnos.</p>') + '</div>';
  }

  function tContratos(c) {
    var rows = c.contratos.map(function (k) { return '<div class="item" style="grid-template-columns:1fr auto"><div><b>' + esc(k.nombre) + '</b><small>' + fecha(k.fecha) + '</small></div><span class="badge info plain">PDF</span></div>'; }).join('');
    return '<div class="card"><h3>Contratos y otrosíes</h3><p class="muted">Los contratos de hace 2–3 años quedan accesibles aquí, sin depender de que Laura los busque.</p>' + (rows || '<div class="empty">Aún no hay contratos cargados.</div>') + '</div>';
  }

  // ---------- Alta de cliente (wizard) ----------
  var draft = null, paso = 0;
  var PASOS = ['Datos generales', 'Seguridad social', 'Nómina y facturación', 'Tarifas y contratación'];
  function nuevoDraft() {
    return { nombre: '', nit: '', ciudad: 'Bogotá', codigo: '', contacto: { nombre: '', correo: '', tel: '' }, ss: { arl: 'Positiva', ccf: 'Compensar', riesgo: 'I' },
      nomina: { iu: 8, corte: 'Quincenal (15 y 30)', pago: '30 días', formaPago: 'Transferencia' }, centros: [{ nombre: 'Principal', nit: '', ciudad: '' }],
      tarifas: { admin: 8, margen: 'Por negociar' }, contratacion: { tipos: ['temporal'], validacion: 'Asignar', dotacion: false } };
  }
  function sel(name, val, opts) { return '<select name="' + name + '">' + opts.map(function (o) { return '<option' + (o === val ? ' selected' : '') + '>' + o + '</option>'; }).join('') + '</select>'; }
  function vNuevo() {
    if (!draft) { draft = nuevoDraft(); paso = 0; }
    if (S.role !== 'cumplimiento' && S.role !== 'comercial') {
      return head('Nuevo cliente') + '<div class="callout warn">' + ic('lock', 18) + '<div>Con el rol <b>' + esc(window.ROLES[S.role]) + '</b> no se crean clientes. Cambia a <b>Cumplimiento</b> o <b>Comercial</b> en el panel de la izquierda.</div></div>';
    }
    var d = draft, f;
    if (paso === 0) f = '<div class="grid2"><label class="f">Razón social<input name="nombre" value="' + esc(d.nombre) + '" required></label><label class="f">NIT<input name="nit" value="' + esc(d.nit) + '" placeholder="900.000.000-0" required></label><label class="f">Ciudad principal' + sel('ciudad', d.ciudad, ['Bogotá', 'Medellín', 'Rionegro', 'Cali', 'Barranquilla', 'Cartagena', 'Pereira']) + '</label>' +
      '<label class="f">Código de 3 letras<small>Se valida contra los existentes (hoy se lleva en el Excel de Sandra)</small><input name="codigo" value="' + esc(d.codigo) + '" maxlength="3" style="text-transform:uppercase" class="mono"></label>' +
      '<label class="f">Contacto principal<input name="c_nombre" value="' + esc(d.contacto.nombre) + '"></label><label class="f">Correo<input name="c_correo" type="email" value="' + esc(d.contacto.correo) + '"></label></div>';
    if (paso === 1) f = '<div class="callout info" style="margin-bottom:16px">Datos estándar; varían poco. Ya vienen precargados.</div><div class="grid3"><label class="f">ARL' + sel('arl', d.ss.arl, ['Positiva', 'Sura', 'Bolívar', 'Colmena', 'Axa Colpatria']) + '</label><label class="f">Caja de compensación' + sel('ccf', d.ss.ccf, ['Compensar', 'Comfama', 'Comfenalco', 'Cafam', 'Comfandi']) + '</label><label class="f">Nivel de riesgo' + sel('riesgo', d.ss.riesgo, ['I', 'II', 'III', 'IV', 'V']) + '</label></div>';
    if (paso === 2) f = '<div class="grid3"><label class="f">Porcentaje IU / administración<input name="iu" type="number" step="0.1" value="' + d.nomina.iu + '"></label><label class="f">Fecha de corte' + sel('corte', d.nomina.corte, ['Quincenal (15 y 30)', 'Mensual (30)', 'Semanal']) + '</label><label class="f">Plazo de pago' + sel('pago', d.nomina.pago, ['8 días', '15 días', '30 días', '45 días']) + '</label><label class="f">Forma de pago' + sel('formaPago', d.nomina.formaPago, ['Transferencia', 'Cheque', 'PSE']) + '</label></div>' +
      '<h3 style="margin:24px 0 4px">Centros de facturación</h3><small class="muted">Un mismo NIT puede tener varios centros.</small><div style="margin-top:12px">' +
      d.centros.map(function (x, i) { return '<div class="repeat"><label class="f">Centro<input name="cn_' + i + '" value="' + esc(x.nombre) + '"></label><label class="f">NIT<input name="cnit_' + i + '" value="' + esc(x.nit || d.nit) + '"></label><label class="f">Ciudad<input name="cc_' + i + '" value="' + esc(x.ciudad || d.ciudad) + '"></label>' + (d.centros.length > 1 ? '<button type="button" class="btn sm" data-act="delcentro" data-i="' + i + '" aria-label="Quitar centro">' + ic('x', 14) + '</button>' : '<span></span>') + '</div>'; }).join('') +
      '<button type="button" class="btn sm" data-act="addcentro">' + ic('plus', 14) + ' Agregar centro</button></div>';
    if (paso === 3) {
      f = '<div class="grid2"><label class="f">Estado de la negociación' + sel('margen', d.tarifas.margen, ['Por negociar', 'En negociación', 'Aprobado']) + '</label><label class="f">¿Quién valida al personal que ingresa?' + sel('validacion', d.contratacion.validacion, ['Asignar', 'Empresa']) + '</label></div>' +
        '<label class="f" style="margin-top:16px">Tipos de contrato</label><div class="checks">' + ['temporal', 'requerimiento', 'flexible'].map(function (t) { return '<label><input type="checkbox" name="tipo" value="' + t + '"' + (d.contratacion.tipos.indexOf(t) >= 0 ? ' checked' : '') + '> ' + t + '</label>'; }).join('') + '</div>' +
        '<div class="checks" style="margin-top:16px"><label><input type="checkbox" name="dotacion"' + (d.contratacion.dotacion ? ' checked' : '') + '> Hay entrega de dotación</label></div>' +
        '<div class="callout warn" style="margin-top:24px">' + ic('lock', 18) + '<div><b>Esto Laura ya no lo llena</b> (lo definen otras gestiones):<ul style="margin:4px 0 0;padding-left:18px"><li>Empleados que gestionan al cliente → se define en la <b>reunión operativa</b> (Apertura)</li><li>Requisitos de selección y perfiles → reunión operativa</li><li>Contratación → Vinculación</li><li>SST → área de SST</li></ul></div></div>';
    }
    var steps = PASOS.map(function (t, i) { return '<div class="step ' + (i === paso ? 'on' : i < paso ? 'done' : '') + '"><i>' + (i < paso ? ic('check', 12) : i + 1) + '</i>' + t + '</div>'; }).join('');
    return head('Nuevo cliente') + '<div class="steps">' + steps + '</div><form class="card" id="wiz" novalidate><h2 style="font-size:18px;margin-bottom:16px">' + PASOS[paso] + '</h2>' + f +
      '<div class="row-actions"><button type="button" class="btn" data-act="atras" ' + (paso === 0 ? 'disabled' : '') + '>Atrás</button>' + (paso < 3 ? '<button type="button" class="btn primary" data-act="sig">Siguiente ' + ic('arrow', 14) + '</button>' : '<button type="button" class="btn primary" data-act="crear">Crear cliente y abrir checklist</button>') + '</div></form>';
  }
  function leerPaso() {
    var f = $('#wiz'); if (!f) return;
    var v = function (n) { var e = f.elements[n]; return e ? e.value : undefined; };
    var d = draft;
    if (paso === 0) { d.nombre = v('nombre').trim(); d.nit = v('nit').trim(); d.ciudad = v('ciudad'); d.codigo = v('codigo').trim().toUpperCase(); d.contacto.nombre = v('c_nombre'); d.contacto.correo = v('c_correo'); }
    if (paso === 1) { d.ss = { arl: v('arl'), ccf: v('ccf'), riesgo: v('riesgo') }; }
    if (paso === 2) { d.nomina = { iu: parseFloat(v('iu')) || 0, corte: v('corte'), pago: v('pago'), formaPago: v('formaPago') }; d.centros = d.centros.map(function (_, i) { return { nombre: v('cn_' + i), nit: v('cnit_' + i), ciudad: v('cc_' + i) }; }); }
    if (paso === 3) { d.tarifas.margen = v('margen'); d.contratacion.validacion = v('validacion'); d.contratacion.tipos = $$('input[name=tipo]:checked', f).map(function (x) { return x.value; }); d.contratacion.dotacion = f.elements.dotacion.checked; }
  }
  function validarPaso() {
    var d = draft;
    if (paso === 0) {
      if (!d.nombre) return 'Falta la razón social';
      if (!/^[0-9.\-]{6,}$/.test(d.nit)) return 'El NIT no parece válido';
      if (!/^[A-Z]{3}$/.test(d.codigo)) return 'El código debe ser de exactamente 3 letras';
      if (byId(d.codigo)) return 'El código ' + d.codigo + ' ya existe (' + byId(d.codigo).nombre + ')';
    }
    if (paso === 2 && d.centros.some(function (c) { return !c.nombre; })) return 'Cada centro de facturación necesita nombre';
    if (paso === 3 && !d.contratacion.tipos.length) return 'Elige al menos un tipo de contrato';
    return '';
  }

  // ---------- Router y render ----------
  function ruta() {
    var p = (location.hash || '#/pipeline').split('/'); // ['#','cliente','VLX','tab']
    return { v: p[1] || 'pipeline', a: p[2], b: p[3] };
  }
  function render() {
    var r = ruta(), html;
    if (r.v === 'clientes') html = vClientes();
    else if (r.v === 'pendientes') html = vPendientes();
    else if (r.v === 'nuevo') html = vNuevo();
    else if (r.v === 'cliente') html = vFicha(r.a, r.b);
    else html = vPipeline();
    $('#main').innerHTML = html;
    var nav = { pipeline: 'pipeline', clientes: 'clientes', cliente: 'clientes', pendientes: 'pendientes', nuevo: 'nuevo' }[r.v] || 'pipeline';
    $$('.nav a').forEach(function (a) { a.classList.toggle('on', a.dataset.nav === nav); });
    var n = alertasGlobales().length; $('#nalert').textContent = n; $('#nalert').style.display = n ? '' : 'none';
    $('#rol').value = S.role; $('#strict').checked = S.strict; $('#adias').value = S.alertDias; $('#sdesde').value = S.slaDesde;
    bindDnD(); bindSearch();
  }
  function bindSearch() {
    var q = $('#q'); if (!q) return;
    q.addEventListener('input', function () {
      var t = q.value.toLowerCase();
      $$('#tabla tbody tr').forEach(function (tr) { tr.style.display = tr.textContent.toLowerCase().indexOf(t) >= 0 ? '' : 'none'; });
    });
  }
  function bindDnD() {
    $$('.deal').forEach(function (el) {
      el.addEventListener('dragstart', function (e) { e.dataTransfer.setData('text/plain', el.dataset.cod); });
    });
    $$('.col').forEach(function (col) {
      col.addEventListener('dragover', function (e) { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', function () { col.classList.remove('over'); });
      col.addEventListener('drop', function (e) {
        e.preventDefault(); col.classList.remove('over');
        var c = byId(e.dataTransfer.getData('text/plain')); if (!c) return;
        mover(c, col.dataset.etapa);
      });
    });
  }
  function mover(c, etapa) {
    if (etapa === 'activo') {
      var m = motivosBloqueo(c);
      if (m.length) { toast('No se puede activar ' + c.nombre + ': ' + m.join('; ')); return; }
    }
    c.etapa = etapa; save(); render();
  }

  // ---------- Eventos ----------
  document.addEventListener('click', function (e) {
    var go = e.target.closest('[data-go]');
    var act = e.target.closest('[data-act]');
    if (act && !act.disabled) {
      var a = act.dataset.act, c = act.dataset.cod && byId(act.dataset.cod);
      if (a === 'toggle') {
        if (c.chk[act.dataset.it]) {
          // Reabrir una actividad invalida las que dependen de ella
          var caen = []; var rec = function (id) { window.PLANTILLA.forEach(function (i) { if ((i.dep || []).indexOf(id) >= 0 && c.chk[i.id]) { delete c.chk[i.id]; caen.push(i.t); rec(i.id); } }); };
          delete c.chk[act.dataset.it]; rec(act.dataset.it);
          if (caen.length) toast('Se reabrieron también las que dependían de esta: ' + caen.join(', '));
        } else c.chk[act.dataset.it] = { at: new Date().toISOString() };
        if (c.etapa === 'activo' && motivosBloqueo(c).length) c.etapa = 'apertura';
        save(); render();
      } else if (a === 'aprobar') { c.aprob[act.dataset.ap] = new Date().toISOString(); save(); render(); }
      else if (a === 'activar') { var m = motivosBloqueo(c); if (m.length) toast('Aún no: ' + m.join('; ')); else { c.etapa = 'activo'; save(); render(); toast(c.nombre + ' quedó habilitado para pedidos'); } }
      else if (a === 'sig') { leerPaso(); var er = validarPaso(); if (er) toast(er); else { paso++; render(); } }
      else if (a === 'atras') { leerPaso(); paso--; render(); }
      else if (a === 'addcentro') { leerPaso(); draft.centros.push({ nombre: '', nit: draft.nit, ciudad: draft.ciudad }); render(); }
      else if (a === 'delcentro') { leerPaso(); draft.centros.splice(+act.dataset.i, 1); render(); }
      else if (a === 'crear') {
        leerPaso(); var er2 = validarPaso(); if (er2) { toast(er2); return; }
        var d = draft;
        S.clientes.unshift({ codigo: d.codigo, nombre: d.nombre, nit: d.nit, ciudad: d.ciudad, etapa: 'apertura', valor: 0, resp: 'Paula', contacto: d.contacto, ss: d.ss, nomina: d.nomina, centros: d.centros, tarifas: d.tarifas, contratacion: d.contratacion, turnos: [], contratos: [], aprob: {}, chk: {}, inicioISO: new Date().toISOString() });
        draft = null; save(); location.hash = '#/cliente/' + d.codigo + '/checklist'; toast('Cliente creado. El reloj de SLA ya está corriendo.');
      }
      return;
    }
    if (go && !e.target.closest('button[disabled]')) { location.hash = go.dataset.go; }
  });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-form="turno"]'); if (!f) return;
    e.preventDefault(); var c = byId(f.dataset.cod);
    c.turnos.push({ cargo: f.cargo.value, turno: f.turno.value, personas: +f.personas.value }); save(); render();
  });
  $('#rol').addEventListener('change', function (e) { S.role = e.target.value; save(); render(); });
  $('#strict').addEventListener('change', function (e) { S.strict = e.target.checked; save(); render(); });
  $('#adias').addEventListener('change', function (e) { S.alertDias = +e.target.value; save(); render(); });
  $('#sdesde').addEventListener('change', function (e) { S.slaDesde = e.target.value; save(); render(); });
  $('#reset').addEventListener('click', function () { S = build(); draft = null; save(); location.hash = '#/pipeline'; render(); toast('Datos de demostración restablecidos'); });
  window.addEventListener('hashchange', render);
  render();
})();
