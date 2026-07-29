# 1. Adopt @wedevs/plugin-ui for admin chrome

Date: 2026-07-22

## Status

Accepted

## Context

TryAura needed a persistent admin Top Bar (logo, version badges, Get Support,
help menu — tryaura-pro#40/#41). TryAura already had its own small component
set (`src/components/`) with a scoped Tailwind theme, so the bar could have
been built in-house. But the bar is meant to be shared across StorePulse
plugins, and wePOS — the next candidate — already builds its admin on
`@wedevs/plugin-ui` (getdokan/plugin-ui), which ships a ready-made `TopBar`
and `DropdownMenu` with the dismissal behaviors the spec requires.

## Decision

Add `@wedevs/plugin-ui` as a dependency and build the Top Bar from its
components. Wrap the dashboard SPA in its `ThemeProvider` (the mechanism that
creates the `.pui-root` style scope), using **default tokens only** — no
custom accent, no dark mode, no Shadow DOM. TryAura's existing components and
`.tryaura`-scoped styles remain untouched for everything else.

## Consequences

- The admin bundle carries both style systems (`.tryaura` and `.pui-root`);
  new admin chrome should prefer plugin-ui so the in-house set can shrink
  over time rather than grow.
- The Top Bar's look now tracks upstream plugin-ui; visual changes can arrive
  via dependency updates.
- Theming (indigo accent, dark mode) is deliberately deferred; enabling it
  later is a token override in one place, not a rebuild.
- The same bar can be ported to wePOS and other StorePulse plugins with only
  logo/links/data-seam differences.
