# Trenova terminal design

The user dashboard is the visual reference for the entire application. Public pages,
authentication, user tools, and admin pages share the same dark theme from the first
server-rendered frame. Saved light-mode preferences no longer override this theme.

| Role | Color |
| --- | --- |
| Page background | `#0A0A0A` |
| Card surface | `#141414` |
| Inset surface | `#111111` |
| Primary text | `#D8D8D8` |
| Muted text | `#929292` |
| Border | `#2A2A2A` |
| Brand / primary action | `#D4A843` |
| Primary action hover / emphasis | `#F0C060` |
| Secondary gold | `#B8902F` |
| Positive status | `#68CE98` |
| Negative status | `#EF7777` |

Use Geist Mono, thin borders, 2–4px panel corners, uppercase module labels, and flat
surfaces. Keep circular avatars and status indicators. Gold identifies actions and
active navigation; green/red communicate status, market direction, and risk.

Shared tokens and interaction styles live in `src/app/globals.css`. Existing slate
utilities use neutral grays so they remain compatible with dashboard components.
Use `bg-card`, `bg-background`, `text-foreground`, `text-neon`, and `border-border`
for new components. Primary gold buttons need dark text (`text-slate-950`).

`AuthShell` supplies the shared responsive login/register layout and loading state.
The admin layout supplies the terminal header/footer across all admin routes.
`dashboard/terminal.css` contains dashboard-specific layouts rather than a separate
palette. Embedded charts receive the same dark theme from `ThemeProvider`.

Check desktop and narrow phone layouts, ID/EN labels, keyboard focus, loading/error
states, and button contrast when extending the design. Auth and admin actions keep
their existing server-side access checks.
