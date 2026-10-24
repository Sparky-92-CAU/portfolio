const searchForm = document.querySelector("#song-search-form");
const songTitleInput = document.querySelector("#song-title");
const artistInput = document.querySelector("#song-artist");
const searchButton = document.querySelector("#song-search-button");
const statusMessage = document.querySelector("#song-finder-status");
const resultsContainer = document.querySelector("#song-finder-results");
const videoResults = document.querySelector("#song-video-results");
const tabResults = document.querySelector("#song-tab-results");

// Practice Station elements
const practiceStation = document.querySelector("#practice-station");
const practiceVideoIframe = document.querySelector("#practice-video-iframe");
const practiceVideoTitle = document.querySelector("#practice-video-title");
const stationCloseBtn = document.querySelector("#station-close-btn");
const chordChipsBar = document.querySelector("#chord-chips-bar");
const activeChordName = document.querySelector("#active-chord-name");
const activeChordInfo = document.querySelector("#active-chord-info");
const fretboardSvgWrapper = document.querySelector("#fretboard-svg-wrapper");
const practiceNotes = document.querySelector("#practice-notes");
const notesSavedIndicator = document.querySelector("#notes-saved-indicator");

let currentSongKey = "";
let currentSongChords = [];

const configuredApiUrl =
  document.querySelector('meta[name="song-finder-api"]')?.content.trim() || "";
const isLocalHost = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const apiBaseUrl = (configuredApiUrl || (isLocalHost ? "http://localhost:8080" : ""))
  .replace(/\/$/, "");

const tabSources = [
  { name: "Songsterr", domain: "songsterr.com", detail: "Interactive guitar tablature" },
  { name: "Ultimate Guitar", domain: "ultimate-guitar.com", detail: "Tabs and chord sheets" },
  { name: "E-Chords", domain: "e-chords.com", detail: "Guitar chords and tabs" },
];

function setStatus(message, state = "info") {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
  statusMessage.hidden = message.length === 0;
}

function makeTabSearchUrl(source, song, artist) {
  const searchTerms = [artist, song, "guitar tab"].filter(Boolean).join(" ");
  const query = `site:${source.domain} ${searchTerms}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function showTabSearches(song, artist) {
  tabResults.replaceChildren();

  for (const source of tabSources) {
    const card = document.createElement("article");
    card.className = "song-tab-card";

    const link = document.createElement("a");
    link.className = "song-tab-link";
    link.href = makeTabSearchUrl(source, song, artist);
    link.target = "_blank";
    link.rel = "noopener noreferrer";

    const name = document.createElement("strong");
    name.textContent = source.name;

    const detail = document.createElement("p");
    detail.textContent = source.detail;

    const action = document.createElement("span");
    action.textContent = "Search this catalog ↗";

    link.append(name, detail, action);
    card.append(link);
    tabResults.append(card);
  }
}

function openPracticeStation(video) {
  const originParam = window.location.origin ? `&origin=${encodeURIComponent(window.location.origin)}` : "";
  practiceVideoIframe.src = `https://www.youtube.com/embed/${encodeURIComponent(video.videoId)}?autoplay=1&rel=0${originParam}`;
  practiceVideoTitle.textContent = video.title;
  practiceStation.hidden = false;
  practiceStation.scrollIntoView({ behavior: "smooth", block: "start" });
}

function closePracticeStation() {
  practiceVideoIframe.src = "";
  practiceVideoTitle.textContent = "";
  practiceStation.hidden = true;
}

stationCloseBtn?.addEventListener("click", closePracticeStation);

function clearPracticeStation() {
  closePracticeStation();
  chordChipsBar.replaceChildren();
  fretboardSvgWrapper.innerHTML = "";
  activeChordName.textContent = "";
  activeChordInfo.textContent = "";
  if (practiceNotes) {
    practiceNotes.value = "";
  }
}

/* SVG Guitar Chord Diagram Generator */
function renderChordDiagram(chord) {
  if (!chord || !chord.fretString) return;

  activeChordName.textContent = chord.name;
  const baseFret = chord.baseFret || 1;
  activeChordInfo.textContent = baseFret > 1 ? `Starting at Fret ${baseFret}` : "Open Position (Fret 1)";

  // Parse strings and fingering: 6 characters representing E A D G B e
  // fretString: e.g. "x32010"
  // fingering: e.g. "032010"
  const frets = chord.fretString.toLowerCase().split("");
  const fingers = (chord.fingering || "000000").split("");

  const width = 180;
  const height = 190;
  const startX = 35;
  const startY = 40;
  const stringSpacing = 22;
  const fretSpacing = 26;
  const numStrings = 6;
  const numFrets = 4;

  let svg = `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-label="Chord diagram for ${chord.name}">`;

  // Draw Nut or Base Fret Marker
  if (baseFret === 1) {
    svg += `<line x1="${startX}" y1="${startY}" x2="${startX + (numStrings - 1) * stringSpacing}" y2="${startY}" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>`;
  } else {
    svg += `<line x1="${startX}" y1="${startY}" x2="${startX + (numStrings - 1) * stringSpacing}" y2="${startY}" stroke="currentColor" stroke-width="2"/>`;
    svg += `<text x="${startX - 18}" y="${startY + 18}" fill="currentColor" font-size="12" font-weight="700">${baseFret}fr</text>`;
  }

  // Draw Frets (horizontal lines)
  for (let f = 1; f <= numFrets; f++) {
    const y = startY + f * fretSpacing;
    svg += `<line x1="${startX}" y1="${y}" x2="${startX + (numStrings - 1) * stringSpacing}" y2="${y}" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>`;
  }

  // Draw Strings (vertical lines)
  for (let s = 0; s < numStrings; s++) {
    const x = startX + s * stringSpacing;
    svg += `<line x1="${x}" y1="${startY}" x2="${x}" y2="${startY + numFrets * fretSpacing}" stroke="currentColor" stroke-width="1.2" opacity="0.4"/>`;
  }

  // String markers (top) & dots
  frets.forEach((fVal, sIdx) => {
    const x = startX + sIdx * stringSpacing;
    const finger = fingers[sIdx] || "0";

    if (fVal === "x") {
      // Muted string
      svg += `<text x="${x}" y="${startY - 10}" text-anchor="middle" fill="currentColor" font-size="13" font-weight="bold" opacity="0.65">✕</text>`;
    } else if (fVal === "0") {
      // Open string
      svg += `<circle cx="${x}" cy="${startY - 13}" r="4.5" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.8"/>`;
    } else {
      // Fretted note
      const fretNum = parseInt(fVal, 10);
      const relativeFret = fretNum - baseFret + 1;
      if (relativeFret >= 1 && relativeFret <= numFrets) {
        const y = startY + relativeFret * fretSpacing - fretSpacing / 2;
        // Dot
        svg += `<circle cx="${x}" cy="${y}" r="8" fill="var(--home-accent, #0e7490)"/>`;
        // Finger number inside dot
        if (finger && finger !== "0") {
          svg += `<text x="${x}" y="${y + 3.8}" text-anchor="middle" fill="#ffffff" font-size="10" font-weight="700">${finger}</text>`;
        }
      }
    }
  });

  // String names at bottom (E A D G B e)
  const stringNames = ["E", "A", "D", "G", "B", "e"];
  stringNames.forEach((sName, sIdx) => {
    const x = startX + sIdx * stringSpacing;
    svg += `<text x="${x}" y="${startY + numFrets * fretSpacing + 18}" text-anchor="middle" fill="currentColor" font-size="10" opacity="0.6">${sName}</text>`;
  });

  svg += `</svg>`;
  fretboardSvgWrapper.innerHTML = svg;
}

function updateChordChips(chords) {
  chordChipsBar.replaceChildren();
  currentSongChords = chords || [];

  if (currentSongChords.length === 0) {
    chordChipsBar.innerHTML = `<span style="font-size: 0.8rem; color: var(--home-muted);">No chords detected</span>`;
    fretboardSvgWrapper.innerHTML = "";
    activeChordName.textContent = "—";
    activeChordInfo.textContent = "No chord data available";
    return;
  }

  currentSongChords.forEach((chord, idx) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = `chord-chip ${idx === 0 ? "active" : ""}`;
    chip.textContent = chord.name;
    chip.addEventListener("click", () => {
      document.querySelectorAll(".chord-chip").forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      renderChordDiagram(chord);
    });
    chordChipsBar.append(chip);
  });

  // Render first chord by default
  renderChordDiagram(currentSongChords[0]);
}

/* Local Storage for Song Notes */
function loadSongPracticeData(songKey) {
  if (!songKey) return;
  try {
    const saved = localStorage.getItem(`song_notes_${songKey}`);
    if (practiceNotes) practiceNotes.value = saved || "";
  } catch (err) {
    console.warn("Could not read practice notes from storage", err);
  }
}

function saveSongPracticeData() {
  if (!currentSongKey) return;
  try {
    localStorage.setItem(`song_notes_${currentSongKey}`, practiceNotes?.value || "");
    if (notesSavedIndicator) {
      notesSavedIndicator.textContent = "Saved";
      setTimeout(() => {
        notesSavedIndicator.textContent = "Saved locally";
      }, 1500);
    }
  } catch (err) {
    console.warn("Could not save practice notes to storage", err);
  }
}

practiceNotes?.addEventListener("input", saveSongPracticeData);

function makeVideoCard(video) {
  const card = document.createElement("article");
  card.className = "song-video-card";

  const thumbnailContainer = document.createElement("div");
  thumbnailContainer.className = "song-video-thumbnail-container";

  if (video.thumbnailUrl) {
    const image = document.createElement("img");
    image.className = "song-video-thumbnail";
    image.src = video.thumbnailUrl;
    image.alt = "";
    image.loading = "lazy";
    thumbnailContainer.append(image);
  }

  if (video.trustedInstructor) {
    const badge = document.createElement("span");
    badge.className = "trusted-badge";
    badge.innerHTML = "★ Verified Instructor";
    thumbnailContainer.append(badge);
  }

  const copy = document.createElement("div");
  copy.className = "song-video-copy";

  const title = document.createElement("h3");
  title.textContent = video.title;

  const channel = document.createElement("p");
  channel.textContent = video.channelTitle;

  copy.append(title, channel);

  // Actions bar: Practice in Studio + Open in YouTube
  const actions = document.createElement("div");
  actions.className = "song-video-actions";

  const playBtn = document.createElement("button");
  playBtn.type = "button";
  playBtn.className = "play-station-btn";
  playBtn.textContent = "▶ Practice in Studio";
  playBtn.addEventListener("click", () => openPracticeStation(video));

  const externalLink = document.createElement("a");
  externalLink.className = "external-yt-link";
  externalLink.href = `https://www.youtube.com/watch?v=${encodeURIComponent(video.videoId)}`;
  externalLink.target = "_blank";
  externalLink.rel = "noopener noreferrer";
  externalLink.title = "Watch on YouTube in new tab";
  externalLink.textContent = "YouTube ↗";

  actions.append(playBtn, externalLink);

  card.append(thumbnailContainer, copy, actions);
  return card;
}

function showVideos(videos) {
  videoResults.replaceChildren();

  for (const video of videos) {
    videoResults.append(makeVideoCard(video));
  }
}

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const song = songTitleInput.value.trim();
  const artist = artistInput.value.trim();

  // Reset/clear any active Practice Station video and chord selection on new search
  clearPracticeStation();

  currentSongKey = `${song} - ${artist}`.toLowerCase();
  loadSongPracticeData(currentSongKey);

  showTabSearches(song, artist);
  resultsContainer.hidden = false;
  videoResults.replaceChildren();

  if (!apiBaseUrl) {
    setStatus("Video search is not connected yet. Tab catalog searches are ready to use.");
    return;
  }

  const parameters = new URLSearchParams({ song });
  if (artist) {
    parameters.set("artist", artist);
  }

  searchButton.disabled = true;
  searchButton.setAttribute("aria-busy", "true");
  setStatus("Searching for guitar lessons…");

  try {
    const response = await fetch(`${apiBaseUrl}/api/search?${parameters.toString()}`, {
      headers: { Accept: "application/json" },
    });

    let payload;
    try {
      payload = await response.json();
    } catch {
      throw new Error("The Java service returned an unreadable response.");
    }

    if (!response.ok) {
      throw new Error(payload.message || `Video search failed (${response.status}).`);
    }

    showVideos(payload.videos);
    updateChordChips(payload.chords || []);

    if (payload.videos.length === 0) {
      setStatus("No lesson videos came back. Try adding the artist or adjusting the song title.");
    } else {
      setStatus(`Found ${payload.videos.length} lesson video${payload.videos.length === 1 ? "" : "s"}.`);
    }
  } catch (error) {
    setStatus(error.message || "Video search failed. Check the Java service and try again.", "error");
  } finally {
    searchButton.disabled = false;
    searchButton.removeAttribute("aria-busy");
  }
});
