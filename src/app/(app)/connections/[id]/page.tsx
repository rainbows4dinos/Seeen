import Link from "next/link";
import { Suspense } from "react";
import { getMembership } from "@/lib/auth/dal";
import { getConnection, type ConnectionDetail } from "@/lib/connections/queries";
import {
  STATUS_HINTS,
  STATUS_LABELS,
  formatDate,
  formatLocality,
  formatType,
} from "@/lib/connections/labels";
import { ArchiveControl } from "@/components/archive-control";
import { NoWorkspace } from "@/components/no-workspace";

export default function ConnectionPage({ params }: PageProps<"/connections/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted">Loading…</p>}>
      <Connection params={params} />
    </Suspense>
  );
}

async function Connection({ params }: { params: PageProps<"/connections/[id]">["params"] }) {
  const membership = await getMembership();
  if (!membership) return <NoWorkspace />;

  const { id } = await params;
  const { connection: c, affiliations, nextAction } = await getConnection(id);
  const place = formatLocality(c.localities);
  const archived = Boolean(c.archived_at);

  return (
    <article className="flex flex-col gap-8">
      <Link href={archived ? "/?view=archived" : "/"} className="link text-sm text-muted">
        Back to directory
      </Link>

      {archived ? (
        <p className="rounded-md border border-foreground p-3 text-sm font-medium">
          Archived {formatDate(c.archived_at!)}. Hidden from the directory; everything below is kept.
        </p>
      ) : null}

      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight break-words">{c.name}</h1>
        <p className="text-muted">
          {[formatType(c), place].filter(Boolean).join(" · ")}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          <span className="tag font-semibold" title={STATUS_HINTS[c.status]}>
            {STATUS_LABELS[c.status]}
          </span>
          {c.played_together ? <span className="tag">Played together</span> : null}
        </div>
        <div className="pt-2">
          <Link href={`/connections/${c.id}/edit`} className="button-primary">
            Edit
          </Link>
        </div>
      </header>

      <Section title="Next action">
        {nextAction ? (
          <p>
            {nextAction.description}
            <span className="block text-sm text-muted">
              {[
                nextAction.assignee?.display_name,
                nextAction.due_on ? `planned for ${formatDate(`${nextAction.due_on}T12:00:00`)}` : null,
              ]
                .filter(Boolean)
                .join(" · ") || "No date set"}
            </span>
          </p>
        ) : (
          <p className="text-muted">Nothing planned.</p>
        )}
      </Section>

      <Affiliations affiliations={affiliations} />

      {c.can_help_with.length ? (
        <Section title="Can help with">
          <ul className="flex flex-wrap gap-2">
            {c.can_help_with.map((s) => (
              <li key={s} className="tag">
                {s}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section title="Contact and links">
        {c.email || c.phone || c.connection_links.length ? (
          <ul className="flex flex-col gap-2">
            {c.email ? (
              <li>
                <a href={`mailto:${c.email}`} className="link break-all">
                  {c.email}
                </a>
              </li>
            ) : null}
            {c.phone ? (
              <li>
                <a href={`tel:${c.phone}`} className="link">
                  {c.phone}
                </a>
              </li>
            ) : null}
            {c.connection_links.map((l) => (
              <li key={l.id}>
                <a href={l.url} className="link break-all" target="_blank" rel="noopener noreferrer">
                  {l.label || l.url}
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted">No contact info or links yet.</p>
        )}
      </Section>

      {c.notes ? (
        <Section title="Notes">
          <p className="whitespace-pre-wrap">{c.notes}</p>
        </Section>
      ) : null}

      <footer className="flex flex-col gap-4 border-t border-line pt-6">
        <p className="text-sm text-muted">
          Added {formatDate(c.created_at)} · Updated {formatDate(c.updated_at)}
        </p>
        <ArchiveControl id={c.id} name={c.name} archived={archived} />
      </footer>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

// Read-only for now; editing affiliations is issue #17.
// Outgoing links ("Jo -> vocals -> The Tin Hollows") read as "Part of";
// incoming ones are the people and bands linked to this connection.
function Affiliations({ affiliations }: { affiliations: ConnectionDetail["affiliations"] }) {
  const groups = [
    {
      title: "Part of",
      rows: affiliations.outgoing.map((a) => ({ ...a, label: `${a.role} · ${a.other?.name}` })),
    },
    {
      title: "Linked here",
      rows: affiliations.incoming.map((a) => ({ ...a, label: `${a.other?.name} · ${a.role}` })),
    },
  ].map((g) => ({ ...g, rows: g.rows.filter((a) => a.other) }));
  if (!groups.some((g) => g.rows.length)) return null;

  return (
    <>
      {groups.map(({ title, rows }) =>
        rows.length ? (
          <Section key={title} title={title}>
            {[
              ["Current", rows.filter((a) => a.is_current)],
              ["Former", rows.filter((a) => !a.is_current)],
            ].map(([label, list]) =>
              (list as typeof rows).length ? (
                <div key={label as string} className="flex flex-col gap-1">
                  <h3 className="text-sm font-medium text-muted">{label as string}</h3>
                  <ul className="flex flex-col gap-1">
                    {(list as typeof rows).map((a) => (
                      <li key={a.id}>
                        <Link href={`/connections/${a.other!.id}`} className="link">
                          {a.label}
                        </Link>
                        {a.notes ? <span className="text-sm text-muted"> ({a.notes})</span> : null}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null,
            )}
          </Section>
        ) : null,
      )}
    </>
  );
}
