# Wiryo 🌳

Wiryo adalah aplikasi **family tree multi-generasi** berbasis Next.js App Router.
Data anggota disimpan dalam database libSQL (Turso / SQLite file), lalu divisualisasikan dalam bentuk pohon keluarga interaktif.

## Fitur Utama

- Manajemen anggota keluarga (CRUD)
- Dukungan ayah & ibu secara independen untuk tiap anggota
- Dukungan relasi pasangan (aktif / mantan)
- Deteksi pencegahan siklus relasi (agar struktur keluarga tetap valid)
- Visual tree interaktif dengan:
  - highlight pencarian nama
  - filter berdasarkan root utama
  - mode fullscreen
  - export ke PNG dan PDF
- Detail anggota: orang tua, anak, dan relasi pasangan
- PWA dasar (manifest + service worker untuk offline shell)

## Stack Teknologi

- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- Turso/libSQL (`@libsql/client`)
- `html-to-image` + `jspdf` untuk export tree

## Struktur Proyek (ringkas)

- `app/` — routing App Router, halaman, API route
- `components/Member/` — form dan kartu anggota
- `components/Tree/` — renderer visual pohon keluarga
- `lib/` — akses DB, operasi member/relationship, util tree
- `public/sw.js` — service worker PWA

## Menjalankan Project

1. Install dependency:

```bash
npm install
```

1. Buat file `.env.local` di root project:

```env
# Opsi 1: Turso (remote)
TURSO_DATABASE_URL=libsql://your-db.turso.io
TURSO_AUTH_TOKEN=your-token

# Opsi 2: SQLite lokal (tanpa Turso)
# TURSO_DATABASE_URL=file:./dev.db
# TURSO_AUTH_TOKEN=
```

1. Jalankan development server:

```bash
npm run dev
```

1. Buka:

[http://localhost:3000](http://localhost:3000)

> Tabel database diinisialisasi otomatis saat akses data pertama.

## Script

- `npm run dev` — jalankan mode development
- `npm run build` — build production
- `npm run start` — jalankan hasil build
- `npm run lint` — linting dengan ESLint

## API Ringkas

### Members

- `GET /api/members` — list semua anggota
- `POST /api/members` — tambah anggota
- `GET /api/members/:id` — detail anggota
- `PUT /api/members/:id` — update anggota
- `DELETE /api/members/:id` — hapus anggota

Payload member utama:

- `name` (string, wajib)
- `fatherId` (string | null)
- `motherId` (string | null)
- `birthDate` (string | null, biasanya tahun lahir)
- `gender` (`"L" | "P" | null`)

### Relationships

- `GET /api/relationships` — list relasi pasangan
- `POST /api/relationships` — tambah/update relasi pasangan
- `PUT /api/relationships/:id` — upsert relasi berdasarkan pasangan
- `DELETE /api/relationships/:id` — hapus relasi

Payload relationship:

- `memberAId` (string, wajib)
- `memberBId` (string, wajib)
- `status` (`"current" | "former"`)

## Catatan

- Ikon PWA perlu disediakan di `public/icons/`:
  - `icon-192x192.png`
  - `icon-512x512.png`
- Service worker didaftarkan hanya pada mode production.

---

Jika butuh, saya bisa lanjut bantu bikinkan section tambahan seperti contoh request/response API atau panduan deployment (Vercel/Fly.io).
