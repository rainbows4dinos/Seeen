import {
  GROUP_TYPES,
  KINDS,
  PERSON_ROLES,
  STATUSES,
  type ConnectionKind,
  type ConnectionStatus,
  type GroupType,
  type PersonRole,
} from "./labels";

// Raw form values, kept as strings so a failed save can repopulate the form.
export type ConnectionFormValues = {
  name: string;
  kind: string;
  personRoles: string[];
  groupType: string;
  status: string;
  playedTogether: boolean;
  canHelpWith: string;
  city: string;
  region: string;
  country: string;
  email: string;
  phone: string;
  notes: string;
  links: { label: string; url: string }[];
};

export type ConnectionFormErrors = Partial<Record<keyof ConnectionFormValues | "form", string>> & {
  linkUrls?: Record<number, string>;
};

export type ConnectionFormState = {
  values: ConnectionFormValues;
  errors: ConnectionFormErrors;
  // Changes on every failed save so the form remounts with submitted values.
  attempt?: number;
};

export type ValidConnection = {
  name: string;
  kind: ConnectionKind;
  person_roles: PersonRole[];
  group_type: GroupType | null;
  status: ConnectionStatus;
  played_together: boolean;
  can_help_with: string[];
  locality: { name: string; region: string | null; country: string | null } | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  links: { label: string | null; url: string }[];
};

export const EMPTY_FORM: ConnectionFormValues = {
  name: "",
  kind: "group",
  personRoles: [],
  groupType: "",
  status: "neutral",
  playedTogether: false,
  canHelpWith: "",
  city: "",
  region: "",
  country: "",
  email: "",
  phone: "",
  notes: "",
  links: [{ label: "", url: "" }],
};

const str = (fd: FormData, key: string) => String(fd.get(key) ?? "").trim();
const optional = (v: string) => (v === "" ? null : v);

export function readForm(fd: FormData): ConnectionFormValues {
  const labels = fd.getAll("link_label").map((v) => String(v).trim());
  const urls = fd.getAll("link_url").map((v) => String(v).trim());
  return {
    name: str(fd, "name"),
    kind: str(fd, "kind"),
    personRoles: fd.getAll("person_roles").map(String),
    groupType: str(fd, "group_type"),
    status: str(fd, "status"),
    playedTogether: fd.get("played_together") === "on",
    canHelpWith: str(fd, "can_help_with"),
    city: str(fd, "city"),
    region: str(fd, "region"),
    country: str(fd, "country"),
    email: str(fd, "email"),
    phone: str(fd, "phone"),
    notes: str(fd, "notes"),
    links: urls.map((url, i) => ({ label: labels[i] ?? "", url })),
  };
}

// Accepts "bandcamp.com/x" as well as full URLs; only http(s) is allowed.
export function normalizeUrl(raw: string): string | null {
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (!url.hostname.includes(".")) return null;
    return url.toString();
  } catch {
    return null;
  }
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(values: ConnectionFormValues):
  | { ok: true; data: ValidConnection }
  | { ok: false; errors: ConnectionFormErrors } {
  const errors: ConnectionFormErrors = {};

  if (!values.name) errors.name = "Add a name.";
  else if (values.name.length > 200) errors.name = "Keep the name under 200 characters.";

  const kind = KINDS.includes(values.kind as ConnectionKind) ? (values.kind as ConnectionKind) : null;
  if (!kind) errors.kind = "Choose person or band, venue, or org.";
  const personRoles = values.personRoles.filter((r): r is PersonRole =>
    PERSON_ROLES.includes(r as PersonRole),
  );
  const groupType = GROUP_TYPES.includes(values.groupType as GroupType)
    ? (values.groupType as GroupType)
    : null;
  if (kind === "person" && personRoles.length === 0) errors.personRoles = "Pick at least one.";
  if (kind === "group" && !groupType) errors.groupType = "Pick one.";

  if (!STATUSES.includes(values.status as ConnectionStatus)) errors.status = "Choose a status.";

  if (values.email && !EMAIL_RE.test(values.email)) errors.email = "That email doesn't look right.";

  if ((values.region || values.country) && !values.city) {
    errors.city = "Add a city or town, or clear the region and country.";
  }

  const links: ValidConnection["links"] = [];
  const linkUrls: Record<number, string> = {};
  values.links.forEach((link, i) => {
    if (!link.url) {
      if (link.label) linkUrls[i] = "Add a URL or clear this label.";
      return;
    }
    const url = normalizeUrl(link.url);
    if (!url) linkUrls[i] = "Use a web address like bandcamp.com/yourband.";
    else links.push({ label: optional(link.label), url });
  });
  if (Object.keys(linkUrls).length) errors.linkUrls = linkUrls;

  if (Object.keys(errors).length) return { ok: false, errors };

  return {
    ok: true,
    data: {
      name: values.name,
      kind: kind!,
      person_roles: kind === "person" ? personRoles : [],
      group_type: kind === "group" ? groupType : null,
      status: values.status as ConnectionStatus,
      played_together: values.playedTogether,
      can_help_with: values.canHelpWith
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      locality: values.city
        ? { name: values.city, region: optional(values.region), country: optional(values.country) }
        : null,
      email: optional(values.email),
      phone: optional(values.phone),
      notes: optional(values.notes),
      links,
    },
  };
}
