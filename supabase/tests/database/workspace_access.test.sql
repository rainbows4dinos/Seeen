-- Workspace access and history rules. Run with: npm run db:test
-- Fixture data is fictional and rolled back at the end.
begin;
create extension if not exists pgtap with schema extensions;

select plan(37);

-- ---------------------------------------------------------------------------
-- Fixtures (as postgres)
--   ws_merwulf: alex (owner), sam (member)
--   ws_other:   cora (member)
--   dana:       signed up, no membership
-- ---------------------------------------------------------------------------

insert into auth.users (id, email) values
  ('f1111111-1111-1111-1111-111111111111', 'test-alex@example.com'),
  ('f2222222-2222-2222-2222-222222222222', 'test-sam@example.com'),
  ('f3333333-3333-3333-3333-333333333333', 'test-cora@example.com'),
  ('f4444444-4444-4444-4444-444444444444', 'test-dana@example.com');

insert into public.workspaces (id, name) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'Merwulf'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'Other Band');

insert into public.workspace_members (workspace_id, user_id, role, display_name) values
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'f1111111-1111-1111-1111-111111111111', 'owner', 'Alex'),
  ('aaaaaaaa-0000-0000-0000-0000000000f1', 'f2222222-2222-2222-2222-222222222222', 'member', 'Sam'),
  ('bbbbbbbb-0000-0000-0000-0000000000f2', 'f3333333-3333-3333-3333-333333333333', 'member', 'Cora');

insert into public.connections (id, workspace_id, name, kind, types) values
  ('c0000000-0000-0000-0000-0000000000f1', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'The Tin Hollows', 'band', '{band}'),
  ('c0000000-0000-0000-0000-0000000000f2', 'aaaaaaaa-0000-0000-0000-0000000000f1', 'Jo Example', 'person', '{musician,dj}'),
  ('c0000000-0000-0000-0000-0000000000f3', 'bbbbbbbb-0000-0000-0000-0000000000f2', 'Elsewhere Hall', 'organization', '{venue}');

-- ---------------------------------------------------------------------------
-- Signed out (anon)
-- ---------------------------------------------------------------------------

set local role anon;
select set_config('request.jwt.claims', '', true);

select throws_ok(
  'select count(*) from public.connections',
  '42501', null,
  'anon cannot read connections'
);
select throws_ok(
  'select count(*) from public.workspaces',
  '42501', null,
  'anon cannot read workspaces'
);

-- ---------------------------------------------------------------------------
-- Signed up, no membership (dana)
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f4444444-4444-4444-4444-444444444444","role":"authenticated"}', true);

select is((select count(*) from public.workspaces), 0::bigint, 'non-member sees no workspaces');
select is((select count(*) from public.workspace_members), 0::bigint, 'non-member sees no members');
select is((select count(*) from public.connections), 0::bigint, 'non-member sees no connections');
select throws_ok(
  $$insert into public.connections (workspace_id, name)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1', 'Sneaky')$$,
  '42501', null,
  'non-member cannot add a connection'
);
select throws_ok(
  $$insert into public.workspace_members (workspace_id, user_id, display_name)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1', 'f4444444-4444-4444-4444-444444444444', 'Dana')$$,
  '42501', null,
  'non-member cannot add themselves to a workspace'
);
select throws_ok(
  $$insert into public.workspaces (name) values ('My Own')$$,
  '42501', null,
  'users cannot create workspaces through the API'
);
select throws_ok(
  $$select public.set_next_action('c0000000-0000-0000-0000-0000000000f1', 'Email them')$$,
  'P0002', 'connection not found',
  'non-member cannot set a next action'
);

update public.connections set name = 'Hacked' where id = 'c0000000-0000-0000-0000-0000000000f1';

-- ---------------------------------------------------------------------------
-- Member of a different workspace (cora)
-- ---------------------------------------------------------------------------

select set_config('request.jwt.claims', '{"sub":"f3333333-3333-3333-3333-333333333333","role":"authenticated"}', true);

select results_eq(
  'select name from public.connections order by name',
  array['Elsewhere Hall'],
  'other-workspace member sees only their own connections'
);
select is((select count(*) from public.workspace_members), 1::bigint, 'other-workspace member sees only their own roster');

update public.connections set is_homie = true where id = 'c0000000-0000-0000-0000-0000000000f2';

select throws_ok(
  $$insert into public.affiliations (workspace_id, from_connection_id, to_connection_id, role)
    values ('bbbbbbbb-0000-0000-0000-0000000000f2',
            'c0000000-0000-0000-0000-0000000000f3',
            'c0000000-0000-0000-0000-0000000000f1', 'books for')$$,
  '23503', null,
  'affiliations cannot link across workspaces'
);

-- ---------------------------------------------------------------------------
-- Writes from outsiders had no effect (checked as postgres)
-- ---------------------------------------------------------------------------

reset role;

select is(
  (select name from public.connections where id = 'c0000000-0000-0000-0000-0000000000f1'),
  'The Tin Hollows',
  'non-member update changed nothing'
);
select is(
  (select is_homie from public.connections where id = 'c0000000-0000-0000-0000-0000000000f2'),
  false,
  'other-workspace update changed nothing'
);

-- ---------------------------------------------------------------------------
-- Member (alex)
-- ---------------------------------------------------------------------------

set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"f1111111-1111-1111-1111-111111111111","role":"authenticated"}', true);

select is((select count(*) from public.connections), 2::bigint, 'member sees their workspace connections');
select is((select count(*) from public.workspace_members), 2::bigint, 'member sees their bandmates');

select lives_ok(
  $$insert into public.connections (id, workspace_id, name, kind, types)
    values ('c0000000-0000-0000-0000-0000000000f4',
            'aaaaaaaa-0000-0000-0000-0000000000f1', 'Basement Saints', 'band', '{band}')$$,
  'member can add a connection'
);
select is(
  (select created_by from public.connections where id = 'c0000000-0000-0000-0000-0000000000f4'),
  'f1111111-1111-1111-1111-111111111111'::uuid,
  'created_by defaults to the signed-in member'
);
select throws_ok(
  $$insert into public.connections (workspace_id, name)
    values ('bbbbbbbb-0000-0000-0000-0000000000f2', 'Wrong Band')$$,
  '42501', null,
  'member cannot add to another workspace'
);

select lives_ok(
  $$insert into public.affiliations (workspace_id, from_connection_id, to_connection_id, role)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1',
            'c0000000-0000-0000-0000-0000000000f2',
            'c0000000-0000-0000-0000-0000000000f1', 'vocals')$$,
  'member can link a person to a band'
);

-- Homie and stage are independent.
update public.connections set is_homie = true where id = 'c0000000-0000-0000-0000-0000000000f1';
update public.connections set stage = 'connected' where id = 'c0000000-0000-0000-0000-0000000000f1';
select is(
  (select is_homie from public.connections where id = 'c0000000-0000-0000-0000-0000000000f1'),
  true,
  'Homie flag survives a stage change'
);
select results_eq(
  $$select from_stage::text, to_stage::text, changed_by
    from public.connection_stage_changes
    where connection_id = 'c0000000-0000-0000-0000-0000000000f1'
    order by id$$,
  $$values (null::text, 'prospect'::text, null::uuid),
           ('prospect', 'connected', 'f1111111-1111-1111-1111-111111111111'::uuid)$$,
  'stage changes are logged with who made them'
);
select throws_ok(
  $$insert into public.connection_stage_changes (workspace_id, connection_id, to_stage)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1', 'c0000000-0000-0000-0000-0000000000f1', 'active')$$,
  '42501', null,
  'stage history cannot be written directly'
);

select throws_ok(
  $$delete from public.connections where id = 'c0000000-0000-0000-0000-0000000000f4'$$,
  '42501', null,
  'connections cannot be deleted (archive instead)'
);

-- Reach out and reasons are band-private and editable by members.
select lives_ok(
  $$update public.connections
    set reach_out = 'maybe', reasons = '{good_move,friends}'
    where id = 'c0000000-0000-0000-0000-0000000000f1'$$,
  'member can set reach out and reasons'
);
select results_eq(
  $$select reach_out::text, reasons::text[] from public.connections
    where id = 'c0000000-0000-0000-0000-0000000000f1'$$,
  $$values ('maybe'::text, array['good_move','friends']::text[])$$,
  'reasons can combine'
);
update public.connections set reach_out = 'pass' where id = 'c0000000-0000-0000-0000-0000000000f1';
select is(
  (select is_homie from public.connections where id = 'c0000000-0000-0000-0000-0000000000f1'),
  true,
  'passing on a connection keeps Homie and everything else'
);
select throws_ok(
  $$update public.connections set reasons = '{urgent}'
    where id = 'c0000000-0000-0000-0000-0000000000f1'$$,
  '22P02', null,
  'reasons only accept the known set'
);

-- Next actions keep history.
select lives_ok(
  $$select public.set_next_action('c0000000-0000-0000-0000-0000000000f1',
      'Ask about a June show', '2026-11-15',
      'f2222222-2222-2222-2222-222222222222')$$,
  'member can set a next action'
);
select lives_ok(
  $$select public.set_next_action('c0000000-0000-0000-0000-0000000000f1', 'Send the EP link')$$,
  'member can replace a next action'
);
select results_eq(
  $$select description, status::text from public.next_actions
    where connection_id = 'c0000000-0000-0000-0000-0000000000f1'
    order by created_at, status desc$$,
  $$values ('Ask about a June show', 'replaced'), ('Send the EP link', 'open')$$,
  'replacing keeps the old next action as history'
);
select throws_ok(
  $$update public.next_actions set description = 'Rewritten'
    where connection_id = 'c0000000-0000-0000-0000-0000000000f1' and status = 'replaced'$$,
  '23514', null,
  'closed next actions cannot be edited'
);
select throws_ok(
  $$select public.set_next_action('c0000000-0000-0000-0000-0000000000f1', 'Assign to outsider',
      null, 'f3333333-3333-3333-3333-333333333333')$$,
  '23503', null,
  'next actions can only be assigned to workspace members'
);

-- Outreach belongs to its author.
select lives_ok(
  $$insert into public.outreach_entries (workspace_id, connection_id, channel, summary)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1',
            'c0000000-0000-0000-0000-0000000000f1', 'instagram', 'DMed about a split bill')$$,
  'member can log outreach'
);
select throws_ok(
  $$insert into public.outreach_entries (workspace_id, connection_id, summary, author_id)
    values ('aaaaaaaa-0000-0000-0000-0000000000f1',
            'c0000000-0000-0000-0000-0000000000f1', 'Pretending to be Sam',
            'f2222222-2222-2222-2222-222222222222')$$,
  '42501', null,
  'member cannot log outreach as someone else'
);

-- Sam can read Alex's outreach but not delete it.
select set_config('request.jwt.claims', '{"sub":"f2222222-2222-2222-2222-222222222222","role":"authenticated"}', true);

select is((select count(*) from public.outreach_entries), 1::bigint, 'bandmates see each other''s outreach');
delete from public.outreach_entries;
select is((select count(*) from public.outreach_entries), 1::bigint, 'bandmates cannot delete each other''s outreach');

select * from finish();
rollback;
