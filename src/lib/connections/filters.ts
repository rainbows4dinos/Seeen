import {
  GROUP_TYPES,
  GROUP_TYPE_LABELS,
  PERSON_ROLES,
  PERSON_ROLE_LABELS,
  STATUSES,
  type ConnectionKind,
  type ConnectionStatus,
  type GroupType,
  type PersonRole,
} from "./labels";

// Directory filters live in the URL (?q=&status=&type=&scene=&town=), so a
// filtered view can be bookmarked or shared with a bandmate.
export type DirectoryFilters = {
  q: string;
  statuses: ConnectionStatus[];
  type: string; // "group:band" or "person:dj"
  scene: string;
  town: string;
};

type Params = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() ?? "";
const all = (v: string | string[] | undefined) => (Array.isArray(v) ? v : v ? [v] : []);

export function readFilters(params: Params): DirectoryFilters {
  return {
    q: first(params.q).slice(0, 200),
    statuses: all(params.status).filter((s): s is ConnectionStatus => STATUSES.includes(s as ConnectionStatus)),
    type: TYPE_OPTIONS.some((o) => o.value === first(params.type)) ? first(params.type) : "",
    scene: first(params.scene),
    town: first(params.town),
  };
}

export function hasFilters(f: DirectoryFilters) {
  return Boolean(f.q || f.statuses.length || f.type || f.scene || f.town);
}

export const TYPE_OPTIONS: { value: string; label: string; group: "Groups" | "People" }[] = [
  ...GROUP_TYPES.map((g) => ({ value: `group:${g}`, label: GROUP_TYPE_LABELS[g], group: "Groups" as const })),
  ...PERSON_ROLES.map((r) => ({ value: `person:${r}`, label: PERSON_ROLE_LABELS[r], group: "People" as const })),
];

type Filterable = {
  name: string;
  kind: ConnectionKind;
  group_type: GroupType | null;
  person_roles: PersonRole[];
  status: ConnectionStatus;
  is_us: boolean;
  locality_id: string | null;
  connection_scenes: { scene_id: string }[];
};

// sceneIds is the chosen scene plus the scenes inside it.
export function matches(
  c: Filterable,
  f: DirectoryFilters,
  { sceneIds, hideAvoid }: { sceneIds: Set<string> | null; hideAvoid: boolean },
) {
  if (f.q && !c.name.toLowerCase().includes(f.q.toLowerCase())) return false;
  // Avoid stays out of the way unless someone asks for it.
  if (f.statuses.length ? !f.statuses.includes(c.status) : hideAvoid && c.status === "avoid" && !c.is_us) {
    return false;
  }
  if (f.type) {
    const [kind, value] = f.type.split(":");
    if (c.kind !== kind) return false;
    if (kind === "group" ? c.group_type !== value : !c.person_roles.includes(value as PersonRole)) return false;
  }
  if (sceneIds && !c.connection_scenes.some((s) => sceneIds.has(s.scene_id))) return false;
  if (f.town && c.locality_id !== f.town) return false;
  return true;
}
