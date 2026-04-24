# Comet

Comet adalah AI commit message assistant untuk workflow Git modern. Tool ini membaca `git diff --staged`, melakukan file filtering dan secret redaction, lalu menghasilkan Conventional Commit yang rapi lewat provider OpenAI-compatible.

## Install

Global install:

```bash
npm install -g @arseno/comet
```

Run without permanent install:

```bash
npx @arseno/comet init
npx @arseno/comet
```

Local dev dependency:

```bash
npm install -D @arseno/comet
npx comet
```

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

Jika install dari npm secara global:

```bash
comet init
```

Atau saat development repo ini:

```bash
npm install
npm run build
node dist/cli.js init
```

Setelah itu di repository Git mana pun:

```bash
git add .
comet
```

## Publish Ke npm

Login dulu:

```bash
npm login
```

Lalu publish:

```bash
npm run check
npm run pack:check
npm publish
```

Karena package ini scoped, `publishConfig.access=public` sudah diset di `package.json`, jadi publish publik tidak perlu flag tambahan.

## Requirement

- Node.js 22+
- npm 11+
- Git terinstall di komputer user
- API key provider jika tidak memakai `local-only`

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
comet doctor
comet init
comet config set provider openai
comet config get
comet config path
comet hook install
```
