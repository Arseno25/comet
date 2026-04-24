# Comet

<div align="center">
  <img src="./assets/logo.png" alt="Comet Logo" width="400" />
</div>

<div align="center">
  <p>
    <a href="https://www.npmjs.com/package/@arseno25/comet">
      <img src="https://img.shields.io/badge/npm-%40arseno25%2Fcomet-CB3837?logo=npm&logoColor=white" alt="npm package" />
    </a>
    <a href="https://www.npmjs.com/package/@arseno25/comet">
      <img src="https://img.shields.io/npm/v/@arseno25/comet?logo=npm&logoColor=white" alt="npm version" />
    </a>
    <a href="./LICENSE">
      <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="license MIT" />
    </a>
  </p>

  <p>AI-powered commit message generation for staged Git changes.</p>
</div>

## Install

```bash
npm install -g @arseno25/comet
```

Run without permanent install:

```bash
npx @arseno25/comet init
npx @arseno25/comet
```

## Requirements

- Node.js 22 or newer
- Git installed and available
- An API key for your chosen provider

## Quick Start

```bash
# 1. Set up config
comet init

# 2. Stage changes
git add .

# 3. Generate commit
comet
```

`comet init` now walks through provider setup, output preferences, push behavior, and default panel visibility for:

- `Safe Send`
- `Analysis`
- `Quality`
- `Warnings`

## Commands

### Main Command

```bash
comet
```

Generate a commit message from staged changes, show preview, and commit if approved.

### Preview

```bash
comet preview
comet preview --json
```

Generate commit message without running `git commit`.

### Analyze

```bash
comet analyze
comet analyze --json
```

Analyze staged changes without committing.

### Review

```bash
comet review
comet review --json
```

Show staged diff risks and highlights.

### Squash

```bash
comet squash main
comet squash main HEAD --json
```

Generate a squash-ready commit message for a commit range.

### Config

```bash
comet config set provider openai-compatible
comet config set model gpt-4o-mini
comet config set apiKey your_api_key
comet config get
comet config unset apiKey
comet config path
```

### Doctor

```bash
comet doctor
comet doctor --json
```

Show environment diagnostics.

### Init

```bash
comet init
```

Create or update the global Comet config with interactive prompts for provider, model, API key, language, output defaults, push behavior, and panel visibility.

### Hook

```bash
comet hook install
comet hook status
comet hook uninstall
```

Manage `prepare-commit-msg` hook.

### Changelog

```bash
comet changelog
comet changelog --from v1.0.0 --version 2.0.0
comet changelog --json
```

Generate formatted changelog from commit history.

### Release Notes

```bash
comet release-notes v1.0.0
comet release-notes v1.0.0 --version 2.0.0
comet release-notes v1.0.0 --json
```

Generate release notes with contributor stats.

## Runtime Flags

### Output

```bash
comet --emoji
comet --description
comet --one-line
comet --omit-scope
comet --why
```

### Provider

```bash
comet --provider openai-compatible
comet --model gpt-4o-mini
comet --base-url https://api.example.com
comet --lang en
```

### Privacy

```bash
comet --privacy-mode standard
```

Options: `standard`, `strict`, `local-only`

### Workflow

```bash
comet --preview
comet --json
comet --yes
comet --push
comet --no-push
```

### Force Output

```bash
comet --type fix
comet --scope auth
```

## Config

Config is resolved in order:

```
CLI flags > environment variables > project config > global config > default
```

### Global Config

```txt
~/.comet/config.env
```

### Project Override

Comet looks for:

```txt
.comet.env
.cometrc
.cometrc.json
```

### Important Config Keys

```env
# Provider
COMET_PROVIDER=openai
COMET_MODEL=gpt-4o-mini
COMET_BASE_URL=
COMET_API_KEY=

# Output
COMET_LANGUAGE=en
COMET_DESCRIPTION=true
COMET_EMOJI=false
COMET_ONE_LINE=false
COMET_OMIT_SCOPE=false
COMET_WHY=false

# Git
COMET_AUTO_COMMIT=false
COMET_GIT_PUSH=false
COMET_STAGE_ALL=false

# Security
COMET_REDACT_SECRETS=true
COMET_PRIVACY_MODE=standard
COMET_EXCLUDE_FILES=

# Panel Visibility
COMET_SHOW_SAFE_SEND=false
COMET_SHOW_ANALYSIS=false
COMET_SHOW_QUALITY=false
COMET_SHOW_WARNINGS=false
COMET_VERBOSE=false
```

### Panel Visibility

These values control which extra panels appear in the commit preview:

- `COMET_SHOW_SAFE_SEND`: show included files, skipped files, and redaction summary
- `COMET_SHOW_ANALYSIS`: show inferred type, scope, confidence, rationale, and issue key
- `COMET_SHOW_QUALITY`: show quality score, suggestions, and warnings for the generated commit
- `COMET_SHOW_WARNINGS`: show runtime warnings such as fallback generation or token truncation

You can set them during `comet init` or later with `comet config set`.

## Output Format

### Standard

```
feat(auth): add role-based login validation
```

### With Body

```
feat(auth): add role-based login validation

- validate user roles during login
- protect dashboard routes with session guard
```

### One Line

```
feat(auth): add role-based login validation
```

### With Emoji

```
✨ feat(auth): add role-based login validation
```

## File Exclusion & Redaction

**Excluded by default:**

- `.env`, `.env.local`
- Lock files: `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- Build output: `dist/`, `build/`, `.next/`
- `node_modules/`, `vendor/`, `coverage/`

**Redacted patterns:**

- API keys
- Bearer tokens
- JWTs
- Passwords
- Database URLs
- Private keys
- Webhook secrets

## Workflows

### Standard

```bash
git add .
comet
```

### Preview Only

```bash
git add .
comet --preview
```

### JSON Output

```bash
git add .
comet preview --json
comet analyze --json
comet doctor --json
```

### Force Type/Scope

```bash
git add .
comet --type fix --scope auth
```

### Auto Push

```bash
comet config set gitPush true
git add .
comet
```

## Library API

```ts
import { analyzeStagedChanges, generateCommitBundle } from "@arseno25/comet";

const analysis = await analyzeStagedChanges();
const bundle = await generateCommitBundle();
```

## Troubleshooting

### No staged changes

```bash
git add .
comet
```

Or enable:

```bash
comet config set stageAll true
```

### Missing API key

```bash
comet config get apiKey
comet doctor
comet config set apiKey your_api_key
```

### Check active config

```bash
comet doctor
comet config path
```

## License

MIT. See [LICENSE](./LICENSE).
