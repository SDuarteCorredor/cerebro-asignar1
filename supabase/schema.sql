-- ============================================================
-- CEREBRO ASIGNAR — Schema Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- Extensión para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABLA: usuarios
-- ============================================================
create table public.usuarios (
  id          uuid primary key references auth.users(id) on delete cascade,
  nombre      text not null,
  correo      text not null unique,
  rol         text not null check (rol in ('colaborador', 'lider', 'admin')),
  gestion_id  uuid,
  activo      boolean not null default true,
  created_at  timestamptz not null default now()
);

-- ============================================================
-- TABLA: gestiones
-- ============================================================
create table public.gestiones (
  id              uuid primary key default uuid_generate_v4(),
  nombre          text not null,
  descripcion     text not null default '',
  icono           text not null default 'folder',
  color_soft      text not null default 'oklch(0.96 0.025 250)',
  color_primary   text not null default 'oklch(0.42 0.12 250)',
  lider_id        uuid references public.usuarios(id) on delete set null,
  activa          boolean not null default true,
  created_at      timestamptz not null default now()
);

-- FK de usuarios hacia gestiones (circular, se agrega después de crear gestiones)
alter table public.usuarios
  add constraint usuarios_gestion_id_fkey
  foreign key (gestion_id) references public.gestiones(id) on delete set null;

-- ============================================================
-- TABLA: procesos
-- ============================================================
create table public.procesos (
  id                  uuid primary key default uuid_generate_v4(),
  nombre              text not null,
  gestion_id          uuid not null references public.gestiones(id) on delete cascade,
  objetivo            text not null default '',
  version             text not null default '1.0',
  fecha_actualizacion date not null default current_date,
  estado              text not null default 'borrador'
                      check (estado in ('activo', 'borrador', 'desactualizado', 'en_revision')),
  creado_por          uuid references public.usuarios(id) on delete set null,
  aprobado_por        uuid references public.usuarios(id) on delete set null,
  comentario_rechazo  text,
  macroproceso        text,
  -- Proceso por cliente (exclusivo de Servicio y Programación)
  es_proceso_cliente    boolean not null default false,
  cliente_nombre        text,
  cliente_contactos     jsonb not null default '[]'::jsonb, -- [{nombre, telefono, correo}]
  acuerdo_tarifa        text,
  acuerdo_tipo_servicio text,
  acuerdo_uniforme      text,
  acuerdo_detalles      text,
  created_at          timestamptz not null default now()
);

-- ============================================================
-- TABLA: pasos
-- ============================================================
create table public.pasos (
  id                uuid primary key default uuid_generate_v4(),
  proceso_id        uuid not null references public.procesos(id) on delete cascade,
  numero_orden      integer not null,
  nombre            text,
  descripcion       text not null default '',
  cargo_responsable text not null default '',
  entradas          text,
  periodicidad      text,
  salidas           text,
  acuerdo_servicio  text,
  tiempos           text,
  unique (proceso_id, numero_orden)
);

-- ============================================================
-- TABLA: documentos
-- ============================================================
create table public.documentos (
  id            uuid primary key default uuid_generate_v4(),
  proceso_id    uuid not null references public.procesos(id) on delete cascade,
  nombre        text not null,
  tipo_archivo  text not null default 'pdf',
  url_descarga  text not null,
  tamano_bytes  bigint,
  created_at    timestamptz not null default now()
);

-- ============================================================
-- TABLA: historial_versiones
-- ============================================================
create table public.historial_versiones (
  id               uuid primary key default uuid_generate_v4(),
  proceso_id       uuid not null references public.procesos(id) on delete cascade,
  version_anterior text not null,
  version_nueva    text not null,
  fecha_cambio     timestamptz not null default now(),
  usuario_id       uuid references public.usuarios(id) on delete set null,
  resumen_cambio   text not null default ''
);

-- ============================================================
-- ÍNDICES
-- ============================================================
create index idx_procesos_gestion on public.procesos(gestion_id);
create index idx_procesos_estado on public.procesos(estado);
create index idx_pasos_proceso on public.pasos(proceso_id, numero_orden);
create index idx_documentos_proceso on public.documentos(proceso_id);
create index idx_historial_proceso on public.historial_versiones(proceso_id);

-- Búsqueda de texto en procesos
create index idx_procesos_busqueda on public.procesos
  using gin(to_tsvector('spanish', nombre || ' ' || objetivo));

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table public.usuarios enable row level security;
alter table public.gestiones enable row level security;
alter table public.procesos enable row level security;
alter table public.pasos enable row level security;
alter table public.documentos enable row level security;
alter table public.historial_versiones enable row level security;

-- Helper: rol del usuario autenticado
create or replace function public.obtener_rol()
returns text
language sql stable
as $$
  select rol from public.usuarios where id = auth.uid()
$$;

-- Helper: gestion_id del usuario autenticado
create or replace function public.obtener_gestion_id()
returns uuid
language sql stable
as $$
  select gestion_id from public.usuarios where id = auth.uid()
$$;

-- ---- Usuarios ----
create policy "usuarios_lectura_propia" on public.usuarios
  for select using (id = auth.uid() or public.obtener_rol() = 'admin');

create policy "usuarios_admin_todo" on public.usuarios
  for all using (public.obtener_rol() = 'admin');

-- ---- Gestiones ----
create policy "gestiones_lectura_todos" on public.gestiones
  for select using (auth.uid() is not null and activa = true);

create policy "gestiones_admin_todo" on public.gestiones
  for all using (public.obtener_rol() = 'admin');

-- ---- Procesos ----
-- Colaboradores: solo ven activos
-- Líderes: ven activos + borradores de su gestión
-- Admins: ven todo
create policy "procesos_lectura" on public.procesos
  for select using (
    auth.uid() is not null and (
      estado = 'activo'
      or public.obtener_rol() = 'admin'
      or (public.obtener_rol() = 'lider' and gestion_id = public.obtener_gestion_id())
    )
  );

create policy "procesos_lider_crear" on public.procesos
  for insert with check (
    public.obtener_rol() in ('lider', 'admin')
    and (public.obtener_rol() = 'admin' or gestion_id = public.obtener_gestion_id())
  );

create policy "procesos_lider_editar" on public.procesos
  for update using (
    public.obtener_rol() = 'admin'
    or (public.obtener_rol() = 'lider' and gestion_id = public.obtener_gestion_id())
  );

create policy "procesos_admin_eliminar" on public.procesos
  for delete using (public.obtener_rol() = 'admin');

-- ---- Pasos ----
create policy "pasos_lectura" on public.pasos
  for select using (
    exists (
      select 1 from public.procesos p
      where p.id = proceso_id
      and (
        p.estado = 'activo'
        or public.obtener_rol() = 'admin'
        or (public.obtener_rol() = 'lider' and p.gestion_id = public.obtener_gestion_id())
      )
    )
  );

create policy "pasos_escritura" on public.pasos
  for all using (
    exists (
      select 1 from public.procesos p
      where p.id = proceso_id
      and (
        public.obtener_rol() = 'admin'
        or (public.obtener_rol() = 'lider' and p.gestion_id = public.obtener_gestion_id())
      )
    )
  );

-- ---- Documentos ----
create policy "documentos_lectura" on public.documentos
  for select using (
    exists (
      select 1 from public.procesos p
      where p.id = proceso_id
      and (
        p.estado = 'activo'
        or public.obtener_rol() = 'admin'
        or (public.obtener_rol() = 'lider' and p.gestion_id = public.obtener_gestion_id())
      )
    )
  );

create policy "documentos_escritura" on public.documentos
  for all using (
    exists (
      select 1 from public.procesos p
      where p.id = proceso_id
      and (
        public.obtener_rol() = 'admin'
        or (public.obtener_rol() = 'lider' and p.gestion_id = public.obtener_gestion_id())
      )
    )
  );

-- ---- Historial ----
create policy "historial_lectura" on public.historial_versiones
  for select using (
    auth.uid() is not null and (
      public.obtener_rol() in ('admin', 'lider')
      or exists (
        select 1 from public.procesos p where p.id = proceso_id and p.estado = 'activo'
      )
    )
  );

create policy "historial_escritura" on public.historial_versiones
  for insert with check (public.obtener_rol() = 'admin');

-- ============================================================
-- TRIGGER: registrar versión al aprobar un proceso
-- ============================================================
create or replace function public.registrar_cambio_version()
returns trigger
language plpgsql
as $$
begin
  if old.estado != 'activo' and new.estado = 'activo' and old.version != new.version then
    insert into public.historial_versiones (proceso_id, version_anterior, version_nueva, usuario_id, resumen_cambio)
    values (new.id, old.version, new.version, auth.uid(), 'Proceso aprobado y publicado.');
  end if;
  return new;
end;
$$;

create trigger trg_version_proceso
  after update on public.procesos
  for each row execute function public.registrar_cambio_version();

-- ============================================================
-- FUNCIÓN: registrar nuevo usuario en tabla usuarios
-- (se llama desde el hook auth.users post-insert de Supabase)
-- ============================================================
create or replace function public.manejar_nuevo_usuario()
returns trigger
language plpgsql security definer
as $$
begin
  insert into public.usuarios (id, nombre, correo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'rol', 'colaborador')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger trg_nuevo_usuario
  after insert on auth.users
  for each row execute function public.manejar_nuevo_usuario();

-- ============================================================
-- STORAGE: bucket para documentos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('documentos-procesos', 'documentos-procesos', false)
on conflict do nothing;

create policy "documentos_storage_lectura" on storage.objects
  for select using (
    bucket_id = 'documentos-procesos'
    and auth.uid() is not null
  );

create policy "documentos_storage_subida" on storage.objects
  for insert with check (
    bucket_id = 'documentos-procesos'
    and auth.uid() is not null
    and public.obtener_rol() in ('lider', 'admin')
  );

create policy "documentos_storage_eliminar" on storage.objects
  for delete using (
    bucket_id = 'documentos-procesos'
    and public.obtener_rol() in ('lider', 'admin')
  );

-- ============================================================
-- DATOS INICIALES: Gestiones de Asignar SAS
-- ============================================================
insert into public.gestiones (nombre, descripcion, icono, color_soft, color_primary) values
  ('Comercial',                    'Gestión de clientes, cotizaciones y relaciones comerciales.',       'handshake', 'oklch(0.95 0.04 250)', 'oklch(0.42 0.12 250)'),
  ('Selección',                    'Reclutamiento, evaluación y selección de candidatos.',               'users',     'oklch(0.95 0.05 280)', 'oklch(0.45 0.14 280)'),
  ('Servicio y Programación',      'Programación de turnos y gestión del servicio al cliente.',          'workflow',  'oklch(0.95 0.04 195)', 'oklch(0.40 0.12 195)'),
  ('Vinculación',                  'Procesos de contratación, inducción y documentación laboral.',       'folder',    'oklch(0.95 0.05 155)', 'oklch(0.42 0.13 155)'),
  ('Compensación',                 'Nómina, liquidaciones y beneficios para colaboradores.',             'coins',     'oklch(0.96 0.05 70)',  'oklch(0.52 0.14 70)'),
  ('Seguridad Social',             'Afiliaciones, novedades y gestión de seguridad social.',             'shield',    'oklch(0.95 0.04 25)',  'oklch(0.48 0.14 25)'),
  ('SST',                          'Seguridad y Salud en el Trabajo, riesgos y capacitaciones.',         'chip',      'oklch(0.96 0.04 50)',  'oklch(0.55 0.15 50)'),
  ('Jurídica',                     'Contratos, litigios y cumplimiento normativo.',                      'scale',     'oklch(0.95 0.03 260)', 'oklch(0.38 0.10 260)'),
  ('Tecnología',                   'Infraestructura, sistemas y soporte tecnológico.',                   'chip',      'oklch(0.95 0.04 240)', 'oklch(0.40 0.12 240)');
