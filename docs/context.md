# Seeen product context

## Current direction

Seeen is a private shared network directory for Merwulf. The October 27, 2026 restart supersedes the earlier public scene-discovery concept. See [../README.md](../README.md) for release scope and schedule.

The core questions are: Who do we know in this scene? Who are our Homies? Who could we connect with next, and why? What did we last do, and who will follow up?

## Working data model

- **Workspace:** the Merwulf network; one workspace at launch.
- **Membership:** an authenticated user's access to that workspace. Joining requires authorization; signing up alone must not grant access.
- **Connection:** a person, band, organization, or outlet, with one or more types, profile links, optional contact details, relationship notes, and timestamps.
- **Locality:** geographic place. Keep locality distinct from genre/community tags.
- **Scene:** a local music community. A connection can belong to multiple scenes.
- **Affiliation:** a link from one connection to another, with a role (for example vocals, member, DJ at, books for, works at), a current/former status, and optional notes. A person can be affiliated with many bands, venues, and organizations; a band's members are its incoming affiliations. Both connections must belong to the same workspace.
- **Can help with:** free-form skills or services on a person (for example music videos, DJ sets, gear, screen printing), so members can find who to ask for a need, not only who plays where.
- **Homie:** a shared favorite flag on a connection, independent of relationship stage and not inherited through affiliations.
- **Relationship stage:** prospect, connected, active relationship, or inactive.
- **Reach out:** yes, maybe, or pass, set by the band. Pass is the honest "nope" (they gave us the cold shoulder, or we played with them once and that was enough). It drops a connection from prospect lists without archiving its history, and can be flipped back.
- **Reasons:** why the band wants to connect, in any combination: we dig them, good move (strategic), or they're friends (the relationship matters even if the music isn't ours). Separate from Homie, which marks a band-wide favorite.
- **Outreach entry:** dated history with channel, notes, and author, linked to a connection.
- **Next action:** current planned step, optional follow-up date, and responsible member. No priority; the date is enough.

Reach out, reasons, Homie, notes, and outreach are the band's candid, private judgments. They stay workspace-owned and must never be shared outside the workspace, even if connection identity is shared across bands later.

These are conceptual entities, not a finalized database schema. Give private records a workspace ownership path so Supabase policies can enforce membership across related data. Preserve history when changing a connection's current status or next action. Archive connections rather than casually removing their history.

## Scene connections

Scenes run on overlapping people: one musician might play in several bands and cover bands, DJ, and help other bands make videos through their day job. Capturing those links is core to the product, not an extra. For the MVP, show affiliations as linked lists on detail pages (a person's bands and roles; a band's members), so clicking through records traverses the network. Former affiliations stay visible because past lineups are part of how a scene connects. A graph visualization can be built later on the same data and remains outside this release.

## Prospect discovery

Start with band members adding relevant prospects and links, recording why they are a fit. Treat notes as member knowledge rather than verified industry facts. Future automated suggestions will need sources and freshness context; they are outside this release.

## Decisions and assumptions

Confirmed: Seeen name, shared Merwulf access, scenes/localities, Homies, Vercel hosting, and Supabase backend.

Working assumptions: Homies are band-wide; prospects are manually curated; the launch serves one workspace. Framework, member invitation mechanism, and visual tokens remain open.

## History

The earlier concept is preserved in [archive/bandpath-context.md](archive/bandpath-context.md). Its public browsing, artist claims, and AI enrichment directions are superseded for this MVP. Vercel hosting and Supabase are retained in the current plan.
