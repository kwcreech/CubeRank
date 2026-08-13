-- Client IP for a secondary rolling hourly cap across accounts on the same network.
alter table assistant_query_log
    add column client_ip varchar(45);

create index idx_assistant_query_log_ip_created
    on assistant_query_log (client_ip, created_at desc);
