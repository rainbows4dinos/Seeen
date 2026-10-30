-- Shared, read-only list of towns (GeoNames, CC BY 4.0). Not workspace data:
-- every signed-in user can search it, nobody can change it through the API.
-- Data loads in the next migration.

create table public.places (
  id integer primary key,          -- GeoNames id
  name text not null,
  ascii_name text not null,
  region_code text,                -- US state / Canadian province, e.g. OR, BC
  region_name text,                -- Oregon, British Columbia
  country_code text not null,      -- ISO 3166-1 alpha-2
  country_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  population integer not null default 0
);

alter table public.places enable row level security;
revoke all on public.places from anon, authenticated;
grant select on public.places to authenticated;

create policy "Signed-in users can read places"
  on public.places for select to authenticated
  using (true);

-- Search as you type: "portland", "portland, or", "portland maine",
-- "vancouver, bc", "berlin, germany". Prefix match on the town name, an
-- optional qualifier after a comma or the last space matches state,
-- province, or country. Exact names first, then biggest, with a boost for
-- countries the caller prefers (the workspace's own).
create function public.search_places(
  q text,
  max_results integer default 8,
  prefer_countries text[] default '{}'
)
returns setof public.places
language sql
stable
security invoker
set search_path = ''
as $$
  with parts as (
    select
      lower(trim(split_part(q, ',', 1))) as town,
      nullif(lower(trim(split_part(q, ',', 2))), '') as qual
  )
  select p.*
  from public.places p, parts
  where length(parts.town) >= 2
    and (lower(p.ascii_name) like parts.town || '%' or lower(p.name) like parts.town || '%')
    and (
      parts.qual is null
      or lower(p.region_code) = parts.qual
      or lower(p.region_name) like parts.qual || '%'
      or lower(p.country_code) = parts.qual
      or lower(p.country_name) like parts.qual || '%'
    )
  order by (lower(p.ascii_name) = parts.town or lower(p.name) = parts.town) desc,
           -- Preferred countries get a 20x boost: Walla Walla beats Wallasey,
           -- but Berlin, Germany still beats Berlin, New Hampshire.
           p.population::bigint * (case when p.country_code = any(prefer_countries) then 20 else 1 end) desc
  limit least(greatest(max_results, 1), 20)
$$;

revoke all on function public.search_places from public, anon;
grant execute on function public.search_places to authenticated;
