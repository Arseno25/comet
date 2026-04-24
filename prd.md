# PRD — Comet: AI Commit Message Assistant

## 1. Ringkasan Produk

**Comet** adalah CLI tool untuk membantu developer membuat commit message yang rapi, konsisten, dan informatif menggunakan AI. Comet membaca perubahan kode dari `git diff --staged`, membersihkan data sensitif, mengklasifikasikan tipe commit seperti `feat`, `fix`, `docs`, `refactor`, dan menghasilkan commit message sesuai konfigurasi user.

Comet dirancang sebagai alternatif yang lebih aman dan fleksibel dari OpenCommit, dengan fokus utama pada:

* Local-first workflow.
* Global config yang bisa dipakai di semua project.
* Dukungan multi-provider LLM.
* Format Conventional Commit.
* Optional emoji, description/body, one-line commit, scope, dan auto push.
* Privacy/security layer sebelum diff dikirim ke AI.
* Tidak melakukan rewrite history atau force push secara default.

---

## 2. Nama Produk

### Nama

**Comet**

### Command CLI

```bash
comet
```

### Tagline

```txt
Comet — Clean commit messages at the speed of thought.
```

### Alternatif nama package

Karena package `comet` kemungkinan sudah digunakan di npm, opsi nama package yang disarankan:

```txt
@arseno/comet
comet-commit
@arseno/comet-commit
```

Rekomendasi awal:

```txt
@arseno/comet
```

---

## 3. Latar Belakang

Banyak developer sering membuat commit message yang terlalu pendek atau tidak informatif, seperti:

```txt
update
fix
final
done
fix bug
wip
```

Masalahnya, commit message seperti ini menyulitkan proses:

* Code review.
* Tracking perubahan.
* Debugging histori Git.
* Pembuatan changelog.
* Release note.
* Kolaborasi tim.

Tool seperti OpenCommit sudah membuktikan bahwa AI dapat membantu menghasilkan commit message otomatis berdasarkan diff. Namun, masih ada beberapa aspek yang bisa dibuat lebih aman dan lebih fleksibel, terutama terkait:

* Kontrol provider AI.
* Global config.
* Privasi diff.
* Commit classification.
* Scope detection.
* Avoid force push by default.
* Project-level customization.

Comet dibuat untuk menjawab kebutuhan tersebut.

---

## 4. Problem Statement

Developer membutuhkan tool yang dapat membuat commit message secara otomatis dari perubahan kode, tetapi tetap:

1. Mudah digunakan dari project mana pun.
2. Bisa dikonfigurasi secara global.
3. Mendukung banyak provider LLM.
4. Mengikuti standar Conventional Commit.
5. Aman terhadap data sensitif.
6. Tidak merusak Git history.
7. Bisa digunakan secara personal maupun tim.

---

## 5. Tujuan Produk

### 5.1 Tujuan Utama

Membuat CLI AI commit assistant yang mampu menghasilkan commit message berkualitas tinggi dari staged diff dengan konfigurasi fleksibel.

### 5.2 Tujuan Teknis

* Membaca staged diff dari Git.
* Memfilter file yang tidak perlu dianalisis.
* Melakukan redaction terhadap secret/token/password.
* Menghasilkan commit message menggunakan LLM.
* Mendukung OpenAI-compatible endpoint.
* Mendukung config global di home directory.
* Mendukung project-level override config.
* Mendukung CLI flags untuk override sementara.
* Menghasilkan output dalam format Conventional Commit.
* Memberikan preview sebelum commit.

### 5.3 Tujuan UX

* User cukup menjalankan:

```bash
git add .
comet
```

* Comet menampilkan saran commit message.
* User bisa memilih:

```txt
Yes / Edit / Regenerate / Cancel
```

* Setup provider cukup dilakukan sekali secara global.

---

## 6. Non-Goals

Untuk MVP, Comet **tidak** akan fokus pada:

* Rewrite history commit remote.
* Auto force push.
* Full GitHub Action rewrite seperti OpenCommit.
* VS Code extension.
* Dashboard web.
* Team management cloud.
* Changelog generator kompleks.
* PR summary otomatis.

Fitur tersebut bisa masuk ke roadmap versi lanjutan.

---

## 7. Target Pengguna

### 7.1 Individual Developer

Developer yang ingin commit message lebih rapi tanpa menulis manual setiap kali.

### 7.2 Open-source Maintainer

Maintainer yang ingin menjaga standar commit di repository open-source.

### 7.3 Team Developer

Tim yang ingin menggunakan standar commit seragam seperti Conventional Commit.

### 7.4 AI/IoT/Web Developer

Developer yang sering mengerjakan banyak project dan ingin satu global config yang bisa dipakai di semua repository.

---

## 8. Value Proposition

Comet memberikan nilai utama:

```txt
Generate clean, consistent, AI-powered commit messages without losing control over your Git workflow.
```

Keunggulan Comet:

| Area               | Value                                                           |
| ------------------ | --------------------------------------------------------------- |
| Speed              | Commit message dibuat otomatis dari diff                        |
| Consistency        | Format mengikuti Conventional Commit                            |
| Flexibility        | Bisa pakai OpenAI, OpenAI-compatible, Ollama, dan provider lain |
| Privacy            | Ada redaction layer sebelum diff dikirim ke AI                  |
| Safety             | Tidak force push secara default                                 |
| Configurable       | Global config + project override + CLI flags                    |
| Developer-friendly | Command pendek: `comet`                                         |

---

## 9. Product Scope

## 9.1 MVP Scope

Fitur wajib MVP:

1. CLI command `comet`.
2. Global config di `~/.comet/config.env`.
3. Command `comet config set/get/path/unset`.
4. Membaca staged diff.
5. File filter.
6. Secret redaction.
7. LLM provider OpenAI-compatible.
8. Conventional Commit prompt module.
9. Auto classification commit type.
10. Auto scope detection sederhana.
11. Optional emoji.
12. Optional description/body.
13. One-line commit mode.
14. Preview before commit.
15. Manual edit.
16. Regenerate.
17. Commit execution.
18. Optional git push.

---

## 9.2 V1 Scope

Fitur setelah MVP:

1. Multiple prompt modules.
2. Local LLM via Ollama.
3. Provider Anthropic.
4. Provider Gemini.
5. Provider DeepSeek/OpenRouter/Groq via OpenAI-compatible.
6. Git hook installer.
7. Commit quality score.
8. Interactive file selection.
9. Project `.cometrc` override.
10. Commitlint compatibility check.

---

## 9.3 V2 Scope

Fitur lanjutan:

1. GitHub Action check mode.
2. Pull Request summary generator.
3. Changelog generator.
4. Release note generator.
5. VS Code extension.
6. Team shared config.
7. Prompt template marketplace.
8. Local embedding/summarization untuk diff besar.
9. Multi-commit analysis.
10. Web dashboard opsional.

---

# 10. Core Flow

## 10.1 Flow Utama

```mermaid
flowchart TD
    A[User menjalankan comet] --> B[Load config]
    B --> C[Validasi Git repository]
    C --> D[Cek staged changes]
    D --> E[Ambil file list dan diff]
    E --> F[Filter ignored files]
    F --> G[Redact secrets]
    G --> H[Analisis perubahan]
    H --> I[Deteksi commit type]
    I --> J[Deteksi scope]
    J --> K[Build prompt]
    K --> L[Pilih LLM provider]
    L --> M[Generate structured JSON]
    M --> N[Validasi schema]
    N --> O[Format commit message]
    O --> P[Tampilkan preview]
    P --> Q{User action}
    Q -->|Yes| R[git commit]
    Q -->|Edit| S[User edit message]
    S --> R
    Q -->|Regenerate| K
    Q -->|Cancel| T[Exit]
    R --> U{Git push enabled?}
    U -->|Yes| V[git push]
    U -->|No| W[Done]
```

---

## 10.2 Flow Config

```mermaid
flowchart TD
    A[Default Config] --> B[Global Config ~/.comet/config.env]
    B --> C[Project Config .cometrc atau .comet.env]
    C --> D[Environment Variables]
    D --> E[CLI Flags]
    E --> F[Final Runtime Config]
```

Prioritas config:

```txt
CLI flags > ENV terminal > project config > global config > default config
```

---

# 11. Config System

## 11.1 Lokasi Global Config

Comet menggunakan global config di home directory:

```txt
~/.comet/config.env
```

Contoh lokasi:

Linux:

```txt
/home/username/.comet/config.env
```

macOS:

```txt
/Users/username/.comet/config.env
```

Windows:

```txt
C:\Users\Username\.comet\config.env
```

---

## 11.2 Contoh Global Config

```env
COMET_PROVIDER=openai
COMET_MODEL=Qwen/Qwen3-235B-A22B
COMET_BASE_URL=https://api.netmind.ai/inference-api/openai/v1
COMET_API_KEY=

COMET_PROMPT_MODULE=conventional-commit
COMET_LANGUAGE=en
COMET_DESCRIPTION=false
COMET_EMOJI=false
COMET_ONE_LINE=false
COMET_OMIT_SCOPE=false
COMET_WHY=false

COMET_MAX_INPUT_TOKENS=40960
COMET_MAX_OUTPUT_TOKENS=4096

COMET_GIT_PUSH=false
COMET_AUTO_COMMIT=false

COMET_MESSAGE_TEMPLATE=$msg
COMET_CUSTOM_HEADERS=
```

---

## 11.3 Mapping Config OpenCommit ke Comet

| OpenCommit                         | Comet                     | Keterangan                     |
| ---------------------------------- | ------------------------- | ------------------------------ |
| `OCO_PROMPT_MODULE`                | `COMET_PROMPT_MODULE`     | Prompt style/module            |
| `OCO_MODEL`                        | `COMET_MODEL`             | Nama model LLM                 |
| `OCO_API_URL`                      | `COMET_BASE_URL`          | Base URL provider              |
| `OCO_API_KEY`                      | `COMET_API_KEY`           | API key provider               |
| `OCO_API_CUSTOM_HEADERS`           | `COMET_CUSTOM_HEADERS`    | Header tambahan                |
| `OCO_AI_PROVIDER`                  | `COMET_PROVIDER`          | Provider LLM                   |
| `OCO_TOKENS_MAX_INPUT`             | `COMET_MAX_INPUT_TOKENS`  | Batas token input              |
| `OCO_TOKENS_MAX_OUTPUT`            | `COMET_MAX_OUTPUT_TOKENS` | Batas token output             |
| `OCO_DESCRIPTION`                  | `COMET_DESCRIPTION`       | Aktifkan body/deskripsi commit |
| `OCO_EMOJI`                        | `COMET_EMOJI`             | Aktifkan emoji                 |
| `OCO_LANGUAGE`                     | `COMET_LANGUAGE`          | Bahasa output                  |
| `OCO_MESSAGE_TEMPLATE_PLACEHOLDER` | `COMET_MESSAGE_TEMPLATE`  | Template commit                |
| `OCO_ONE_LINE_COMMIT`              | `COMET_ONE_LINE`          | Commit satu baris              |
| `OCO_TEST_MOCK_TYPE`               | `COMET_TEST_MOCK_TYPE`    | Mock testing                   |
| `OCO_OMIT_SCOPE`                   | `COMET_OMIT_SCOPE`        | Hilangkan scope                |
| `OCO_GITPUSH`                      | `COMET_GIT_PUSH`          | Auto git push                  |
| `OCO_WHY`                          | `COMET_WHY`               | Tambahkan alasan perubahan     |

---

## 11.4 Config Key Specification

### Provider Config

| Key                    |        Type | Default       | Description          |
| ---------------------- | ----------: | ------------- | -------------------- |
| `COMET_PROVIDER`       |      string | `openai`      | Provider LLM         |
| `COMET_MODEL`          |      string | `gpt-4o-mini` | Model yang digunakan |
| `COMET_BASE_URL`       | string/null | null          | Custom base URL      |
| `COMET_API_KEY`        |      string | empty         | API key              |
| `COMET_CUSTOM_HEADERS` | string/json | empty         | Header tambahan      |

### Prompt Config

| Key                      |    Type | Default               | Description                |
| ------------------------ | ------: | --------------------- | -------------------------- |
| `COMET_PROMPT_MODULE`    |  string | `conventional-commit` | Prompt module              |
| `COMET_LANGUAGE`         |  string | `en`                  | Bahasa output              |
| `COMET_DESCRIPTION`      | boolean | `true`                | Gunakan body commit        |
| `COMET_EMOJI`            | boolean | `false`               | Gunakan emoji              |
| `COMET_ONE_LINE`         | boolean | `false`               | Output satu baris          |
| `COMET_OMIT_SCOPE`       | boolean | `false`               | Hilangkan scope            |
| `COMET_WHY`              | boolean | `false`               | Tambahkan alasan perubahan |
| `COMET_MESSAGE_TEMPLATE` |  string | `$msg`                | Template akhir message     |

### Token Config

| Key                       |   Type | Default | Description        |
| ------------------------- | -----: | ------- | ------------------ |
| `COMET_MAX_INPUT_TOKENS`  | number | `12000` | Batas input ke LLM |
| `COMET_MAX_OUTPUT_TOKENS` | number | `1024`  | Batas output LLM   |

### Git Behavior Config

| Key                 |    Type | Default | Description                                 |
| ------------------- | ------: | ------- | ------------------------------------------- |
| `COMET_AUTO_COMMIT` | boolean | `false` | Auto commit tanpa confirm                   |
| `COMET_GIT_PUSH`    | boolean | `false` | Auto push setelah commit                    |
| `COMET_STAGE_ALL`   | boolean | `false` | Auto `git add .` jika belum ada staged file |

### Security Config

| Key                    |     Type | Default      | Description                        |
| ---------------------- | -------: | ------------ | ---------------------------------- |
| `COMET_REDACT_SECRETS` |  boolean | `true`       | Redact secrets                     |
| `COMET_EXCLUDE_FILES`  | csv/json | default list | File yang di-skip                  |
| `COMET_PRIVACY_MODE`   |   string | `standard`   | `standard`, `strict`, `local-only` |

---

# 12. Command Specification

## 12.1 Main Command

```bash
comet
```

Default behavior:

1. Load config.
2. Read staged diff.
3. Generate commit message.
4. Show preview.
5. Ask confirmation.
6. Commit if approved.

---

## 12.2 Commit Command

```bash
comet commit
```

Sama seperti `comet`, tetapi lebih eksplisit untuk generate dan commit.

---

## 12.3 Preview Command

```bash
comet preview
```

Hanya generate dan menampilkan commit message, tanpa menjalankan `git commit`.

---

## 12.4 Config Commands

### Set Config

```bash
comet config set provider openai
comet config set model Qwen/Qwen3-235B-A22B
comet config set baseUrl https://api.netmind.ai/inference-api/openai/v1
comet config set apiKey your_api_key
comet config set language en
comet config set emoji false
comet config set description false
```

### Get All Config

```bash
comet config get
```

### Get Specific Config

```bash
comet config get model
```

### Remove Config

```bash
comet config unset model
```

### Show Config Path

```bash
comet config path
```

Output:

```txt
/home/user/.comet/config.env
```

---

## 12.5 Init Command

```bash
comet init
```

Membuat global config awal di:

```txt
~/.comet/config.env
```

Interactive prompt:

```txt
Select provider: openai / ollama / custom
Model: gpt-4o-mini
Language: en
Use emoji? false
Use description? true
```

---

## 12.6 Hook Command

```bash
comet hook install
```

Menginstall Git hook untuk repository saat ini.

Target hook MVP:

```txt
prepare-commit-msg
```

Command lain:

```bash
comet hook uninstall
comet hook status
```

---

## 12.7 Runtime Flags

```bash
comet --emoji
comet --no-emoji
comet --description
comet --no-description
comet --one-line
comet --type fix
comet --scope auth
comet --lang id
comet --provider openai
comet --model gpt-4o-mini
comet --base-url https://api.example.com/v1
comet --push
comet --no-push
comet --preview
```

---

# 13. Git Diff Engine

## 13.1 Git Commands Used

Comet akan menggunakan Git command:

```bash
git rev-parse --is-inside-work-tree
git diff --staged --name-only
git diff --staged --stat
git diff --staged
```

Jika tidak ada staged changes:

```txt
No staged changes found.

Options:
1. Stage all changes
2. Select files
3. Cancel
```

MVP boleh hanya menampilkan warning:

```txt
No staged changes found. Run git add . first.
```

---

## 13.2 Diff Payload Internal

```json
{
  "branch": "feature/auth-login",
  "files": [
    "src/auth/login.ts",
    "src/middleware/auth.ts",
    "src/pages/login.tsx"
  ],
  "stats": {
    "filesChanged": 3,
    "insertions": 120,
    "deletions": 32
  },
  "diff": "..."
}
```

---

# 14. File Filter

## 14.1 Default Excluded Files

```txt
.env
.env.local
.env.*
*.pem
*.key
*.crt
*.p12
*.pfx
package-lock.json
pnpm-lock.yaml
yarn.lock
bun.lockb
composer.lock
Cargo.lock
dist/
build/
.next/
node_modules/
vendor/
coverage/
```

---

## 14.2 Exclude Behavior

Comet harus:

1. Membaca daftar file dari staged diff.
2. Mencocokkan dengan exclude pattern.
3. Menghapus diff dari file yang diabaikan.
4. Tetap boleh memasukkan nama file tertentu dalam summary jika aman.

Contoh:

```txt
Skipped 2 files:
- package-lock.json
- .env.local
```

---

# 15. Secret Redaction

## 15.1 Data yang Harus Di-redact

Comet harus mendeteksi dan menyensor:

```txt
API key
Access token
Refresh token
JWT
Bearer token
Database URL
Password
Private key
Secret key
SSH key
Webhook secret
OAuth client secret
```

---

## 15.2 Contoh Redaction

Input:

```env
OPENAI_API_KEY=sk-123456789
DATABASE_URL=mysql://root:password@localhost:3306/app
```

Output:

```env
OPENAI_API_KEY=[REDACTED_SECRET]
DATABASE_URL=[REDACTED_DATABASE_URL]
```

---

## 15.3 Redaction Flow

```mermaid
flowchart TD
    A[Raw Diff] --> B[Pattern Scan]
    B --> C[Detect Secret]
    C --> D[Replace Sensitive Value]
    D --> E[Safe Diff]
```

---

# 16. Commit Analyzer

Commit Analyzer bertugas menentukan:

* Commit type.
* Scope.
* Subject.
* Body.
* Breaking change.
* Why explanation jika aktif.

---

## 16.1 Commit Type List

Comet mengikuti Conventional Commit:

| Type       | Kapan Digunakan                             |
| ---------- | ------------------------------------------- |
| `feat`     | Menambah fitur baru                         |
| `fix`      | Memperbaiki bug                             |
| `docs`     | Perubahan dokumentasi                       |
| `style`    | Formatting/style tanpa logic change         |
| `refactor` | Perubahan struktur kode tanpa fitur/bug fix |
| `perf`     | Optimasi performa                           |
| `test`     | Tambah/ubah test                            |
| `build`    | Dependency/build system                     |
| `ci`       | CI/CD workflow                              |
| `chore`    | Maintenance umum                            |
| `revert`   | Membatalkan commit sebelumnya               |

---

## 16.2 Rule-based Classification

Comet menggunakan classifier awal berbasis rule.

| Rule                                                   | Type       |
| ------------------------------------------------------ | ---------- |
| File di `docs/` atau `README.md`                       | `docs`     |
| File di `.github/workflows/`                           | `ci`       |
| File `*.test.ts`, `*.spec.ts`, `tests/`                | `test`     |
| File `package.json`, `Dockerfile`, `tsconfig.json`     | `build`    |
| Diff berisi keyword `fix`, `bug`, `error`, `exception` | `fix`      |
| Ada file/function/module baru signifikan               | `feat`     |
| Perubahan nama/folder/struktur tanpa fitur baru        | `refactor` |
| Perubahan cache/query/performance                      | `perf`     |

---

## 16.3 LLM Classification

Setelah rule-based classifier memberi kandidat, LLM boleh memperbaiki hasil.

Input ke LLM:

```json
{
  "files": ["src/auth/login.ts", "src/auth/session.ts"],
  "candidateType": "feat",
  "allowedTypes": ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"],
  "diffSummary": "Added session validation and role check during login"
}
```

Expected output:

```json
{
  "type": "feat",
  "scope": "auth",
  "subject": "add role-based session validation",
  "body": [
    "validate user role during login",
    "add session guard for protected routes"
  ],
  "breaking": false,
  "breakingDescription": null
}
```

---

# 17. Scope Detection

## 17.1 Scope Rule

Scope diambil dari folder/domain perubahan.

| Path                  | Scope     |
| --------------------- | --------- |
| `src/auth/*`          | `auth`    |
| `src/api/payment/*`   | `payment` |
| `src/components/*`    | `ui`      |
| `src/database/*`      | `db`      |
| `src/config/*`        | `config`  |
| `.github/workflows/*` | `ci`      |
| `docker-compose.yml`  | `docker`  |
| `README.md`           | `docs`    |

---

## 17.2 Scope Behavior

Jika hanya satu domain dominan:

```txt
feat(auth): add role-based login validation
```

Jika banyak domain:

```txt
feat: add authentication and dashboard updates
```

Jika `COMET_OMIT_SCOPE=true`:

```txt
feat: add role-based login validation
```

---

# 18. Prompt Module

## 18.1 Prompt Module MVP

Prompt module pertama:

```txt
conventional-commit
```

Tujuan:

* Output mengikuti format Conventional Commit.
* Type harus dari daftar allowed types.
* Scope otomatis jika relevan.
* Subject pendek dan jelas.
* Body opsional.
* JSON structured output.

---

## 18.2 Prompt Rules

Prompt harus menginstruksikan LLM:

```txt
You are Comet, an AI commit message generator.
Generate a clean Conventional Commit message based on the provided git diff.

Rules:
- Use the configured output language.
- Use Conventional Commit format.
- Allowed types: feat, fix, docs, style, refactor, perf, test, build, ci, chore, revert.
- Infer the best commit type from the diff.
- Infer scope from file paths when useful.
- Do not invent changes not present in the diff.
- Keep the subject under 72 characters.
- Use imperative mood.
- Return valid JSON only.
```

---

## 18.3 Expected LLM JSON Output

```json
{
  "type": "feat",
  "scope": "auth",
  "subject": "add role-based login validation",
  "body": [
    "validate user roles during login",
    "protect dashboard routes with session guard"
  ],
  "breaking": false,
  "breakingDescription": null,
  "why": null
}
```

---

# 19. Commit Formatter

Formatter mengubah JSON dari LLM menjadi commit message final.

## 19.1 Standard Format

```txt
feat(auth): add role-based login validation
```

## 19.2 With Body

```txt
feat(auth): add role-based login validation

- validate user roles during login
- protect dashboard routes with session guard
```

## 19.3 With Emoji

```txt
✨ feat(auth): add role-based login validation
```

## 19.4 Without Scope

```txt
feat: add role-based login validation
```

## 19.5 Breaking Change

```txt
feat(auth)!: change session validation flow

BREAKING CHANGE: session tokens must now include role metadata
```

## 19.6 One-line Commit

Jika `COMET_ONE_LINE=true`:

```txt
feat(auth): add role-based login validation
```

Body tidak ditampilkan walaupun `COMET_DESCRIPTION=true`.

---

# 20. Emoji Mapping

Jika `COMET_EMOJI=true`, Comet menggunakan mapping berikut:

| Type       | Emoji | Example        |
| ---------- | ----: | -------------- |
| `feat`     |     ✨ | `✨ feat:`      |
| `fix`      |    🐛 | `🐛 fix:`      |
| `docs`     |    📝 | `📝 docs:`     |
| `style`    |    💄 | `💄 style:`    |
| `refactor` |    ♻️ | `♻️ refactor:` |
| `perf`     |     ⚡ | `⚡ perf:`      |
| `test`     |     ✅ | `✅ test:`      |
| `build`    |    📦 | `📦 build:`    |
| `ci`       |    👷 | `👷 ci:`       |
| `chore`    |    🔧 | `🔧 chore:`    |
| `revert`   |     ⏪ | `⏪ revert:`    |

Default:

```env
COMET_EMOJI=false
```

Alasan default `false`:

* Lebih aman untuk commitlint.
* Lebih umum untuk repository profesional.
* Tidak semua tim memakai emoji di commit.

---

# 21. LLM Provider Engine

## 21.1 Provider MVP

MVP wajib mendukung provider:

```txt
openai
openai-compatible
```

Karena banyak provider modern menyediakan API compatible dengan OpenAI format.

Contoh:

```env
COMET_PROVIDER=openai
COMET_MODEL=Qwen/Qwen3-235B-A22B
COMET_BASE_URL=https://api.netmind.ai/inference-api/openai/v1
COMET_API_KEY=your_api_key
```

---

## 21.2 Provider Roadmap

Provider lanjutan:

```txt
ollama
anthropic
gemini
deepseek
openrouter
groq
azure-openai
```

---

## 21.3 Provider Interface

```ts
export interface AIProvider {
  generateCommitMessage(input: GenerateCommitInput): Promise<GenerateCommitResult>;
}
```

Input:

```ts
export interface GenerateCommitInput {
  model: string;
  baseUrl?: string;
  apiKey?: string;
  prompt: string;
  diff: string;
  maxInputTokens: number;
  maxOutputTokens: number;
}
```

Output:

```ts
export interface GenerateCommitResult {
  type: string;
  scope?: string | null;
  subject: string;
  body?: string[];
  breaking?: boolean;
  breakingDescription?: string | null;
  why?: string | null;
}
```

---

# 22. UX Interaction

## 22.1 Preview UI

Setelah generate:

```txt
Comet generated this commit message:

feat(auth): add role-based login validation

- validate user roles during login
- protect dashboard routes with session guard

Use this commit message?
[Y] yes  [e] edit  [r] regenerate  [n] cancel
```

---

## 22.2 User Actions

| Input       | Action                              |
| ----------- | ----------------------------------- |
| `Y` / Enter | Commit menggunakan message tersebut |
| `e`         | Edit message manual                 |
| `r`         | Regenerate message                  |
| `n`         | Cancel                              |

---

## 22.3 Auto Commit Mode

Jika:

```env
COMET_AUTO_COMMIT=true
```

Maka Comet langsung commit tanpa confirmation.

Namun default MVP:

```env
COMET_AUTO_COMMIT=false
```

---

## 22.4 Git Push Mode

Jika:

```env
COMET_GIT_PUSH=true
```

Setelah commit berhasil, Comet menjalankan:

```bash
git push
```

Default:

```env
COMET_GIT_PUSH=false
```

Alasan:

* Lebih aman.
* Tidak semua commit perlu langsung dipush.
* Menghindari push tidak sengaja.

---

# 23. Error Handling

## 23.1 Not a Git Repository

```txt
Comet error: current directory is not a Git repository.
```

## 23.2 No Staged Changes

```txt
No staged changes found.
Run git add . before using comet.
```

## 23.3 Missing API Key

```txt
Missing COMET_API_KEY.
Set it using:
comet config set apiKey your_api_key

Or use environment variable:
COMET_API_KEY=your_api_key
```

## 23.4 LLM Request Failed

```txt
Failed to generate commit message.
Reason: provider request failed.

Try:
- Check your API key
- Check COMET_BASE_URL
- Check model name
- Reduce COMET_MAX_INPUT_TOKENS
```

## 23.5 Invalid LLM JSON

```txt
The AI returned an invalid response.
Comet will retry with stricter JSON instructions.
```

MVP retry policy:

```txt
Max retry: 2
```

---

# 24. Security Requirements

## 24.1 Default Security Principles

Comet harus:

1. Tidak mengirim `.env` ke LLM.
2. Tidak mengirim private key.
3. Redact token/password/API key.
4. Tidak auto push secara default.
5. Tidak force push.
6. Tidak rewrite history.
7. Tidak menyimpan diff.
8. Tidak menyimpan hasil LLM kecuali user mengaktifkan logging.

---

## 24.2 API Key Storage

Untuk MVP, API key dapat disimpan di config global, tetapi rekomendasi aman:

```txt
Use environment variable when possible.
```

Opsi:

```bash
export COMET_API_KEY="your_api_key"
```

Windows PowerShell:

```powershell
setx COMET_API_KEY "your_api_key"
```

Roadmap:

```txt
Support OS keychain/keytar for secure API key storage.
```

---

## 24.3 Privacy Mode

Comet dapat memiliki tiga mode:

| Mode         | Behavior                                        |
| ------------ | ----------------------------------------------- |
| `standard`   | Redact secrets dan kirim diff aman              |
| `strict`     | Exclude lebih banyak file dan batasi diff       |
| `local-only` | Hanya boleh pakai local provider seperti Ollama |

Config:

```env
COMET_PRIVACY_MODE=standard
```

---

# 25. Architecture

## 25.1 Recommended Stack

```txt
Node.js
TypeScript
Commander.js
Execa
Inquirer/Prompts
Zod
dotenv
OpenAI SDK
picomatch
chalk
ora
conf or custom config loader
tsup
vitest
eslint
prettier
```

---

## 25.2 Project Structure

```txt
comet/
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── README.md
├── .env.example
├── src/
│   ├── cli.ts
│   ├── commands/
│   │   ├── commit.ts
│   │   ├── preview.ts
│   │   ├── config.ts
│   │   ├── init.ts
│   │   └── hook.ts
│   ├── config/
│   │   ├── default.ts
│   │   ├── loader.ts
│   │   ├── paths.ts
│   │   ├── parser.ts
│   │   └── schema.ts
│   ├── git/
│   │   ├── diff.ts
│   │   ├── status.ts
│   │   ├── commit.ts
│   │   ├── push.ts
│   │   └── hooks.ts
│   ├── ai/
│   │   ├── provider.ts
│   │   ├── openai.ts
│   │   ├── openai-compatible.ts
│   │   ├── ollama.ts
│   │   └── mock.ts
│   ├── prompt/
│   │   ├── builder.ts
│   │   ├── modules/
│   │   │   ├── conventional-commit.ts
│   │   │   └── simple.ts
│   │   └── templates.ts
│   ├── analyzer/
│   │   ├── type-classifier.ts
│   │   ├── scope-detector.ts
│   │   └── diff-summary.ts
│   ├── formatter/
│   │   ├── commit-formatter.ts
│   │   └── emoji.ts
│   ├── security/
│   │   ├── redact.ts
│   │   ├── file-filter.ts
│   │   └── patterns.ts
│   ├── ui/
│   │   ├── prompts.ts
│   │   ├── logger.ts
│   │   └── spinner.ts
│   └── utils/
│       ├── shell.ts
│       └── json.ts
└── tests/
    ├── config.test.ts
    ├── redact.test.ts
    ├── formatter.test.ts
    └── classifier.test.ts
```

---

## 25.3 Internal Pipeline

```txt
CLI
 ↓
Config Loader
 ↓
Git Diff Engine
 ↓
File Filter
 ↓
Secret Redactor
 ↓
Commit Analyzer
 ↓
Prompt Builder
 ↓
LLM Provider
 ↓
Schema Validator
 ↓
Commit Formatter
 ↓
Preview UI
 ↓
Git Commit / Git Push
```

---

# 26. Data Models

## 26.1 Runtime Config

```ts
export interface CometConfig {
  provider: string;
  model: string;
  baseUrl?: string | null;
  apiKey?: string | null;
  customHeaders?: Record<string, string> | null;

  promptModule: string;
  language: string;
  description: boolean;
  emoji: boolean;
  oneLine: boolean;
  omitScope: boolean;
  why: boolean;
  messageTemplate: string;

  maxInputTokens: number;
  maxOutputTokens: number;

  autoCommit: boolean;
  gitPush: boolean;
  stageAll: boolean;

  redactSecrets: boolean;
  privacyMode: "standard" | "strict" | "local-only";
  excludeFiles: string[];
}
```

---

## 26.2 Git Diff Context

```ts
export interface GitDiffContext {
  branch: string;
  files: string[];
  stats: {
    filesChanged: number;
    insertions: number;
    deletions: number;
  };
  rawDiff: string;
  safeDiff: string;
  skippedFiles: string[];
}
```

---

## 26.3 Commit Analysis

```ts
export interface CommitAnalysis {
  candidateType: string;
  candidateScope?: string | null;
  changedAreas: string[];
  summary: string;
}
```

---

## 26.4 Generated Commit

```ts
export interface GeneratedCommit {
  type: string;
  scope?: string | null;
  subject: string;
  body?: string[];
  breaking: boolean;
  breakingDescription?: string | null;
  why?: string | null;
}
```

---

# 27. Functional Requirements

## FR-001 — Run Main CLI

User dapat menjalankan:

```bash
comet
```

Comet harus memproses staged diff dan menghasilkan commit message.

Acceptance Criteria:

* Command tersedia setelah install global.
* Command gagal dengan pesan jelas jika bukan Git repo.
* Command gagal dengan pesan jelas jika tidak ada staged changes.

---

## FR-002 — Global Config

Comet harus membaca global config dari:

```txt
~/.comet/config.env
```

Acceptance Criteria:

* File dibuat otomatis oleh `comet init` atau `comet config set`.
* Config dibaca dari folder mana pun.
* Config bisa ditampilkan dengan `comet config get`.
* Path bisa ditampilkan dengan `comet config path`.

---

## FR-003 — Config Override

Comet harus mendukung urutan prioritas:

```txt
CLI flags > ENV > project config > global config > default
```

Acceptance Criteria:

* CLI flag bisa override global config.
* ENV bisa override global config.
* Project config bisa override global config.

---

## FR-004 — OpenAI-compatible Provider

Comet harus dapat memanggil endpoint OpenAI-compatible.

Acceptance Criteria:

* User bisa set `COMET_BASE_URL`.
* User bisa set model custom.
* User bisa set API key.
* Response divalidasi ke schema.

---

## FR-005 — Conventional Commit Output

Comet harus menghasilkan output Conventional Commit.

Acceptance Criteria:

* Type valid.
* Scope opsional.
* Subject tidak kosong.
* Format benar.

---

## FR-006 — Emoji Option

Comet harus mendukung emoji optional.

Acceptance Criteria:

* Default emoji false.
* Jika true, emoji ditambahkan berdasarkan type.
* Jika false, output tanpa emoji.

---

## FR-007 — Description Option

Comet harus mendukung body commit optional.

Acceptance Criteria:

* Jika `COMET_DESCRIPTION=false`, output satu subject saja kecuali breaking change.
* Jika true, body bullet bisa ditampilkan.

---

## FR-008 — One-line Commit

Comet harus mendukung one-line commit.

Acceptance Criteria:

* Jika `COMET_ONE_LINE=true`, output hanya satu baris.
* Body tidak ditampilkan.

---

## FR-009 — Omit Scope

Comet harus mendukung omit scope.

Acceptance Criteria:

* Jika `COMET_OMIT_SCOPE=true`, output tidak memakai `(scope)`.

---

## FR-010 — Preview Confirmation

Comet harus menampilkan preview sebelum commit.

Acceptance Criteria:

* User bisa accept.
* User bisa edit.
* User bisa regenerate.
* User bisa cancel.

---

## FR-011 — Secret Redaction

Comet harus menyensor secret dari diff.

Acceptance Criteria:

* API key disensor.
* Password disensor.
* Private key disensor.
* Database URL disensor.

---

## FR-012 — File Exclusion

Comet harus skip file tertentu.

Acceptance Criteria:

* `.env` tidak dikirim ke LLM.
* Lockfile bisa di-skip.
* Build output bisa di-skip.

---

## FR-013 — Git Push Optional

Comet dapat melakukan `git push` jika diaktifkan.

Acceptance Criteria:

* Default false.
* Jika true, push setelah commit berhasil.
* Jika push gagal, tampilkan error jelas.

---

# 28. Non-Functional Requirements

## 28.1 Performance

* Untuk diff kecil, response CLI terasa cepat.
* Diff besar harus dipotong sesuai `COMET_MAX_INPUT_TOKENS`.
* Comet harus memberi informasi jika diff terlalu besar.

## 28.2 Reliability

* Retry LLM maksimal 2 kali jika response invalid.
* Tidak boleh membuat commit jika message kosong.
* Tidak boleh push jika commit gagal.

## 28.3 Security

* Redaction aktif default.
* File sensitif di-skip default.
* API key tidak ditampilkan di log.

## 28.4 Compatibility

* Linux.
* macOS.
* Windows.
* Node.js LTS.

## 28.5 Maintainability

* Modular provider engine.
* Modular prompt module.
* Testable config loader.
* Testable formatter.
* Testable redaction.

---

# 29. Example Usage

## 29.1 Setup Global Config

```bash
npm install -g @arseno/comet

comet config set provider openai
comet config set model Qwen/Qwen3-235B-A22B
comet config set baseUrl https://api.netmind.ai/inference-api/openai/v1
comet config set apiKey your_api_key
comet config set promptModule conventional-commit
comet config set language en
comet config set emoji false
comet config set description false
```

---

## 29.2 Generate Commit

```bash
git add .
comet
```

Output:

```txt
Comet generated this commit message:

feat(auth): add role-based login validation

Use this commit message?
[Y] yes  [e] edit  [r] regenerate  [n] cancel
```

---

## 29.3 Generate with Emoji

```bash
comet --emoji
```

Output:

```txt
✨ feat(auth): add role-based login validation
```

---

## 29.4 Force Type and Scope

```bash
comet --type fix --scope api
```

Output:

```txt
fix(api): handle missing authorization token
```

---

# 30. Roadmap

## Phase 1 — MVP CLI

Target:

* CLI stable.
* Config global.
* OpenAI-compatible provider.
* Conventional Commit.
* Preview and commit.

Deliverables:

```txt
comet
comet preview
comet config set/get/path/unset
```

---

## Phase 2 — Developer Experience

Target:

* Git hook.
* Project config.
* Interactive setup.
* Commitlint compatibility.

Deliverables:

```txt
comet init
comet hook install
.cometrc
```

---

## Phase 3 — Provider Expansion

Target:

* Ollama.
* Gemini.
* Anthropic.
* OpenRouter.
* Groq.

Deliverables:

```txt
COMET_PROVIDER=ollama
COMET_PROVIDER=gemini
COMET_PROVIDER=anthropic
```

---

## Phase 4 — GitHub Integration

Target:

* GitHub Action check mode.
* PR summary.
* Commit quality check.

Important:

* No force push by default.
* No history rewrite by default.

---

## Phase 5 — Ecosystem

Target:

* VS Code extension.
* Team config.
* Changelog generator.
* Release note generator.
* Web dashboard optional.

---

# 31. MVP Acceptance Checklist

MVP dianggap selesai jika:

* [ ] Package bisa diinstall global.
* [ ] Command `comet` tersedia.
* [ ] `comet config set` membuat `~/.comet/config.env`.
* [ ] `comet config get` menampilkan config.
* [ ] `comet config path` menampilkan path config.
* [ ] Comet bisa membaca staged diff.
* [ ] Comet bisa skip file sensitif.
* [ ] Comet bisa redact secret.
* [ ] Comet bisa call OpenAI-compatible API.
* [ ] Comet bisa generate JSON commit result.
* [ ] Comet bisa format Conventional Commit.
* [ ] Comet bisa preview commit message.
* [ ] User bisa accept/edit/regenerate/cancel.
* [ ] Comet bisa menjalankan `git commit`.
* [ ] Auto push default false.
* [ ] Test untuk config loader tersedia.
* [ ] Test untuk redaction tersedia.
* [ ] Test untuk formatter tersedia.

---

# 32. Risks & Mitigation

| Risiko                  | Dampak                 | Mitigasi                                     |
| ----------------------- | ---------------------- | -------------------------------------------- |
| Diff mengandung secret  | Data bocor ke provider | Redaction + file exclude default             |
| LLM output tidak valid  | Commit gagal           | JSON schema validation + retry               |
| Model terlalu mahal     | Biaya tinggi           | Model configurable + local provider          |
| Diff terlalu besar      | Token limit error      | Truncation + summarization                   |
| Auto push tidak sengaja | Push premature         | Default `COMET_GIT_PUSH=false`               |
| Commit message buruk    | Kualitas rendah        | Rule classifier + prompt strict + regenerate |
| Config membingungkan    | UX buruk               | `comet init` interactive                     |

---

# 33. Success Metrics

## Product Metrics

* Jumlah install package.
* Jumlah GitHub stars.
* Jumlah repository yang menggunakan Comet.
* Jumlah issue/bug rendah.
* Retention developer personal.

## Quality Metrics

* Persentase generated commit yang langsung diterima user.
* Persentase regenerate.
* Persentase edit manual.
* Rata-rata waktu generate.
* Jumlah invalid LLM response.

## Security Metrics

* Tidak ada secret leak dalam test sample.
* Redaction coverage meningkat.
* Tidak ada force push behavior default.

---

# 34. Final Product Definition

Comet adalah AI commit assistant berbasis CLI yang membaca staged Git diff, membersihkan data sensitif, mengklasifikasikan perubahan kode, lalu menghasilkan commit message rapi menggunakan provider LLM yang dapat dikonfigurasi.

Core identity:

```txt
Name: Comet
Command: comet
Purpose: AI-powered commit message assistant
Default style: Conventional Commit
Default safety: no auto push, no force push, redact secrets
Global config: ~/.comet/config.env
```

MVP command utama:

```bash
git add .
comet
```

Contoh hasil:

```txt
feat(auth): add role-based login validation
```

Comet harus terasa seperti tool kecil, cepat, aman, dan developer-friendly — mirip `oco`, tetapi dengan kontrol lebih baik terhadap config, provider, privacy, dan Git behavior.
