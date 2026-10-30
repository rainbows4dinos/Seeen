-- Replace urgency-style priority with the band's own intent.
--
-- Seeen never ranks people or tells a band something is urgent. Instead a
-- connection can carry:
--   reach_out  yes / maybe / pass. "pass" is the honest "nope": it drops a
--              connection from prospect lists without archiving its history.
--   reasons    why the band wants to connect. Any combination of
--              dig_them (we like the music), good_move (strategic),
--              friends (the relationship matters even if the music isn't ours).
--
-- Both are band-private judgments. They live on the workspace-owned
-- connection row and must never be shared outside the workspace.
--
-- Next actions lose their priority. The follow-up date is enough.

create type public.reach_out as enum ('yes', 'maybe', 'pass');

create type public.connection_reason as enum ('dig_them', 'good_move', 'friends');

alter table public.connections
  add column reach_out public.reach_out,
  add column reasons public.connection_reason[] not null default '{}';

create index connections_reach_out_idx
  on public.connections (workspace_id, reach_out)
  where archived_at is null;

-- Drop next-action priority and the RPC parameter that set it.
drop function public.set_next_action(uuid, text, date, public.action_priority, uuid);

alter table public.next_actions drop column priority;

drop type public.action_priority;

create function public.set_next_action(
  p_connection_id uuid,
  p_description text,
  p_due_on date default null,
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
    (workspace_id, connection_id, description, due_on, assignee_id)
  values
    (v_workspace_id, p_connection_id, p_description, p_due_on, p_assignee_id)
  returning * into v_action;

  return v_action;
end;
$$;

revoke all on function public.set_next_action from public, anon;
grant execute on function public.set_next_action to authenticated;
