# Seeen

**Your people. Your scenes.**

Seeen helps Merwulf keep track of its music network and decide whom to reach out to next. It is a private workspace shared by band members, organized around local scenes and real relationships.

Formerly Artist Pathway / BandPath. The project restarted on October 27, 2026 with a smaller, personal MVP.

## MVP

- **Connections:** bands, promoters, venues, DJs, playlisters, and other people or organizations in the network.
- **Scenes:** organize connections by locality and scene, with multiple memberships when useful.
- **Homies:** favorite connections with a shared band-wide flag.
- **Affiliations:** links between connections, such as who plays in which bands, who books which venue, or who works where, shown on each connection's detail page.
- **Prospects:** curate potential connections, record why they matter, and prioritize outreach.
- **Follow-through:** log outreach and track a next action, responsible member, and follow-up date.
- **Shared access:** authorized Merwulf members can work with the same private data across devices.
- **Portability:** export the directory to CSV.

Search and filters should make it easy to move between scenes, connection types, Homies, and relationship stages. Start with manually curated prospects; automated discovery is deferred.

## Architecture

| Layer | Direction |
| --- | --- |
| Frontend | Web app; framework to be selected |
| Language | TypeScript |
| Styling | Tailwind CSS planned |
| Hosting | Vercel |
| Database | Supabase Postgres |
| Authentication | Supabase Auth |
| Authorization | Workspace membership enforced through Row Level Security |

Vercel hosts the application. Contact details, notes, and outreach history live in Supabase and are accessible only to authorized members. Browser configuration may contain the Supabase project URL and publishable key; privileged secrets belong outside the frontend and repository.

Configure Supabase authentication redirects for production, approved preview environments, and local development. Keep environment configuration explicit for each deployment environment. Choose server-side functionality only where the MVP needs it.

## Delivery target

Live MVP: **November 10–17, 2026**.

1. **October 27–November 2:** settle fields and scene structure; scaffold frontend, sign-in, membership policies, directory, and editor; deploy an initial Vercel build.
2. **November 3–9:** add scene filters, Homies, prospects, outreach history, export, and mobile layouts; try a representative set of connections.
3. **November 10–17:** verify collaboration and data access, fix workflow issues, and launch.

Launch means two authorized band members can update the same records across devices, unauthorized users cannot read or change them, and the core add → organize → favorite → follow up workflow works on mobile and desktop. CSV export must work.

## Scope boundaries

Automated scraping, AI recommendations, automatic messaging, social integrations, graph visualization, touring routes, public profiles, and multi-band customer support come after the MVP.

## Development status

Planning and documentation only. Application scaffolding, Supabase migrations, and deployment workflows have not been created. There are no install, development, or test commands yet.

## Project documentation

- [Product context and data model](docs/context.md)
- [Design system rules](docs/design-system/rules.md)
- [Agent instructions](AGENTS.md)
- [Historical BandPath context](docs/archive/bandpath-context.md) — superseded; reference only
