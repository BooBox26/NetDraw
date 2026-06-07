# NETDRAW Roadmap

This document outlines the planned evolutions of **NETDRAW**, structured by
priority tier. Each item is sized roughly (S / M / L) and tagged with a status
(_planned_, _in progress_, _shipped_).

> **Product philosophy.** NETDRAW is a **static, self-hostable diagramming
> tool** in the spirit of Microsoft Visio and Draw.io, with a clear
> orientation toward **network, telecom, and IT infrastructure** diagrams.
> It does not aim to be a supervision tool, an IPAM, a real-time
> collaboration platform, or an AI generator. The roadmap below is
> deliberately conservative: small, useful features first, and only the
> occasional major feature when it directly improves the _drawing_ and
> _documentation_ experience.

> Have a feature request? Open a GitHub Discussion under the “Ideas”
> category. Items promoted to P0/P1 are tracked as GitHub issues.

---

## 🛠️ P0 — Foundations and stability (immediate)

_Essential work for a trustworthy, polished public release. Quality over
quantity._

- [x] **Secure SVG sanitization** — Server-side (JSDOM + DOMPurify) and
      client-side (DOMPurify) defense-in-depth. _Shipped._
- [x] **Import/Export data integrity** — Custom SVGs, device metadata, VRFs,
      and subnets preserved across `.ndj` round-trips. _Shipped._
- [x] **Input validation on every mutating route** — Zod schemas for
      projects, comments, snapshots, branches, workflows, and audit logs.
      _Shipped._
- [x] **Linter + format checks in CI** — `npm run lint` and
      `npm run format:check` run on every PR. _Shipped._
- [x] **Accessibility basics** — Keyboard shortcuts, ARIA labels on key
      controls, and visible focus rings. _Shipped (foundations)._
- [ ] **Accessibility audit and remediation** — Full pass against WCAG 2.1
      AA on the editor and dialogs. _Planned (M)._
- [ ] **Automated canvas tests** — Vitest suite for core canvas actions
      (add shape, connect shapes, lock layer, undo/redo). _Planned (M)._
- [ ] **Performance budget enforced in CI** — Fail the build when the main
      JS chunk exceeds a configurable size. _Planned (S)._
- [ ] **Dependency review bot** — Automated PR comment listing outdated or
      vulnerable transitive deps. _Planned (S)._
- [ ] **Public security policy** — `SECURITY.md` with a monitored contact
      channel and CVE disclosure timeline. _Planned (S)._

---

## 📈 P1 — Drawing experience and small quality-of-life features (1–3 months)

_Small, high-leverage features that make daily diagramming more pleasant
and more aligned with the network / telecom use cases the tool targets._

### Shape library and standards

- **Rack-mount equipment set** _(S, planned)_ — Standardized 1U / 2U / 4U
  chassis shapes, patch panels, PDUs, with proper EIA-310 alignment guides.
- **Wireless and cellular set** _(S, planned)_ — Antennas, sector antennas,
  small cells, satellite dishes, with pattern indicators.
- **Optical fiber components** _(S, planned)_ — OLT, ONT, splitters
  (1:8 / 1:16 / 1:32 / 1:64), fiber patch panels, splice closures.
- **Generic IT infrastructure** _(S, planned)_ — Servers (1U, 2U, blade,
  tower), storage arrays, tape libraries, KVM, UPS.
- **Cloud and SaaS icons** _(S, planned)_ — Generic cloud, SaaS, region,
  zone, edge, CDN — for hybrid-architecture diagrams.
- **Per-vendor icon packs** _(M, planned)_ — Optional, community-maintained
  packs (Cisco, Juniper, HPE-Aruba, Mikrotik, Huawei) shipped as separate
  imports. **No live data, just static SVG.**

### Connectors and labels

- **Cable type styling** _(S, planned)_ — Visual differentiation for
  copper / fiber / coax / logical, with a small inline legend.
- **Port-aware connectors** _(M, planned)_ — Snap a connector to a
  specific port and keep the link when the port is reassigned.
- **Inline labels on connectors** _(S, planned)_ — Bandwidth, VLAN, link
  ID, length, all editable inline without opening a property panel.
- **Connector bundles** _(M, planned)_ — Visually group parallel links
  (LACP, port-channel, MLAG) into a single bundle with member count.

### Layout and editing

- **Auto-layout presets** _(M, planned)_ — Hierarchical, radial, and
  grid layouts, applied to the current selection or the whole page.
- **Diagram overview minimap** _(S, planned)_ — Click-to-pan minimap in the
  status bar.
- **Quick-find palette** _(S, planned)_ — `Ctrl/Cmd+K` to search shapes,
  templates, and diagrams by name or tag.
- **Snap-to-anchor when dragging** _(S, planned)_ — Improved snap feedback
  with subtle guides.
- **Multi-page diagrams** _(M, planned)_ — Tabs at the top of the editor;
  each page has its own background, layers, and shapes.
- **Smart copy / paste** _(S, planned)_ — Duplicate a selection with an
  offset, and increment hostnames, IP addresses, and VLAN IDs intelligently.

### Templates and starting points

- **More starter templates** _(S, planned)_ — Small office LAN, campus
  network, datacenter leaf-spine, GPON FTTH, MPLS backbone, hybrid cloud.
- **Template gallery in the editor** _(S, planned)_ — Browse and one-click
  apply without leaving the editor.

### Documentation and export

- **PDF / PNG / SVG with cartouche** _(M, planned)_ — Optional title
  block, page number, author, date, classification footer.
- **Markdown / AsciiDoc export** _(S, planned)_ — Produce a markdown
  document with a rendered image of the diagram plus a generated inventory
  table (devices, ports, subnets, VRFs).
- **CSV inventory export** _(S, planned)_ — Already partially shipped;
  extend with port-level and connector-level exports.
- **Print mode** _(S, planned)_ — A4/Letter/A3 page sizes, scale-to-fit,
  margin guides.

### Quality of life

- **Dark/light theme** _(S, planned)_ — System-aware, persisted per user.
- **Command palette** _(S, planned)_ — `Ctrl/Cmd+Shift+P` to invoke any
  editor action by name.
- **Properties panel search** _(S, planned)_ — Filter the property tree by
  key.
- **Undo/redo history view** _(S, planned)_ — A small panel showing the
  last 50 actions with the ability to jump back to any point.

---

## 🚀 P2 — Major features that stay on-philosophy (3–6 months)

_These are bigger changes, but each one still supports the static,
self-hostable, draw-and-document philosophy. None of them turn NETDRAW
into a live monitoring platform._

- **Custom shape libraries** _(L, planned)_ — Teams can author their own
  shape packs (SVG + JSON metadata) and load them per project. Distributed
  as plain `.ndlib` files.
- **Diagram comparison / diff** _(M, planned)_ — Visual side-by-side or
  overlay diff between two versions of the same `.ndj` file, with
  per-shape change highlights. Useful for reviewing changes in pull
  requests.
- **Standards-aware export profiles** _(L, planned)_ — Export profiles
  that match common deliverables: Cisco network diagram style, generic
  ISO-net, vendor-neutral, full-detailed, presentation-clean.
- **Project-level metadata** _(M, planned)_ — Customer name, project ID,
  author, revision, classification, all storable on the project and
  rendered on every export.
- **Better backend persistence** _(M, planned)_ — Optional PostgreSQL
  support, full-text search across projects, project tagging and
  filtering.
- **Standalone HTML export** _(S, planned)_ — A single `.html` file that
  embeds the diagram, the inventory, and the project metadata, viewable in
  any browser without a server.
- **Plugin SDK for static extensions** _(L, planned)_ — A public API for
  third-party shape libraries, themes, and exporter adapters. Plugins are
  static JS modules evaluated in a sandboxed iframe — no network, no DOM
  access outside the canvas.

---

## 🔮 P3 — Long-term vision (12+ months)

_Forward-looking items that respect the static-diagramming philosophy._

- **Geographic / floor-plan view** _(L, research)_ — An optional background
  layer that can be a map tile, a floor plan image, or a topology image.
  Shapes snap to coordinates on the background. **Static only** — no map
  data is fetched from external services.
- **Diagram linting rules** _(M, research)_ — Built-in checks like “two
  routers connected with a copper link longer than 100 m”, “an endpoint
  without an IP address”, “a VLAN referenced by no port”. Surfaced as
  warnings in the editor and as a report in the exports.
- **Web-based shape editor** _(L, research)_ — A built-in editor for
  creating 2.5D shapes from primitives + theme slots, packaged with the
  app, fully offline.
- **Multi-user editing (file-based, not real-time)** _(L, research)_ — A
  Git-style workflow: each user has a local copy, edits are merged with a
  deterministic three-way merge, conflicts are surfaced visually. This
  is **not** real-time collaboration; it preserves the “file on disk”
  model and works fully offline.

---

## 🚫 Out of scope (explicit non-goals)

These are deliberately **not** on the roadmap. They would change the
nature of the product and are documented here so contributors do not
propose them again:

- ❌ Real-time network monitoring (SNMP, NETCONF, gNMI polling).
- ❌ IP address management (IPAM) with live DHCP / DNS integration.
- ❌ Live topology discovery (active probes, LLDP/CDP parsing).
- ❌ Real-time multiplayer cursors and CRDT-based collaborative editing.
- ❌ AI prompt-to-diagram generation.
- ❌ WebGL / Three.js 3D canvas.
- ❌ Telemetry on user activity or on the underlying infrastructure.
- ❌ Cloud-hosted SaaS offering.

---

## 📅 Release cadence

We follow a lightweight, predictable cadence:

- **Patch releases** — as needed for security or critical bug fixes.
- **Minor releases** — roughly every 6 weeks, containing P0/P1 items.
- **Major releases** — when a significant architectural change ships
  (e.g. custom shape libraries, multi-page diagrams).

Each minor release has a GitHub milestone tracking its P0/P1 items.

---

## Contributing to the roadmap

The roadmap is not a contract — it is a living document. Anyone can
propose a P1/P2 item by opening a GitHub Discussion. P3 items are
typically promoted to P2 once a champion and a design doc are available.

When proposing an item, please check it against the **out-of-scope** list
above. If your idea requires live data, polling, AI inference, or
real-time collaboration, it is not a fit for NETDRAW and will be
redirected to a more specialised tool.
