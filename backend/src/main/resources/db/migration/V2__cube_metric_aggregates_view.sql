-- Per-cube average metrics + review count. Backs the radar chart and feeds
-- the Bayesian leaderboard scoring done in the application layer.
create view cube_metric_aggregates as
select
    c.id                                                                          as cube_id,
    c.status,
    c.type,
    c.brand,
    count(rm.review_id)                                                          as review_count,
    avg(rm.speed)::numeric(4, 2)                                                 as avg_speed,
    avg(rm.stability)::numeric(4, 2)                                             as avg_stability,
    avg(rm.turning)::numeric(4, 2)                                               as avg_turning,
    avg(rm.customizability)::numeric(4, 2)                                       as avg_customizability,
    avg(rm.value)::numeric(4, 2)                                                 as avg_value,
    avg((rm.speed + rm.stability + rm.turning + rm.customizability + rm.value) / 5.0)::numeric(4, 2) as avg_overall
from cubes c
left join reviews r on r.cube_id = c.id
left join review_metrics rm on rm.review_id = r.id
group by c.id;
