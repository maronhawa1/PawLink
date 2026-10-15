# 🐾 PawLink

**Digital pet passports and community help for animals in need.**

PawLink is a full-stack web app where pet owners keep their pets' identity and vaccination records in one place, and anyone who finds an injured, lost or at-risk animal can report it with a photo and location so people nearby can step in and help.

**🌐 Live demo:** [paw-link-sepia.vercel.app](https://paw-link-sepia.vercel.app)
**🔌 API:** [pawlink-api.onrender.com/api/health](https://pawlink-api.onrender.com/api/health)

> The API runs on Render's free plan, which puts idle services to sleep after 15 minutes. A [cron-job.org](https://cron-job.org) job calls `/api/health` every 10 minutes to keep it awake. If the server was just redeployed, the first request can still take up to a minute.

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Redux Toolkit](https://img.shields.io/badge/Redux_Toolkit-764ABC?logo=redux&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)
![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase_Storage-3FCF8E?logo=supabase&logoColor=white)
![Leaflet](https://img.shields.io/badge/Leaflet-199900?logo=leaflet&logoColor=white)

---

## Table of Contents

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Database](#database)
- [Testing & Code Quality](#testing--code-quality)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Future Improvements](#future-improvements)
- [Team](#team)

---

## Overview

**The problem.** Pet information and vaccination records are often scattered across paper cards, clinic files and phone photos. And when someone finds an animal that is hurt, lost or in danger, they often don't know where to report it or who nearby could help.

**What PawLink does.**

- Gives every pet a **digital passport** with its details and vaccination history.
- Lets anyone **report an animal** with a type, description, photo and location on a map.
- Shows open cases on a **reports map** and list, so people can find where help is needed.
- Lets users **offer help** on a report. The reporter accepts a helper, both can post progress updates, and the case moves from `OPEN` → `IN_PROGRESS` → `RESOLVED`.

**Who it's for.**

| User                      | What they do                                                            |
| ------------------------- | ----------------------------------------------------------------------- |
| Pet owners                | Keep pet profiles, photos, microchip numbers and vaccinations organized |
| People who find an animal | Report it quickly with a location and photo                             |
| Community helpers         | Browse nearby reports, offer help and post updates                      |

---

## Screenshots

> Screenshots were taken from a local run with sample data.

### Home page

![Home page](docs/screenshots/home-page.png)

### Reports map

Reports near the user with distance and type filters, and a synced "Nearby reports" list.

![Reports map](docs/screenshots/reports-map.png)

### Report an animal

Choose the report type, describe the animal, pick the location on the map and add a photo.

![Report an animal](docs/screenshots/new-report.png)

### Dashboard

The signed-in dashboard with quick actions and the user's pets.

![Dashboard](docs/screenshots/dashboard.png)

### My pets

![My pets](docs/screenshots/my-pets.png)

### Pet passport

Pet details on the front, vaccination history, next due vaccine and medical notes on the back.

![Pet passport](docs/screenshots/pet-passport.png)

### Add a pet

![Add pet form](docs/screenshots/add-pet.png)

### Report details

Case activity timeline, progress updates and the status form for the reporter or an accepted helper.

![Report details](docs/screenshots/report-details.png)

### My activity

The user's own reports and the help offers they have made.

![My activity](docs/screenshots/my-activity.png)

### Mobile view

<img src="docs/screenshots/mobile-view.png" alt="Mobile home page" width="300">

---

## Key Features

### 🪪 Pet passport

- Add, edit and delete pets: name, species, breed, sex, color, birth date, microchip number (9–15 digits, unique), photo and medical notes.
- Each pet is visible only to its owner. All pet queries are scoped to the logged-in user.
- Pages: `client/src/pages/MyPetsPage.tsx`, `PetPassportPage.tsx`, `AddPetPage.tsx`.

### 💉 Vaccination tracking

- Record vaccine name, date given, next due date, clinic and notes.
- The passport shows the next upcoming vaccine and a "Vaccine due soon" badge.
- API: `GET/POST /api/pets/:id/vaccinations`.

### 📍 Animal reports & map

- Report types: `INJURED`, `LOST`, `FOUND`, `NEEDS_RESCUE`. Animal types: `DOG`, `CAT`, `OTHER`.
- Pick the location on a Leaflet map and optionally upload a photo.
- The reports map shows markers and a synced "Nearby reports" list, with distance (2–50 km) and type filters based on the user's location.
- Pages: `NewReportPage.tsx`, `ReportsMapPage.tsx`, `ReportDetailsPage.tsx`.

### 🤝 Offering help & case status

- Signed-in users can offer help on someone else's open report with a short message.
- The reporter accepts or declines offers. Accepting the first offer moves the report to `IN_PROGRESS` and adds a timeline entry.
- The reporter and accepted helpers can post progress updates. Only the reporter can resolve, close or reopen a report. A closed report is final.
- Helpers can withdraw their offer. Everything is listed on the **My Activity** page.

### 🖼️ Image uploads

- `POST /api/uploads/pets` and `/api/uploads/reports` upload one image to Supabase Storage and return its public URL.
- Only JPEG, PNG and WebP (checked from the file bytes, not the file name), max 5 MB, rate-limited to 30 uploads per 15 minutes.

### 🔐 Authentication

- Register and log in with email and password. Passwords are hashed with bcrypt (12 rounds).
- JWT (HS256, 1 hour) sent as `Authorization: Bearer <token>`. Login is rate-limited.
- Protected pages (`/dashboard`, `/my-pets`, `/my-activity`) redirect to login when signed out.

### ℹ️ Info pages

- `/about`: what PawLink is, its features and the team.
- `/contact`: team contact details and a contact form (front-end only for now).
- `/privacy`: what data PawLink stores and how it is protected.

---

## Technology Stack

| Layer              | Technology                                    | Role                                                  |
| ------------------ | --------------------------------------------- | ----------------------------------------------------- |
| **Frontend**       | React 19, TypeScript, Vite                    | UI and build tooling                                  |
|                    | React Router 7                                | Client-side routing                                   |
|                    | Redux Toolkit + RTK Query                     | Auth state and API data fetching/caching              |
|                    | Leaflet + React Leaflet                       | Reports map and location picker (OpenStreetMap tiles) |
| **Backend**        | Node.js, Express 5, TypeScript (`tsx` in dev) | REST API                                              |
|                    | Zod                                           | Request validation                                    |
|                    | Multer                                        | Multipart image upload handling                       |
|                    | express-rate-limit                            | Rate limits on login and uploads                      |
|                    | cors                                          | Restricts API access to the allowed client origins    |
| **Database**       | PostgreSQL (Supabase)                         | Main data store                                       |
|                    | Prisma ORM (`@prisma/orm-postgres`) + `pg`    | Schema, migrations and queries                        |
| **Authentication** | bcryptjs, jsonwebtoken                        | Password hashing and JWT tokens                       |
| **Storage**        | Supabase Storage (`@supabase/supabase-js`)    | Pet and report images                                 |
| **Deployment**     | Vercel (client, `client/vercel.json`)         | SPA hosting with rewrites to `index.html`             |
|                    | Render (server)                               | Node.js web service for the API                       |
| **Code quality**   | ESLint, TypeScript                            | Linting and type checks                               |

---

## Architecture

```mermaid
flowchart LR
    subgraph Browser
        UI["React + Redux Toolkit<br/>React Router · Leaflet"]
    end

    subgraph Server["Express API (Node.js)"]
        MW["CORS · JSON · rate limits<br/>requireAuth (JWT)"]
        R["Routes → Controllers<br/>auth · pets · reports · offers · updates · uploads"]
    end

    DB[("PostgreSQL<br/>(Supabase)")]
    ST[("Supabase Storage<br/>pawlink-images bucket")]
    OSM["OpenStreetMap tiles"]

    UI -- "HTTPS / JSON + Bearer JWT" --> MW --> R
    R -- "Prisma ORM / pg" --> DB
    R -- "image upload (service role key)" --> ST
    UI -- "public image URLs" --> ST
    UI -- "map tiles" --> OSM
```

- The client calls the API at `VITE_API_URL` + `/api`. RTK Query adds the JWT to every request.
- Each Express route uses a controller in `server/src/controllers`. Protected routes run the `requireAuth` middleware, which verifies the JWT and puts the user id in `res.locals.userId`.
- Status changes and accepting a help offer run inside a database transaction with the report row locked, so the status and its history entry are always saved together.

---

## Project Structure

```text
PawLink/
├── client/                     # React frontend (Vite)
│   ├── public/                 # Favicons and static icons
│   ├── src/
│   │   ├── api/                # RTK Query endpoints (auth, pets, reports)
│   │   ├── assets/             # Images used in the UI
│   │   ├── components/         # Shared components + landing page sections
│   │   ├── layout/             # Header, footer, public layout
│   │   ├── pages/              # One file per route
│   │   ├── services/           # fetch helpers (report details, uploads)
│   │   ├── store/              # Redux store and auth slice
│   │   ├── styles/             # CSS per page
│   │   ├── utils/              # Date helpers
│   │   ├── App.tsx             # Route definitions
│   │   └── main.tsx            # App entry
│   ├── vercel.json             # SPA rewrite rule for Vercel
│   └── package.json
├── server/                     # Express API
│   ├── migrations/             # Prisma migrations (app/) and contract snapshots
│   ├── src/
│   │   ├── config/             # pg pool and Supabase Storage client
│   │   ├── controllers/        # Request handlers and business rules
│   │   ├── middleware/         # requireAuth (JWT)
│   │   ├── prisma/             # contract.prisma (schema) and db client
│   │   ├── routes/             # Express routers
│   │   ├── scripts/            # setup-storage.ts
│   │   ├── app.ts              # Express app, CORS, route mounting
│   │   └── server.ts           # Starts the HTTP server
│   ├── prisma.config.ts
│   ├── .env.example
│   └── package.json
└── README.md
```

---

## Prerequisites

- **Node.js 22.18 or newer** (Prisma 8 needs it) and npm- **PostgreSQL** database. The team uses Supabase, but any PostgreSQL works for local development.
- **Supabase project** with Storage (optional, only needed for image uploads)
- Git

---

## Installation & Setup

### 1. Clone the repository

```bash
git clone https://github.com/maronhawa1/PawLink.git
cd PawLink
```

### 2. Set up the server

```bash
cd server
npm install
cp .env.example .env        # Windows PowerShell: copy .env.example .env
```

Fill in `server/.env` (see [Environment Variables](#environment-variables)). At minimum set `DATABASE_URL` and `JWT_SECRET`.

Create the database tables:

```bash
npx prisma db migrate
```

(Optional) Create the image bucket in Supabase Storage:

```bash
npm run storage:setup
```

Start the API:

```bash
npm run dev
```

The API runs on `http://localhost:5001`. Check it at `http://localhost:5001/api/health`.

### 3. Set up the client

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open `http://localhost:5173`.

---

## Environment Variables

### Server (`server/.env`)

| Variable                    | Required    | Description                                                                                                                      | Example                                             |
| --------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `DATABASE_URL`              | ✅          | PostgreSQL connection string                                                                                                     | `postgresql://user:password@localhost:5432/pawlink` |
| `JWT_SECRET`                | ✅          | Secret for signing JWTs, **at least 32 characters**. The server won't start without it. Generate one with `openssl rand -hex 32` | `your-random-64-char-hex`                           |
| `PORT`                      | –           | API port (default `5001`)                                                                                                        | `5001`                                              |
| `CLIENT_ORIGINS`            | –           | Comma-separated list of allowed frontend origins for CORS (default `http://localhost:5173`)                                      | `http://localhost:5173,https://your-app.vercel.app` |
| `SUPABASE_URL`              | for uploads | Supabase project URL                                                                                                             | `https://your-project-ref.supabase.co`              |
| `SUPABASE_SERVICE_ROLE_KEY` | for uploads | Supabase service role key. **Secret: keep it on the server only**                                                                | –                                                   |
| `SUPABASE_STORAGE_BUCKET`   | –           | Storage bucket name (default `pawlink-images`)                                                                                   | `pawlink-images`                                    |

If the Supabase variables are missing, the server still starts and upload requests return `503 Image uploads are not configured`.

### Client (`client/.env`, optional)

| Variable       | Required | Description                         | Default                 |
| -------------- | -------- | ----------------------------------- | ----------------------- |
| `VITE_API_URL` | –        | Base URL of the API, without `/api` | `http://localhost:5001` |

---

## Usage

1. **Sign up** at `/register`, then **log in** at `/login`. You land on the dashboard.
2. **Add a pet**: go to **My pets → + Add Pet**, fill in the details and optionally upload a photo.
3. **Track vaccinations**: open a pet's passport and click **+ Add vaccination**.
4. **Report an animal**: click **Report an animal**, choose the type, describe it, pick the location on the map and optionally add a photo.
5. **Find cases**: open **Reports map** to see reports near you and filter them by distance and type.
6. **Offer help**: open a report and send a help offer.
7. **Manage a case**: as the reporter, accept or decline offers, post updates and change the status. Accepted helpers can post updates too.
8. **Track everything** on **My Activity**: your reports and the help offers you've made.

---

## API Reference

Base URL: `http://localhost:5001/api`. 🔒 = needs the `Authorization: Bearer <token>` header.

### Health

| Method | Path      | Description                |
| ------ | --------- | -------------------------- |
| GET    | `/health` | Returns `{ status: "ok" }` |

### Auth

| Method | Path             | Description                                                                                        |
| ------ | ---------------- | -------------------------------------------------------------------------------------------------- |
| POST   | `/auth/register` | `{ name, email, password }` (password ≥ 8 chars) → `201 { message, user }` · `409` if email exists |
| POST   | `/auth/login`    | `{ email, password }` → `200 { message, token, user }` · `401` invalid credentials                 |

### Pets 🔒

| Method | Path                     | Description                                               |
| ------ | ------------------------ | --------------------------------------------------------- |
| GET    | `/pets`                  | List the current user's pets                              |
| POST   | `/pets`                  | Create a pet (`name`, `species` required)                 |
| GET    | `/pets/:id`              | Get one of your pets                                      |
| PATCH  | `/pets/:id`              | Update one of your pets                                   |
| DELETE | `/pets/:id`              | Delete one of your pets                                   |
| GET    | `/pets/:id/vaccinations` | List vaccinations (newest first)                          |
| POST   | `/pets/:id/vaccinations` | `{ name, vaccinatedAt, nextDueAt?, clinicName?, notes? }` |

### Reports

| Method | Path                      | Description                                                                                  |
| ------ | ------------------------- | -------------------------------------------------------------------------------------------- |
| GET    | `/reports`                | Public list. Query: `limit` (1–100, default 50), `offset`, `type`, `status`                  |
| GET    | `/reports/mine` 🔒        | Reports created by the current user                                                          |
| POST   | `/reports` 🔒             | `{ title, description, type, animalType?, photoUrl?, locationText?, latitude?, longitude? }` |
| GET    | `/reports/:id`            | Public. Report details plus full status history                                              |
| PATCH  | `/reports/:id/status` 🔒  | `{ status, message? }`. Reporter or accepted helper, with transition rules                   |
| GET    | `/reports/:id/updates` 🔒 | Progress updates (oldest first)                                                              |
| POST   | `/reports/:id/updates` 🔒 | `{ message }`. Reporter or accepted helper                                                   |

**Status rules:**

| From          | Reporter can change to              | Accepted helper can change to |
| ------------- | ----------------------------------- | ----------------------------- |
| `OPEN`        | `IN_PROGRESS`, `RESOLVED`, `CLOSED` | `IN_PROGRESS`                 |
| `IN_PROGRESS` | `OPEN`, `RESOLVED`, `CLOSED`        | –                             |
| `RESOLVED`    | `OPEN` (reopen)                     | –                             |
| `CLOSED`      | – (final)                           | –                             |

### Help offers 🔒

| Method | Path                                | Description                                                             |
| ------ | ----------------------------------- | ----------------------------------------------------------------------- |
| POST   | `/reports/:id/offers`               | `{ message }`. Offer help on someone else's `OPEN`/`IN_PROGRESS` report |
| GET    | `/reports/:id/offers`               | Offers on a report (reporter only)                                      |
| PATCH  | `/reports/:id/offers/:offerId`      | `{ status: "ACCEPTED" \| "DECLINED" }` (reporter only)                  |
| GET    | `/reports/offers/mine`              | Offers made by the current user                                         |
| PATCH  | `/reports/offers/:offerId/withdraw` | Withdraw your own offer                                                 |

### Uploads 🔒

| Method | Path                                 | Description                                                                                       |
| ------ | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| POST   | `/uploads/pets` · `/uploads/reports` | `multipart/form-data` with one file in the `image` field → `201 { url, path, contentType, size }` |

Upload errors: `413` file larger than 5 MB · `415` not JPEG/PNG/WebP · `429` too many uploads · `503` storage not configured.

---

## Database

PostgreSQL, managed with Prisma ORM. The schema is in [`server/src/prisma/contract.prisma`](server/src/prisma/contract.prisma) and the migrations are in [`server/migrations/app`](server/migrations/app).

```mermaid
erDiagram
    User ||--o{ Pet : owns
    User ||--o{ Report : creates
    User ||--o{ HelpOffer : makes
    User ||--o{ ReportUpdate : writes
    Pet ||--o{ Vaccination : has
    Report ||--o{ ReportUpdate : has
    Report ||--o{ HelpOffer : receives

    User {
        int id PK
        string email UK
        string passwordHash
        string name
    }
    Pet {
        int id PK
        int ownerId FK
        string name
        string species
        string breed
        date birthDate
        string microchipNumber UK
        string photoUrl
    }
    Vaccination {
        int id PK
        int petId FK
        string name
        date vaccinatedAt
        date nextDueAt
        string clinicName
    }
    Report {
        int id PK
        int reporterId FK
        string title
        string type
        string status
        float latitude
        float longitude
        string photoUrl
    }
    ReportUpdate {
        int id PK
        int reportId FK
        int authorId FK
        string status
        string message
    }
    HelpOffer {
        int id PK
        int reportId FK
        int volunteerId FK
        string status
        string message
    }
```

| Enum              | Values                                         |
| ----------------- | ---------------------------------------------- |
| `PetSpecies`      | `DOG`, `CAT`, `OTHER`                          |
| `PetSex`          | `MALE`, `FEMALE`, `UNKNOWN`                    |
| `ReportType`      | `INJURED`, `LOST`, `FOUND`, `NEEDS_RESCUE`     |
| `ReportStatus`    | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`    |
| `HelpOfferStatus` | `PENDING`, `ACCEPTED`, `DECLINED`, `WITHDRAWN` |

Apply migrations with:

```bash
cd server
npx prisma db migrate
```

---

## Testing & Code Quality

There are no automated tests in the project yet (`npm test` in `server/` is a placeholder).

Available checks:

```bash
# client
cd client
npm run lint      # ESLint
npm run build     # TypeScript check + production build

# server
cd server
npm run build     # TypeScript compile to dist/
```

---

## Deployment

**Client (Vercel).** Deploy the `client/` folder as a Vite project. `client/vercel.json` sends every route to `index.html` so React Router works on page refresh. Set `VITE_API_URL` to the deployed API URL.

**Server (Render).** The API runs as a Render web service with root directory `server`, build command `npm install && npm run build` and start command `npm start`. Every merge into `main` redeploys the client and the server automatically. A cron-job.org job pings `https://pawlink-api.onrender.com/api/health` every 10 minutes so the free Render instance does not go to sleep.

Live URLs:

| Part   | URL                               |
| ------ | --------------------------------- |
| Client | https://paw-link-sepia.vercel.app |
| API    | https://pawlink-api.onrender.com  |

To run the production build yourself:

```bash
cd server
npm install
npm run build
npm start         # runs node dist/server.js
```

Set all the server environment variables on the host, and add the deployed client URL to `CLIENT_ORIGINS`. The app uses `trust proxy`, so rate limits use the real client IP when it runs behind a hosting proxy.

---

## Troubleshooting

| Problem                                                                               | Fix                                                                                                 |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Server exits with `JWT_SECRET must be set in server/.env`                             | Set `JWT_SECRET` to a value of at least 32 characters                                               |
| `npm ci` fails in `server/` with "package.json and package-lock.json are not in sync" | Use `npm install` instead                                                                           |
| Browser shows a CORS error                                                            | Add the client URL (for example `http://localhost:5173`) to `CLIENT_ORIGINS` and restart the server |
| Uploads return `503 Image uploads are not configured`                                 | Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, then run `npm run storage:setup`                |
| Client can't reach the API                                                            | Make sure the server is running on port 5001, or set `VITE_API_URL` in `client/.env`                |
| `401 Invalid or expired token`                                                        | Tokens expire after 1 hour. Log in again                                                            |
| Refreshing a page on the deployed site gives a 404                                    | Make sure `client/vercel.json` is deployed with the client                                          |

---

## Contributing

The team works with feature branches and pull requests into `develop`. `develop` is merged into `main` for releases.

```bash
git checkout develop
git pull origin develop
git checkout -b feature/your-feature
# make your changes
cd client && npm run lint && npm run build
git add <files>
git commit -m "feat: short description"
git push -u origin feature/your-feature
```

Then open a pull request into `develop`. Commit messages follow the `feat:` / `fix:` / `style:` / `chore:` / `refactor:` format.

Every pull request is reviewed by a teammate before merging, and also gets an automatic review from [CodeRabbit](https://coderabbit.ai). We fixed the issues it found, such as cache invalidation after deleting a pet and scoping pet updates to the owner.

---

## Future Improvements

- Password reset by email
- Notifications when someone offers help on a report
- Search reports by distance on the server instead of in the browser
- Automated API tests

---

## Team

PawLink was built as the final project of the NewTech Full Stack course (2026) by:

| Name        | GitHub                                         | Main work                                                                                                                                 |
| ----------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Maron Hawa  | [@maronhawa1](https://github.com/maronhawa1)   | Landing page, login, Redux setup, reports map, pets API, My Pets, pet passport, editing and deleting pets, server controllers, deployment |
| Misk Naser  | [@MiskNaser-5](https://github.com/MiskNaser-5) | Registration, dashboard, add pet form, report form, help offers, My Activity, nearby reports map, responsive design                       |
| Ward Salama | [@wardsa10](https://github.com/wardsa10)       | Auth API, vaccinations API, report status and updates, report details page, image uploads, About, Contact and Privacy pages, README       |

Repository: [github.com/maronhawa1/PawLink](https://github.com/maronhawa1/PawLink)
