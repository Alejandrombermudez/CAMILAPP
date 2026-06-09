-- CAMILAPP — esquema inicial
-- Concilia el DDL original del proyecto con el código actual (sesión 2026-06-08).
-- Diferencias respecto al SQL original, y por qué:
--   * rendimiento.cantidad  → cantidad_ejecutada : el código usa ese nombre; con
--     'cantidad' el upsert de /api/sync fallaría.
--   * Catálogos SERIAL → id explícito (integer PK): los ids se definen en
--     src/lib/catalog-data.ts para que fallback offline, seed y reportes compartan
--     el mismo id (fix de divergencia de ids).
--   * reportes.sync_status : ELIMINADA. Es estado local (IndexedDB); /api/sync la
--     quita del payload, así que en el servidor siempre sería 'pending'.
--   * RLS de las tablas de datos: SIN "Anon full USING(true) WITH CHECK(true)".
--     Ese policy era el agujero de seguridad que se cerró: daba escritura total a la
--     anon key. Ahora la escritura va solo por /api/sync con el service role.
--
-- La app no ha estado en producción: para reconstruir desde cero, descomenta el
-- bloque DROP de abajo antes de ejecutar (recrea con el esquema corregido).

-- drop table if exists avance_efectivo, rendimiento, detalles_actividad_reporte,
--   actividades_reporte, reportes, detalles_catalogo, actividades_catalogo, poligonos cascade;

-- ── Catálogos ────────────────────────────────────────────────────────────────
-- ids definidos en código (no SERIAL) → estables entre offline/seed/reportes.
create table if not exists poligonos (
  id     integer primary key,
  codigo text not null unique,
  nombre text not null
);

create table if not exists actividades_catalogo (
  id     integer primary key,
  nombre text not null unique
);

create table if not exists detalles_catalogo (
  id       integer primary key,
  nombre   text not null unique,
  es_corte boolean not null default false
);

-- ── Informes ─────────────────────────────────────────────────────────────────
create table if not exists reportes (
  id                uuid primary key default gen_random_uuid(),
  profesional       text not null default 'María Camila Mateus Álvarez',
  fecha             date not null,
  poligono_id       integer references poligonos (id),
  numeros_cuadrilla integer[] not null default '{}',
  operarios_hombre  integer not null default 0,
  operarios_mujer   integer not null default 0,
  hora_ingreso      time not null default '06:00',
  hora_salida       time not null default '15:00',
  novedades         text,
  local_id          text not null unique,   -- onConflict de /api/sync
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index if not exists reportes_fecha_idx       on reportes (fecha);
create index if not exists reportes_poligono_id_idx on reportes (poligono_id);

create table if not exists actividades_reporte (
  id               uuid primary key default gen_random_uuid(),
  reporte_id       uuid not null references reportes (id) on delete cascade,
  actividad_nombre text not null,
  es_otra          boolean not null default false,
  orden            integer not null default 0
);
create index if not exists actividades_reporte_reporte_id_idx on actividades_reporte (reporte_id);

create table if not exists detalles_actividad_reporte (
  id                   uuid primary key default gen_random_uuid(),
  actividad_reporte_id uuid not null references actividades_reporte (id) on delete cascade,
  detalle_nombre       text not null,
  es_otro              boolean not null default false,
  es_corte             boolean not null default false,
  orden                integer not null default 0
);
create index if not exists detalles_actividad_reporte_act_idx on detalles_actividad_reporte (actividad_reporte_id);

create table if not exists rendimiento (
  id                       uuid primary key default gen_random_uuid(),
  reporte_id               uuid not null references reportes (id) on delete cascade,
  -- nullable como en el DDL original (tolerancia); el fix de matching garantiza
  -- que detalle_reporte_id llegue informado en el camino feliz.
  actividad_reporte_id     uuid references actividades_reporte (id) on delete cascade,
  detalle_reporte_id       uuid references detalles_actividad_reporte (id) on delete cascade,
  cantidad_ejecutada       numeric not null default 0,
  num_operarios            integer not null default 1,
  porcentaje_area_efectiva numeric(5,2),   -- null = pendiente (semáforo); solo cortes
  created_at               timestamptz not null default now()
);
create index if not exists rendimiento_reporte_id_idx on rendimiento (reporte_id);

create table if not exists avance_efectivo (
  id           uuid primary key default gen_random_uuid(),
  reporte_id   uuid not null references reportes (id) on delete cascade,
  fecha_inicio date not null,
  fecha_fin    date not null,
  created_at   timestamptz not null default now()
);
create index if not exists avance_efectivo_reporte_id_idx on avance_efectivo (reporte_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
-- Catálogos: lectura pública (el cliente los descarga con la anon key).
alter table poligonos            enable row level security;
alter table actividades_catalogo enable row level security;
alter table detalles_catalogo    enable row level security;
create policy "catalogo lectura publica" on poligonos            for select using (true);
create policy "catalogo lectura publica" on actividades_catalogo for select using (true);
create policy "catalogo lectura publica" on detalles_catalogo    for select using (true);

-- Tablas de datos: RLS habilitado SIN políticas para anon. La escritura entra por
-- /api/sync con el service role (omite RLS) tras validar el secreto. Cualquier otro
-- acceso queda denegado por defecto.
-- ⚠ NO añadir "FOR ALL USING (true) WITH CHECK (true)" para anon: reabriría el
--   agujero de escritura pública que se cerró en la sesión 2026-06-08.
alter table reportes                   enable row level security;
alter table actividades_reporte        enable row level security;
alter table detalles_actividad_reporte enable row level security;
alter table rendimiento                enable row level security;
alter table avance_efectivo            enable row level security;
