# Frontend Technical Guide

---

## 1. Stack overview

| Layer | Details |
|-------|---------|
| Runtime | [Nuxt 4](https://nuxt.com/) (Vue 3 / `<script setup>` / TypeScript) |
| Component kit | [`@nuxt/ui`](https://ui.nuxt.com/) (shipped as `UButton`, `UContainer`, etc.) |
| Styling | CSS variables in `assets/css`, scoped styles per component, `@nuxt/ui` design tokens |
| Icons | [`UIcon`](https://ui.nuxt.com/components/icon) backed by Iconify icon packs (`heroicons`, `logos`, `lucide`). Custom SVGs live in `public/` |
| State/data | Composition API composables instead of Vuex/Pinia (`useAuth`, `useWorkflowManagement`, etc.) |
| HTTP | `$fetch` (Nuxt wrapper around `fetch`) with tokens from cookies (`useCookie('auth-token')`) |

Environment variables (see `nuxt.config.ts`):

```ini
# Provided to Nuxt at build/runtime
BACKEND_URL=http://localhost:8080           # Internal server-to-server base URL
NUXT_PUBLIC_API_URL=http://localhost:8080   # Client-exposed URL used in $fetch
```

Overriding these in local `.env` files lets the frontend target staging/prod APIs without code changes.

---

## 2. Project structure (frontend/app)

```
assets/        Global CSS (variables, transitions)
components/    Reusable UI (split into layout/, ui/, workflow/, etc.)
composables/   Data / business logic (Auth, Workflow API, dashboards...)
layouts/       Nuxt page layouts (default nav + footer)
middleware/    Route guards (e.g. `auth.global.ts`)
pages/         Route-driven views (`/`, `/services`, `/workflow/...`)
plugins/       Nuxt plugins (auth bootstrap)
stores/        Currently unused (placeholder for Pinia if needed)
types/         Shared TS interfaces (services, workflows, etc.)
public/        Static assets served as-is (logos, favicon, screenshots)
```

Key composables you will hit:

| Composable | Responsibility |
|------------|----------------|
| `useAuth` | Authentication state, tokens, provider linking |
| `useAuthProviders` | Fetch and memoize available OAuth providers |
| `useWorkflowApi` | Low-level API calls (nodes, connections, save workflow) |
| `useWorkflowManagement` | Canvas state for workflows (blocks, connections) |
| `useCanvasManagement` | Zoom / pan helpers for the canvas |
| `useDashboard` | Aggregate KPI data for the dashboard |

`plugins/auth.client.ts` calls `useAuth().initAuth()` on app start so that tokens and the current user are restored before rendering protected routes.

---

## 3. Local development

```bash
cd frontend
npm install                 # Installs dependencies
npm run dev                 # Nuxt dev server (defaults to localhost:3000)
npm run build && npm run preview   # Production build + preview
```

Set `NUXT_PUBLIC_API_URL` and `BACKEND_URL` before running if the backend lives outside Docker (`host.docker.internal` is handy on macOS/Windows).

When using Docker only for the frontend, run:

```bash
docker compose --profile dev up frontend-dev --no-deps
```

This mounts the local `frontend/` directory into the container for hot reload.

---

## 4. Page lifecycle & layouts

- `app.vue` defines the outer layout wrapper via `<NuxtLayout />`.
- `layouts/default.vue` (not shown above) renders header/footer and `<NuxtPage />`.
- Pages (`pages/*.vue`) automatically become routes. Most use `<script setup lang="ts">` with explicit `useHead` for SEO metadata.
- Route guarding uses Nuxt middleware (`middleware/auth.global.ts` ensures auth-only routes redirect to `/login`).

---

## 5. Styling guidelines

1. Prefer CSS variables declared in `assets/css/variables.css` to keep themes consistent.
2. Use scoped styles for component-specific rules. Global adjustments go in `assets/css/main.css`.
3. For buttons, cards, modals, rely on `@nuxt/ui` primitives (`UButton`, `UCard`, `UAlert`, etc.) to stay consistent.
4. Icons: use `<UIcon name="i-heroicons-sparkles" />`. The prefix `i-` selects the Iconify pack. If a logo is missing, drop a SVG into `public/logos/` and render with `<img src="/logos/your.svg" />`.
5. Gradients / bespoke effects (glare hover) are encapsulated in helper components like `UiGlareHover.vue`.

---

## 6. Component patterns

- New components belong in `components/` (often grouped by domain: `components/workflow`, `components/layout`…).
- Use `<script setup lang="ts">` and define props with `const props = defineProps<{ ... }>()`.
- Keep components as stateless as possible; move API calls or mutations into composables.
- When a component needs to share behaviour with others, place the logic in `composables/` and import it.
- Example snippet:

```vue
<script setup lang="ts">
const props = defineProps<{ title: string; icon?: string }>()
const emit = defineEmits<{
  (e: 'click'): void
}>()
</script>

<template>
  <UCard class="my-card" @click="emit('click')">
    <div class="flex items-center gap-3">
      <UIcon v-if="props.icon" :name="props.icon" />
      <span>{{ props.title }}</span>
    </div>
  </UCard>
</template>
```

---

## 7. Workflow canvas (core feature)

The workflow editor is the most complex part of the UI. A high-level map:

```
/pages/workflow/create.vue
└─ uses useWorkflowManagement()  -> blocks, connections, saveWorkflow()
   ├─ useCanvasManagement()      -> pan/zoom/reset + DOM refs for the SVG canvas
   ├─ useWorkflowApi()           -> CRUD nodes/connections via backend
   └─ useServiceManagement()     -> modal logic for choosing triggers/actions
```

Saving an existing workflow:

1. `useWorkflowManagement.saveWorkflow()` collects blocks + connections.
2. `useWorkflowApi.saveWorkflowToBackend()` diffs current vs backend state.
3. Each new connection POST includes the `X-Skip-Trigger-Start` header so the backend doesn’t re-trigger workflows when you edit them.

The composables take care of toggling areas, re-creating nodes, and refreshing the canvas. When adding new block types or visuals:

- Update block rendering components (e.g. `components/workflow/WorkflowBlock.vue`).
- Extend `useWorkflowManagement.mapBackendNodeToBlock()` so the new node fields map correctly.
- Adjust styling in `assets/css/` if the nodes need new colors or sizes.

---

## 8. API access

All remote calls go through `$fetch` with `baseURL: backendUrl` (from runtime config). Authentication tokens are stored in cookies (`auth-token`) and automatically attached in composables like `useWorkflowApi`.

When creating new API interactions:

1. Add a function to the relevant composable (`useWorkflowApi`, `useAuth`, etc.).
2. Handle token absence (`if (!authToken.value) throw new Error(...)`).
3. Surface errors via reactive `error` refs so pages can display feedback.
4. For endpoints that mutate workflows, respect the `X-Skip-Trigger-Start` header if the action should not re-trigger workflows.

---

## 9. Adding a new component/feature

1. **Define the use-case**: Is it purely visual? Does it talk to the backend?
2. **Create the composable logic** (if needed) in `composables/`. Example pattern:
   ```ts
   export const useFoo = () => {
     const items = ref<Foo[]>([])
     const isLoading = ref(false)

     const fetchItems = async () => {
       isLoading.value = true
       try {
         items.value = await $fetch('/api/foo', { baseURL: backendUrl })
       } finally {
         isLoading.value = false
       }
     }
     return { items, isLoading, fetchItems }
   }
   ```
3. **Build the UI** in `components/` using composables for data.
4. **Integrate** into the relevant page or layout.
5. **Wire up metadata** (`useHead`) and update navigation if it’s a new page.
6. **Document** any new environment variables or backend dependencies.

---

## 11. Useful tips

- `UIcon` names map to installed icon packs: `i-heroicons-*`, `i-logos-*`, `i-lucide-*`.
- For provider logos not in Iconify, place SVGs under `public/logos/` and import them directly.
- Nuxt auto-imports composables from `composables/`, so `const { user } = useAuth()` works without explicit imports.
- `definePageMeta({ middleware: 'auth' })` is used to enforce auth on pages like `/me` and `/dashboard`.
- Global environment values (e.g. site title) are set in `nuxt.config.ts` (`app.head.title`, etc.).

---

## 12. Need help?

- **Backend integration**: Check `useWorkflowApi.ts` for existing patterns.
- **Design tokens**: refer to `assets/css/variables.css` and `@nuxt/ui` documentation.
- **Workflows**: start in `/pages/workflow/create.vue` and follow the composables chain outlined above.
- **Auth**: `useAuth.ts` plus the `auth` Nuxt plugin.
