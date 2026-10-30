"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getMembership } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
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

// Reuse a place with the same name/region/country, or add it.
async function resolveLocality(
  supabase: Supabase,
  workspaceId: string,
  locality: ValidConnection["locality"],
) {
  if (!locality) return null;

  const { data: existing, error } = await supabase
    .from("localities")
    .select("id, name, region, country")
    .ilike("name", locality.name);
  if (error) throw error;

  const norm = (v: string | null) => (v ?? "").trim().toLowerCase();
  const match = existing.find(
    (l) => norm(l.region) === norm(locality.region) && norm(l.country) === norm(locality.country),
  );
  if (match) return match.id;

  const { data, error: insertError } = await supabase
    .from("localities")
    .insert({ workspace_id: workspaceId, ...locality })
    .select("id")
    .single();
  if (insertError) throw insertError;
  return data.id;
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
