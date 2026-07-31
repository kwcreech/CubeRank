-- CubeRank initial schema
-- Requires the pgvector extension. This statement is idempotent and safe to
-- run even if you already enabled it manually in the Supabase dashboard.
create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- users
-- id is intentionally NOT auto-generated: it must equal the corresponding
-- Supabase Auth `auth.users.id`. Rows are created just-in-time by the backend
-- the first time an authenticated request arrives for a new Supabase user.
-- ---------------------------------------------------------------------------
create table users (
    id          uuid primary key,
    email       varchar(255) not null unique,
    username    varchar(50) not null unique,
    avatar_url  text,
    role        varchar(20) not null default 'USER' check (role in ('USER', 'ADMIN')),
    created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- cubes
-- Populated by the TheCubicle catalog ingest pipeline. New rows always start
-- in STAGING; an admin must flip them to LIVE before they are user-facing.
-- ---------------------------------------------------------------------------
create table cubes (
    id                  bigserial primary key,
    name                varchar(255) not null,
    brand               varchar(100) not null,
    type                varchar(50) not null,
    status              varchar(20) not null default 'STAGING' check (status in ('STAGING', 'LIVE')),
    shopify_product_id  bigint,
    source_store        varchar(50) not null default 'thecubicle',
    image_url           text,
    product_url         text,
    created_at          timestamptz not null default now(),
    updated_at          timestamptz not null default now(),
    constraint uq_cubes_source_product unique (source_store, shopify_product_id)
);

create index idx_cubes_status_type on cubes (status, type);
create index idx_cubes_status_brand on cubes (status, brand);

-- ---------------------------------------------------------------------------
-- reviews
-- One review per user per cube (v1).
-- ---------------------------------------------------------------------------
create table reviews (
    id               bigserial primary key,
    user_id          uuid not null references users (id) on delete cascade,
    cube_id          bigint not null references cubes (id) on delete cascade,
    written_content  text not null,
    youtube_url      text,
    created_at       timestamptz not null default now(),
    updated_at       timestamptz not null default now(),
    constraint uq_reviews_user_cube unique (user_id, cube_id)
);

create index idx_reviews_cube_id on reviews (cube_id);
create index idx_reviews_user_id on reviews (user_id);
create index idx_reviews_created_at on reviews (created_at desc);

-- ---------------------------------------------------------------------------
-- review_metrics
-- 1:1 with reviews. "turning" replaces the originally sketched corner_cutting.
-- ---------------------------------------------------------------------------
create table review_metrics (
    review_id         bigint primary key references reviews (id) on delete cascade,
    speed             smallint not null check (speed between 1 and 10),
    stability         smallint not null check (stability between 1 and 10),
    turning           smallint not null check (turning between 1 and 10),
    customizability   smallint not null check (customizability between 1 and 10),
    value             smallint not null check (value between 1 and 10)
);

-- ---------------------------------------------------------------------------
-- embeddings
-- One vector per review, generated from written_content via
-- text-embedding-3-small (1536 dimensions).
-- ---------------------------------------------------------------------------
create table embeddings (
    review_id   bigint primary key references reviews (id) on delete cascade,
    embedding   vector(1536) not null,
    updated_at  timestamptz not null default now()
);

-- HNSW index for fast approximate cosine-distance search.
create index idx_embeddings_hnsw on embeddings using hnsw (embedding vector_cosine_ops);
