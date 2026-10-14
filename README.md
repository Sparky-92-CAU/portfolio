# Clark Urbon Portfolio

A responsive, static portfolio site built with HTML, CSS, and JavaScript. The site includes a welcome page, resume, project gallery, and browser-based tools.

## Pages and projects

- `index.html` - Welcome page with English/Spanish text and a persistent theme control.
- `projects.html` - Arcade games, tools, and experiments.
- `resume.html` - Experience, education, certification, and skills.
- `expense-splitter.html` - Local expense tracker and 50/50 split calculator, with optional custom shares.
- `guitar-song-finder.html` - Song lookup and guitar practice frontend.
- `rest-api-learning.html` - Guided REST API lessons, a knowledge check, and a browser-based request simulator with Java Spring examples.
- `cat-store.html` - Cat-store catalog, role-based account screens, inventory tools, and PostgreSQL-backed orders.

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

GitHub Pages serves the static frontend; video lookup is provided by the Java Spring Boot API at `https://acoustic-song-finder-api.onrender.com`, configured in the `song-finder-api` meta tag in `guitar-song-finder.html`. The tab-catalog searches work without the backend. The API needs a YouTube API key supplied as the `YOUTUBE_API_KEY` environment variable. Never commit the key. The backend allows local portfolio development and the portfolio's GitHub Pages origin by default; set `CORS_ALLOWED_ORIGINS` when the frontend has a different origin.

To run the backend locally, install JDK 25 or newer and set a YouTube Data API key. The Maven wrapper downloads Maven if needed:

```powershell
$env:YOUTUBE_API_KEY = "your-key"
.\mvnw.cmd spring-boot:run
```

In a second terminal, serve the portfolio root:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/guitar-song-finder.html`. The frontend uses the local API automatically on `localhost`; the tab-catalog search links also work without the backend. The API endpoint is `GET /api/search?song=...&artist=...`.

Run the backend tests from `guitar-song-finder-api` with `.\mvnw.cmd test`.

## Deploy the API with Render

GitHub Pages hosts only the static frontend; the Java API needs its own web service. The root `render.yaml` defines a free Render service that builds the API with Docker. In Render, create a Blueprint from this repository and provide `YOUTUBE_API_KEY` when prompted. Keep the key in Render's environment settings; never add it to the repository.

The deployed service URL is configured in the `song-finder-api` meta tag in `guitar-song-finder.html`. If the service is recreated with a different URL, update the meta tag and deploy the frontend again. The backend already allows the portfolio's GitHub Pages origin by default.

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

In a second terminal, serve the portfolio:

```powershell
python -m http.server 8000
```

Open `http://localhost:8000/cat-store.html`. The page connects to the API at `http://localhost:8081`. PostgreSQL data is stored in a Docker volume and remains available after restarting the containers. Stop the containers with `docker compose --env-file cat-store-api\.env -f cat-store-api\compose.yaml down`; use `down -v` only if you intentionally want to delete the local database volume and its data.

Run the API tests (they use an isolated in-memory H2 database):

```powershell
Set-Location cat-store-api
.\mvnw.cmd test
```

### Deploy the API and database

Merging to `main` runs `.github/workflows/deploy-portfolio.yml`: GitHub Actions tests the API, builds its Docker image, and publishes the static portfolio to GitHub Pages. GitHub Pages cannot host the Java API or PostgreSQL database. The API is a separate Render web service described in the root `render.yaml`; when that Blueprint is connected to this repository, it deploys commits from `main` and checks readiness at `/api/cats`.

Before the first production deployment, create a managed PostgreSQL database with a provider such as Neon and configure the Render service variables `SPRING_DATASOURCE_URL` (a JDBC PostgreSQL URL using TLS), `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`. The admin password must be 12-72 UTF-8 bytes. Set `CORS_ALLOWED_ORIGINS` to `https://sparky-92-cau.github.io`. Never put these values in the frontend, source code, or committed files. The API runs Flyway migrations automatically when it starts.

The API URL in the `cat-store-api` meta tag in `cat-store.html` must match the Render service URL. Render's free web service may sleep when idle, so the first API request can be slow. Check provider quotas and backup/retention policies before using real data; free tiers change and are for learning, not an uptime or backup guarantee.

## Run locally

The site has no build step. From the repository root, serve the files with Python:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Using a local HTTP server also gives browser storage a consistent origin while testing the Expense Splitter.

## Deployment

The portfolio is published with GitHub Pages from the `main` branch. Pushing changes to `main` triggers the Pages build and deployment workflow.
