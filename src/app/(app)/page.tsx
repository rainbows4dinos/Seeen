import Link from "next/link";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { listConnections, loadNetwork } from "@/lib/connections/queries";
import {
  STATUSES,
  STATUS_LABELS,
  formatLocality,
  formatType,
} from "@/lib/connections/labels";
import type { ConnectionListItem } from "@/lib/connections/queries";
import type { ConnectionStatus } from "@/lib/connections/labels";
import { NoWorkspace } from "@/components/no-workspace";
import { listScenes, nestScenes, sceneAndChildren } from "@/lib/scenes/queries";
import {
  TYPE_OPTIONS,
  hasFilters,
  matches,
  readFilters,
  type DirectoryFilters,
} from "@/lib/connections/filters";

export default function DirectoryPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the directory…</p>}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}

async function Directory({
  searchParams,
}: {
  searchParams: PageProps<"/">["searchParams"];
}) {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  const params = await searchParams;
  const view = readView(params.view);
  const archived = view === "archived";
  const list = LISTS[view as ListView] ?? null;
  const asked = readFilters(params);
  // The Let's play and Prospects views are the directory with one status.
  const filters = list ? { ...asked, statuses: [list.status] } : asked;
  const filtering = hasFilters(asked);
  const [all, network, scenes] = await Promise.all([
    listConnections({ archived }),
    loadNetwork(),
    listScenes(),
  ]);
  const sceneIds = filters.scene
    ? sceneAndChildren(scenes, filters.scene)
    : null;
  const connections = all.filter((c) =>
    matches(c, filters, { sceneIds, hideAvoid: !archived }),
  );
  const hiddenAvoid =
    view === "current" && !filters.statuses.length
      ? all.filter(
          (c) =>
            c.status === "avoid" &&
            !c.is_us &&
            matches(
              c,
              { ...filters, statuses: ["avoid"] },
              { sceneIds, hideAvoid: false },
            ),
        ).length
      : 0;
  const towns = [
    ...new Map(
      all
        .filter((c) => c.locality_id && c.localities)
        .map((c) => [c.locality_id!, formatLocality(c.localities)!] as const),
    ),
  ].sort((a, b) => a[1].localeCompare(b[1]));
  // In Let's play and Prospects, "of Y" counts that list, not everyone.
  const total = list ? all.filter((c) => c.status === list.status).length : all.length;
  const us = connections.filter((c) => c.is_us);
  const tagsFor = (id: string) =>
    [
      network.isLabelMateWithUs(id) ? "Label mate" : null,
      network.sharedMembersWithUs(id).length ? "Shares a member" : null,
    ].filter((t): t is string => Boolean(t));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <Link href="/connections/new" className="button-primary">
          Add connection
        </Link>
      </div>

      <nav aria-label="Directory views" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {VIEWS.map((v) => (
          <ViewLink key={v.id} href={viewHref(v.id)} current={view === v.id}>
            {v.label}
          </ViewLink>
        ))}
      </nav>

      {list ? <p className="text-muted">{list.intro}</p> : null}

      {all.length ? (
        <FilterForm
          filters={filters}
          view={view}
          scenes={nestScenes(scenes)}
          towns={towns}
          open={Boolean(
            asked.statuses.length ||
            filters.type ||
            filters.scene ||
            filters.town,
          )}
        />
      ) : null}

      {all.length === 0 ? (
        archived ? (
          <p className="text-muted">Nothing archived.</p>
        ) : list ? (
          <p className="text-muted">{list.empty}</p>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line p-6">
            <p className="font-medium">No connections yet.</p>
            <p className="text-muted">
              Start with a band you&rsquo;ve shared a bill with, a venue
              you&rsquo;ve played, or someone you&rsquo;d like to meet.
            </p>
            <Link href="/connections/new" className="button-secondary">
              Add your first connection
            </Link>
          </div>
        )
      ) : (
        <>
          <div
            className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-muted"
            aria-live="polite"
          >
            <p>
              {filtering || connections.length !== total
                ? `Showing ${connections.length} of ${total}`
                : `${total} ${total === 1 ? "connection" : "connections"}`}
            </p>
            {hiddenAvoid ? (
              <Link
                href={filterHref({ ...filters, statuses: ["avoid"] }, view)}
                className="link"
              >
                {hiddenAvoid} in Avoid, hidden. Show them
              </Link>
            ) : null}
          </div>

          {connections.length === 0 && list && !filtering ? (
            <p className="text-muted">{list.empty}</p>
          ) : connections.length === 0 ? (
            <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line p-6">
              <p className="font-medium">Nothing matches.</p>
              <p className="text-muted">
                Try fewer filters or a shorter search.
              </p>
              <Link href={viewHref(view)} className="button-secondary">
                Clear filters
              </Link>
            </div>
          ) : null}

          {us.length ? (
            <section aria-labelledby="group-us" className="flex flex-col gap-2">
              <h2
                id="group-us"
                className="text-sm font-semibold uppercase tracking-wide text-muted"
              >
                Us
              </h2>
              <ConnectionList connections={us} tagsFor={tagsFor} />
            </section>
          ) : null}
          {STATUSES.map((status) => {
            const group = connections.filter(
              (c) => c.status === status && !c.is_us,
            );
            if (!group.length) return null;
            return (
              <section
                key={status}
                aria-labelledby={`group-${status}`}
                className="flex flex-col gap-2"
              >
                <h2
                  id={`group-${status}`}
                  className="text-sm font-semibold uppercase tracking-wide text-muted"
                >
                  {STATUS_LABELS[status]}{" "}
                  <span className="font-normal">({group.length})</span>
                </h2>
                <ConnectionList connections={group} tagsFor={tagsFor} />
              </section>
            );
          })}
        </>
      )}

      {all.length ? (
        <p className="border-t border-line pt-4">
          <Link href="/export" className="action-link text-sm">
            Export the directory as CSV
          </Link>
        </p>
      ) : null}
    </div>
  );
}

type View = "current" | "lets_play" | "prospects" | "archived";
type ListView = "lets_play" | "prospects";

const VIEWS: { id: View; label: string }[] = [
  { id: "current", label: "Current" },
  { id: "lets_play", label: "Let's play" },
  { id: "prospects", label: "Prospects" },
  { id: "archived", label: "Archived" },
];

// Plain lists, no ranking: the order is alphabetical on purpose.
const LISTS: Record<ListView, { status: ConnectionStatus; intro: string; empty: string }> = {
  lets_play: {
    status: "lets_play",
    intro:
      "People and bands you both want to play with. Filter by town or scene when you're putting a show together.",
    empty:
      "No one here yet. Mark a connection Let's play when you both want to share a bill.",
  },
  prospects: {
    status: "prospect",
    intro: "Who you'd like to know. Notes are what bandmates have picked up, not checked facts.",
    empty: "No prospects yet. Mark a connection Prospect when you'd like to reach out.",
  },
};

function readView(v: string | string[] | undefined): View {
  const value = Array.isArray(v) ? v[0] : v;
  return VIEWS.some((x) => x.id === value) ? (value as View) : "current";
}

function viewHref(view: View) {
  return view === "current" ? "/" : `/?view=${view}`;
}

function filterHref(f: DirectoryFilters, view: View) {
  const p = new URLSearchParams();
  if (view !== "current") p.set("view", view);
  if (f.q) p.set("q", f.q);
  if (!LISTS[view as ListView]) f.statuses.forEach((st) => p.append("status", st));
  if (f.type) p.set("type", f.type);
  if (f.scene) p.set("scene", f.scene);
  if (f.town) p.set("town", f.town);
  const qs = p.toString();
  return qs ? `/?${qs}` : "/";
}

// A plain GET form: works without JavaScript, and the URL is shareable.
function FilterForm({
  filters: f,
  view,
  scenes,
  towns,
  open,
}: {
  filters: DirectoryFilters;
  view: View;
  scenes: {
    scene: { id: string; name: string };
    children: { id: string; name: string }[];
  }[];
  towns: (readonly [string, string])[];
  open: boolean;
}) {
  const clearHref = viewHref(view);
  const isList = Boolean(LISTS[view as ListView]);
  return (
    <form
      action="/"
      method="get"
      role="search"
      aria-label="Search and filter the directory"
      className="flex flex-col gap-3"
    >
      {view !== "current" ? <input type="hidden" name="view" value={view} /> : null}
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex min-w-48 flex-1 flex-col gap-1.5">
          <label htmlFor="f-q" className="text-sm font-medium">
            Search by name
          </label>
          <input
            id="f-q"
            name="q"
            type="search"
            defaultValue={f.q}
            autoComplete="off"
            className="field"
          />
        </div>
        <button type="submit" className="button-primary">
          Search
        </button>
        {hasFilters(isList ? { ...f, statuses: [] } : f) ? (
          <Link href={clearHref} className="button-secondary">
            Clear filters
          </Link>
        ) : null}
      </div>

      <details open={open}>
        <summary className="cursor-pointer text-sm font-medium">
          Filters
        </summary>
        <div className="flex flex-col gap-4 pt-3">
          <fieldset className="flex flex-col gap-2" hidden={isList} disabled={isList}>
            <legend className="text-sm font-medium">Status</legend>
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((st) => (
                <label key={st} className="choice">
                  <input
                    type="checkbox"
                    name="status"
                    value={st}
                    defaultChecked={f.statuses.includes(st)}
                  />
                  <span>{STATUS_LABELS[st]}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-type" className="text-sm font-medium">
                Type
              </label>
              <select
                id="f-type"
                name="type"
                defaultValue={f.type}
                className="field"
              >
                <option value="">Any</option>
                {(["Groups", "People"] as const).map((g) => (
                  <optgroup key={g} label={g}>
                    {TYPE_OPTIONS.filter((o) => o.group === g).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-scene" className="text-sm font-medium">
                Scene
              </label>
              <select
                id="f-scene"
                name="scene"
                defaultValue={f.scene}
                className="field"
              >
                <option value="">Any</option>
                {scenes.flatMap(({ scene, children }) => [
                  <option key={scene.id} value={scene.id}>
                    {children.length ? `${scene.name} (all)` : scene.name}
                  </option>,
                  ...children.map((c) => (
                    <option key={c.id} value={c.id}>
                      {`\u00a0\u00a0${c.name}`}
                    </option>
                  )),
                ])}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="f-town" className="text-sm font-medium">
                Town
              </label>
              <select
                id="f-town"
                name="town"
                defaultValue={f.town}
                className="field"
              >
                <option value="">Any</option>
                {towns.map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <button type="submit" className="button-secondary self-start">
            Apply filters
          </button>
        </div>
      </details>
    </form>
  );
}

function ViewLink({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={
        current
          ? "border-b-2 border-foreground pb-1 font-semibold"
          : "border-b-2 border-transparent pb-1 text-muted hover:text-foreground"
      }
    >
      {children}
    </Link>
  );
}

function ConnectionList({
  connections,
  tagsFor,
}: {
  connections: ConnectionListItem[];
  tagsFor: (id: string) => string[];
}) {
  return (
    <ul className="flex flex-col divide-y divide-line border-y border-line">
      {connections.map((c) => {
        const place = formatLocality(c.localities);
        return (
          <li key={c.id}>
            <Link
              href={`/connections/${c.id}`}
              className="flex flex-col gap-1 py-3 hover:bg-line/30 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4"
            >
              <span className="flex flex-col">
                <span className="font-semibold break-words">{c.name}</span>
                <span className="text-sm text-muted">{formatType(c)}</span>
              </span>
              <span className="flex flex-wrap gap-x-3 text-sm text-muted sm:justify-end">
                {place ? <span>{place}</span> : null}
                {c.played_together ? <span>Played together</span> : null}
                {tagsFor(c.id).map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
