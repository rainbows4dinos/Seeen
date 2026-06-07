# BandPath

**Scene intelligence and pathway discovery for independent musicians.**

BandPath helps independent artists find their way into real scenes — mapping the venues, bands, curators, writers, radio shows, labels, festivals, and local networks that can help them build momentum.

This is not a marketing dashboard. It is a scene intelligence and relationship-building tool built for DIY artists who don't have managers, booking agents, or PR teams.

---

## What It Does

Independent artists are surrounded by opaque systems: algorithmic platforms, gatekeepers, and scene-based networks that are hard to map unless you already know someone. BandPath makes that hidden map visible.

Given an artist name, Spotify/Bandcamp link, home city, and genre tags, BandPath surfaces:

- **Adjacent artists** — similar bands, potential billmates, overlapping scenes
- **Venues** — DIY-friendly spaces and clubs in relevant cities
- **Local press** — blogs, zines, and writers covering the right scenes
- **Radio** — community radio, college radio, specialty shows
- **Labels, festivals, promoters** — small and independent, relevant to the artist's sound
- **Playlists and curators** — contextual, not just algorithmic
- **Pathway suggestions** — practical, sequenced next steps

Every recommendation is source-backed with a confidence level and a suggested next action. AI enrichment is assistive, not authoritative. The product is transparent about uncertainty.

---

## Core Principles

- Serve artists, not exploit them
- Respect local scenes as communities, not markets to extract from
- Be transparent about data sources, confidence levels, and AI-generated vs. human-verified content
- Feel like a zine/directory/community map — not a corporate SaaS dashboard
- Avoid growth-hack language, fake virality promises, and generic music marketing advice

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

---

## MVP Screens

1. **Landing page** — explain the product, search/claim artist CTA, browse scenes CTA
2. **Artist search / claim** — search for an artist, add manually if not found, connect links, verify ownership
3. **Artist dashboard** — artist snapshot, pathway summary, recommended opportunity cards, saved opportunities
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
- Artist connects to Artists through similarity, shared bills, shared labels, shared press
- Opportunity points to one or more entities and sources
- User can claim Artist, save Opportunity

---

## Example User Journey

A Portland post-punk band enters their Bandcamp link.

BandPath identifies their genre cluster (post-punk, art-punk, DIY punk, experimental indie), adjacent cities (Olympia, Seattle, Eugene), local venues, KEXP specialty shows, community radio, local zines, and potential show-swap targets.

The result is a set of explainable opportunity cards and a suggested path — not a blast-everything submission list.

---

## Build Sequence

1. Define core TypeScript types and entities
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
- What is the smallest credible data source strategy for MVP?
- Should the first release focus on Portland / Pacific Northwest scenes only?
- How much of the product is public vs. login-gated?
- How should confidence levels be calculated and surfaced?
- What is the right verification method for claimed artist profiles?

---

## Development Notes

When working on this codebase:

- Preserve the DIY/community-first product spirit
- Do not over-enterprise the UI
- Prioritize useful MVP flows over complex architecture
- Keep data models flexible; this is an evolving product
- Favor source-backed recommendations with visible confidence levels
- Treat AI enrichment as assistive, not authoritative
- Make interfaces feel like scene exploration, not analytics dashboards

---

## Status

Early-stage concept and MVP build. No public release yet.