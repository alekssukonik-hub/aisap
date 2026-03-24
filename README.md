This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Description

- **Sorting** — sort studies in the studies list.
- **Patient ID filtering** — filter by patient ID to see studies for a specific patient.

## Why this tech stack

- **React** — currently a fast and fairly reliable framework for building UI.
- **Next.js** — the best fit for this task as a lightweight mini-backend, with a transparent structure that is easy to maintain.
- **TypeScript** — provides type safety between backend and frontend code.
- **Docker** — part of the task requirements and also useful for quick, consistent deployment.

## State management approach

This project intentionally uses a lightweight state management model without Redux/Zustand/React Query.

- **Local UI state (`useState`)** in page components handles filters, sorting, pagination, loading/error flags, and status edit drafts.
- **Derived state (`useMemo`)** computes filtered/sorted datasets and dynamic filter options.
- **URL as a shareable state layer** keeps list state in query params (page, page size, filters, sorting), so navigation and deep links preserve user context.
- **Session persistence** stores list preferences in `sessionStorage` to restore state during the same browser session.
- **Server state via API calls** is handled with straightforward `fetch` helpers; after updates, UI state is updated directly for immediate feedback.
- **Mock backend persistence** writes updates to the local JSON dataset through Next.js route handlers.

### Why this choice

- **Fits project scope:** most state is page-scoped, so a global store would add unnecessary complexity.
- **Keeps dependencies minimal:** easier maintenance and lower cognitive overhead.
- **Improves UX naturally:** URL-synced list state supports back navigation and shareable links.
- **Easy to evolve:** if cross-page shared state or advanced caching/revalidation grows, adding a dedicated state/data library remains straightforward.

## Project structure

- **Studies list** — studies are shown in a filtered, sorted list.
- **Study preview** — open a selected study for a detailed view; the back link returns you to the studies list with the same filters, sorting, and pagination as when you opened the study.

Application code lives in the `nextjs-app` directory. A `docker-compose.yml` file for running the app in containers lives in the repository root.

## Prerequisites

- **Node.js** 20 or newer (aligned with the Docker images).
- **npm** — the repo includes `package-lock.json`; use `npm ci` for reproducible installs.
- **Docker** (optional) — [Docker Engine](https://docs.docker.com/engine/install/) with [Compose V2](https://docs.docker.com/compose/) (`docker compose`) for container-based workflows.

## Getting started (local, no Docker)

From the `nextjs-app` directory:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The dev server uses hot reload: edits under `src/` (and other app files) refresh automatically.

### npm scripts

| Command        | Description                          |
| -------------- | ------------------------------------ |
| `npm run dev`  | Next.js development server           |
| `npm run build`| Production build                     |
| `npm run start`| Production server (run after `build`)|
| `npm run lint` | ESLint                               |

## Docker

Docker files:

| File                 | Role                                      |
| -------------------- | ----------------------------------------- |
| `nextjs-app/Dockerfile`         | Multi-stage production build (standalone) |
| `nextjs-app/Dockerfile.dev`     | Dev base image (Node 20 Alpine)           |
| `docker-compose.yml` | `web` (prod) and `dev` (hot reload) |

**Run all `docker compose` commands from the repository root** (the directory that contains `docker-compose.yml` and the `nextjs-app` folder).

### Important: one service at a time

Both `web` and `dev` publish **host port 3000**. Start **one** service per session:

- **Production:** `docker compose up web`
- **Development:** `docker compose up dev`

Do **not** run `docker compose up` with no service name; Compose would try to start both services and the second bind to port 3000 would fail.

### Production (`web`)

Builds the app with `next build` (standalone output) and runs `node server.js` as a non-root user.

```bash
# from repository root
docker compose build web
docker compose up web
```

Detached (background):

```bash
docker compose up -d web
```

Stop:

```bash
docker compose down
```

Then open [http://localhost:3000](http://localhost:3000).

### Development (`dev`)

Mounts `./nextjs-app` into the container, keeps `node_modules` and `.next` in named volumes (so Linux dependencies are consistent and the bind mount does not wipe them), enables polling for file watching on Docker Desktop, and runs `next dev` bound to `0.0.0.0`.

```bash
# from repository root
docker compose build dev
docker compose up dev
```

Open [http://localhost:3000](http://localhost:3000). Code changes on the host should trigger reloads; if they do not, ensure `WATCHPACK_POLLING` remains enabled (it is set in Compose for the `dev` service).

### After changing dependencies

If you edit `package.json` or `package-lock.json`, refresh modules inside the dev stack:

```bash
docker compose run --rm dev sh -c "npm ci"
```

To fully reset dev container volumes (`node_modules` and `.next` caches), remove them when stopping the stack:

```bash
docker compose down -v
docker compose up dev
```

The next start runs `npm ci` again and repopulates the volumes. Use this when dependencies are badly out of sync; for small lockfile updates, prefer `docker compose run --rm dev sh -c "npm ci"` above.

### Production image without Compose

```bash
# from repository root
docker build -t aisap-web -f nextjs-app/Dockerfile nextjs-app
docker run -p 3000:3000 aisap-web
```

## Emulation errors

You can emulate errors in mock data by:

- Placing malformed data in the mock file.
- Using an empty array.
- Removing or renaming the file.

## TODO

Tracked from inline `TODO` / `FIXME`-style comments in the codebase:

- *(None found — search covered project sources under `nextjs-app` and the repo root, excluding dependencies.)*

## Learn more

- [Next.js Documentation](https://nextjs.org/docs) — features and APIs.
- [Learn Next.js](https://nextjs.org/learn) — interactive tutorial.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to optimize and load [Geist](https://vercel.com/font).

## Deploy on Vercel

The [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) is a common choice for Next.js apps.

See the [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more options, including self-hosted and container deployments.
