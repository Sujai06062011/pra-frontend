# Patient Relationship Assistant (PRA)

A live React frontend for clinic patient relationship management, built from the [Figma prototype](https://www.figma.com/design/ERiOjJBsFKIJCwA974DHMM/Design-Patient-Relationship-Assistant).

## Features

- **11 fully interactive sections**: Dashboard, Appointments, Queue, Patients, Prescriptions, Lab Reports, Queries, Follow-ups, Reviews, Analytics, Settings
- **Figma-faithful UI**: Syne + DM Sans fonts, emerald/teal palette, card layouts, badges, and status chips
- **Live charts**: Recharts bar, area, line, pie, and radial charts across Dashboard, Analytics, and Reviews
- **Mock clinic data**: Dr. Kumar Child Care demo data for tier 2/3 Indian city workflows
- **Interactive flows**: Sidebar navigation, queue token controls, search/filter, query replies, new appointment modal

## Tech Stack

- React 18 + TypeScript
- Vite 6
- Tailwind CSS v4
- Radix UI + shadcn-style components
- Recharts + Lucide icons

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm run dev

# Build for production
pnpm run build

# Preview production build
pnpm run preview
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
src/
├── app/
│   ├── App.tsx                 # Main shell + routing
│   └── components/
│       ├── pages/              # 11 page views
│       ├── Sidebar.tsx
│       ├── Topbar.tsx
│       └── ui/                 # Reusable UI primitives
└── styles/
    ├── fonts.css               # Syne + DM Sans
    ├── theme.css               # Design tokens
    └── tailwind.css
```

## Backend Integration

The app uses local mock data. To connect a backend, replace mock arrays in each page component under `src/app/components/pages/` with API calls.
