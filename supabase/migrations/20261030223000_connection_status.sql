-- One status per connection, set in a single tap, replaces four overlapping
-- fields (stage, Homie flag, reach out, reasons) plus fit reason and kind.
--
--   homies     played together, love each other, top tour-mate candidates
--   lets_play  mutual "we should play together", not booked yet
--   prospect   we'd like to; not mutual yet
--   neutral    we know of them, no particular plans (default)
--   avoid      nope
--
-- played_together is a separate fact: what has already happened, versus how
-- the band feels and what's next. Status is a band-private judgment and must
-- never be shared outside the workspace.

create type public.connection_status as enum ('homies', 'lets_play', 'prospect', 'neutral', 'avoid');

alter table public.connections
  add column status public.connection_status not null default 'neutral',
  add column played_together boolean not null default false;

update public.connections set
  status = case
    when is_homie then 'homies'
    when reach_out = 'pass' then 'avoid'
    when reach_out in ('yes', 'maybe') or stage = 'prospect' then 'prospect'
    else 'neutral'
  end::public.connection_status,
  played_together = is_homie or stage = 'active';

-- Status history replaces stage history.
drop trigger connections_log_stage on public.connections;
drop function private.log_stage_change();
drop table public.connection_stage_changes;

create table public.connection_status_changes (
  id bigint generated always as identity primary key,
  workspace_id uuid not null,
  connection_id uuid not null,
  from_status public.connection_status,
  to_status public.connection_status not null,
  changed_by uuid,
  changed_at timestamptz not null default now(),
  foreign key (workspace_id, connection_id)
    references public.connections (workspace_id, id) on delete cascade
);

create index connection_status_changes_connection_idx
  on public.connection_status_changes (connection_id, changed_at desc);

-- Seed history for existing rows so every connection has a starting point.
insert into public.connection_status_changes (workspace_id, connection_id, to_status)
select workspace_id, id, status from public.connections;

create function private.log_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.connection_status_changes
      (workspace_id, connection_id, from_status, to_status, changed_by)
    values
      (new.workspace_id, new.id,
       case when tg_op = 'UPDATE' then old.status end,
       new.status, auth.uid());
  end if;
  return null;
end;
$$;

create trigger connections_log_status
  after insert or update of status on public.connections
  for each row execute function private.log_status_change();

alter table public.connection_status_changes enable row level security;
revoke all on public.connection_status_changes from anon, authenticated;
grant select on public.connection_status_changes to authenticated;

create policy "Members can view status history"
  on public.connection_status_changes for select to authenticated
  using (workspace_id in (select private.my_workspace_ids()));

-- Retire the replaced fields.
alter table public.connections
  drop column stage,
  drop column is_homie,
  drop column reach_out,
  drop column reasons,
  drop column fit_reason,
  drop column kind;

drop type public.relationship_stage;
drop type public.reach_out;
drop type public.connection_reason;
drop type public.connection_kind;

create index connections_status_idx
  on public.connections (workspace_id, status)
  where archived_at is null;
