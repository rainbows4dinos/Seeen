-- Affiliations get a kind, so Seeen can show members, labels, and label mates
-- from structured data. Role becomes optional detail ("vocals, guitar").
--
--   member      person -> band        (plays in)
--   works_with  person -> other group (books for, runs, works at, hosts)
--   on_label    group  -> label       (released on)
--   related     group  -> group       (side project, split, sister band)
--   other       anything else
--
-- Also: one connection per workspace can be marked as "us" (the band using
-- Seeen), so pages can say "label mate" or "shares a member with us".

create type public.affiliation_kind as enum ('member', 'works_with', 'on_label', 'related', 'other');

alter table public.affiliations
  add column kind public.affiliation_kind not null default 'other';

update public.affiliations a set kind = case
    when f.kind = 'person' and t.kind = 'group' and t.group_type = 'band' then 'member'
    when f.kind = 'person' and t.kind = 'group' then 'works_with'
    when f.kind = 'group' and t.kind = 'group' and t.group_type = 'label' then 'on_label'
    when f.kind = 'group' and t.kind = 'group' then 'related'
    else 'other'
  end::public.affiliation_kind
from public.connections f, public.connections t
where f.id = a.from_connection_id and t.id = a.to_connection_id;

alter table public.affiliations
  alter column role drop not null,
  drop constraint affiliations_role_check,
  add constraint affiliations_role_check check (role is null or char_length(role) between 1 and 80),
  drop constraint affiliations_from_connection_id_to_connection_id_role_key,
  add constraint affiliations_one_per_kind unique (from_connection_id, to_connection_id, kind);

create index affiliations_kind_idx on public.affiliations (workspace_id, kind);

-- "This is us"
alter table public.connections
  add column is_us boolean not null default false,
  add constraint connections_us_is_group check (not is_us or kind = 'group');

create unique index connections_one_us_per_workspace
  on public.connections (workspace_id) where is_us;
