# Comet

[![npm package](https://img.shields.io/badge/npm-%40arseno25%2Fcomet-CB3837?logo=npm&logoColor=white)](https://www.npmjs.com/package/@arseno25/comet)
[![npm version](https://img.shields.io/npm/v/@arseno25/comet?logo=npm&logoColor=white)](https://www.npmjs.com/package/@arseno25/comet)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

AI-powered commit message generation for staged Git changes.

Comet reads `git diff --staged`, filters noisy or sensitive files, redacts secrets, and generates clean Conventional Commit-style messages through an OpenAI-compatible provider.

```bash
npm install -g @arseno25/comet
```

The goal is simple: when you run `comet`, it should feel fast, clean, and immediately useful.

## Product Docs

- [Competitive Analysis](./COMPETITIVE_ANALYSIS.md)
- [Roadmap](./ROADMAP.md)
- [Product Backlog](./PRODUCT_BACKLOG.md)

## Features

- Default command runs commit generation directly without requiring an extra subcommand.
- Consistent Conventional Commit output.
- Support for `openai` and `openai-compatible` providers.
- Semantic diff preprocessing that collapses format-only and rename-only noise.
- Safe-send preview that shows what Comet is about to send to the model.
- Global config stored in `~/.comet/config.env`.
- Project-level overrides through `.comet.env`, `.cometrc`, or `.cometrc.json`.
- Interactive preview before commit: accept, edit, regenerate, cancel.
- `analyze`, `review`, and `squash` workflows for pre-commit and history cleanup.
- JSON output modes for automation and editor integrations.
- Public library API for programmatic usage.
- Optional commit body/description.
- Optional emoji by commit type.
- Optional one-line commit mode.
- Optional scope omission.
- Optional `why` section.
- Team policy support for allowed commit types, required issue keys, and scope mapping.
- Secret redaction for tokens, passwords, database URLs, private keys, and other common sensitive patterns.
- Default file exclusion for lockfiles, `.env`, build output, and sensitive directories.
- `doctor --json` for machine-readable environment diagnostics.
- `prepare-commit-msg` hook installer.
- Optional push flow with a separate confirmation after commit.

## Install

Global install:

```bash
npm install -g @arseno25/comet
```

Run without a permanent install:

```bash
npx @arseno25/comet init
npx @arseno25/comet
```

Install as a dev dependency:

```bash
npm install -D @arseno25/comet
npx comet
```

## Requirements

- Node.js 22 or newer
- npm 11 or newer
- Git installed and available in the terminal
- A provider API key unless you use `local-only` mode

## Quick Start

### 1. Set up config once

```bash
comet init
```

The `init` wizard asks for:

- provider
- model
- base URL
- API key
- language
- emoji on/off
- description/body on/off
- default git push on/off

### 2. Stage your changes

```bash
git add .
```

### 3. Generate a commit

```bash
comet
```

When staged changes exist, Comet will:

1. load runtime config
2. read the staged diff
3. filter skipped files
4. redact sensitive data
5. send the safe diff to the AI provider
6. review semantic changes, redactions, and commit quality
6. show a commit preview
7. ask for confirmation
8. create the commit
9. if `gitPush=true`, ask whether you also want to push

## Default Behavior

Comet is intentionally designed to behave like OpenCommit:

```bash
comet
```

That command immediately runs the commit generation flow. Help is shown only when you explicitly ask for it:

```bash
comet -h
comet --help
```

If there are no staged changes, Comet does not spin for a long time. It exits quickly with a clear message:

```txt
No staged changes found. Run `git add .` first or enable COMET_STAGE_ALL.
```

## Command Reference

### Main command

```bash
comet
```

Generate a commit message from the staged diff, show a preview, and commit if approved.

### Explicit commit command

```bash
comet commit
```

Same behavior as `comet`, but more explicit.

### Preview only

```bash
comet preview
comet preview --json
```

Generate a commit message without running `git commit`.

### Analyze only

```bash
comet analyze
comet analyze --json
```

Analyze staged changes, semantic diff groups, issue key detection, and commit quality without calling `git commit`.

### Review staged changes

```bash
comet review
comet review --json
```

Show staged diff risks and highlights before commit generation.

### Generate a squash message

```bash
comet squash main
comet squash main HEAD --json
```

Generate a squash-ready commit message for a commit range.

### Interactive init

```bash
comet init
```

Creates or updates the global config at:

```txt
~/.comet/config.env
```

### Config commands

Set a value:

```bash
comet config set provider openai-compatible
comet config set model Qwen/Qwen3-235B-A22B
comet config set baseUrl https://api.netmind.ai/inference-api/openai/v1
comet config set apiKey your_api_key
comet config set gitPush true
```

Get all config values:

```bash
comet config get
```

Get a single key:

```bash
comet config get model
comet config get gitPush
```

Unset a key:

```bash
comet config unset apiKey
```

Show the config path:

```bash
comet config path
```

### Doctor

```bash
comet doctor
comet doctor --json
```

Shows diagnostics for:

- active global config
- project config override
- provider/model/base URL
- whether the API key is detected
- Git repository status
- staged file count
- `COMET_*` environment variable overrides

### Hook management

Install hook:

```bash
comet hook install
```

Check hook status:

```bash
comet hook status
```

Remove hook:

```bash
comet hook uninstall
```

The current MVP hook target is:

```txt
prepare-commit-msg
```

## Runtime Flags

All of these flags can be used with `comet`, `comet commit`, or `comet preview`.

### Output and formatting

```bash
comet --emoji
comet --no-emoji
comet --description
comet --no-description
comet --one-line
comet --no-one-line
comet --omit-scope
comet --no-omit-scope
comet --why
comet --no-why
```

### Provider and language

```bash
comet --provider openai-compatible
comet --model Qwen/Qwen3-235B-A22B
comet --base-url https://api.netmind.ai/inference-api/openai/v1
comet --lang en
comet --privacy-mode standard
```

### Force output

```bash
comet --type fix
comet --scope auth
```

### Workflow control

```bash
comet --preview
comet --json
comet --push
comet --no-push
comet --yes
```

Notes:

- `--yes` accepts the generated commit message without preview confirmation.
- If `gitPush=true`, Comet still asks for a separate confirmation before running `git push`.
- In a non-interactive terminal, push confirmation is not forced and push is skipped.

## Confirmations You Will See

### Preview confirmation

After the message is generated, you can choose:

- `Yes` to commit
- `Edit` to open an editor and adjust the message
- `Regenerate` to ask the model again
- `Cancel` to abort

### Push confirmation

If `gitPush=true`, after a successful commit Comet asks:

```txt
Commit created. Push to remote now?
```

So push never happens silently just because the config allows it.

## Config Priority

Config is resolved in this order:

```txt
CLI flags > environment variables > project config > global config > default config
```

That means:

- CLI flags have the highest priority
- `COMET_*` environment variables override config files
- project config only applies to the current repository
- global config applies across repositories

## Config Locations

### Global config

```txt
~/.comet/config.env
```

Windows example:

```txt
C:\Users\Username\.comet\config.env
```

### Project override

Comet looks upward from the current directory for one of these files:

```txt
.comet.env
.cometrc
.cometrc.json
```

## Important Config Keys

### Provider

```env
COMET_PROVIDER=openai
COMET_MODEL=gpt-4o-mini
COMET_BASE_URL=
COMET_API_KEY=
COMET_CUSTOM_HEADERS=
```

### Output

```env
COMET_LANGUAGE=en
COMET_DESCRIPTION=true
COMET_EMOJI=false
COMET_ONE_LINE=false
COMET_OMIT_SCOPE=false
COMET_WHY=false
COMET_MESSAGE_TEMPLATE=$msg
```

### Token limits

```env
COMET_MAX_INPUT_TOKENS=12000
COMET_MAX_OUTPUT_TOKENS=1024
```

### Git behavior

```env
COMET_AUTO_COMMIT=false
COMET_GIT_PUSH=false
COMET_STAGE_ALL=false
```

### Security

```env
COMET_REDACT_SECRETS=true
COMET_PRIVACY_MODE=standard
COMET_EXCLUDE_FILES=
```

### Team policy

```env
COMET_POLICY_ALLOWED_TYPES=["feat","fix","docs","refactor","chore"]
COMET_POLICY_REQUIRE_ISSUE_KEY=false
COMET_ISSUE_KEY_PATTERN=[A-Z][A-Z0-9]+-\d+
COMET_POLICY_SCOPE_MAP={"src/payments":"billing"}
```

## Example OpenAI-Compatible Config

```env
COMET_PROVIDER=openai-compatible
COMET_MODEL=Qwen/Qwen3-235B-A22B
COMET_BASE_URL=https://api.netmind.ai/inference-api/openai/v1
COMET_API_KEY=your_api_key

COMET_LANGUAGE=en
COMET_DESCRIPTION=true
COMET_EMOJI=false
COMET_GIT_PUSH=true
```

## Output Format Examples

### Standard

```txt
feat(auth): add role-based login validation
```

### With body

```txt
feat(auth): add role-based login validation

- validate user roles during login
- protect dashboard routes with session guard
```

### One line

```txt
feat(auth): add role-based login validation
```

### With emoji

```txt
✨ feat(auth): add role-based login validation
```

### Without scope

```txt
feat: add role-based login validation
```

## File Exclusion and Secret Redaction

By default, Comet does not send certain sensitive or noisy files to the model, including:

- `.env`
- `.env.local`
- `package-lock.json`
- `pnpm-lock.yaml`
- `yarn.lock`
- `dist/`
- `build/`
- `.next/`
- `node_modules/`
- `coverage/`

Comet also redacts common sensitive patterns such as:

- API keys
- bearer tokens
- JWTs
- passwords
- database URLs
- private keys
- webhook secrets

## Typical Workflows

### Standard workflow

```bash
git add .
comet
```

### Preview only

```bash
git add .
comet --preview
```

### Automation-friendly JSON

```bash
git add .
comet analyze --json
comet preview --json
comet doctor --json
```

### Force type and scope

```bash
git add .
comet --type fix --scope auth
```

### Commit without body

```bash
git add .
comet --no-description
```

### One-line commit

```bash
git add .
comet --one-line
```

### Push after commit, but still ask for confirmation

```bash
comet config set gitPush true
git add .
comet
```

## Library API

Comet can also be used programmatically:

```ts
import { analyzeStagedChanges, generateCommitBundle } from "@arseno25/comet";

const analysis = await analyzeStagedChanges();
const bundle = await generateCommitBundle();
```

## Troubleshooting

### `No staged changes found`

This means nothing is staged yet.

```bash
git add .
comet
```

Or enable:

```bash
comet config set stageAll true
```

### `Missing API key`

Check whether the key is actually stored:

```bash
comet config get apiKey
comet doctor
```

Set it again if needed:

```bash
comet config set apiKey your_api_key
```

### I want to see the currently active config

```bash
comet doctor
```

### I want to know which config file is being used

```bash
comet config path
```

## License

MIT. See [LICENSE](./LICENSE).
