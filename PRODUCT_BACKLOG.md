# Product Backlog

This backlog is ordered by strategic value, not just implementation convenience.

## P0

### Semantic Diff Preprocessing

Why it matters:

- directly improves commit quality
- reduces token waste
- separates Comet from raw-diff competitors

Acceptance criteria:

- formatting-only hunks can be ignored
- rename-only changes do not dominate summaries
- large generated noise is collapsed
- a compact diff summary object is available to downstream prompt building

### Safe Send Preview

Why it matters:

- creates user trust
- makes privacy behavior visible
- supports debugging bad generations

Acceptance criteria:

- shows included and excluded files
- shows redaction count or classes
- shows active privacy mode
- works in both interactive and non-interactive contexts

### Non-Empty Output Guarantee

Why it matters:

- commit generation tools become unusable if empty output is possible

Acceptance criteria:

- provider failures fall back to deterministic local output
- invalid structured output is retried or repaired
- final commit text is never blank

### `preview --json`

Why it matters:

- unlocks automation and editor integrations

Acceptance criteria:

- returns structured generated commit data
- includes analysis metadata
- returns actionable errors with stable exit codes

## P1

### `analyze --json`

Why it matters:

- separates analysis from commit generation
- useful for CI, dashboards, and integrations

Acceptance criteria:

- returns type, scope, summary, file stats, and confidence
- does not require a commit action

### Library API

Why it matters:

- makes Comet usable beyond the CLI

Acceptance criteria:

- public entrypoint exposes generation and analysis
- documented stable types
- no CLI-specific side effects required

### Repo Policy Mode

Why it matters:

- moves Comet from solo tool to team tool

Acceptance criteria:

- repo can define allowed types
- repo can define issue key format
- repo can define scope suggestions or restrictions

### Branch-Aware Defaults

Why it matters:

- improves consistency with existing workflows

Acceptance criteria:

- branch naming can influence default scope and metadata
- optional issue key extraction from branch names

## P2

### Commit Quality Review

Why it matters:

- turns Comet into a reviewer, not only a generator

Acceptance criteria:

- flags generic subjects
- flags overly long subjects
- warns on low-confidence type selection
- suggests refinement when needed

### Rationale Output

Why it matters:

- improves trust and debugging

Acceptance criteria:

- explains why type was chosen
- explains why scope was chosen
- references the most influential files or change groups

### `comet squash`

Why it matters:

- highly requested adjacent workflow
- strong practical value for pull request cleanup

Acceptance criteria:

- summarizes commit range into one commit message
- supports preview before applying

### `comet review`

Why it matters:

- expands Comet into commit-time quality tooling

Acceptance criteria:

- highlights risky changes in staged diff
- produces short review notes before commit

## P3

### GitHub Action

Why it matters:

- improves adoption and distribution

Acceptance criteria:

- supports non-interactive execution
- supports JSON mode inputs and outputs
- documents safety warnings for history rewriting behavior

### Editor Integration Foundations

Why it matters:

- reduces friction for daily use

Acceptance criteria:

- stable machine-readable API
- CLI exit behavior is predictable
- docs include integration examples

### Release Note And Changelog Flows

Why it matters:

- expands usage beyond single commits

Acceptance criteria:

- commit history can be summarized by range
- output works for both terminal preview and machine-readable mode
