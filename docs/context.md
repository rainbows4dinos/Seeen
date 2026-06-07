# BandPath / Artist Pathway Project — Context File

## Project Summary

BandPath, formerly called Artist Pathway, is a product concept for helping independent artists understand, build, and participate in music scenes. The core idea is a modern, dynamic version of DIY music directories like *Book Your Own Fucking Life*, but updated for the streaming/social/platform era.

The product helps artists discover practical pathway opportunities across cities, genres, scenes, venues, local media, radio, podcasts, blogs, playlists, labels, festivals, promoters, and peer bands. It is not just a marketing dashboard. It is a scene intelligence and relationship-building tool.

The project is especially focused on artists who do not already have industry access, management, booking support, PR, or insider knowledge.

## Working Product Thesis

Independent artists are surrounded by opaque systems:

- Algorithmic platforms such as Spotify, Bandcamp, Instagram, TikTok, YouTube, and Apple Music
- Gatekeepers such as blogs, playlist curators, promoters, venues, festivals, labels, radio DJs, and local press
- Scene-based networks that are hard to map unless you already know someone

BandPath should help artists turn scattered signals into practical next steps.

The product should answer questions like:

- Where does this artist fit?
- Which cities or scenes are adjacent to their sound?
- What venues, bands, promoters, blogs, DJs, playlists, radio shows, or labels should they know about?
- What opportunities are realistic right now?
- What actions should the artist take next?
- How can an artist participate in a scene without being extractive or spammy?

## Product Positioning

BandPath is not primarily an ads product, a generic AI music marketing tool, or a traditional analytics dashboard.

It should feel more like:

- A scene explorer
- A pathway mapper
- A DIY music intelligence tool
- A community-editable directory
- A contextual recommendation engine
- A guide for finding legitimate, human-scale opportunities

Possible positioning language:

> BandPath helps independent artists find their way into real scenes — mapping the venues, bands, curators, writers, radio shows, labels, festivals, and local networks that can help them build momentum.

## Target User

Primary user:

- Independent musicians and bands
- DIY artists without managers, booking agents, or PR teams
- Artists trying to understand where they fit locally, regionally, or within genre-adjacent scenes
- Artists who want practical, ethical, non-spammy ways to reach people

Secondary users:

- Local promoters
- Small labels
- Music bloggers
- Community radio DJs
- DIY venues
- Scene organizers
- Fans who want to discover and support local music ecosystems

## Core User Problem

Most independent artists do not lack effort. They lack access, context, and a clear map of the ecosystem around them.

The music industry has many economies built around that lack of access: PR, playlisting, ads, marketing packages, submission platforms, and growth hacks. Some of those tools can be useful, but many are expensive, opaque, extractive, or poorly matched to what artists actually need.

BandPath should demystify those pathways and make the hidden scene graph visible.

## MVP Direction

The MVP should be intentionally rough, playful, and useful. It does not need to solve the whole music industry.

The MVP should likely focus on:

1. Artist input
   - Artist name
   - Spotify link, Bandcamp link, or manual description
   - City or home base
   - Genre tags / sound descriptors

2. Scene graph output
   - Similar or adjacent artists
   - Relevant cities
   - Relevant venues
   - Local/regional blogs and writers
   - Community radio shows / DJs
   - Podcasts
   - Playlists or curators
   - Small labels
   - Festivals
   - Promoters / booking contacts where discoverable

3. Opportunity cards
   - Each card should explain why the opportunity matters
   - Include confidence level or source signal
   - Include next suggested action
   - Include links/sources
   - Avoid pretending the AI "knows" more than it does

4. Pathway suggestions
   - Example: "Start with these 3 Portland contacts, then explore Olympia/Seattle punk-adjacent venues."
   - Example: "This band's strongest signal is college/community radio, not playlists."
   - Example: "These bands appear in adjacent scenes and could be potential billmates."

## Possible Information Architecture

### Public / Discovery Layer

A public-facing scene explorer could allow browsing by:

- City
- Genre
- Band
- Venue
- Label
- Publication
- Radio show
- Festival
- Promoter

This could feel like Airbnb-style exploration, with multiple entry points rather than one rigid flow.

### Claimed Artist Layer

There may be value in placing deeper recommendations behind a login or artist claim flow.

Potential flow:

> Claim and verify your artist account to begin finding your path.

Reasons to consider a login/claim layer:

- Lets artists save opportunities
- Lets artists edit or enrich their own profile
- Prevents fully anonymous scraping/misuse
- Enables verification
- Supports personal pathway recommendations
- Creates a clearer product conversion moment

The app could still have public browsing, but personalized pathway generation may require claiming an artist profile.

## Verification / Community Layer

BandPath could become community-editable, but should include trust and verification patterns.

Potential models:

- Artists can claim their profiles
- Venues/promoters/labels can claim listings
- Community members can suggest edits
- Edits can be pending until verified
- Sources are always attached to claims
- Confidence levels are shown openly
- AI-generated data is clearly labeled
- Human-verified data is visually distinguished

The goal is to avoid becoming another spammy music database full of stale contacts.

## Data Sources / Signals

Potential sources to explore:

- Bandcamp artist pages, tags, locations, supporters, labels, collections
- Spotify artist pages, related artists, playlists, listener geography where available
- Bandsintown / Songkick / venue calendars
- Instagram bios, show flyers, tagged posts, venue/promoter activity
- Local blogs and music publications
- Community radio playlists
- College radio playlists
- Podcasts
- Festival lineups
- Label rosters
- Venue event archives
- YouTube / YouTube Music
- Apple Music editorial or artist pages, though playlist ecosystem differs from Spotify
- Manual CSV/admin seeding if needed, but this may be a time blocker for MVP

Important: source attribution matters. The product should show where a recommendation came from.

## AI Enrichment Ideas

AI could help by:

- Summarizing an artist's sound from public descriptions, reviews, and metadata
- Extracting genre/location/scene signals
- Identifying related artists and shared ecosystem nodes
- Clustering venues, bands, blogs, labels, and promoters by scene
- Explaining why an opportunity is relevant
- Turning raw signals into suggested next actions
- Generating outreach drafts that are specific, respectful, and non-spammy
- Flagging weak, stale, or low-confidence recommendations
- Comparing an artist's likely pathway across cities

AI should not hallucinate contacts or fake certainty. Every recommendation should be source-backed when possible.

## Tone and UX Principles

The experience should feel:

- DIY but polished
- Encouraging without being fake
- Practical, not guru-ish
- Scene-aware
- Anti-extractive
- Transparent about uncertainty
- Playful but useful
- More zine/directory/community map than corporate SaaS dashboard

Avoid:

- Growth-hack language
- "Crush the algorithm" clichés
- Fake virality promises
- Generic music marketing advice
- Overly polished enterprise SaaS vibes
- Treating artists like ad buyers first

## Feature Concepts

### Artist Snapshot

A concise profile generated from available data:

- Name
- Location
- Genre/sound tags
- Short description
- Key releases
- Similar/adjacent artists
- Known scene connections
- Available links
- Confidence/source summary

### Scene Map

A graph or list-based representation of connected entities:

- Bands
- Venues
- Promoters
- Labels
- Publications
- Radio shows
- Playlists
- Festivals
- Cities

A visual map is not required for MVP. The product can work as cards, lists, clusters, and pathways.

### Opportunity Cards

Each opportunity card might include:

- Opportunity name
- Type: venue, blog, radio, playlist, band, festival, label, promoter
- Location
- Why it matches
- Evidence/source links
- Suggested action
- Confidence level
- Save/dismiss controls
- User notes

### Pathway View

A guided sequence of recommended actions:

1. Strengthen local scene presence
2. Identify adjacent bands for show swaps
3. Target community radio and small blogs
4. Explore nearby regional cities
5. Build a lightweight outreach list

### Claim Artist Flow

Possible steps:

1. Search for artist
2. Confirm links
3. Verify ownership through website, social account, email domain, or manual review
4. Add missing metadata
5. Generate first pathway

## Current Design Direction

Recent Figma Make explorations use the names SceneMap / BandPath and include visual ideas around:

- Pathway cards
- Artist profile claim flow
- Scene/opportunity discovery
- Search and browse
- Login-gated artist workspace
- Public-facing discovery surfaces

The latest strategic direction is to push toward a claimed artist account model:

> Claim and verify your artist account to begin finding your path.

## Technical Stack Preference

Preferred vibe-coding-friendly stack:

- Next.js / React
- TypeScript
- Tailwind CSS
- Supabase for database/auth/storage
- Vercel for deployment
- Optional: shadcn/ui for components
- Optional: OpenAI or Anthropic API for AI enrichment
- Optional: Firecrawl, browser scraping, or ingestion workers later
- Optional: Spotify/Bandcamp/Bandsintown integrations where feasible

Avoid starting with Rails if possible. The user prefers modern React/Next/Vercel workflows and is exploring Claude Code, Cursor, and Figma Make.

Mapbox is probably not required for the MVP unless geo lookup becomes necessary. A visual geographic map is not currently a core requirement.

Manual CSV seeding may be useful but could become a blocker. Prefer lightweight ingestion, AI-assisted enrichment, or small curated seed sets.

## Suggested Data Model Draft

Core entities:

- Artist
- City
- Scene
- GenreTag
- Venue
- Promoter
- Publication
- Writer
- RadioShow
- DJ
- Playlist
- Label
- Festival
- Event
- Opportunity
- Source
- Claim
- User
- SavedOpportunity
- Note

Potential relationships:

- Artist belongs to City
- Artist has many GenreTags
- Artist connects to many Artists through similarity, shared bills, shared labels, shared playlists, or shared press
- Venue belongs to City
- Event connects Artists, Venue, Promoter, and Date
- Opportunity points to one or more entities and sources
- Source supports a claim or recommendation
- User can claim Artist
- User can save Opportunity

## MVP Screens

Possible initial screens:

1. Landing page
   - Explain the product
   - Search artist / claim artist CTA
   - Browse scenes CTA

2. Artist search / claim
   - Search for artist
   - Add artist manually if not found
   - Connect links
   - Claim/verify CTA

3. Artist dashboard
   - Artist snapshot
   - Pathway summary
   - Recommended opportunities
   - Saved opportunities
   - Missing profile data prompts

4. Scene explorer
   - Browse by city and genre
   - View related bands, venues, blogs, radio, labels, festivals

5. Opportunity detail
   - Why this is recommended
   - Sources
   - Suggested next step
   - Save/dismiss/note

6. Admin / enrichment view
   - Review AI-generated entities
   - Add/edit source links
   - Approve or reject suggestions

## Example User Journey

A Portland post-punk band enters their Spotify or Bandcamp link.

BandPath identifies:

- Home city: Portland
- Genre cluster: post-punk, art-punk, DIY punk, experimental indie
- Adjacent cities: Olympia, Seattle, Astoria, Eugene
- Adjacent bands: local and regional bands with overlapping venues, tags, or press
- Venues: small DIY-friendly spaces and clubs
- Radio: KEXP specialty shows, local/community radio, college radio
- Press: local blogs, zines, small publications
- Potential next actions: show swap targets, radio submissions, local press outreach, Bandcamp tags to improve, physical media review targets

The product presents this as a set of explainable opportunity cards and a suggested path.

## Important Product Philosophy

BandPath should serve artists, not exploit them.

It should help artists build real relationships and understand scenes, not just blast submissions or buy growth services.

It should respect local scenes as communities, not as markets to extract from.

It should be transparent about uncertainty, source quality, and the difference between AI-generated suggestions and verified information.

## Open Questions

- Should the product be called BandPath, Artist Pathway, SceneMap, or something else?
- How much should be public vs login-gated?
- What is the smallest credible data source strategy for MVP?
- Should the first MVP focus on Portland/Pacific Northwest scenes only?
- Should artists be able to edit community listings at launch, or should that come later?
- What is the right verification method for claimed artist profiles?
- How should confidence levels be calculated and explained?
- What are the most useful opportunity categories for the first release?

## Near-Term Recommended Build Sequence

1. Define core entities and TypeScript types.
2. Build static prototype screens with mock data.
3. Add Supabase schema for artists, entities, sources, opportunities, claims, and saved opportunities.
4. Add artist search/create flow.
5. Add claim/verification placeholder flow.
6. Add artist dashboard with mock opportunity cards.
7. Add source-backed opportunity detail pages.
8. Add basic admin/enrichment workflow.
9. Add AI enrichment only after the core product shape feels right.
10. Test with one real band and one real city/scene before scaling.

## Useful Initial Build Prompt

Use this prompt to start implementation work:

> We are building BandPath, a Next.js/TypeScript/Supabase app that helps independent musicians discover scene-based pathway opportunities. The app should let an artist search for or create an artist profile, claim/verify that profile, and view recommended opportunities such as venues, bands, blogs, radio shows, labels, festivals, playlists, and promoters. Recommendations should be represented as source-backed opportunity cards with confidence levels, explanation, links, and suggested next actions. Start by creating the core app structure, data model/types, and MVP screens: landing page, artist search/claim flow, artist dashboard, scene explorer, and opportunity detail. Use Tailwind and simple reusable components. Keep the UI DIY, editorial, and community-oriented rather than corporate SaaS.

## Useful Design Prompt

Use this prompt for Figma Make or design exploration:

> Design a web app for BandPath, a scene intelligence and pathway discovery tool for independent musicians. The product helps artists claim their profile and discover relevant venues, bands, promoters, blogs, radio shows, labels, festivals, playlists, and local scenes. The design should feel like a modern DIY music directory crossed with a smart recommendation system — editorial, warm, slightly zine-like, but still clear and usable. Create screens for landing page, claim artist flow, artist dashboard, scene explorer, opportunity cards, and opportunity detail. Emphasize source-backed recommendations, confidence levels, and practical next actions. Avoid corporate SaaS aesthetics and generic analytics dashboard patterns.