# Modern Next.js Front-end

A modern front-end built with the latest Next.js stack: **Next.js 16**, **React 19**, **TypeScript**, and **Tailwind CSS v4**.

## Tech stack

- **Next.js 16** – App Router, React Server Components, Turbopack
- **React 19** – Latest React with Server Components support
- **TypeScript** – End-to-end type safety
- **Tailwind CSS v4** – Utility-first styling with CSS variables and `@theme`
- **ESLint** – Linting with `eslint-config-next`

## Getting started

```bash
# Install dependencies (if needed)
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Edit `src/app/page.tsx` and the page updates in the browser.

## Scripts

| Command    | Description                |
| ---------- | -------------------------- |
| `npm run dev`   | Start dev server (Turbopack) |
| `npm run build` | Build for production       |
| `npm run start` | Start production server     |
| `npm run lint`  | Run ESLint                 |

## Project structure

```
src/
├── app/              # App Router routes and layout
│   ├── globals.css   # Global styles and design tokens
│   ├── layout.tsx    # Root layout (fonts, metadata)
│   └── page.tsx      # Home page
└── components/       # Reusable UI
    ├── ui/           # Primitives (Button, Card)
    ├── header.tsx
    └── footer.tsx
```

Design tokens (colors, radius, fonts) are defined in `src/app/globals.css` and respect `prefers-color-scheme: dark`.
