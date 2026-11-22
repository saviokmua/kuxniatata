# Кухня тата

Сайт із рецептами, які я приготував і спробував: [kuxniatata.pp.ua](https://kuxniatata.pp.ua).
Astro + Markdown, пошук Pagefind, коментарі на Supabase з входом через Google.

## Розробка

Потрібен Node.js ≥ 22.23.4 (див. `.node-version`).

```sh
npm install
npm run dev      # http://localhost:4321 (пошук працює лише після npm run build)
npm test         # тести
npm run build    # збірка в dist/ + індекс пошуку
npm run preview  # перегляд збірки
```

## Як додати рецепт

Створіть файл `src/content/recipes/<назва-латиницею>.md` і покладіть поруч фото (`.jpg`/`.png`/`.webp`).
Назва файлу стає адресою: `/recipes/<назва-латиницею>/`.

```md
---
title: Борщ з яловичиною
description: Класичний червоний борщ.
image: ./borsch.jpg
category: supy            # supy | osnovni | vypichka | deserty | zakusky | napoi
tags: [Українська кухня, Обід]   # необов'язково
time: 150                 # хвилин
servings: 6
cookedOn: 2026-10-12
ingredients:
  - Яловичина на кістці — 600 г
  - Буряк — 2 шт.
notes: Що вийшло і що змінити наступного разу.   # необов'язково
---

1. Перший крок.
2. Другий крок.
```

Нова категорія: додайте її в `src/lib/categories.ts`.

## Коментарі (одноразове налаштування)

Коментарі зберігаються в Supabase, вхід через Google. Без налаштування сайт працює, а замість коментарів
показується «Коментарі тимчасово недоступні».

1. Створіть безкоштовний проєкт на [supabase.com](https://supabase.com).
2. У **SQL Editor** виконайте вміст `supabase/schema.sql`.
3. Створіть OAuth-клієнт Google: [Google Cloud Console](https://console.cloud.google.com) → *APIs & Services* → *Credentials* → *Create credentials* → *OAuth client ID* (тип *Web application*).
   У *Authorized redirect URIs* вкажіть адресу з Supabase: *Authentication → Providers → Google* (вигляд `https://<id>.supabase.co/auth/v1/callback`).
4. У Supabase → *Authentication → Providers → Google* увімкніть провайдера й вставте Client ID та Client Secret.
5. У Supabase → *Authentication → URL Configuration*: **Site URL** = `https://kuxniatata.pp.ua`, у **Redirect URLs** додайте
   `https://kuxniatata.pp.ua/**` і `http://localhost:4321/**`.
6. Скопіюйте з *Project Settings → API* значення **Project URL** і **anon public key** у файл `.env` (за зразком `.env.example`).
   Це публічні ключі: безпеку забезпечують правила доступу в базі (RLS), а не секретність ключа.

Видалити будь-який коментар може власник сайту через Supabase → *Table Editor → comments*.
Автор може видалити лише свій коментар. Ім'я й аватар беруться з профілю Google на боці бази; частота — не більше одного коментаря на 30 секунд.

## Деплой (GitHub Pages)

Сайт збирається й публікується GitHub Actions при кожному push у `main` (`.github/workflows/deploy.yml`).

1. У репозиторії: **Settings → Pages → Source = GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: додайте `PUBLIC_SUPABASE_URL` і `PUBLIC_SUPABASE_ANON_KEY`
   (це публічні значення, тому *Variables*, а не *Secrets*).
3. Домен: у реєстратора `.pp.ua` створіть для `kuxniatata.pp.ua` чотири A-записи:
   `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`.
   Файл `public/CNAME` уже містить домен. Після перевірки DNS у **Settings → Pages** увімкніть **Enforce HTTPS**.
4. Щотижневий workflow `supabase-ping.yml` робить запит до Supabase, щоб безкоштовний проєкт не «засинав».
