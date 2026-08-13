-- Speeds LIVE/STAGING catalog browse: findByStatus + ORDER BY name.
create index idx_cubes_status_name on cubes (status, name);
