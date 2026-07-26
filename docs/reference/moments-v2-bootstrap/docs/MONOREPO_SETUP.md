# Monorepo Setup Guide

## Prerequisites
- Node.js >= 20
- pnpm >= 9
- Supabase CLI
- Git

---

## Step 1 — Scaffold Monorepo

```bash
npx create-turbo@latest moments-v2 --package-manager pnpm
cd moments-v2

# Remove default apps, we'll create our own
rm -rf apps/web apps/docs
```

## Step 2 — Create Apps

```bash
# Admin dashboard
pnpm create next-app apps/admin \
  --typescript --tailwind --app --src-dir --no-git --import-alias "@/*"

# Public PWA
pnpm create next-app apps/web \
  --typescript --tailwind --app --src-dir --no-git --import-alias "@/*"
```

## Step 3 — Init shadcn in Admin

```bash
cd apps/admin
npx shadcn@latest init
# ✔ Style: New York
# ✔ Base color: Zinc
# ✔ CSS variables: yes

# Add all components needed upfront
npx shadcn@latest add sidebar-07 data-table chart form dialog sheet \
  badge card tabs select calendar popover toast alert progress avatar \
  dropdown-menu command input label textarea button separator skeleton \
  table pagination switch tooltip

cd ../..
```

## Step 4 — Create Shared Packages

```bash
# Types package
mkdir -p packages/types/src
cat > packages/types/package.json << 'EOF'
{
  "name": "@moments/types",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" }
}
EOF

# Validators package
mkdir -p packages/validators/src
cat > packages/validators/package.json << 'EOF'
{
  "name": "@moments/validators",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": { "zod": "^3.22.0" }
}
EOF

# DB package
mkdir -p packages/db/src
cat > packages/db/package.json << 'EOF'
{
  "name": "@moments/db",
  "version": "0.0.1",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": { ".": "./src/index.ts" },
  "dependencies": {
    "@supabase/supabase-js": "^2.39.0",
    "drizzle-orm": "^0.29.0"
  }
}
EOF
```

## Step 5 — Configure Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "test": {}
  }
}
```

## Step 6 — Root package.json

```json
{
  "name": "moments-v2",
  "private": true,
  "scripts": {
    "dev": "turbo dev",
    "build": "turbo build",
    "lint": "turbo lint",
    "typecheck": "turbo typecheck",
    "test": "turbo test",
    "db:push": "supabase db push",
    "functions:deploy": "supabase functions deploy"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.3.0"
  },
  "packageManager": "pnpm@9.0.0"
}
```

## Step 7 — Add Packages to Apps

```bash
# Admin app dependencies
cd apps/admin
pnpm add @moments/types @moments/validators @moments/db
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add swr zod react-hook-form @hookform/resolvers
pnpm add @tanstack/react-table
pnpm add recharts
pnpm add date-fns
pnpm add lucide-react  # already added by shadcn

# Web app dependencies
cd ../web
pnpm add @moments/types @moments/validators
pnpm add @supabase/supabase-js @supabase/ssr
pnpm add swr

cd ../..
```

## Step 8 — Supabase Init

```bash
supabase init
supabase link --project-ref <your-project-ref>
```

## Step 9 — Environment Files

```bash
# Root .env.example (committed)
cp docs/ENVIRONMENT.md .env.example  # use as reference

# App-specific (not committed)
cp .env.example apps/admin/.env.local
cp .env.example apps/web/.env.local
# Fill in values
```

## Step 10 — First Run

```bash
pnpm install
pnpm dev
# Admin: http://localhost:3001
# Web:   http://localhost:3000
```

---

## Port Configuration

```
apps/admin  → port 3001
apps/web    → port 3000
```

Set in each app's package.json:
```json
"dev": "next dev --port 3001"  // admin
"dev": "next dev --port 3000"  // web
```

---

## TypeScript Config

Root `tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "skipLibCheck": true
  }
}
```

Each app extends root:
```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

---

## Deployment

### Admin + Web → Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy admin
cd apps/admin && vercel --prod

# Deploy web
cd apps/web && vercel --prod
```

Vercel project settings:
- Framework: Next.js
- Root directory: apps/admin (or apps/web)
- Build command: cd ../.. && pnpm build --filter=admin
- Install command: pnpm install

### Edge Functions → Supabase
```bash
supabase functions deploy webhook --no-verify-jwt
supabase functions deploy admin-api
supabase functions deploy broadcast-processor
supabase functions deploy mcp-advisory
```

Note: webhook uses `--no-verify-jwt` because Meta sends requests without JWT.

---

## GitHub Actions

### CI (`.github/workflows/ci.yml`)
Triggers: pull_request
Steps: pnpm install → lint → typecheck → test

### Deploy (`.github/workflows/deploy.yml`)
Triggers: push to main
Steps: pnpm install → build → deploy to Vercel + Supabase functions

### Migrate (`.github/workflows/migrate.yml`)
Triggers: push tag v*
Steps: supabase db push (applies new migrations)
