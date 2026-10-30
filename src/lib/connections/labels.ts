import type { Database } from "@/lib/supabase/database.types";

type Enums = Database["public"]["Enums"];
export type ConnectionType = Enums["connection_type"];
export type ConnectionStatus = Enums["connection_status"];

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

// Order matters: this is also the directory's grouping order.
export const STATUS_LABELS: Record<ConnectionStatus, string> = {
  homies: "Homies",
  lets_play: "Let's play",
  prospect: "Prospect",
  neutral: "Neutral",
  avoid: "Avoid",
};

export const STATUS_HINTS: Record<ConnectionStatus, string> = {
  homies: "Love playing together, love hanging out, top tour-mate pick.",
  lets_play: "We both want to play together. Just haven't booked it.",
  prospect: "We'd like to. Not mutual yet.",
  neutral: "We know of them. No plans.",
  avoid: "Nope.",
};

export const TYPES = Object.keys(TYPE_LABELS) as ConnectionType[];
export const STATUSES = Object.keys(STATUS_LABELS) as ConnectionStatus[];

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
