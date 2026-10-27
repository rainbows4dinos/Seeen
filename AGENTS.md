# Working on Seeen

Read [README.md](README.md) for current scope and delivery targets. For schema, relationship logic, or outreach work, read [docs/context.md](docs/context.md). For UI work, read [docs/design-system/rules.md](docs/design-system/rules.md).

## Implementation constraints

- Build for Vercel hosting and shared data in Supabase. Keep the architecture simple; add server-side functionality when a workflow requires it.
- Use TypeScript and keep data access separate from rendering. Prefer small modules shaped around the MVP workflows.
- Enforce private workspace access in Supabase Row Level Security, including membership and related tables. Verify authorized and unauthorized read/write behavior when changing policies.
- Keep service-role keys, database credentials, real contact lists, and private notes out of source, fixtures, logs, and built assets. Use fictional sample data.
- Preserve outreach history when updating next actions. Keep Homie status independent of relationship stage.
- Keep database changes in versioned migrations when database implementation begins.

## Working process

- Keep scope aligned with the README. Historical material in `docs/archive/` is reference only and does not define current requirements.
- Use the repository's actual scripts once scaffolding exists; document setup alongside it. Until then, report that application checks are unavailable.
- Validate behavior affected by a change. For deployment changes, check production and preview environment configuration and Supabase auth redirect behavior. For UI changes, check mobile layout, keyboard operation, and loading/empty/error states.
- In handoffs, state what changed, what was checked, and what remains unverified.
