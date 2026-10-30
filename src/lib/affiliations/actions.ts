"use server";

import { revalidatePath } from "next/cache";
import { getMembership } from "@/lib/auth/dal";
import { GROUP_TYPES, type GroupType } from "@/lib/connections/labels";
import { createClient } from "@/lib/supabase/server";
import { addOptionsFor, fitsTarget, newGroupTypes } from "./options";

export type LinkState = { ok?: boolean; error?: string; attempt?: number };

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const fail = (error: string): LinkState => ({ error, attempt: Date.now() });

export async function addLink(
  connectionId: string,
  optionId: string,
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const membership = await getMembership();
  if (!membership) return fail("You're not in a workspace.");
  const supabase = await createClient();

  const { data: subject } = await supabase
    .from("connections")
    .select("id, kind, group_type")
    .eq("id", connectionId)
    .maybeSingle();
  if (!subject) return fail("Couldn't find this connection.");

  const option = addOptionsFor(subject).find((o) => o.id === optionId);
  if (!option) return fail("That kind of link doesn't fit here.");

  const role = str(formData, "role").slice(0, 80) || null;
  const isCurrent = formData.get("former") !== "on";
  const picked = str(formData, "other_id");
  const newName = str(formData, "new_name");
  let otherId: string;

  if (picked && picked !== "__new__") {
    const { data: other } = await supabase
      .from("connections")
      .select("id, kind, group_type")
      .eq("id", picked)
      .maybeSingle();
    if (!other || other.id === subject.id || !fitsTarget(option.target, other)) {
      return fail("Pick someone from the list.");
    }
    otherId = other.id;
  } else if (picked === "__new__" && newName) {
    let row:
      | { kind: "person"; person_roles: NonNullable<typeof option.newPersonRoles>; group_type: null }
      | { kind: "group"; person_roles: []; group_type: GroupType };
    if (option.target.kind === "person") {
      row = { kind: "person", person_roles: option.newPersonRoles ?? ["other"], group_type: null };
    } else {
      const allowed = newGroupTypes(option.target);
      const chosen = str(formData, "new_group_type") as GroupType;
      const type = allowed.length === 1 ? allowed[0] : chosen;
      if (!GROUP_TYPES.includes(type) || !allowed.includes(type)) {
        return fail("Choose what kind of place or org it is.");
      }
      row = { kind: "group", person_roles: [], group_type: type };
    }
    const { data: created, error } = await supabase
      .from("connections")
      .insert({ workspace_id: membership.workspaceId, name: newName.slice(0, 200), ...row })
      .select("id")
      .single();
    if (error || !created) return fail("Couldn't add them. Try again.");
    otherId = created.id;
  } else {
    return fail("Pick someone, or type a name to add someone new.");
  }

  const [from, to] = option.direction === "out" ? [subject.id, otherId] : [otherId, subject.id];
  const { error } = await supabase.from("affiliations").insert({
    workspace_id: membership.workspaceId,
    from_connection_id: from,
    to_connection_id: to,
    kind: option.kind,
    role,
    is_current: isCurrent,
  });
  if (error?.code === "23505") return fail("They're already linked this way.");
  if (error) return fail("Couldn't save the link. Try again.");

  // Any change can show up on other pages (both ends of a link, the
  // directory), so drop the client's cached pages, not just this one.
  revalidatePath("/", "layout");
  return { ok: true, attempt: Date.now() };
}

export async function updateLink(
  linkId: string,
  _prev: LinkState,
  formData: FormData,
): Promise<LinkState> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("affiliations")
    .update({
      role: str(formData, "role").slice(0, 80) || null,
      is_current: formData.get("former") !== "on",
    })
    .eq("id", linkId)
    .select("id");
  if (error || !data.length) return fail("Couldn't save. Try again.");
  // Any change can show up on other pages (both ends of a link, the
  // directory), so drop the client's cached pages, not just this one.
  revalidatePath("/", "layout");
  return { ok: true, attempt: Date.now() };
}

export async function removeLink(linkId: string): Promise<LinkState> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("affiliations").delete().eq("id", linkId).select("id");
  if (error || !data.length) return fail("Couldn't remove it. Try again.");
  // Any change can show up on other pages (both ends of a link, the
  // directory), so drop the client's cached pages, not just this one.
  revalidatePath("/", "layout");
  return { ok: true };
}
