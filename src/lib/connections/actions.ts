"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMembership } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { resolveLocality } from "@/lib/localities";
import { STATUSES, type ConnectionStatus } from "./labels";
import {
  readForm,
  validate,
  type ConnectionFormState,
  type ValidConnection,
} from "./form";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const SAVE_FAILED = "Couldn't save. Your changes are still here; try again.";

function saveErrors(error: unknown): ConnectionFormState["errors"] {
  const e = error as { code?: string; message?: string } | null;
  if (e?.code === "23505" && e.message?.includes("connections_one_us_per_workspace")) {
    return { isUs: "Another connection is already marked as your band." };
  }
  return { form: SAVE_FAILED };
}

async function requireWorkspace() {
  const membership = await getMembership();
  if (!membership) redirect("/");
  return membership.workspaceId;
}

function connectionRow(data: ValidConnection, localityId: string | null) {
  return {
    name: data.name,
    kind: data.kind,
    person_roles: data.person_roles,
    group_type: data.group_type,
    status: data.status,
    played_together: data.played_together,
    is_us: data.is_us,
    can_help_with: data.can_help_with,
    locality_id: localityId,
    email: data.email,
    phone: data.phone,
    notes: data.notes,
  };
}

async function replaceLinks(
  supabase: Supabase,
  workspaceId: string,
  connectionId: string,
  links: ValidConnection["links"],
) {
  const { error: deleteError } = await supabase
    .from("connection_links")
    .delete()
    .eq("connection_id", connectionId);
  if (deleteError) throw deleteError;
  if (!links.length) return;

  const { error } = await supabase.from("connection_links").insert(
    links.map((link, position) => ({
      workspace_id: workspaceId,
      connection_id: connectionId,
      label: link.label,
      url: link.url,
      position,
    })),
  );
  if (error) throw error;
}

// Tags the connection with exactly these scenes. Names typed in as new
// scenes reuse an existing scene with the same name (any capitalization).
async function replaceScenes(
  supabase: Supabase,
  workspaceId: string,
  connectionId: string,
  sceneIds: string[],
  newNames: string[],
) {
  const ids = new Set(sceneIds);
  if (newNames.length) {
    const { data: existing, error } = await supabase.from("scenes").select("id, name");
    if (error) throw error;
    const byName = new Map(existing.map((s) => [s.name.toLowerCase(), s.id]));
    const missing = newNames.filter((n) => !byName.has(n.toLowerCase()));
    if (missing.length) {
      const { data: created, error: insertError } = await supabase
        .from("scenes")
        .insert(missing.map((name) => ({ workspace_id: workspaceId, name })))
        .select("id, name");
      if (insertError) throw insertError;
      created.forEach((s) => byName.set(s.name.toLowerCase(), s.id));
    }
    newNames.forEach((n) => ids.add(byName.get(n.toLowerCase())!));
  }

  const { error: deleteError } = await supabase
    .from("connection_scenes")
    .delete()
    .eq("connection_id", connectionId);
  if (deleteError) throw deleteError;
  if (!ids.size) return;

  const { error } = await supabase.from("connection_scenes").insert(
    [...ids].map((scene_id) => ({ workspace_id: workspaceId, connection_id: connectionId, scene_id })),
  );
  if (error) throw error;
}

export async function createConnection(
  _prev: ConnectionFormState,
  formData: FormData,
): Promise<ConnectionFormState> {
  const values = readForm(formData);
  const result = validate(values);
  if (!result.ok) return { values, errors: result.errors, attempt: Date.now() };

  const workspaceId = await requireWorkspace();
  const supabase = await createClient();
  let id: string;

  try {
    const localityId = await resolveLocality(supabase, workspaceId, result.data.locality);
    const { data, error } = await supabase
      .from("connections")
      .insert({ workspace_id: workspaceId, ...connectionRow(result.data, localityId) })
      .select("id")
      .single();
    if (error) throw error;
    id = data.id;
    await replaceLinks(supabase, workspaceId, id, result.data.links);
    await replaceScenes(supabase, workspaceId, id, result.data.scene_ids, result.data.new_scenes);
  } catch (error) {
    return { values, errors: saveErrors(error), attempt: Date.now() };
  }

  revalidatePath("/", "layout");
  redirect(`/connections/${id}`);
}

export async function updateConnection(
  id: string,
  _prev: ConnectionFormState,
  formData: FormData,
): Promise<ConnectionFormState> {
  const values = readForm(formData);
  const result = validate(values);
  if (!result.ok) return { values, errors: result.errors, attempt: Date.now() };

  const workspaceId = await requireWorkspace();
  const supabase = await createClient();

  try {
    const localityId = await resolveLocality(supabase, workspaceId, result.data.locality);
    const { data, error } = await supabase
      .from("connections")
      .update(connectionRow(result.data, localityId))
      .eq("id", id)
      .select("id");
    if (error) throw error;
    // RLS hides rows the user can't edit, which shows up as zero rows updated.
    if (!data.length) throw new Error("not found");
    await replaceLinks(supabase, workspaceId, id, result.data.links);
    await replaceScenes(supabase, workspaceId, id, result.data.scene_ids, result.data.new_scenes);
  } catch (error) {
    return { values, errors: saveErrors(error), attempt: Date.now() };
  }

  revalidatePath("/", "layout");
  redirect(`/connections/${id}`);
}

export type ArchiveState = { error?: string };

async function setArchived(id: string, archived: boolean): Promise<ArchiveState> {
  await requireWorkspace();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("connections")
    .update({ archived_at: archived ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");

  if (error || !data.length) {
    return { error: archived ? "Couldn't archive. Try again." : "Couldn't restore. Try again." };
  }
  // Any change can show up on other pages (both ends of a link, the
  // directory), so drop the client's cached pages, not just this one.
  revalidatePath("/", "layout");
  return {};
}

export async function archiveConnection(id: string): Promise<ArchiveState> {
  return setArchived(id, true);
}

export async function restoreConnection(id: string): Promise<ArchiveState> {
  return setArchived(id, false);
}

export type QuickState = { status: ConnectionStatus; playedTogether: boolean };
export type QuickResult = { ok: true; saved: QuickState } | { ok: false; saved: QuickState | null };

// One-tap status and "played together" changes from the detail page.
// Status history is logged by a database trigger.
export async function quickUpdate(
  id: string,
  change: { status: ConnectionStatus } | { playedTogether: boolean },
): Promise<QuickResult> {
  await requireWorkspace();
  const supabase = await createClient();
  const patch =
    "status" in change
      ? STATUSES.includes(change.status)
        ? { status: change.status }
        : null
      : { played_together: Boolean(change.playedTogether) };

  const current = async () => {
    const { data } = await supabase.from("connections").select("status, played_together").eq("id", id).maybeSingle();
    return data ? { status: data.status, playedTogether: data.played_together } : null;
  };
  if (!patch) return { ok: false, saved: await current() };

  const { data, error } = await supabase
    .from("connections")
    .update(patch)
    .eq("id", id)
    .select("status, played_together")
    .maybeSingle();
  if (error || !data) return { ok: false, saved: await current() };

  revalidatePath("/", "layout");
  return { ok: true, saved: { status: data.status, playedTogether: data.played_together } };
}
