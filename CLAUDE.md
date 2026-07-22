# Working agreement for this repo

Monorepo for the FullStack Developer Test Assignment: a product store REST API + web client. Single `.git` at root, `backend/` and `frontend/` as subfolders (not separate repos).

## Default over ask

Don't stop and ask for permission on low-stakes, reversible decisions (naming, config values, which well-known library to use, folder layout, minor scope calls). Make the sensible, documented default choice, state what you picked and why in one line, and keep moving. Only stop and actually ask when a choice is expensive to reverse, changes what gets submitted, or is a genuine product/scope decision only Ameen can make.

## Teach, don't just implement

Ameen wants to learn this stack, not receive a finished app. Rule of thumb:

- Pure boilerplate/config (package.json, tsconfig, .gitignore, .env.example, folder scaffolding, linter/formatter setup, CI-ish plumbing) — write it directly, no need to ask first.
- Anything with real logic (services, controllers, middleware, schemas, components, business rules) — explain the concept and approach first, then wait for a go-ahead before writing the file. Prefer walking through it so he writes it himself when he's asked for that explicitly.

## Git

- Every commit touches either `backend/` or `frontend/` (or root-only config), never a mix. Keep the two histories readable independently.
- Conventional-ish commit messages: `feat(backend): ...`, `chore(frontend): ...`, etc.

## Stack decisions already made (don't re-litigate without reason)

- ESM everywhere (`"type": "module"`), not CommonJS. Relative imports in backend TS files need explicit `.js` extensions (`moduleResolution: NodeNext`).
- TypeScript on both sides, strict mode on.
- Feature/module-based folder structure (`modules/auth/`, `modules/products/`, each with `.schema.ts` / `.service.ts` / `.controller.ts` / `.routes.ts`), not Laravel-style grouping by layer.
- Backend: Express 5, Postgres, Prisma 7 (requires an explicit driver adapter, e.g. `@prisma/adapter-pg` — no more Rust engine, config lives in `prisma.config.ts` not `package.json`), Zod v4 (prefer top-level `z.email()`/`z.url()` over the deprecated chained `.email()`/`.url()`), `jsonwebtoken` + `bcrypt` for auth primitives (no Passport, no full-stack framework), JWT access token (~15m, memory on frontend) + refresh token (~7d, httpOnly/Secure/SameSite=Strict cookie).
- Frontend: React 19 + Vite, TanStack Query for data fetching/caching, React Context for auth state (no Redux/Zustand needed), shadcn/ui for components, Zod for form validation.
- ESLint (flat config) + Prettier + a dedicated `typecheck` script (`tsc --noEmit` / `tsc -b`) on both sides — remember `tsx` (backend dev) and Vite (frontend dev) do NOT type-check, only `typecheck`/`build` do.
- Always verify current library majors via web search before assuming versions from training data — Ameen has asked explicitly for "latest," not "remembered."

## Build order

Repo/tooling setup → auth (register/login/refresh, JWT + bcrypt, tested via curl before touching frontend) → products CRUD + search/pagination → frontend wiring → Swagger/Postman docs, tests, Docker.
