<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Tekstkonventioner (dansk UI)

- **Ingen lange bindestreger nogen steder.** Brug aldrig em-dash (U+2014) eller en-dash (U+2013) i brugervendt tekst, kommentarer eller dokumentation. Omskriv med komma, punktum eller kolon, eller brug en kort bindestreg (-) hvor det giver mening (fx sammensatte ord som "stempel-QR").
- Skriv korrekt dansk med æ/ø/å i al brugervendt tekst.
- Fejl vises i fejlfarven (`text-rust`), ikke i brandfarven.

# Design (låst)

- Udseendet er låst og beskrevet i [DESIGN.md](DESIGN.md). Læs den, før du laver eller ændrer en side.
- Genbrug de komponenter og farver, der står dér. Nye farver, skrifter eller et nyt udtryk kræver Alis godkendelse.
- Produktet hedder Folka Kort. Det gamle Stemplet-udtryk (terrakotta, pergament, Instrument Sans) bruges ikke på nye sider.
- Roadmap og beslutninger står i [docs/roadmap.md](docs/roadmap.md).
