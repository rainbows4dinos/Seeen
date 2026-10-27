# Seeen design rules

Status: baseline guidance; visual tokens and component library are not yet selected.

## Character

Build a useful DIY music directory: editorial, personable, and scene-aware. Let names, places, links, and relationship context lead. Use plain language such as Connections, Scenes, Homies, and Next action.

## Layout and hierarchy

- Make browsing, search, and scene filters easy to reach on desktop and mobile.
- Show connection name, type, scene, and Homie state before secondary metadata.
- Keep primary actions clear: add a connection, favorite it, or record outreach.
- Use comfortable reading widths and a consistent spacing scale. Define shared tokens when styling begins.
- Keep the first release focused on directory and detail views; prioritize useful relationship context over metrics.

## Components and states

- Reuse controls for buttons, fields, filters, tags, connection rows/cards, and status messages.
- Make Homie controls identifiable by both label and state; give icon buttons accessible names.
- Include loading, empty, no-results, error, saving, and success states. Preserve user input after failed saves.
- Show dates with enough context to distinguish past outreach from a future follow-up.
- Confirm destructive actions and prefer archiving when history is attached.

## Accessibility

- Use semantic HTML, associated input labels, visible keyboard focus, and logical focus order.
- Target WCAG AA contrast. Pair color with text or icons for meaning.
- Keep touch controls comfortable and layouts usable without horizontal page scrolling.
- Respect reduced-motion preferences; animation should support feedback.

## Content and privacy

Use fictional examples in public previews. Keep contact details and relationship notes inside authenticated views backed by database authorization. Clearly distinguish saved history from current plans and uncertain notes from confirmed details.

## Before shipping UI

Check the main workflow on desktop and mobile, keyboard navigation, contrast, long names, multiple scene tags, missing contact fields, and every async state affected by the change.
