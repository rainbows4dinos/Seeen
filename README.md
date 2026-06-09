# BandPath

**Scene intelligence and pathway discovery for independent musicians.**

BandPath (formerly Artist Pathway) helps independent artists find their way into real scenes — mapping the venues, bands, curators, writers, radio shows, labels, festivals, and local networks that can help them build momentum. It is a modern, dynamic take on DIY music directories like *Book Your Own Fucking Life*, updated for the streaming and platform era.

This is not a marketing dashboard. It is a scene intelligence and relationship-building tool built for DIY artists who don't have managers, booking agents, or PR teams.

BandPath does not claim to have definitive, verified answers. The underground music world is too volatile for that. Instead, it surfaces the best available signals, explains where they came from, flags how fresh they are, and points artists toward the right starting places for their own verification and outreach.

> BandPath shows you where to start looking and helps you triangulate from there.

---

## What It Does

Independent artists are surrounded by opaque systems: algorithmic platforms, gatekeepers, and scene-based networks that are hard to map unless you already know someone. BandPath turns scattered signals into practical next steps and makes that hidden map visible.

Given an artist name, Spotify/Bandcamp link, home city, and genre tags, BandPath surfaces:

- **Adjacent artists** — similar bands, potential billmates, overlapping scenes
- **Venues** — DIY-friendly spaces and clubs in relevant cities
- **Local press** — blogs, zines, and writers covering the right scenes
- **Radio and podcasts** — community radio, college radio, specialty shows
- **Labels, festivals, promoters** — small and independent, relevant to the artist's sound
- **Playlists and curators** — contextual, not just algorithmic
- **Pathway suggestions** — practical, sequenced next steps

Every recommendation is source-backed with a confidence level, timestamp, and a suggested next action. AI enrichment is assistive, not authoritative. The product is transparent about uncertainty and never pretends verification has already been done.

---

## The Staleness Problem

Underground music scenes are volatile by nature. Booking contacts change. Bands go inactive or relocate. Venues shift formats or close. Promoters move on. This is not an edge case — it is the central design constraint.

BandPath's value proposition is not "we have the right contacts." It is "we show you where to start looking and help you triangulate from there."

Key failure modes to design around:

- **Booking contact staleness** — the real booker may only be reachable through Instagram DMs, a mutual connection, or showing up to a show. Never present contacts with false confidence.
- **Band activity uncertainty** — bands break up, relocate, or go on hiatus. Freshness signals lag.
- **Venue and promoter turnover** — contacts accurate a year ago may be wrong today.

The honest response is to surface uncertainty clearly, timestamp everything, and help artists know *how* to verify. The people using BandPath are themselves nodes in the scene graph — their corrections and updates are part of what makes the product work over time.

---

## Target Users

**Primary:** Independent musicians and DIY bands without industry access, management, booking support, or PR — artists who want practical, ethical, non-spammy ways to reach people and understand where they fit locally, regionally, or within genre-adjacent scenes.

**Secondary:** Local promoters, small labels, music bloggers, community radio DJs, DIY venues, scene organizers, and fans who want to discover and support local music ecosystems.

---

## Core Principles

- Serve artists, not exploit them
- Respect local scenes as communities, not markets to extract from
- Be transparent about data sources, confidence levels, freshness, and AI-generated vs. human-verified content
- Never pretend to have answers the product doesn't have
- Feel like a zine/directory/community map — not a corporate SaaS dashboard
- Avoid growth-hack language, fake virality promises, and generic music marketing advice
- Treat community flagging and editing as a core feature, not a phase 2 item

---

## Data Confidence

Every piece of data carries a visible confidence indicator based on source and freshness:

| Tier | Description |
|---|---|
| **AI / scraped** | Machine-generated or pulled from public sources. Lowest confidence. Always timestamped. Prompts users to verify or flag. |
| **Community-flagged** | A scene participant confirmed or updated this, with a date. Higher than raw AI, still subject to decay. |
| **Verified / claimed** | The entity confirmed through a claim flow. Highest tier. Still carries a last-verified date. |
| **Stale / flagged** | Any tier can be marked stale. Dead contacts and inactive bands are surfaced, not silently deleted. |

Confidence is temporal, not just accuracy-based. A contact verified two years ago should display differently than one verified last month. Every data point should ideally carry source, source date, last community confirmation, and staleness flags.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database / Auth | Supabase |
| Deployment | Vercel |
| Components | shadcn/ui (optional) |
| AI Enrichment | Anthropic or OpenAI API (optional, later) |
| Integrations | Spotify, Bandcamp, Bandsintown (optional, later) |
| Ingestion | Firecrawl, browser scraping, or ingestion workers (optional, later) |

Mapbox is not required for MVP unless geo lookup becomes necessary. Prefer lightweight ingestion, AI-assisted enrichment, or small curated seed sets over heavy manual CSV seeding.

---

## Information Architecture

**Public / discovery layer** — browse scenes by city, genre, band, venue, label, publication, radio show, festival, or promoter. Multiple entry points, not one rigid flow.

**Claimed artist layer** — deeper, personalized pathway generation behind login:

> Claim and verify your artist account to begin finding your path.

Artists can save opportunities, enrich their profile, and receive personal pathway recommendations. Public browsing remains available without a claim.

**Community / verification layer** — artists, venues, and promoters can claim listings; community members can suggest edits or flag stale data; all changes are attributed and source-backed.

---

## MVP Screens

1. **Landing page** — explain the product, search/claim artist CTA, browse scenes CTA
2. **Artist search / claim** — search for an artist, add manually if not found, connect links, verify ownership
3. **Artist dashboard** — artist snapshot, pathway summary, recommended opportunity cards, saved opportunities, missing profile data prompts
4. **Scene explorer** — browse by city and genre, view related bands, venues, blogs, radio, labels, festivals
5. **Opportunity detail** — why it's recommended, sources, suggested next step, save/dismiss/note
6. **Admin / enrichment view** — review AI-generated entities, add/edit sources, approve or reject suggestions

---

## Data Model (Core Entities)

```
Artist, City, Scene, GenreTag
Venue, Promoter, Publication, Writer
RadioShow, DJ, Playlist, Label, Festival
Event, Opportunity, Source, Claim
User, SavedOpportunity, Note
```

Key relationships:

- Artist belongs to City, has many GenreTags
- Artist connects to Artists through similarity, shared bills, shared labels, shared playlists, or shared press
- Venue belongs to City
- Event connects Artists, Venue, Promoter, and Date
- Opportunity points to one or more entities and sources
- Source supports a claim or recommendation
- User can claim Artist, save Opportunity

Design schemas and UI to carry source, timestamp, and confidence tier on every data point from the start.

---

## Example User Journey

A Portland post-punk band enters their Spotify or Bandcamp link.

BandPath identifies their genre cluster (post-punk, art-punk, DIY punk, experimental indie), adjacent cities (Olympia, Seattle, Astoria, Eugene), local DIY-friendly venues, KEXP specialty shows, community and college radio, local blogs and zines, and potential show-swap targets.

Suggested next actions might include radio submissions, local press outreach, Bandcamp tag improvements, and physical media review targets — presented as explainable opportunity cards with confidence levels and a suggested path, not a blast-everything submission list.

---

## Build Sequence

1. Define core TypeScript types and entities (with confidence/source/freshness fields)
2. Build static prototype screens with mock data
3. Add Supabase schema for artists, entities, sources, opportunities, claims, saved opportunities
4. Add artist search / create flow
5. Add claim / verification placeholder flow
6. Add artist dashboard with mock opportunity cards
7. Add source-backed opportunity detail pages
8. Add basic admin / enrichment workflow
9. Add AI enrichment after core product shape is solid
10. Test with one real band and one real city/scene before scaling

---

## Open Questions

- Should the product stay named BandPath, or become SceneMap, Artist Pathway, or something else?
- How much should be public vs. login-gated?
- What is the smallest credible data source strategy for MVP?
- Should the first release focus on Portland / Pacific Northwest scenes only?
- Should artists be able to edit community listings at launch?
- How should confidence levels be calculated and explained?
- What is the right verification method for claimed artist profiles?
- What are the most useful opportunity categories for the first release?
- What is the right decay threshold for flagging data as likely stale?
- Should booking contacts be handled differently from other contact types?
- How do we make community flagging low-friction enough that people actually use it?
- Should there be a lightweight "this band is still active" / "this venue is still open" confirmation mechanic?

---

## Development Notes

When working on this codebase:

- Preserve the DIY/community-first product spirit
- Do not over-enterprise the UI
- Prioritize useful MVP flows over complex architecture
- Keep data models flexible; this is an evolving product
- Favor source-backed recommendations with visible confidence levels and timestamps
- Treat AI enrichment as assistive, not authoritative — avoid fake certainty or hallucinated contacts
- Make interfaces feel like scene exploration, not analytics dashboards
- The staleness problem is real and central — never present contact or band data as current without a freshness signal
- Community flagging and editing is a core feature — build data models that support it even before the UI exists

---

## Status

Early-stage concept and MVP build. No public release yet.
