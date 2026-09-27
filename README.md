# EverLens Weddings

> Premium wedding photography and cinematic wedding films.

EverLens Weddings is a modern, production-grade web application tailored for luxury wedding photography and cinematic film commissions worldwide.

---

## Experiences

The platform provides three logically separated experiences:

1. **Public Marketing Website** (`/`, `/portfolio`, `/services`, `/about`, `/contact`, `/login`)
   - Editorial showcase, film reels, collection pricing, and commission inquiries.
2. **Private Client Portal** (`/client`, `/client/gallery`, `/client/prints`, `/client/downloads`)
   - Client sanctuary for 4K film streaming, high-resolution proofing, print store, and archival downloads.
3. **Admin Control Panel** (`/admin`, `/admin/clients`, `/admin/galleries`, `/admin/media`, `/admin/portfolio`, `/admin/print-orders`, `/admin/settings`)
   - Studio management for client lifecycles, gallery publishing, CloudFront/S3 media assets, and lab print orders.

---

## Development Preview

A living design system showcase is available during development:
- **Design System Preview**: [`/design-system`](http://localhost:3000/design-system)

---

## Tech Stack

- **Framework**: Next.js 15 (App Router) + React 18 + TypeScript
- **Database**: MongoDB (Atlas) with Mongoose
- **Object Storage**: Cloudflare R2 (Private S3-compatible, presigned URLs only)
- **Styling**: Tailwind CSS with bespoke EverLens design tokens
- **Security**: Strict CORS Lockdown, Magic Byte verification, Audit Logging, Auth Rate Limiting, Dependabot

---

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Run strict TypeScript verification
npm run typecheck

# Build for production
npm run build

# Run automated MongoDB database backup
npm run db:backup
```

---

## Disaster Recovery & Backups

For step-by-step restoration procedures for MongoDB and Cloudflare R2 media assets, consult the [Disaster Recovery Runbook](docs/BACKUP_AND_RESTORE.md).
