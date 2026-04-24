# Comet

Comet adalah CLI untuk membuat commit message yang rapi, konsisten, dan aman dari perubahan kode yang sudah di-stage di Git. Tool ini membaca `git diff --staged`, memfilter file sensitif, melakukan secret redaction, lalu menghasilkan commit message bergaya Conventional Commit dengan provider OpenAI-compatible.

Tujuan Comet sederhana: saat Anda menjalankan `comet`, yang terjadi harus terasa cepat, bersih, dan langsung berguna.

## Fitur

- Default command langsung generate commit message tanpa harus mengetik subcommand tambahan.
- Format output Conventional Commit yang konsisten.
- Dukungan provider `openai` dan `openai-compatible`.
- Global config di `~/.comet/config.env`.
- Project override via `.comet.env`, `.cometrc`, atau `.cometrc.json`.
- Preview interaktif sebelum commit: accept, edit, regenerate, cancel.
- Opsi body/deskripsi commit.
- Opsi emoji per tipe commit.
- Opsi one-line commit.
- Opsi omit scope.
- Opsi `why` section.
- Secret redaction untuk token, password, database URL, private key, dan pola sensitif umum lain.
- File exclusion default untuk lockfile, `.env`, build output, dan folder sensitif.
- `doctor` command untuk diagnosis config dan readiness environment.
- `prepare-commit-msg` hook installer.
- Opsi push setelah commit dengan konfirmasi terpisah.

## Install

Global install:

```bash
npm install -g @arseno25/comet
```

Jalankan tanpa install permanen:

```bash
npx @arseno25/comet init
npx @arseno25/comet
```

Install sebagai dev dependency:

```bash
npm install -D @arseno25/comet
npx comet
```

## Requirement

- Node.js 22 atau lebih baru
- npm 11 atau lebih baru
- Git terinstall dan tersedia di terminal
- API key provider jika tidak memakai mode `local-only`

## Quick Start

### 1. Setup config sekali

```bash
comet init
```

Wizard `init` akan menanyakan:

- provider
- model
- base URL
- API key
- language
- emoji on/off
- description/body on/off
- git push default on/off

### 2. Stage perubahan

```bash
git add .
```

### 3. Generate commit

```bash
comet
```

Kalau ada staged changes, Comet akan:

1. membaca config runtime
2. membaca staged diff
3. memfilter file yang di-skip
4. meredact data sensitif
5. mengirim safe diff ke provider AI
6. menampilkan preview commit
7. meminta konfirmasi
8. membuat commit
9. jika `gitPush=true`, meminta konfirmasi push

## Cara Kerja Default

Perilaku utama Comet sengaja dibuat seperti OpenCommit:

```bash
comet
```

Command di atas langsung menjalankan flow generate commit. Help hanya muncul jika Anda memang memanggil:

```bash
comet -h
comet --help
```

Kalau tidak ada staged changes, Comet tidak akan muter lama. Dia langsung menampilkan pesan dan selesai:

```txt
No staged changes found. Run `git add .` first or enable COMET_STAGE_ALL.
```

## Command Reference

### Main command

```bash
comet
```

Generate commit message dari staged diff, tampilkan preview, lalu commit jika disetujui.

### Explicit commit command

```bash
comet commit
```

Sama seperti `comet`, hanya lebih eksplisit.

### Preview only

```bash
comet preview
```

Generate commit message tanpa menjalankan `git commit`.

### Interactive init

```bash
comet init
```

Membuat atau memperbarui global config di:

```txt
~/.comet/config.env
```

### Config commands

Set value:

```bash
comet config set provider openai-compatible
comet config set model Qwen/Qwen3-235B-A22B
comet config set baseUrl https://api.netmind.ai/inference-api/openai/v1
comet config set apiKey your_api_key
comet config set gitPush true
```

Ambil semua config:

```bash
comet config get
```

Ambil satu key:

```bash
comet config get model
comet config get gitPush
```

Hapus key:

```bash
comet config unset apiKey
```

Lihat path config:

```bash
comet config path
```

### Doctor

```bash
comet doctor
```

Menampilkan diagnosis untuk:

- global config aktif
- project config override
- provider/model/base URL
- API key terbaca atau tidak
- status git repo
- jumlah staged files
- env override `COMET_*`

### Hook management

Install hook:

```bash
comet hook install
```

Cek status hook:

```bash
comet hook status
```

Hapus hook:

```bash
comet hook uninstall
```

Hook yang dipasang pada MVP ini adalah:

```txt
prepare-commit-msg
```

## Runtime Flags

Semua flag ini bisa dipakai di `comet`, `comet commit`, atau `comet preview`.

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
comet --push
comet --no-push
comet --yes
```

Catatan:

- `--yes` menerima commit message tanpa konfirmasi preview.
- Jika `gitPush=true`, Comet tetap akan meminta konfirmasi terpisah sebelum `git push`.
- Pada terminal non-interactive, konfirmasi push tidak dipaksa dan push akan dilewati.

## Konfirmasi yang Akan Muncul

### Preview confirmation

Setelah message dihasilkan, user bisa memilih:

- `Yes` untuk commit
- `Edit` untuk membuka editor dan mengubah message
- `Regenerate` untuk generate ulang
- `Cancel` untuk batal

### Push confirmation

Jika `gitPush=true`, setelah commit berhasil Comet akan bertanya lagi:

```txt
Commit created. Push to remote now?
```

Jadi push tidak langsung terjadi tanpa persetujuan user.

## Config Priority

Urutan prioritas config:

```txt
CLI flags > environment variables > project config > global config > default config
```

Artinya:

- flag CLI paling kuat
- env var `COMET_*` mengalahkan file config
- config project hanya berlaku di repo tertentu
- config global berlaku lintas project

## Lokasi Config

### Global config

```txt
~/.comet/config.env
```

Contoh Windows:

```txt
C:\Users\Username\.comet\config.env
```

### Project override

Comet akan mencari salah satu file berikut dari folder aktif ke atas:

```txt
.comet.env
.cometrc
.cometrc.json
```

## Config Keys

Berikut key yang paling penting untuk penggunaan sehari-hari.

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

### Token limit

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

## Contoh Config OpenAI-Compatible

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

## Output Format

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

## File Exclusion dan Secret Redaction

Secara default Comet tidak mengirim file sensitif atau noise-heavy tertentu ke model, termasuk:

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

Comet juga meredact pola sensitif seperti:

- API key
- bearer token
- JWT
- password
- database URL
- private key
- webhook secret

## Typical Workflows

### Workflow normal

```bash
git add .
comet
```

### Preview only

```bash
git add .
comet --preview
```

### Force type and scope

```bash
git add .
comet --type fix --scope auth
```

### Commit tanpa body

```bash
git add .
comet --no-description
```

### Commit satu baris

```bash
git add .
comet --one-line
```

### Push setelah commit, tapi tetap pakai konfirmasi

```bash
comet config set gitPush true
git add .
comet
```

## Troubleshooting

### `No staged changes found`

Artinya belum ada perubahan yang di-stage.

```bash
git add .
comet
```

Atau aktifkan:

```bash
comet config set stageAll true
```

### `Missing API key`

Cek apakah key benar-benar tersimpan:

```bash
comet config get apiKey
comet doctor
```

Set ulang jika perlu:

```bash
comet config set apiKey your_api_key
```

### Ingin cek config aktif sekarang

```bash
comet doctor
```

### Ingin tahu file config yang dipakai

```bash
comet config path
```

## License

MIT. Lihat [LICENSE](./LICENSE).
