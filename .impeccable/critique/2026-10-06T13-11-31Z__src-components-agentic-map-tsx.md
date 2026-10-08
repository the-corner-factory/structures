---
target: /agentic page diagram
total_score: 21
max_score: 32
na_heuristics: 5,9
p0_count: 0
p1_count: 0
target_identity: "file:/Users/raphael.balet/Documents/Open-source/structures/src/components/agentic-map.tsx"
target_fingerprint: "sha256:61e997cc0d4f9a20d6b76e46fdd92bd7eb8757eb8cde32974676ab128e6fab18"
target_path: /Users/raphael.balet/Documents/Open-source/structures/src/components/agentic-map.tsx
timestamp: 2026-10-06T13-11-31Z
slug: src-components-agentic-map-tsx
---
Method: dual-agent (A: /root/diagram_design_review · B: /root/diagram_evidence_review).

The diagram is a useful component glossary. Its main weakness is that readers can learn the names without understanding how an agent actually works. The written explanations underneath are more precise than the visual model.

What works: directed, verb-labelled connections; the distinction between requesting a call and executing it under permissions; explicit “when read” wording for project context; and real buttons, visible keyboard focus, a selection checkmark, and a textual relationship list. The legend and explanations exist below the supplied screenshot.

Design specificity: familiar filenames and meaningful relationships suit a developer education product. The uniform nine-card grid gives the concepts less hierarchy than their roles deserve. Initial order is reassuring; the learning friction arrives when the reader asks where to start and must scroll away from the map for the explanation. Templates provide a practical endpoint.

Priority issues, ordered by impact:

1. **[P2] The core feedback loop is missing.** Tools receive requests, but no result returns to the agent. A task/goal, model decision, observation, and completion are only implicit. This is an acceptable omission for a relationship index, but a significant teaching gap under “Anatomy of an agent system.” Show a compact cycle: task → model decision → harness checks/routes a tool call → result → next decision or final response. Preserve the difference between request and execution. Sources: [connection definitions](/Users/raphael.balet/Documents/Open-source/structures/src/components/agentic-map.tsx:34), [Anthropic’s agent-loop explanation](https://www.anthropic.com/engineering/building-effective-agents). Suggested command: `$impeccable clarify`.

2. **[P2] Equal boxes flatten unlike concepts.** Harness is runtime software; Agent is the acting behavior; Tools are operations; Instructions/Skills/Context supply guidance or information; Plugins distribute components; MCP connects capabilities. Identical weight and “Nine building blocks. One connected system” can imply a required nine-part stack. Group runtime, guidance/context, and optional integrations. Reuse color for these groups rather than unexplained pairs such as Plugins/Skills and MCP/Specs. Solid arrows currently encode execution, guidance, and capability exposure; grouping should make those differences readable without more arrows. Suggested commands: `$impeccable distill`, `$impeccable clarify`.

3. **[P2] The overview and its explanation are too far apart.** At 1280×720 the diagram is approximately 1110×755 and begins 432 pixels down the page. Only its top row appears initially. A selection updates explanatory content below the entire map while retaining scroll position. Reduce vertical gaps and put the brief selected explanation or an explicit explanation link beside the map. Preserve intentional scroll stability. Source: [map layout](/Users/raphael.balet/Documents/Open-source/structures/src/styles.css:2504). Suggested command: `$impeccable layout`.

4. **[P2] Document options look broken.** `PRODUCT.md` is clipped in the screenshot and live desktop view. The document strip is 236 pixels wide with 267 pixels of content and a deliberately hidden scrollbar. Wrap the three filenames; they are too few to justify an undiscoverable horizontal scroller. Source: [badge overflow rules](/Users/raphael.balet/Documents/Open-source/structures/src/styles.css:2585). Suggested command: `$impeccable polish`.

5. **[P2] Mobile retains the map promise while removing the map.** At 390×844 all connections, node summaries, and relationship legend entries are hidden. “System map” and “Select a block to trace its connections” remain. The textual relationship list survives below the grid, beyond the initial viewport. Keep one-line definitions and place the selected relationships immediately beside the selection, or label the mobile view as a concept list. Source: [mobile rules](/Users/raphael.balet/Documents/Open-source/structures/src/styles.css:2783). Suggested command: `$impeccable adapt`.

Technical precision: MCP → Tools is true but incomplete: MCP servers also expose resources and prompts, already acknowledged in the page’s detailed content. A short “tools, resources, prompts” label would prevent the visual from narrowing MCP to tools. Skills guide behavior after relevant content is loaded; “guide when loaded” makes the difference from standing instructions clearer. Sources: [MCP server concepts](https://modelcontextprotocol.io/docs/learn/server-concepts), [Agent Skills loading](https://agentskills.io/home).

Cognitive load and personas: beginners face nine peer concepts plus six embedded examples without a starting sequence; experienced developers can read the vocabulary but must infer the runtime boundary. Keyboard users have working focus and Enter selection; map buttons should associate their summaries as accessible descriptions. Narrow-screen readers lose those definitions entirely. This is high learning load for newcomers, moderate for familiar readers. The problem is weak grouping and diagram-to-explanation separation, not a universal limit on the number of visible choices.

Heuristic assessment, 0–4 with higher better:

| Heuristic | Score | Main observation |
|---|---:|---|
| Visibility of status | 3 | Selection clear; explanatory response distant |
| Match with real world | 2 | Roles and core loop need stronger framing |
| Control and freedom | 3 | URL-backed selections and view switching |
| Consistency | 3 | Coherent controls; mobile map wording mismatch |
| Error prevention | n/a | Read-only concept selection |
| Recognition over recall | 2 | Definitions and connections separated |
| Efficiency | 3 | Deep links, alternate view, downloadable examples |
| Minimalist design | 2 | Uniform weight and excess vertical distance |
| Error recovery | n/a | No diagram error workflow |
| Help and documentation | 3 | Useful detail and templates |
| **Total** | **21/32** | **Useful foundation; teaching hierarchy needs work** |

Minor observations: the focused Harness outline in the screenshot is useful keyboard feedback, not an extra architectural container. Do not remove it to simplify the graphic. Two polite live regions update overlapping explanations; possible duplicate announcements need a real screen-reader check before being called a defect. No horizontal page overflow was observed on desktop or mobile.

Automated scan: zero findings in both agentic-map.tsx and agentic-page.tsx. No reported rule locations or false positives. The manual findings concern semantics and rendered layout that the detector did not identify.

Questions for a revision: should the first lesson be the runtime loop or a component reference? Should the nine-card layout be preserved or regrouped into runtime, guidance, and integrations?
