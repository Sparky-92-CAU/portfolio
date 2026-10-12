# Clark Urbon Portfolio

A responsive, static portfolio site built with HTML, CSS, and JavaScript. The site includes a welcome page, resume, project gallery, and browser-based tools.

## Pages and projects

- `index.html` - Welcome page with English/Spanish text and a persistent theme control.
- `projects.html` - Arcade games and tools.
- `resume.html` - Experience, education, certification, and skills.
- `expense-splitter.html` - Local expense tracker and 50/50 split calculator, with optional custom shares.
- Hangman and Rock Paper Scissors are hosted as separate GitHub Pages projects and linked from the Arcade section.

## Expense Splitter

Open **Projects → Tools → Expense Splitter** to record shared purchases. Each expense includes a description, amount in USD, date, payer, and your share percentage. The share defaults to 50%; the partner's share is the remainder.

The current balance considers only unsettled expenses. A positive balance means your partner owes you; a negative balance means you owe your partner. **Mark expenses settled** archives the current expenses without removing them from settled history.

Expenses are saved in the browser's local storage on the current device. They are not uploaded or synchronized with another device. Clearing the browser's site data will remove them.

## Run locally

The site has no build step. From the repository root, serve the files with Python:

```powershell
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser. Using a local HTTP server also gives browser storage a consistent origin while testing the Expense Splitter.

## Deployment

The portfolio is published with GitHub Pages from the `main` branch. Pushing changes to `main` triggers the Pages build and deployment workflow.
