-- Scenes can sit inside a bigger scene: "Portland DIY" inside "Pacific
-- Northwest". One level of nesting is enough for now; the app only offers
-- top-level scenes as parents.

alter table public.scenes
  add column parent_id uuid,
  add constraint scenes_parent_not_self check (parent_id is null or parent_id <> id),
  add constraint scenes_parent_same_workspace
    foreign key (workspace_id, parent_id)
    references public.scenes (workspace_id, id) on delete set null (parent_id);

create index scenes_parent_id_idx on public.scenes (parent_id);
