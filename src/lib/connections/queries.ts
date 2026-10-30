import "server-only";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EMPTY_FORM, type ConnectionFormValues } from "./form";

// All reads go through RLS: a member only ever sees their workspace's rows.

export async function listConnections({ archived }: { archived: boolean }) {
  const supabase = await createClient();
  let query = supabase
    .from("connections")
    .select(
      "id, name, kind, person_roles, group_type, status, played_together, archived_at, localities ( name, region, country )",
    )
    .order("name");
  query = archived ? query.not("archived_at", "is", null) : query.is("archived_at", null);

  const { data, error } = await query;
  if (error) throw new Error("Couldn't load the directory.");
  return data;
}

export type ConnectionListItem = Awaited<ReturnType<typeof listConnections>>[number];

export async function getConnection(id: string) {
  const supabase = await createClient();

  const [connection, outgoing, incoming, nextAction] = await Promise.all([
    supabase
      .from("connections")
      .select("*, localities ( name, region, country ), connection_links ( id, label, url, position )")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("affiliations")
      .select(
        "id, role, is_current, notes, other:connections!affiliations_workspace_id_to_connection_id_fkey ( id, name, kind, group_type, archived_at )",
      )
      .eq("from_connection_id", id),
    supabase
      .from("affiliations")
      .select(
        "id, role, is_current, notes, other:connections!affiliations_workspace_id_from_connection_id_fkey ( id, name, kind, group_type, archived_at )",
      )
      .eq("to_connection_id", id),
    supabase
      .from("next_actions")
      .select(
        "id, description, due_on, assignee:workspace_members!next_actions_workspace_id_assignee_id_fkey ( display_name )",
      )
      .eq("connection_id", id)
      .eq("status", "open")
      .maybeSingle(),
  ]);

  // An invalid UUID comes back as an error; treat it like a missing record.
  if (connection.error?.code === "22P02") notFound();
  if (connection.error) throw new Error("Couldn't load this connection.");
  if (!connection.data) notFound();
  if (outgoing.error || incoming.error || nextAction.error) {
    throw new Error("Couldn't load this connection's details.");
  }

  const links = [...connection.data.connection_links].sort((a, b) => a.position - b.position);

  return {
    connection: { ...connection.data, connection_links: links },
    affiliations: { outgoing: outgoing.data, incoming: incoming.data },
    nextAction: nextAction.data,
  };
}

export type ConnectionDetail = Awaited<ReturnType<typeof getConnection>>;

export function toFormValues(c: ConnectionDetail["connection"]): ConnectionFormValues {
  return {
    ...EMPTY_FORM,
    name: c.name,
    kind: c.kind,
    personRoles: c.person_roles,
    groupType: c.group_type ?? "",
    status: c.status,
    playedTogether: c.played_together,
    canHelpWith: c.can_help_with.join(", "),
    city: c.localities?.name ?? "",
    region: c.localities?.region ?? "",
    country: c.localities?.country ?? "",
    email: c.email ?? "",
    phone: c.phone ?? "",
    notes: c.notes ?? "",
    links: c.connection_links.length
      ? c.connection_links.map((l) => ({ label: l.label ?? "", url: l.url }))
      : EMPTY_FORM.links,
  };
}

export async function listLocalities() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("localities")
    .select("id, name, region, country")
    .order("name");
  if (error) throw new Error("Couldn't load places.");
  return data;
}
