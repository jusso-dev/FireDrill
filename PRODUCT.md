# FireDrill — Product Context

## Product purpose

FireDrill is a self-hosted SRE incident-simulation lab. Engineers spin it up with `docker compose up`, trigger realistic production failures (latency spike, error storm, database slowdown, queue backlog, worker failure, memory pressure), and watch them surface across dashboards, metrics, alerts, and incident timelines. They can resolve incidents and generate post-incident reports. Built as a portfolio project that demonstrates SRE thinking end-to-end: observability, incident response, infrastructure, monitoring, alerting, production-readiness.

## Register

**product** — this is a control surface, not a marketing site. Users are inside a task: trigger failure, observe symptoms, mitigate, write postmortem. Design serves the task; design IS NOT the product.

## Users

Three audiences, ranked:

1. **The author (live demo).** Walks a hiring manager or interviewer through "here's what production-grade observability looks like" in 5 minutes. Must read instantly, on a projector or a small laptop.
2. **Hiring managers / SRE leads (recruiter loop).** Open repo, skim screenshots, decide whether to ask a deeper question. Screenshots must say "this person has worked in a real incident command surface."
3. **Engineers running it locally.** Spend 30 minutes triggering scenarios, end up understanding the codebase. Familiar dispatch metaphors lower their cognitive load.

## Tone & voice

Station-house, not start-up. Words are short, declarative, sometimes blunt. Eyebrows look like dispatch tags: `BAY 02 / ALARM`. No marketing copy, no exclamations, no emoji. Empty states deadpan ("quiet on the wire") rather than chipper ("nothing here yet!"). System status reads like an apparatus check, not a friendly bot.

## Brand & visual mood

**Scene sentence:** "On-call SRE at 2am after a page; eyes are bloodshot, the room is dim, the only red light in the building belongs to the bay that's currently failing." Theme: dark, forced.

**Aesthetic anchors:**
- Engine-house apparatus bay, not "fire-themed startup logo."
- Industrial dispatch board: stenciled bay numbers, brushed-steel surfaces, concrete textures, hand-painted shop signage.
- Signal lights stay OFF unless something is actually wrong. Drama is reserved for incidents.

**Anti-references** (absolutely not):
- SaaS gradient hero with a flame emoji.
- "Linear-but-orange" minimalist white-space dashboard.
- Generic dark-blue observability template (Datadog, Grafana-default, New Relic).
- Bauhaus tri-color geometric branding.
- AI-default "obsidian neon" cyberpunk red.

## Strategic principles

- **Information density is a feature.** A dispatch board fits a lot on one screen on purpose. Don't pad.
- **Lights mean something.** Color is a state vocabulary (healthy / degraded / down / pending). Decoration uses neutrals.
- **Density without noise.** Heavy frames, full borders, grids of uniform cards are LAZY — vary structure between metric tiles, service list, and incident feed.
- **Read at 2am.** High contrast on stateful surfaces. Mono fonts on numbers, IDs, timestamps.
- **Demo-able in 5 seconds.** Trigger latency on the Scenarios page → a casual viewer should *see* the system go red without explanation.
