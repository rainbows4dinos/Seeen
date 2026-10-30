-- Split types into people and groups.
--
-- A person can do several things (sings, DJs, makes videos). A band, venue,
-- or org is one thing. So a connection is either:
--   kind = 'person' with one or more person_roles, or
--   kind = 'group'  with exactly one group_type.

create type public.connection_kind as enum ('person', 'group');

create type public.person_role as enum (
  'musician', 'dj', 'promoter', 'booker', 'manager', 'label_owner',
  'producer', 'recording_engineer', 'live_sound_engineer',
  'photographer', 'videographer', 'artist_designer', 'writer',
  'radio_host', 'other'
);

create type public.group_type as enum (
  'band', 'venue', 'label', 'recording_studio', 'production_studio',
  'radio_station', 'press', 'promoter_collective', 'other'
);

alter table public.connections
  add column kind public.connection_kind,
  add column person_roles public.person_role[] not null default '{}',
  add column group_type public.group_type;

-- Backfill from the old mixed list. Anything with a group-like type becomes
-- that group; everything else is a person.
update public.connections set
  kind = case
    when types && array['band', 'venue', 'label', 'radio', 'press']::public.connection_type[]
      then 'group' else 'person'
  end::public.connection_kind,
  group_type = case
    when 'band' = any(types) then 'band'
    when 'venue' = any(types) then 'venue'
    when 'label' = any(types) then 'label'
    when 'radio' = any(types) then 'radio_station'
    when 'press' = any(types) then 'press'
  end::public.group_type;

update public.connections set
  person_roles = coalesce(
    nullif(
      array(
        select distinct case t
          when 'musician' then 'musician'
          when 'dj' then 'dj'
          when 'promoter' then 'promoter'
          when 'photographer' then 'photographer'
          when 'videographer' then 'videographer'
          else 'other'
        end::public.person_role
        from unnest(types) as t
      ),
      '{}'
    ),
    array['other']::public.person_role[]
  )
where kind = 'person';

alter table public.connections
  alter column kind set not null,
  alter column kind set default 'group',
  drop column types,
  add constraint connections_kind_shape check (
    (kind = 'person' and group_type is null and cardinality(person_roles) > 0)
    or (kind = 'group' and group_type is not null and cardinality(person_roles) = 0)
  );

drop type public.connection_type;

create index connections_group_type_idx on public.connections (workspace_id, group_type) where kind = 'group';
create index connections_person_roles_idx on public.connections using gin (person_roles);
