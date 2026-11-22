# «Кухня тата» Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Статичний Astro-сайт з рецептами (категорії, теги, Pagefind-пошук) і коментарями через Supabase + вхід Google.

**Architecture:** Astro генерує HTML з Markdown-колекції `recipes`. Хелпери в `src/lib/` (чиста логіка, покрита vitest). Пошук — Pagefind, індекс будується після `astro build`. Коментарі — окремий клієнтський компонент, що говорить із Supabase напряму (RLS у базі); його збій не ламає сторінку.

**Tech Stack:** Astro (latest), TypeScript, vitest, Pagefind, @astrojs/sitemap, @astrojs/rss, @supabase/supabase-js, GitHub Pages, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-11-22-kuxniatata-recipes-design.md`

## Global Constraints

- Інтерфейс і весь UI-текст українською (`<html lang="uk">`).
- Лише Astro + звичайний TS/JS; без Svelte/React/Vue.
- Новий рецепт = один `.md` у `src/content/recipes/` + фото поруч; жодної іншої правки.
- Категорії — фіксований список: `supy` Супи, `osnovni` Основні страви, `vypichka` Випічка, `deserty` Десерти, `zakusky` Закуски, `napoi` Напої. Теги вільні.
- Поля рецепта: `title`, `description`, `image`, `category`, `tags[]`, `time` (хв), `servings`, `ingredients[]`, `cookedOn` (дата), `notes` (необов'язкове). Кроки — тіло Markdown.
- Таблиця `comments`: `id, recipe_slug, user_id, author_name, avatar_url, body, created_at`.
- Без реклами й сторонніх трекерів. Безкоштовні плани сервісів.
- Збій Supabase не повинен ламати сторінку рецепта.
- Секрети не комітяться; публічні ключі через `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`.

## Review Focus

- Рецепт без `notes` і без `tags` — сторінка рендериться без порожніх блоків.
- Категорія/тег з українськими літерами й пробілами — коректний, стабільний slug у URL.
- Невідома категорія в frontmatter — збірка падає з зрозумілою помилкою, а не створює нову категорію.
- Supabase недоступний або ключі не задані — показується «Коментарі тимчасово недоступні», рецепт повний.
- Коментар порожній або задовгий (>2000 символів) — відхиляється і в UI, і в базі.
- Незалогінений користувач бачить коментарі, але форми немає (замість неї кнопка «Увійти через Google»).
- Пошук по українській (регістр, «ї/є») знаходить рецепт за інгредієнтом.

---

### Task 1: Каркас проєкту

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `.gitignore`, `.env.example`, `src/pages/index.astro` (тимчасова), `vitest.config.ts`
- Modify: —

**Interfaces:**
- Produces: `npm run dev|build|test` скрипти; `site: 'https://kuxniatata.pp.ua'` в конфігу.

- [ ] **Step 1:** Створити Astro-проєкт у поточній папці (`npm create astro@latest . -- --template minimal --no-git --install`), зберігши `docs/` і `propos.txt`. Додати dev-залежності `vitest`; у `package.json` скрипт `"test": "vitest run"`, а `"build": "astro build && pagefind --site dist"` (pagefind встановлюється в Task 5, до того — просто `astro build`).
- [ ] **Step 2:** У `astro.config.mjs` задати `site: 'https://kuxniatata.pp.ua'`. `.gitignore`: `node_modules`, `dist`, `.astro`, `.env`. `.env.example` з двома `PUBLIC_SUPABASE_*` змінними без значень.
- [ ] **Step 3:** Запустити `npm run build`. Expected: збірка успішна, `dist/index.html` існує.
- [ ] **Step 4: Commit** `chore: scaffold astro project`

### Task 2: Колекція рецептів і хелпери

**Files:**
- Create: `src/content.config.ts`, `src/lib/categories.ts`, `src/lib/slug.ts`, `src/lib/recipes.ts`, `src/content/recipes/borsch.md`, `.../syrnyky.md`, `.../yablucnyi-pyrih.md` (з фото поруч), `tests/slug.test.ts`, `tests/recipes.test.ts`

**Interfaces:**
- Produces:
  - `CATEGORIES: Record<CategoryId, string>` і `type CategoryId = 'supy'|'osnovni'|'vypichka'|'deserty'|'zakusky'|'napoi'` (`categories.ts`)
  - `slugify(input: string): string` — нижній регістр, транслітерація кирилиці в латиницю (ї→yi, є→ye, й→y, ґ→g, ь→порожньо…), небуквено-цифрові → `-`, без дублів і країв (`slug.ts`)
  - `getAllRecipes(): Promise<RecipeEntry[]>` (сортування за `cookedOn` спадно), `getTagIndex(recipes): Map<string, {name: string; slug: string; recipes: RecipeEntry[]}>`, `groupByCategory(recipes): Map<CategoryId, RecipeEntry[]>` (`recipes.ts`)
  - Колекція `recipes` зі схемою з Global Constraints; `category` — `z.enum` від ключів `CATEGORIES`, `image` — `image()` helper, `tags` за замовчуванням `[]`, `notes` optional.

- [ ] **Step 1: Failing tests.** `tests/slug.test.ts`: `slugify('Яблучний пиріг')==='yablucnyi-pyrih'`, `slugify('  Борщ  з  м\'ясом! ')==='borsch-z-myasom'`, `slugify('')===''`. `tests/recipes.test.ts` на чистих даних: `getTagIndex` об'єднує однаковий тег із різним регістром («Швидко»/«швидко») в одну запис, `groupByCategory` ставить рецепти у правильні категорії й повертає порожній масив для категорій без рецептів.
- [ ] **Step 2:** `npm test` → FAIL (модулі не існують).
- [ ] **Step 3:** Реалізувати `slug.ts`, `categories.ts`, `recipes.ts` (чисті функції `getTagIndex`/`groupByCategory` приймають масив, без Astro-імпортів, щоб тестувалися; `getAllRecipes` обгортає `getCollection`).
- [ ] **Step 4:** `src/content.config.ts` з glob-лоадером для `src/content/recipes/**/*.md`. Додати 3 демо-рецепти (різні категорії; один без `notes`, один без `tags`), фото — невеликі згенеровані плейсхолдери.
- [ ] **Step 5:** `npm test` → PASS. Тимчасово поставити в рецепті `category: kava` і `npm run build` → має впасти з помилкою схеми; повернути назад, збірка PASS.
- [ ] **Step 6: Commit** `feat: recipes collection, categories and helpers`

### Task 3: Макет і сторінки

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/RecipeCard.astro`, `src/components/Header.astro`, `src/pages/index.astro`, `src/pages/recipes/[slug].astro`, `src/pages/category/[category].astro`, `src/pages/tag/[tag].astro`, `src/pages/404.astro`, `src/styles/global.css`

**Interfaces:**
- Consumes: хелпери з Task 2.
- Produces: `Base.astro` з пропсами `{ title: string; description: string; image?: string; canonical?: string; jsonLd?: object }` і слотом `head`; `RecipeCard.astro` з пропом `recipe: RecipeEntry`.

- [ ] **Step 1:** Реалізувати `Base.astro` (lang uk, viewport, title/description/OG/canonical, опціональний `<script type="application/ld+json">`, Header зі шляхами `/`, `/search/`), `RecipeCard`, глобальний CSS (світла адаптивна тема, мобільний пріоритет, фото на видному місці).
- [ ] **Step 2:** `index.astro`: свіжі рецепти + список категорій. `[slug].astro`: фото, час/порції/дата, інгредієнти, кроки, блок «Мої нотатки» лише якщо є `notes`, теги-посилання лише якщо вони є. Сторінки категорій і тегів через `getStaticPaths` на `slugify`. Порожні категорії не генерують сторінок і не показуються.
- [ ] **Step 3:** `npm run build`; перевірити в `dist/`: існують `recipes/borsch/index.html`, `category/<slug>/index.html`, `tag/<slug>/index.html`; сторінка рецепта без `notes` не містить «Мої нотатки».
- [ ] **Step 4:** `npm run dev`, відкрити головну й сторінку рецепта в браузері на ширині 375 px і 1280 px, перевірити, що немає горизонтального скролу.
- [ ] **Step 5: Commit** `feat: pages for recipes, categories and tags`

### Task 4: SEO, RSS, sitemap

**Files:**
- Create: `src/lib/jsonld.ts`, `src/pages/rss.xml.ts`, `tests/jsonld.test.ts`
- Modify: `astro.config.mjs` (інтеграція sitemap), `src/pages/recipes/[slug].astro`

**Interfaces:**
- Produces: `recipeJsonLd(recipe: RecipeEntry, url: string): object` — `@type: 'Recipe'` з `name, description, image, recipeIngredient, totalTime` (ISO 8601, `PT{time}M`), `recipeYield`, `datePublished`.

- [ ] **Step 1: Failing test** `tests/jsonld.test.ts`: для рецепта з `time: 90` результат має `totalTime === 'PT90M'`, `@type === 'Recipe'`, `recipeIngredient` дорівнює списку інгредієнтів.
- [ ] **Step 2:** `npm test` → FAIL; реалізувати `recipeJsonLd`; → PASS.
- [ ] **Step 3:** Підключити JSON-LD на сторінці рецепта; додати `@astrojs/sitemap` та `rss.xml.ts` (усі рецепти, дата `cookedOn`, українська мова каналу).
- [ ] **Step 4:** `npm run build`; перевірити, що `dist/sitemap-index.xml`, `dist/rss.xml` існують, а `dist/recipes/borsch/index.html` містить `application/ld+json`.
- [ ] **Step 5: Commit** `feat: seo json-ld, rss and sitemap`

### Task 5: Пошук (Pagefind)

**Files:**
- Create: `src/pages/search.astro`
- Modify: `package.json` (залежність `pagefind`, скрипт `build`), `src/pages/recipes/[slug].astro`, `src/components/Header.astro`, `src/pages/index.astro`

- [ ] **Step 1:** Додати `pagefind`; `build` = `astro build && pagefind --site dist`. Позначити на сторінці рецепта `data-pagefind-body` (лише контент рецепта, не коментарі й навігація), заголовок як `data-pagefind-meta="title"`, фото як `data-pagefind-meta="image[src]"`; решта сторінок не індексуються.
- [ ] **Step 2:** `search.astro` підключає Pagefind UI (`/pagefind/pagefind-ui.js`) з українськими підписами; поле пошуку також на головній.
- [ ] **Step 3:** `npm run build && npx astro preview`; у браузері на `/search/` пошук «буряк» (інгредієнт демо-борщу) повертає борщ, пошук «Борщ» і «борщ» дають однаковий результат; пошук слова з «ї» не падає.
- [ ] **Step 4: Commit** `feat: pagefind search`

### Task 6: Коментарі (Supabase)

**Files:**
- Create: `supabase/schema.sql`, `src/lib/comments.ts`, `src/components/Comments.astro`, `tests/comments.test.ts`
- Modify: `src/pages/recipes/[slug].astro`, `.env.example`

**Interfaces:**
- Produces:
  - `validateComment(body: string): { ok: true; body: string } | { ok: false; error: string }` — тримується (trim), порожнє → помилка, >2000 символів → помилка (`comments.ts`)
  - `loadComments(client, slug): Promise<Comment[]>`, `postComment(client, slug, body): Promise<void>`, `deleteComment(client, id): Promise<void>` — тонкі обгортки над supabase-js
  - `Comments.astro` приймає проп `slug: string`

- [ ] **Step 1: Failing tests** `tests/comments.test.ts`: `validateComment('  ')` → `ok:false`; `validateComment('a'.repeat(2001))` → `ok:false`; `validateComment('  Смачно! ')` → `{ok:true, body:'Смачно!'}`.
- [ ] **Step 2:** `npm test` → FAIL; реалізувати `validateComment`; → PASS.
- [ ] **Step 3:** `supabase/schema.sql`: таблиця `comments` (поля з Global Constraints, `body` з `check (char_length(body) between 1 and 2000)`, `user_id default auth.uid()`), RLS: select — всім; insert — authenticated і `user_id = auth.uid()`; delete — власнику коментаря. Обмеження частоти: тригер, що забороняє >1 коментаря від користувача за 30 с. `author_name`/`avatar_url` заповнюються з `user_metadata` на клієнті.
- [ ] **Step 4:** `Comments.astro`: клієнтський `<script>` створює supabase-клієнт із `PUBLIC_SUPABASE_*`; якщо ключів немає або `loadComments` кидає помилку — показати «Коментарі тимчасово недоступні», нічого більше не ламаючи. Без сесії — список + кнопка «Увійти через Google» (`signInWithOAuth({provider:'google'})`); із сесією — форма з валідацією через `validateComment`, кнопка «Вийти», кнопка «Видалити» на своїх коментарях. Текст коментарів виводити лише через `textContent` (без `innerHTML`).
- [ ] **Step 5:** Без `.env` запустити `npm run dev`: сторінка рецепта показує повідомлення про недоступність, решта рецепта на місці. Вручну перевірити в браузері.
- [ ] **Step 6:** Створити `README.md` з покроковою інструкцією для автора: створити проєкт Supabase, виконати `schema.sql`, створити Google OAuth-клієнт, вказати redirect URL Supabase, додати Site URL `https://kuxniatata.pp.ua` і `http://localhost:4321`, скопіювати ключі в `.env`. 
- [ ] **Step 7: Commit** `feat: supabase comments with google login`

### Task 7: Деплой на GitHub Pages і «пінг» Supabase

**Files:**
- Create: `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`, `.github/workflows/supabase-ping.yml`, `public/CNAME`
- Modify: `README.md`

- [ ] **Step 1:** `ci.yml`: на PR — `npm ci`, `npm test`, `npm run build` (Node 22).
- [ ] **Step 2:** `deploy.yml`: на push у `main` — `npm ci`, `npm test`, `npm run build` (із `PUBLIC_SUPABASE_URL`/`PUBLIC_SUPABASE_ANON_KEY` з repository variables), `actions/upload-pages-artifact` (`dist`), `actions/deploy-pages`; permissions `pages: write`, `id-token: write`; environment `github-pages`.
- [ ] **Step 3:** `public/CNAME` з одним рядком `kuxniatata.pp.ua`. У `astro.config.mjs` `site` лишається `https://kuxniatata.pp.ua`, `base` не задається.
- [ ] **Step 4:** `supabase-ping.yml`: cron раз на тиждень + `workflow_dispatch`; GET до `$SUPABASE_URL/rest/v1/comments?select=id&limit=1` із заголовком `apikey` з variables/secrets репозиторію.
- [ ] **Step 5:** У `README.md` додати розділ «Деплой»: у Settings → Pages обрати Source = GitHub Actions; додати repository variables `PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`; DNS у реєстратора `.pp.ua` — чотири A-записи на `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` для kuxniatata.pp.ua (і CNAME `www` → `<користувач>.github.io`, за потреби); у Settings → Pages вказати custom domain й увімкнути Enforce HTTPS. Також розділ «Як додати рецепт» (приклад frontmatter).
- [ ] **Step 4:** Локально `npm ci && npm test && npm run build` → все PASS.
- [ ] **Step 5: Commit** `ci: tests, build and supabase keepalive`

### Task 8: Фінальна перевірка

- [ ] **Step 1:** `npm test`, `npm run build` — без помилок і попереджень схеми.
- [ ] **Step 2:** `npm run preview`; пройти в браузері: головна → категорія → рецепт → тег → пошук → RSS; на ширині 375 px і 1280 px; консоль без помилок.
- [ ] **Step 3:** Прогнати Lighthouse на сторінці рецепта (Accessibility/SEO ≥ 90); виправити знахідки.
- [ ] **Step 4: Commit** `chore: final polish`
