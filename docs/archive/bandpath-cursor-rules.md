# BandPath — Cursor Rules

## Project

BandPath is a scene intelligence and pathway discovery tool for independent musicians. It helps artists find venues, bands, blogs, radio shows, labels, festivals, promoters, and local networks relevant to their sound and city.

## Stack

- Next.js (App Router) with TypeScript
- Tailwind CSS for styling
- Supabase for database, auth, and storage
- Vercel for deployment
- shadcn/ui for components where appropriate
- Anthropic or OpenAI API for AI enrichment (added later, not in early MVP)

## Coding Conventions

- Always use TypeScript. No `any` types without a comment explaining why.
- Use Tailwind for all styling. No CSS modules or inline styles.
- Use the Next.js App Router. No pages directory.
- Keep components small and reusable.
- Co-locate types with the files that use them; shared types go in `types/`.
- Use Supabase client for all data access. No raw SQL unless necessary.
- Prefer server components. Use client components only when interactivity requires it.
- Keep data models flexible — this is an early-stage product.

## Product Principles

- Every recommendation should be source-backed with a visible confidence level.
- AI enrichment is assistive, not authoritative. Never fake certainty.
- Clearly distinguish AI-generated data from human-verified data in the UI.
- The UI should feel like a DIY music directory or zine — not a corporate SaaS dashboard.
- Do not over-engineer. Prioritize useful, shippable MVP flows.
- Avoid growth-hack language, generic music marketing copy, or analytics dashboard patterns.

## UI Tone

- DIY but polished
- Encouraging without being fake
- Practical and scene-aware
- Transparent about uncertainty
- More community map than marketing tool

## Core Entities

Artist, City, Scene, GenreTag, Venue, Promoter, Publication, Writer, RadioShow, DJ, Playlist, Label, Festival, Event, Opportunity, Source, Claim, User, SavedOpportunity, Note

## Key Screens

1. Landing page
2. Artist search / claim flow
3. Artist dashboard (snapshot, pathway, opportunity cards)
4. Scene explorer (browse by city and genre)
5. Opportunity detail
6. Admin / enrichment view

## What to Avoid

- `any` types
- Inline styles
- Pages directory
- Over-complex abstractions in early MVP
- Hallucinated music industry data
- Enterprise SaaS UI patterns
- Generic marketing copy
