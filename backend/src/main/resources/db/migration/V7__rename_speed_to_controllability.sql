-- Rename the speed metric to controllability. Existing scores are left as-is.
-- CREATE OR REPLACE VIEW cannot rename columns, so drop and recreate the view.

alter table review_metrics rename column speed to controllability;

alter table review_metrics
    rename constraint review_metrics_speed_check to review_metrics_controllability_check;

drop view cube_metric_aggregates;

create view cube_metric_aggregates as
select
    c.id                                                                          as cube_id,
    c.status,
    c.type,
    c.brand,
    count(rm.review_id)                                                          as review_count,
    avg(rm.controllability)::numeric(4, 2)                                       as avg_controllability,
    avg(rm.stability)::numeric(4, 2)                                             as avg_stability,
    avg(rm.turning)::numeric(4, 2)                                               as avg_turning,
    avg(rm.customizability)::numeric(4, 2)                                       as avg_customizability,
    avg(rm.value)::numeric(4, 2)                                                 as avg_value,
    avg((rm.controllability + rm.stability + rm.turning + rm.customizability + rm.value) / 5.0)::numeric(4, 2) as avg_overall
from cubes c
left join reviews r on r.cube_id = c.id
left join review_metrics rm on rm.review_id = r.id
group by c.id;
