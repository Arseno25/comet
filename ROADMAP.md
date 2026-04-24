# Roadmap

## Product Goal

Make Comet the most trustworthy AI commit assistant for real-world repositories and teams.

The roadmap is optimized around three outcomes:

- better commit quality
- safer automation
- stronger team adoption

## Now

Current foundations already in place:

- direct `comet` command flow
- config system with global and project overrides
- OpenAI-compatible provider support
- secret redaction
- file exclusion
- preview and confirmation flow
- post-commit push confirmation
- doctor diagnostics
- hook support

This is enough for an MVP, but not yet enough to create a durable advantage over OpenCommit.

## Phase 1: Trust And Signal

### Goal

Make Comet safer and more reliable than alternatives.

### Deliverables

- semantic diff preprocessing
- explicit safe-send preview
- payload summary before generation
- stronger invalid-provider fallback path
- guaranteed non-empty commit output
- improved redaction reporting
- better non-interactive behavior

### Success Signals

- fewer generic commit messages
- fewer provider-failure dead ends
- clear visibility into what is sent to AI
- stronger user trust in privacy handling

## Phase 2: Automation And Integrations

### Goal

Make Comet easy to integrate into other tooling.

### Deliverables

- `comet preview --json`
- `comet analyze --json`
- public library API
- structured exit codes
- token and latency metadata
- machine-readable doctor output

### Success Signals

- easier CI usage
- editor and Git GUI integration becomes possible
- better observability for advanced users

## Phase 3: Team Workflows

### Goal

Make Comet attractive for shared team standards, not just solo developer use.

### Deliverables

- repo policy config
- allowed type enforcement
- required issue key support
- scope map support
- branch-aware defaults
- shared project presets

### Success Signals

- teams can standardize commit quality
- less manual policing of commit conventions
- stronger fit for open-source maintainers and internal engineering teams

## Phase 4: Commit Intelligence

### Goal

Make Comet smarter than a generator by adding review and judgment.

### Deliverables

- commit quality scoring
- rationale and confidence output
- alternative suggestion mode
- stronger type and scope validation
- explanation of why files drove the classification

### Success Signals

- higher perceived intelligence
- easier debugging when results are not ideal
- lower chance of accepting weak commit messages

## Phase 5: Workflow Expansion

### Goal

Expand Comet beyond single-commit generation into Git authoring workflows.

### Deliverables

- `comet squash`
- `comet review`
- `comet changelog`
- `comet release-notes`
- GitHub Action
- editor extension groundwork

### Success Signals

- broader daily usage
- stronger product stickiness
- better differentiation from pure commit-message generators

## 30 / 60 / 90 Day Plan

## Day 0-30

- build semantic diff preprocessing
- add safe-send preview
- add `preview --json`
- harden fallback output guarantees
- improve doctor diagnostics for payload and config visibility

## Day 31-60

- add `analyze --json`
- expose library API
- add repo policy config
- add issue key extraction
- add branch-aware defaults

## Day 61-90

- add commit quality review
- add rationale output
- ship `comet squash`
- prototype `comet review`
- define GitHub Action packaging plan

## Scope Discipline

The roadmap should explicitly avoid early distraction in these areas:

- maximizing provider count before trust features are strong
- advanced UI polish that does not improve product usefulness
- broad ecosystem integrations before JSON/API mode exists
- enterprise messaging before team policy mode is real

## Decision Filter

Future roadmap items should be prioritized if they improve one or more of:

- trust
- determinism
- semantic quality
- team standardization
- integration readiness

If a feature does not improve one of those, it should likely wait.
