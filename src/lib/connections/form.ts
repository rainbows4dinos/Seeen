import {
  KINDS,
  REACH_OUTS,
  REASONS,
  STAGES,
  TYPES,
  type ConnectionKind,
  type ConnectionReason,
  type ConnectionType,
  type ReachOut,
  type RelationshipStage,
} from "./labels";

// Raw form values, kept as strings so a failed save can repopulate the form.
export type ConnectionFormValues = {
  name: string;
  kind: string;
  types: string[];
  stage: string;
  reachOut: string;
  reasons: string[];
  fitReason: string;
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
  types: ConnectionType[];
  stage: RelationshipStage;
  reach_out: ReachOut | null;
  reasons: ConnectionReason[];
  fit_reason: string | null;
  can_help_with: string[];
  locality: { name: string; region: string | null; country: string | null } | null;
  email: string | null;
  phone: string | null;
  notes: string | null;
  links: { label: string | null; url: string }[];
};

export const EMPTY_FORM: ConnectionFormValues = {
  name: "",
  kind: "band",
  types: [],
  stage: "prospect",
  reachOut: "",
  reasons: [],
  fitReason: "",
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
    types: fd.getAll("types").map(String),
    stage: str(fd, "stage"),
    reachOut: str(fd, "reach_out"),
    reasons: fd.getAll("reasons").map(String),
    fitReason: str(fd, "fit_reason"),
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

  if (!KINDS.includes(values.kind as ConnectionKind)) errors.kind = "Choose what kind of connection this is.";

  const types = values.types.filter((t): t is ConnectionType => TYPES.includes(t as ConnectionType));
  if (types.length === 0) errors.types = "Pick at least one type.";

  if (!STAGES.includes(values.stage as RelationshipStage)) errors.stage = "Choose a stage.";

  if (values.reachOut && !REACH_OUTS.includes(values.reachOut as ReachOut)) {
    errors.reachOut = "Choose yes, maybe, pass, or not set.";
  }

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
      kind: values.kind as ConnectionKind,
      types,
      stage: values.stage as RelationshipStage,
      reach_out: (values.reachOut || null) as ReachOut | null,
      reasons: values.reasons.filter((r): r is ConnectionReason =>
        REASONS.includes(r as ConnectionReason),
      ),
      fit_reason: optional(values.fitReason),
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
