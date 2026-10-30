-- Seeen MVP schema: one private workspace per band, shared by its members.
--
-- Access model
--   * Every private table carries workspace_id. RLS allows a row only when the
--     signed-in user is a member of that workspace (private.my_workspace_ids()).
--   * Signing up does not grant access. Memberships are added by an admin
--     (SQL editor for now; the invite flow is still an open decision).
--   * Child rows reference parents through (workspace_id, id) composite keys,
--     so a row can never point at a record in another workspace.
--
-- History rules
--   * Connections are archived (archived_at), not deleted. No delete policy.
--   * Relationship stage changes are logged to connection_stage_changes.
--   * Next actions are never edited once closed; replacing one closes the old
--     row and inserts a new one (public.set_next_action).
--   * Outreach entries can be edited or removed only by their author.

create schema if not exists private;

-- ---------------------------------------------------------------------------
-- Types
-- ---------------------------------------------------------------------------

create type public.member_role as enum ('owner', 'member');

create type public.connection_kind as enum ('person', 'band', 'organization', 'outlet');

create type public.connection_type as enum (
  'band', 'musician', 'promoter', 'venue', 'dj', 'playlister',
  'label', 'press', 'radio', 'photographer', 'videographer', 'other'
);

create type public.relationship_stage as enum ('prospect', 'connected', 'active', 'inactive');

create type public.outreach_channel as enum (
  'in_person', 'email', 'text', 'call', 'instagram', 'other_social', 'other'
);

create type public.action_priority as enum ('low', 'normal', 'high');

-- replaced: superseded by a newer next action for the same connection.
create type public.action_status as enum ('open', 'done', 'dropped', 'replaced');

-- ---------------------------------------------------------------------------
-- Workspaces and membership
-- ---------------------------------------------------------------------------

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role public.member_role not null default 'member',
  display_name text not null check (char_length(display_name) between 1 and 80),
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);

create index workspace_members_user_id_idx on public.workspace_members (user_id);

-- Workspaces the current user belongs to. SECURITY DEFINER so policies on
-- workspace_members don't recurse into themselves. Lives in a schema the API
-- doesn't expose.
create function private.my_workspace_ids()
returns setof uuid
language sql
stable
security definer
set search_path = ''
as $$
  select workspace_id
  from public.workspace_members
  where user_id = (select auth.uid())
$$;

revoke all on schema private from public;
grant usage on schema private to authenticated;
revoke all on function private.my_workspace_ids() from public;
grant execute on function private.my_workspace_ids() to authenticated;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Places and scenes
-- ---------------------------------------------------------------------------

create table public.localities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  region text,
  country text,
  created_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique nulls not distinct (workspace_id, name, region, country)
);

create table public.scenes (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  description text,
  locality_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  unique (workspace_id, name),
  foreign key (workspace_id, locality_id)
    references public.localities (workspace_id, id) on delete set null (locality_id)
);

create index scenes_locality_id_idx on public.scenes (locality_id);

create trigger scenes_set_updated_at
  before update on public.scenes
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Connections
-- ---------------------------------------------------------------------------

create table public.connections (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 200),
  kind public.connection_kind not null default 'person',
  types public.connection_type[] not null default '{}',
  stage public.relationship_stage not null default 'prospect',
  -- Band-wide favorite. Independent of stage, not inherited via affiliations.
  is_homie boolean not null default false,
  -- Why this connection matters (mainly for prospects). Member knowledge,
  -- not verified fact.
  fit_reason text,
  can_help_with text[] not null default '{}',
  locality_id uuid,
  email text,
  phone text,
  notes text,
  archived_at timestamptz,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, id),
  foreign key (workspace_id, locality_id)
    references public.localities (workspace_id, id) on delete set null (locality_id),
  foreign key (workspace_id, created_by)
    references public.workspace_members (workspace_id, user_id) on delete set null (created_by)
);

create index connections_workspace_name_idx on public.connections (workspace_id, lower(name));
create index connections_workspace_stage_idx on public.connections (workspace_id, stage);
create index connections_homies_idx on public.connections (workspace_id) where is_homie;
create index connections_types_idx on public.connections using gin (types);
create index connections_locality_id_idx on public.connections (locality_id);

create trigger connections_set_updated_at
  before update on public.connections
  for each row execute function private.set_updated_at();

create table public.connection_links (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  connection_id uuid not null,
  label text,
  url text not null check (url ~* '^https?://'),
  position smallint not null default 0,
  created_at timestamptz not null default now(),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade
);

create index connection_links_connection_id_idx on public.connection_links (connection_id);

create table public.connection_scenes (
  workspace_id uuid not null,
  connection_id uuid not null,
  scene_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (connection_id, scene_id),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade,
  foreign key (workspace_id, scene_id)
    references public.scenes (workspace_id, id) on delete cascade
);

create index connection_scenes_scene_id_idx on public.connection_scenes (scene_id);

-- A directed link: "from" is affiliated with "to" in a role
-- (Jo -> vocals -> The Band; Jo -> books for -> The Venue).
-- A band's members are its incoming affiliations.
create table public.affiliations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  from_connection_id uuid not null,
  to_connection_id uuid not null,
  role text not null check (char_length(role) between 1 and 80),
  is_current boolean not null default true,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (from_connection_id <> to_connection_id),
  unique (from_connection_id, to_connection_id, role),
  foreign key (workspace_id, from_connection_id)
    references public.connections (workspace_id, id) on delete cascade,
  foreign key (workspace_id, to_connection_id)
    references public.connections (workspace_id, id) on delete cascade
);

create index affiliations_to_connection_id_idx on public.affiliations (to_connection_id);

create trigger affiliations_set_updated_at
  before update on public.affiliations
  for each row execute function private.set_updated_at();

-- ---------------------------------------------------------------------------
-- Stage history
-- ---------------------------------------------------------------------------

create table public.connection_stage_changes (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  connection_id uuid not null,
  from_stage public.relationship_stage,
  to_stage public.relationship_stage not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade
);

create index connection_stage_changes_connection_idx
  on public.connection_stage_changes (connection_id, changed_at desc);

-- SECURITY DEFINER: members can't insert history rows directly.
create function private.log_stage_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    insert into public.connection_stage_changes
      (workspace_id, connection_id, from_stage, to_stage, changed_by)
    values
      (new.workspace_id, new.id,
       case when tg_op = 'UPDATE' then old.stage end,
       new.stage, auth.uid());
  end if;
  return null;
end;
$$;

create trigger connections_log_stage
  after insert or update of stage on public.connections
  for each row execute function private.log_stage_change();

-- ---------------------------------------------------------------------------
-- Outreach and next actions
-- ---------------------------------------------------------------------------

create table public.outreach_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  connection_id uuid not null,
  occurred_on date not null default current_date,
  channel public.outreach_channel not null default 'other',
  summary text not null check (char_length(summary) between 1 and 4000),
  author_id uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade,
  foreign key (workspace_id, author_id)
    references public.workspace_members (workspace_id, user_id) on delete set null (author_id)
);

create index outreach_entries_connection_idx
  on public.outreach_entries (connection_id, occurred_on desc);

create trigger outreach_entries_set_updated_at
  before update on public.outreach_entries
  for each row execute function private.set_updated_at();

create table public.next_actions (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  connection_id uuid not null,
  description text not null check (char_length(description) between 1 and 1000),
  due_on date,
  priority public.action_priority not null default 'normal',
  assignee_id uuid,
  status public.action_status not null default 'open',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  closed_at timestamptz,
  closed_by uuid,
  check ((status = 'open') = (closed_at is null)),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade,
  foreign key (workspace_id, assignee_id)
    references public.workspace_members (workspace_id, user_id) on delete set null (assignee_id),
  foreign key (workspace_id, created_by)
    references public.workspace_members (workspace_id, user_id) on delete set null (created_by)
);

-- At most one current next action per connection.
create unique index next_actions_one_open_idx
  on public.next_actions (connection_id) where status = 'open';
create index next_actions_due_idx
  on public.next_actions (workspace_id, due_on) where status = 'open';
create index next_actions_assignee_idx
  on public.next_actions (assignee_id) where status = 'open';

-- Closed actions are history and can't change. Closing stamps who and when.
create function private.guard_next_action()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if old.status <> 'open' then
    raise exception 'closed next actions are history and cannot be edited'
      using errcode = 'check_violation';
  end if;
  if new.status <> 'open' then
    new.closed_at := now();
    new.closed_by := auth.uid();
  end if;
  return new;
end;
$$;

create trigger next_actions_guard
  before update on public.next_actions
  for each row execute function private.guard_next_action();

-- Replace a connection's current next action, keeping the old one as history.
-- SECURITY INVOKER: runs under the caller's RLS.
create function public.set_next_action(
  p_connection_id uuid,
  p_description text,
  p_due_on date default null,
  p_priority public.action_priority default 'normal',
  p_assignee_id uuid default null
)
returns public.next_actions
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_action public.next_actions;
begin
  select workspace_id into v_workspace_id
  from public.connections
  where id = p_connection_id;

  if v_workspace_id is null then
    raise exception 'connection not found' using errcode = 'no_data_found';
  end if;

  update public.next_actions
  set status = 'replaced'
  where connection_id = p_connection_id and status = 'open';

  insert into public.next_actions
    (workspace_id, connection_id, description, due_on, priority, assignee_id)
  values
    (v_workspace_id, p_connection_id, p_description, p_due_on, p_priority, p_assignee_id)
  returning * into v_action;

  return v_action;
end;
$$;

-- ---------------------------------------------------------------------------
-- Grants: authenticated users only. anon gets nothing.
-- ---------------------------------------------------------------------------

revoke all on all tables in schema public from anon, authenticated;
revoke all on function public.set_next_action from public, anon;

grant select on public.workspaces, public.workspace_members to authenticated;
grant select, insert, update on public.connections to authenticated;
grant select, insert, update, delete on
  public.localities, public.scenes, public.connection_links,
  public.connection_scenes, public.affiliations,
  public.outreach_entries to authenticated;
grant select, insert, update on public.next_actions to authenticated;
grant select on public.connection_stage_changes to authenticated;
grant execute on function public.set_next_action to authenticated;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.localities enable row level security;
alter table public.scenes enable row level security;
alter table public.connections enable row level security;
alter table public.connection_links enable row level security;
alter table public.connection_scenes enable row level security;
alter table public.affiliations enable row level security;
alter table public.connection_stage_changes enable row level security;
alter table public.outreach_entries enable row level security;
alter table public.next_actions enable row level security;

create policy "Members can view their workspaces"
  on public.workspaces for select to authenticated
  using (id in (select private.my_workspace_ids()));

create policy "Members can view fellow members"
  on public.workspace_members for select to authenticated
  using (workspace_id in (select private.my_workspace_ids()));

-- Full read/write for members on shared directory tables.
do $$
declare
  t text;
begin
  foreach t in array array[
    'localities', 'scenes', 'connection_links', 'connection_scenes', 'affiliations'
  ] loop
    execute format(
      'create policy "Members can view" on public.%I for select to authenticated
         using (workspace_id in (select private.my_workspace_ids()))', t);
    execute format(
      'create policy "Members can add" on public.%I for insert to authenticated
         with check (workspace_id in (select private.my_workspace_ids()))', t);
    execute format(
      'create policy "Members can edit" on public.%I for update to authenticated
         using (workspace_id in (select private.my_workspace_ids()))
         with check (workspace_id in (select private.my_workspace_ids()))', t);
    execute format(
      'create policy "Members can remove" on public.%I for delete to authenticated
         using (workspace_id in (select private.my_workspace_ids()))', t);
  end loop;
end;
$$;

-- Connections and next actions: view, add, edit. No delete (archive instead).
do $$
declare
  t text;
begin
  foreach t in array array['connections', 'next_actions'] loop
    execute format(
      'create policy "Members can view" on public.%I for select to authenticated
         using (workspace_id in (select private.my_workspace_ids()))', t);
    execute format(
      'create policy "Members can add" on public.%I for insert to authenticated
         with check (workspace_id in (select private.my_workspace_ids()))', t);
    execute format(
      'create policy "Members can edit" on public.%I for update to authenticated
         using (workspace_id in (select private.my_workspace_ids()))
         with check (workspace_id in (select private.my_workspace_ids()))', t);
  end loop;
end;
$$;

create policy "Members can view stage history"
  on public.connection_stage_changes for select to authenticated
  using (workspace_id in (select private.my_workspace_ids()));

create policy "Members can view outreach"
  on public.outreach_entries for select to authenticated
  using (workspace_id in (select private.my_workspace_ids()));

create policy "Members can log outreach as themselves"
  on public.outreach_entries for insert to authenticated
  with check (
    workspace_id in (select private.my_workspace_ids())
    and author_id = (select auth.uid())
  );

create policy "Authors can edit their outreach"
  on public.outreach_entries for update to authenticated
  using (
    workspace_id in (select private.my_workspace_ids())
    and author_id = (select auth.uid())
  )
  with check (
    workspace_id in (select private.my_workspace_ids())
    and author_id = (select auth.uid())
  );

create policy "Authors can remove their outreach"
  on public.outreach_entries for delete to authenticated
  using (
    workspace_id in (select private.my_workspace_ids())
    and author_id = (select auth.uid())
  );
