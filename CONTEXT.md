# TryAura — Ubiquitous Language

A glossary of domain terms for this plugin. Keep implementation details out.

## Admin chrome

- **Top Bar** — The persistent plugin header rendered at the top of every TryAura
  admin screen. Contains the plugin logo, version badges, the Get Support button,
  and the Help Menu. Built from the StorePulse component system.
- **Help Menu** — The dropdown opened by the "?" button in the Top Bar. Lists
  external self-service links (Documentation, FAQ, Request a Feature, Changelog,
  and — for Lite users only — Upgrade to Pro).
- **Version Badge** — A plain-text (non-link) badge in the Top Bar showing an
  installed plugin version. The **Lite badge** always shows and reads the free
  plugin's header version; the **Pro badge** shows only when TryAura Pro is
  active and reads the Pro plugin's header version.

## Editions & platform

- **Lite** — The free TryAura plugin distributed on WordPress.org.
- **Pro** — The TryAura Pro plugin. Declares its presence to Lite via the
  `tryaura_is_pro_exists` filter; Lite exposes this to JS as `hasPro`.
- **StorePulse** — The product family/brand (storepulse.co) that TryAura belongs
  to. Shared UI across StorePulse plugins comes from the **StorePulse component
  system**, implemented as the `@wedevs/plugin-ui` package.
- **plugin-ui** — The shared `@wedevs/plugin-ui` React component library
  (getdokan/plugin-ui). Components render inside a `ThemeProvider` scope.
  TryAura consumes it with default tokens: no custom theme, no dark mode, and
  no Shadow DOM for now.
