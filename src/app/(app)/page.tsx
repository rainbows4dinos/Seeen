import Link from "next/link";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { listConnections } from "@/lib/connections/queries";
import { STATUSES, STATUS_LABELS, formatLocality, formatType } from "@/lib/connections/labels";
import type { ConnectionListItem } from "@/lib/connections/queries";
import { NoWorkspace } from "@/components/no-workspace";

export default function DirectoryPage({ searchParams }: PageProps<"/">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading the directory…</p>}>
      <Directory searchParams={searchParams} />
    </Suspense>
  );
}

async function Directory({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  const { view } = await searchParams;
  const archived = view === "archived";
  const connections = await listConnections({ archived });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">Directory</h1>
        <Link href="/connections/new" className="button-primary">
          Add connection
        </Link>
      </div>

      <nav aria-label="Directory views" className="flex gap-4 text-sm">
        <ViewLink href="/" current={!archived}>
          Current
        </ViewLink>
        <ViewLink href="/?view=archived" current={archived}>
          Archived
        </ViewLink>
      </nav>

      {connections.length === 0 ? (
        archived ? (
          <p className="text-muted">Nothing archived.</p>
        ) : (
          <div className="flex flex-col items-start gap-3 rounded-md border border-dashed border-line p-6">
            <p className="font-medium">No connections yet.</p>
            <p className="text-muted">
              Start with a band you&rsquo;ve shared a bill with, a venue you&rsquo;ve played, or someone
              you&rsquo;d like to meet.
            </p>
            <Link href="/connections/new" className="button-secondary">
              Add your first connection
            </Link>
          </div>
        )
      ) : (
        <>
          <p className="text-sm text-muted" aria-live="polite">
            {connections.length} {connections.length === 1 ? "connection" : "connections"}
          </p>
          {STATUSES.map((status) => {
            const group = connections.filter((c) => c.status === status);
            if (!group.length) return null;
            return (
              <section key={status} aria-labelledby={`group-${status}`} className="flex flex-col gap-2">
                <h2 id={`group-${status}`} className="text-sm font-semibold uppercase tracking-wide text-muted">
                  {STATUS_LABELS[status]} <span className="font-normal">({group.length})</span>
                </h2>
                <ConnectionList connections={group} />
              </section>
            );
          })}
        </>
      )}
    </div>
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

function ConnectionList({ connections }: { connections: ConnectionListItem[] }) {
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
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
