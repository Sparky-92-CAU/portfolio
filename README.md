# Clark Urbon Portfolio

A responsive, static portfolio site built with HTML, CSS, and JavaScript. The site includes a welcome page, resume, project gallery, and browser-based tools.

## Pages and projects

- `index.html` - Welcome page with English/Spanish text and a persistent theme control.
- `projects.html` - Arcade games, tools, and experiments.
- `resume.html` - Experience, education, certification, and skills.
- `expense-splitter.html` - Local expense tracker and 50/50 split calculator, with optional custom shares.
- `guitar-song-finder.html` - Song lookup and guitar practice frontend.

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

## Run locally

The site has no build step. From the repository root, serve the files with Python:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Using a local HTTP server also gives browser storage a consistent origin while testing the Expense Splitter.

## Deployment

The portfolio is published with GitHub Pages from the `main` branch. Pushing changes to `main` triggers the Pages build and deployment workflow.
