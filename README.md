# Comet

Comet adalah AI commit message assistant untuk workflow Git modern. Tool ini membaca `git diff --staged`, melakukan file filtering dan secret redaction, lalu menghasilkan Conventional Commit yang rapi lewat provider OpenAI-compatible.

## Fitur MVP

- `comet`, `comet commit`, `comet preview`
- Global config di `~/.comet/config.env`
- Project override via `.comet.env` atau `.cometrc`
- OpenAI-compatible provider
- Conventional Commit formatter
- Optional emoji, body, one-line, omit scope, why
- Preview interaktif: accept, edit, regenerate, cancel
- Hook installer untuk `prepare-commit-msg`
- Redaction untuk secret umum dan filter file sensitif

## Quick Start

```bash
npm install
npm run build
node dist/cli.js init
```

Lalu di repository Git:

```bash
git add .
comet
```

## Stack

- Node.js 22 LTS
- TypeScript 6
- Commander 14
- `@clack/prompts`
- OpenAI SDK 6
- Zod 4
- Execa 9
- TSUP 8
- Vitest 4

## Commands

```bash
comet
comet commit
comet preview
comet init
comet config set provider openai
comet config get
comet config path
comet hook install
```



test
