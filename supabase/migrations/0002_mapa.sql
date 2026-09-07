-- CAMILAPP — georreferenciación (mapa): puntos y núcleos
-- Sesión 2026-08-31. Sigue las mismas convenciones que 0001_init.sql:
--   * local_id text unique  → onConflict para el upsert de /api/sync.
--   * Geometría SIN PostGIS: puntos como lat/lng (double precision) y núcleos
--     como jsonb de vértices [{lat,lng}, ...]. Suficiente para dibujar/consultar
--     por polígono. Si más adelante se necesitan consultas espaciales, migrar a
--     PostGIS (geography) es un paso aparte.
--   * RLS habilitado SIN políticas para anon: la escritura entra por /api/sync con
--     el service role. La app lee los puntos/núcleos desde IndexedDB (local-first),
--     igual que los reportes, así que no se exponen a la anon key.
--     ⚠ NO añadir "FOR ALL USING (true) WITH CHECK (true)" para anon.

-- drop table if exists puntos, nucleos cascade;

create table if not exists puntos (
  id          uuid primary key default gen_random_uuid(),
  poligono_id integer references poligonos (id),
  reporte_id  uuid references reportes (id) on delete set null,
  nombre      text not null default '',
  tipo        text not null default 'otro',
  lat         double precision not null,
  lng         double precision not null,
  altitud     double precision,
  precision   double precision,
  notas       text,
  origen      text not null default 'gps',   -- 'gps' | 'import' | 'manual'
  local_id    text not null unique,
  created_at  timestamptz not null default now()
);
create index if not exists puntos_poligono_id_idx on puntos (poligono_id);
create index if not exists puntos_reporte_id_idx  on puntos (reporte_id);

-- Núcleo = punto de trazado de un módulo de nucleación (escenario + tipo).
create table if not exists nucleos (
  id          uuid primary key default gen_random_uuid(),
  reporte_id  uuid references reportes (id) on delete set null,
  poligono_id integer references poligonos (id),
  escenario   text not null,                 -- clave del escenario (diseño florístico)
  tipo        integer not null,              -- 1-4 (tipo de núcleo)
  lat         double precision not null,
  lng         double precision not null,
  altitud     double precision,
  precision   double precision,
  notas       text,
  origen      text not null default 'gps',
  local_id    text not null unique,
  created_at  timestamptz not null default now()
);
create index if not exists nucleos_reporte_id_idx  on nucleos (reporte_id);
create index if not exists nucleos_poligono_id_idx on nucleos (poligono_id);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table puntos  enable row level security;
alter table nucleos enable row level security;
-- Sin políticas para anon (fail-closed). Escritura solo por /api/sync (service role).
