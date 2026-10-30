-- Workspace localities now point at a verified place. Existing localities are
-- matched by town name plus state/province/country, duplicates that resolve
-- to the same place are merged ("Portland, OR" and "Portland, Oregon"), and
-- coordinates are copied over for later "towns near X" lookups.

create index places_ascii_prefix_idx on public.places (lower(ascii_name) text_pattern_ops);
create index places_name_prefix_idx on public.places (lower(name) text_pattern_ops);

alter table public.localities
  add column place_id integer references public.places (id),
  add column region_code text,
  add column country_code text,
  add column latitude double precision,
  add column longitude double precision;

-- Best match for each existing locality: same town name, and a region or
-- country that agrees when one was typed. Largest town wins ties.
with matches as (
  select distinct on (l.id) l.id as locality_id, p.id as place_id
  from public.localities l
  join public.places p
    on lower(p.ascii_name) = lower(trim(l.name)) or lower(p.name) = lower(trim(l.name))
  where (
      l.region is null or trim(l.region) = ''
      or lower(trim(l.region)) in (lower(p.region_code), lower(p.region_name))
    )
    and (
      l.country is null or trim(l.country) = ''
      or lower(trim(l.country)) in (lower(p.country_code), lower(p.country_name))
      or (p.country_code = 'US' and lower(trim(l.country)) in ('usa', 'united states of america', 'u.s.', 'u.s.a.'))
    )
  order by l.id, p.population desc
)
update public.localities l set place_id = m.place_id
from matches m where m.locality_id = l.id;

-- Merge duplicates: keep the oldest locality per (workspace, place) and move
-- everything that pointed at the others onto it.
with ranked as (
  select id, workspace_id, place_id,
         first_value(id) over (partition by workspace_id, place_id order by created_at, id) as keep_id
  from public.localities
  where place_id is not null
), dupes as (
  select id, keep_id from ranked where id <> keep_id
)
update public.connections c set locality_id = d.keep_id
from dupes d where c.locality_id = d.id;

with ranked as (
  select id, workspace_id, place_id,
         first_value(id) over (partition by workspace_id, place_id order by created_at, id) as keep_id
  from public.localities
  where place_id is not null
), dupes as (
  select id, keep_id from ranked where id <> keep_id
)
update public.scenes s set locality_id = d.keep_id
from dupes d where s.locality_id = d.id;

delete from public.localities l
using (
  select id, first_value(id) over (partition by workspace_id, place_id order by created_at, id) as keep_id
  from public.localities where place_id is not null
) r
where l.id = r.id and r.id <> r.keep_id;

-- Normalize display fields from the verified place.
update public.localities l set
  name = p.name,
  region = coalesce(p.region_name, l.region),
  region_code = p.region_code,
  country = p.country_name,
  country_code = p.country_code,
  latitude = p.latitude,
  longitude = p.longitude
from public.places p
where p.id = l.place_id;

alter table public.localities
  add constraint localities_one_per_place unique (workspace_id, place_id);
