# Clark Urbon Portfolio

A responsive, static portfolio site built with HTML, CSS, and JavaScript. The site includes a welcome page, resume, project gallery, and browser-based tools.

## Pages and projects

- [index.html](website/pages/index.html) - Welcome page with English/Spanish text and a persistent theme control.
- [projects.html](website/pages/projects.html) - Arcade games, tools, and experiments.
- [resume.html](website/pages/resume.html) - Experience, education, certification, and skills.
- [expense-splitter.html](website/projects/expense-splitter/expense-splitter.html) - Local expense tracker and 50/50 split calculator, with optional custom shares.
- [guitar-song-finder.html](website/projects/guitar-song-finder/guitar-song-finder.html) - Song lookup and guitar practice frontend.
- [rest-api-learning.html](website/projects/rest-api-learning/rest-api-learning.html) - Guided REST API lessons, a knowledge check, and a browser-based request simulator with Java Spring examples.
- [cat-store.html](website/projects/cat-store/cat-store.html) - Cat-store catalog, role-based account screens, inventory tools, and PostgreSQL-backed orders.

## Repository layout

```text
website/
  pages/                       Home, projects, and resume HTML
  shared/                      Shared style.css and script.js
  assets/                      Images, logos, and documents
  projects/
    cat-store/                 Project HTML, CSS, and JavaScript together
    guitar-song-finder/
    expense-splitter/
    rest-api-learning/
cat-store-api/                 Existing Java cat-store backend
guitar-song-finder-api/        Existing Java song-finder backend
scripts/                      Static build/server and cat-store launcher
tests/                        Frontend/build/environment regression checks
dist/                         Generated public website (ignored by Git)
```

Edit frontend source under `website`, then run `npm.cmd run build`. Do not open the source HTML directly or serve `website`: its links target the published layout. The build copies pages, shared files, and project files to the top level of `dist`, preserving existing public URLs such as `/cat-store.html` and `/guitar-song-finder.html`. Assets remain at `/assets/...`. Published filenames must be unique across pages, shared files, and projects; the build rejects duplicates rather than overwriting another component. Backend paths, root environment files, and Render configuration stay in their existing locations.

## Arcade games

Both games are standalone GitHub Pages projects linked from **Projects → Arcade**:

- [Rock Paper Scissors](https://sparky-92-cau.github.io/rock-paper-scissors/) - First to five wins, with round-by-round feedback and keyboard shortcuts.
- [Hangman](https://sparky-92-cau.github.io/hangman/) - Guess the hidden word with progressive visual feedback and replayable rounds.

## Expense Splitter

Open **Projects → Tools → Expense Splitter** to record shared purchases. Each expense includes a description, amount in USD, date, payer, and your share percentage. The share defaults to 50%; the partner's share is the remainder.

The current balance considers only unsettled expenses. A positive balance means your partner owes you; a negative balance means you owe your partner. **Mark expenses settled** archives the current expenses without removing them from settled history.

Expenses are saved in the browser's local storage on the current device. They are not uploaded or synchronized with another device. Clearing the browser's site data will remove them.

## Song Lookup: Acoustic Song Finder

The Acoustic Song Finder is an interactive practice hub. Search by song title and optionally artist to find guitar lesson videos, with results prioritizing instructors such as Marty Music, JustinGuitar, and Andy Guitar. It also creates site-filtered searches for Songsterr, Ultimate Guitar, and E-Chords rather than scraping tab catalogs.

The page includes a Practice Station with an interactive metronome, tuning and capo selectors, and a chord-notes scratchpad that saves automatically in the browser.

GitHub Pages serves the static frontend; video lookup is provided by the Java Spring Boot API at `https://acoustic-song-finder-api.onrender.com`, configured in the `song-finder-api` meta tag in [guitar-song-finder.html](website/projects/guitar-song-finder/guitar-song-finder.html). The tab-catalog searches work without the backend. The API needs a YouTube API key supplied as the `YOUTUBE_API_KEY` environment variable. Never commit the key. The backend allows local portfolio development and the portfolio's GitHub Pages origin by default; set `CORS_ALLOWED_ORIGINS` when the frontend has a different origin.

To run the backend locally, install JDK 25 or newer and set a YouTube Data API key. From `guitar-song-finder-api`, run the following. The Maven wrapper downloads Maven if needed:

```powershell
$env:YOUTUBE_API_KEY = "your-key"
.\mvnw.cmd spring-boot:run
```

In a second terminal at the repository root, build and serve the public output:

```powershell
npm.cmd run build
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000/guitar-song-finder.html`. The frontend uses the local API automatically on `localhost`; the tab-catalog search links also work without the backend. The API endpoint is `GET /api/search?song=...&artist=...`.

Run the backend tests from `guitar-song-finder-api` with `.\mvnw.cmd test`.

## Deploy the API with Render

GitHub Pages hosts only the static frontend; the Java API needs its own web service. The root `render.yaml` defines a free Render service that builds the API with Docker. In Render, create a Blueprint from this repository and provide `YOUTUBE_API_KEY` when prompted. Keep the key in Render's environment settings; never add it to the repository.

The deployed service URL is configured in the `song-finder-api` meta tag in [guitar-song-finder.html](website/projects/guitar-song-finder/guitar-song-finder.html). If the service is recreated with a different URL, update the meta tag and deploy the frontend again. The backend already allows the portfolio's GitHub Pages origin by default.

Render's free web services spin down after 15 minutes without traffic. The first request after a pause can take about a minute while the API starts again.

## REST API Learning Lab

Open **Projects → Experiments → REST API Learning Lab** to study REST concepts, HTTP methods and status codes, JSON, and Java Spring controllers. Complete the guided lessons, test your understanding with the quiz, and use the request lab to create, read, update, and delete sample books. The request lab is a browser-only simulation; it does not connect to a server or send data over the network.

## Whisker & Willow Cat Store

The Cat Store is a full-stack portfolio demonstration. Its static portfolio page calls a separate Java 21 Spring Boot API. The API stores accounts, customer profiles, individual cat listings, orders, and order items in PostgreSQL using Spring Data JPA and Flyway migrations.

Customers can register, browse fictional sample listings, and place orders without payment. Placing an order locks and reserves the selected cats in one database transaction. The admin can add, edit, archive, and restore available listings; review orders; fulfill an order (marking the cats sold); or cancel an order (returning reserved cats to the catalog). Order history and the original price remain in the database. Public registration always creates a customer; the admin is created from server-side environment variables and cannot be self-registered.

The Flyway schema has five tables: `users` stores email, BCrypt password hash, and trusted role; `customers` holds the customer profile; `cats` tracks each unique listing and availability; `store_orders` records the customer, status, and total; and `order_items` stores each cat and a snapshot of its name, breed, and price at order time. Foreign keys and database constraints protect relationships and valid inventory states.

This is an educational demo, not a live animal marketplace. Its seeded cat listings are fictional. It does not collect payment or provide production features such as address/shipping management, email verification, password resets, or payment processing. The access token is kept in page memory and expires after one hour; refreshing the page signs the user out.

### Run the API and PostgreSQL locally

Install Docker Desktop, copy the example environment file, and replace its local passwords and JWT secret. The JWT secret must be Base64 that decodes to at least 32 random bytes. For example, in PowerShell:

```powershell
Copy-Item cat-store-api\.env.example cat-store-api\.env
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Put the generated Base64 value in `JWT_SECRET` in `cat-store-api\.env`. Set `POSTGRES_PASSWORD` and `SPRING_DATASOURCE_PASSWORD` to the same local database password, and replace `ADMIN_PASSWORD` with a unique password of 12-72 UTF-8 bytes. The `.env` file is ignored by Git.

Start the API and PostgreSQL:

```powershell
docker compose --env-file cat-store-api\.env -f cat-store-api\compose.yaml up --build
```

In a second terminal at the repository root, build and serve the portfolio:

```powershell
npm.cmd run build
python -m http.server 8000 --directory dist
```

Open `http://localhost:8000/cat-store.html`. The page connects to the API at `http://localhost:8081`. PostgreSQL data is stored in a Docker volume and remains available after restarting the containers. Stop the containers with `docker compose --env-file cat-store-api\.env -f cat-store-api\compose.yaml down`; use `down -v` only if you intentionally want to delete the local database volume and its data.

Run the API tests (they use an isolated in-memory H2 database):

```powershell
Set-Location cat-store-api
.\mvnw.cmd test
```

### Run the cat store against Neon Postgres

Neon is used **only for the cat store's database**. The Acoustic Song Finder is unchanged: its Java API and browser-local practice notes do not use Neon. The cat store retains its own existing Spring Security accounts, BCrypt passwords, and JWTs; it does not use Neon Auth, Functions, Object Storage, or AI Gateway.

The linked project is `noisy-frog-62188723`, branch `production`, in `org-plain-recipe-76431371`. Keep `DATABASE_URL` (pooled) and `DATABASE_URL_UNPOOLED` (direct) in root `.env.local`, or `.env` if it already exists. Both are ignored by Git. Preserve the existing `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` in `cat-store-api/.env`.

With Node.js 22+ and Java 21+, build the API, then start it from the repository root:

```powershell
Set-Location cat-store-api
.\mvnw.cmd --batch-mode --no-transfer-progress clean verify
Set-Location ..
npm.cmd run start:cat-store
```

The launcher reads those files without modifying them. It converts the Neon URLs to JDBC settings for the Java child process, retains the existing admin/JWT configuration, enforces certificate-verified TLS, and uses the pooled connection for application traffic and the direct connection for Flyway. The `neon` Spring profile creates the existing cat-store schema through Flyway in a separate `cat_store` PostgreSQL schema. This avoids touching the previously created workspace tables or other schemas. No existing local Docker data is copied automatically; switching databases does not migrate existing customer accounts/orders.

In another terminal, run `npm.cmd run build` and `npm.cmd start`, then open `http://127.0.0.1:3000/cat-store.html`. The API listens on port 8081 unless `PORT` overrides it. The launcher allows the local frontend origins on ports 3000 and 8000. Node is only a local launcher/static file server; the deployed API remains Java.

While the API is running, `npm.cmd run test:cat-store` checks the real database-backed catalog, existing admin login, protected inventory, unauthorized rejection, and browser CORS without creating customer accounts or orders. `npm.cmd test` checks the local/hosted frontend routing, static build isolation, and pooled/direct JDBC environment mapping.

The removed guitar cloud workspace is no longer part of the app. Its previously provisioned remote Function, Auth service, bucket, and tables have deliberately not been deleted; remote deletion requires separate confirmation.

### Deploy the API and database

Merging to `main` runs `.github/workflows/deploy-portfolio.yml`: GitHub Actions tests the API, builds its Docker image, and publishes the static portfolio to GitHub Pages. GitHub Pages cannot host the Java API or PostgreSQL database. The API runs as a separate Render web service, and PostgreSQL runs on a managed database provider such as Neon.

#### 1. Create the PostgreSQL database in Neon

1. Create a Neon account and project. Choose a region near the Render service's region to reduce connection latency.
2. In the Neon project, open **Connect** and select the project database and role. Copy both the pooled and direct host, database name, role/user name, and password. Use the existing linked project above rather than creating another one.
3. Keep the connection details private. Do not put them in this repository, the frontend, or a committed file.

#### 2. Create or sync the Render Blueprint

1. Open the Render Dashboard. If this repository already has a Render Blueprint, open it and sync the latest `main` branch. Otherwise select **New +** → **Blueprint**, connect this GitHub repository, select `main`, and use the root `render.yaml`.
2. The Blueprint defines both the existing song-finder API and `cat-store-api`. Review the services before applying changes so you don't accidentally create a duplicate song-finder service.
3. Open the `cat-store-api` web service in Render. It deploys commits from `main`; the Blueprint health check uses `/api/cats`.

#### 3. Configure the cat-store API environment

In the Render `cat-store-api` service, open **Environment** and set these variables. For the database URL, use the host and database name from Neon; leave the username and password in their separate variables:

| Variable | Value |
| --- | --- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://<Neon-pooled-host>/<database>?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory` |
| `SPRING_DATASOURCE_USERNAME` | Neon role/user name |
| `SPRING_DATASOURCE_PASSWORD` | Neon role password |
| `SPRING_PROFILES_ACTIVE` | `neon` (already set by the Blueprint) |
| `SPRING_FLYWAY_URL` | `jdbc:postgresql://<Neon-direct-host>/<database>?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory` |
| `JWT_SECRET` | A newly generated Base64 secret containing at least 32 random bytes |
| `ADMIN_EMAIL` | The email address you'll use for the store admin account |
| `ADMIN_PASSWORD` | A unique password of 12-72 UTF-8 bytes |
| `CORS_ALLOWED_ORIGINS` | `https://sparky-92-cau.github.io` |

For `SPRING_DATASOURCE_URL`, use the pooled host. For `SPRING_FLYWAY_URL`, use the direct host (no `-pooler`). Both JDBC URLs should end with `?sslmode=verify-full&sslfactory=org.postgresql.ssl.DefaultJavaSSLFactory`, using Java's trusted CA certificates rather than requiring a local PostgreSQL `root.crt`. Do not include the username or password in either JDBC URL. Flyway uses the datasource credentials unless `SPRING_FLYWAY_USER` and `SPRING_FLYWAY_PASSWORD` are separately set. Set these in the Render dashboard; the local launcher does not change Render's environment or deploy the service. Generate `JWT_SECRET` locally in PowerShell and paste the result directly into Render:

```powershell
$rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
$bytes = New-Object byte[] 32
$rng.GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Save the environment settings to start a deployment. The API applies its Flyway database migrations automatically during startup. Never share or commit the database password, JWT secret, or admin password.

#### 4. Verify the deployment

1. In Render, wait for the `cat-store-api` deployment and `/api/cats` health check to succeed. Check the service logs if startup fails.
2. Open `https://cat-store-api.onrender.com/api/cats`. It should return the catalog as JSON. If Render assigned a different service URL, update the `cat-store-api` meta tag in [cat-store.html](website/projects/cat-store/cat-store.html) to match and merge that change to `main`.
3. In the Neon SQL Editor, verify that Flyway created the schema tables:

   ```sql
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'cat_store'
   ORDER BY table_name;
   ```

   The application tables are `cats`, `customers`, `order_items`, `store_orders`, and `users`; `flyway_schema_history` tracks migrations.
4. Open the [cat-store page](https://sparky-92-cau.github.io/portfolio/cat-store.html), register a customer, then sign in as the configured admin to test the role-specific features.

Subsequent merges to `main` run the GitHub Actions checks and publish the portfolio; the connected Render Blueprint automatically deploys the API. A free Render web service may sleep while idle, so the first request can be slow. Check provider quotas, database retention, and backup policies before using real data; free tiers are for learning and do not guarantee uptime or backups.

## Run locally

Build the static portfolio, then serve the isolated public output:

```powershell
npm.cmd run build
npm.cmd start
```

Then open `http://127.0.0.1:3000` in a browser. Using a local HTTP server also gives browser storage a consistent origin while testing the Expense Splitter. The build does not require Neon credentials and publishes only static pages and assets, never environment files, backend source, or dependencies. GitHub Pages publishes this `dist` output. Prefer it over serving the repository root, which contains private local configuration files.

## Deployment

The portfolio is published with GitHub Pages from the `main` branch. Pushing changes to `main` triggers the Pages build and deployment workflow.
