import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type ConnectionKind = Enums["connection_kind"];
export type ConnectionType = Enums["connection_type"];
export type RelationshipStage = Enums["relationship_stage"];
export type ReachOut = Enums["reach_out"];
export type ConnectionReason = Enums["connection_reason"];

export const KIND_LABELS: Record<ConnectionKind, string> = {
  person: "Person",
  band: "Band",
  organization: "Organization",
  outlet: "Outlet",
};

export const TYPE_LABELS: Record<ConnectionType, string> = {
  band: "Band",
  musician: "Musician",
  promoter: "Promoter",
  venue: "Venue",
  dj: "DJ",
  playlister: "Playlister",
  label: "Label",
  press: "Press",
  radio: "Radio",
  photographer: "Photographer",
  videographer: "Videographer",
  other: "Other",
};

export const STAGE_LABELS: Record<RelationshipStage, string> = {
  prospect: "Prospect",
  connected: "Connected",
  active: "Active relationship",
  inactive: "Inactive",
};

export const REACH_OUT_LABELS: Record<ReachOut, string> = {
  yes: "Yes",
  maybe: "Maybe",
  pass: "Pass",
};

export const REASON_LABELS: Record<ConnectionReason, string> = {
  dig_them: "We dig them",
  good_move: "Good move",
  friends: "They're friends",
};

export const KINDS = Object.keys(KIND_LABELS) as ConnectionKind[];
export const TYPES = Object.keys(TYPE_LABELS) as ConnectionType[];
export const STAGES = Object.keys(STAGE_LABELS) as RelationshipStage[];
export const REACH_OUTS = Object.keys(REACH_OUT_LABELS) as ReachOut[];
export const REASONS = Object.keys(REASON_LABELS) as ConnectionReason[];

export function formatTypes(types: ConnectionType[]) {
  return types.map((t) => TYPE_LABELS[t]).join(", ");
}

export function formatLocality(
  locality: { name: string; region: string | null; country: string | null } | null,
) {
  if (!locality) return null;
  return [locality.name, locality.region].filter(Boolean).join(", ");
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Los_Angeles",
  });
}
