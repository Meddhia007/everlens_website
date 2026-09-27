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

- **Framework**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS with bespoke EverLens design tokens (Teal, Ivory Canvas, Slate, Dusty Salmon)
- **Typography**: Cormorant Garamond, Playfair Display, Plus Jakarta Sans, Alex Brush
- **Animation**: Framer Motion
- **Icons**: Lucide Icons
- **Forms & Validation**: React Hook Form + Zod
- **Routing**: React Router v6

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
```
