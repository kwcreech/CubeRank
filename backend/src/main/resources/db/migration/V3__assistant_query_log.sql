-- Tracks assistant prompts for rolling hourly rate limits and abuse audit.
create table assistant_query_log (
    id          bigserial primary key,
    user_id     uuid not null references users (id) on delete cascade,
    created_at  timestamptz not null default now(),
    status      text not null
);

create index idx_assistant_query_log_user_created
    on assistant_query_log (user_id, created_at desc);
