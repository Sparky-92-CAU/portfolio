package com.clarkurbon.songfinder;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
public class ChordService {
    private static final Logger log = LoggerFactory.getLogger(ChordService.class);
    private static final Map<String, ChordDefinition> CHORD_DICTIONARY = new LinkedHashMap<>();
    private static final Map<String, List<String>> SONG_CHORD_MAP = new HashMap<>();

    private static final Pattern CHORD_DIAGRAM_PATTERN = Pattern.compile("data-chord=\"([^\"]+)\"");

    private final RestClient restClient;

    static {
        // Open Chords
        register(new ChordDefinition("C", "C", "x32010", "032010", 1));
        register(new ChordDefinition("Cadd9", "C", "x32033", "021034", 1));
        register(new ChordDefinition("Cmaj7", "C", "x32000", "032000", 1));
        register(new ChordDefinition("C7", "C", "x32310", "032410", 1));
        register(new ChordDefinition("C#m", "C#", "x46654", "013421", 4));
        register(new ChordDefinition("D", "D", "xx0232", "000132", 1));
        register(new ChordDefinition("Dm", "D", "xx0231", "000231", 1));
        register(new ChordDefinition("Dsus2", "D", "xx0230", "000130", 1));
        register(new ChordDefinition("Dsus4", "D", "xx0233", "000124", 1));
        register(new ChordDefinition("D7", "D", "xx0212", "000213", 1));
        register(new ChordDefinition("D/F#", "D", "200232", "100243", 1));
        register(new ChordDefinition("D/F♯", "D", "200232", "100243", 1));
        register(new ChordDefinition("E", "E", "022100", "023100", 1));
        register(new ChordDefinition("Em", "E", "022000", "023000", 1));
        register(new ChordDefinition("Em7", "E", "022033", "012034", 1));
        register(new ChordDefinition("E7", "E", "020100", "020100", 1));
        register(new ChordDefinition("Esus4", "E", "022200", "023400", 1));
        register(new ChordDefinition("G", "G", "320003", "210003", 1));
        register(new ChordDefinition("Gmaj7", "G", "320002", "210001", 1));
        register(new ChordDefinition("G7", "G", "320001", "320001", 1));
        register(new ChordDefinition("Gsus4", "G", "3x0013", "200013", 1));
        register(new ChordDefinition("G/B", "G", "x20003", "010002", 1));
        register(new ChordDefinition("A", "A", "x02220", "001230", 1));
        register(new ChordDefinition("Am", "A", "x02210", "002310", 1));
        register(new ChordDefinition("Am7", "A", "x02010", "002010", 1));
        register(new ChordDefinition("A7", "A", "x02020", "002030", 1));
        register(new ChordDefinition("Asus2", "A", "x02200", "001200", 1));
        register(new ChordDefinition("Asus4", "A", "x02230", "001230", 1));
        register(new ChordDefinition("A7sus4", "A", "x02030", "001030", 1));
        register(new ChordDefinition("F", "F", "133211", "134211", 1));
        register(new ChordDefinition("Fmaj7", "F", "xx3210", "003210", 1));
        register(new ChordDefinition("F#m", "F#", "244222", "134111", 2));
        register(new ChordDefinition("F#m7", "F#", "242222", "131111", 2));
        register(new ChordDefinition("F#7", "F#", "242322", "131211", 2));
        register(new ChordDefinition("B", "B", "x24442", "012341", 2));
        register(new ChordDefinition("Bm", "B", "x24432", "013421", 2));
        register(new ChordDefinition("Bm7", "B", "x24232", "013020", 2));
        register(new ChordDefinition("B7", "B", "x21202", "021304", 1));
        register(new ChordDefinition("Bb", "Bb", "x13331", "012341", 1));

        // Popular Acoustic Songs & their chords (curated list)
        SONG_CHORD_MAP.put("fast car", List.of("C", "G", "Em", "D"));
        SONG_CHORD_MAP.put("hotel california", List.of("Am", "E7", "G", "D", "F", "C", "Dm", "E"));
        SONG_CHORD_MAP.put("wonderwall", List.of("Em7", "G", "Dsus4", "A7", "Cadd9"));
        SONG_CHORD_MAP.put("wish you were here", List.of("G", "Em7", "A7", "C", "D", "Am"));
        SONG_CHORD_MAP.put("blackbird", List.of("G", "Am7", "C", "D", "Em"));
        SONG_CHORD_MAP.put("hallelujah", List.of("C", "Am", "F", "G", "E7"));
        SONG_CHORD_MAP.put("let it be", List.of("C", "G", "Am", "F"));
        SONG_CHORD_MAP.put("knockin on heavens door", List.of("G", "D", "Am", "C"));
        SONG_CHORD_MAP.put("stand by me", List.of("A", "F#m", "D", "E7"));
        SONG_CHORD_MAP.put("riptide", List.of("Am", "G", "C", "Fmaj7"));
        SONG_CHORD_MAP.put("sweet home alabama", List.of("D", "Cadd9", "G"));
        SONG_CHORD_MAP.put("take me home country roads", List.of("G", "Em", "D", "C"));
        SONG_CHORD_MAP.put("shallow", List.of("Em", "D", "G", "C", "Am", "Bm"));
        SONG_CHORD_MAP.put("brown eyed girl", List.of("G", "C", "D", "Em"));
        SONG_CHORD_MAP.put("free fallin", List.of("D", "Dsus4", "A", "G"));
        SONG_CHORD_MAP.put("zombie", List.of("Em", "C", "G", "D/F#"));
        SONG_CHORD_MAP.put("creep", List.of("G", "B", "C", "Cm"));
        SONG_CHORD_MAP.put("yellow", List.of("G", "D", "C", "Em"));
        SONG_CHORD_MAP.put("landslide", List.of("C", "G/B", "Am7", "D"));
        SONG_CHORD_MAP.put("hey jude", List.of("F", "C", "C7", "Bb"));
        SONG_CHORD_MAP.put("horse with no name", List.of("Em", "D6/9"));
        SONG_CHORD_MAP.put("bad moon rising", List.of("D", "A", "G"));
        SONG_CHORD_MAP.put("have you ever seen the rain", List.of("C", "G", "Am", "F"));
        SONG_CHORD_MAP.put("wagon wheel", List.of("G", "D", "Em", "C"));
        SONG_CHORD_MAP.put("heart of gold", List.of("Em", "D", "C", "G"));
        SONG_CHORD_MAP.put("the a team", List.of("A", "Em", "G", "D", "C"));
        SONG_CHORD_MAP.put("perfect", List.of("G", "Em", "C", "D"));
        SONG_CHORD_MAP.put("photograph", List.of("E", "C#m", "B", "A"));
        SONG_CHORD_MAP.put("someone you loved", List.of("C", "G", "Am", "F"));
        SONG_CHORD_MAP.put("counting stars", List.of("Am", "C", "G", "F"));
        SONG_CHORD_MAP.put("ho hey", List.of("C", "F", "Am", "G"));
        SONG_CHORD_MAP.put("iron and wine", List.of("G", "C", "Em", "D"));
        SONG_CHORD_MAP.put("jolie louise", List.of("C", "G", "F"));
    }

    public ChordService(RestClient.Builder restClientBuilder) {
        this.restClient = restClientBuilder.build();
    }

    public ChordService() {
        this(RestClient.builder());
    }

    private static void register(ChordDefinition chord) {
        CHORD_DICTIONARY.put(chord.name().toLowerCase(), chord);
        // Normalize sharp symbol variants
        if (chord.name().contains("#")) {
            CHORD_DICTIONARY.put(chord.name().replace("#", "♯").toLowerCase(), chord);
        }
    }
    public List<ChordDefinition> findChordsForSong(String songTitle, String artist) {
        if (songTitle == null || songTitle.isBlank()) {
            return List.of();
        }

        String normalizedTitle = songTitle.toLowerCase().replaceAll("[^a-z0-9 ]", "").trim();

        // 1. Check curated song database first for quick & reliable accuracy
        for (Map.Entry<String, List<String>> entry : SONG_CHORD_MAP.entrySet()) {
            if (normalizedTitle.contains(entry.getKey()) || entry.getKey().contains(normalizedTitle)) {
                return mapChordNames(entry.getValue());
            }
        }

        // 2. Fetch live chords from Songsterr catalog
        List<ChordDefinition> liveChords = fetchChordsFromSongsterr(songTitle, artist);
        if (!liveChords.isEmpty()) {
            return liveChords;
        }

        // 3. Fallback: return empty list or standard acoustic chords
        return List.of();
    }

    private List<ChordDefinition> fetchChordsFromSongsterr(String songTitle, String artist) {
        try {
            String query = (artist != null && !artist.isBlank()) ? (artist + " " + songTitle) : songTitle;
            JsonNode searchResults = restClient.get()
                    .uri("https://www.songsterr.com/api/songs?pattern={query}", query)
                    .retrieve()
                    .body(JsonNode.class);

            if (searchResults == null || !searchResults.isArray() || searchResults.isEmpty()) {
                return List.of();
            }

            // Find best matching song with hasChords = true
            JsonNode targetSong = null;
            for (JsonNode item : searchResults) {
                if (item.path("hasChords").asBoolean(false)) {
                    targetSong = item;
                    break;
                }
            }

            if (targetSong == null) {
                return List.of();
            }

            int songId = targetSong.path("songId").asInt();
            String songArtist = targetSong.path("artist").asText("");
            String songName = targetSong.path("title").asText("");

            // Slug format: {artist}-{title}-chords-s{songId}
            String artistSlug = songArtist.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            String titleSlug = songName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
            String url = String.format("https://www.songsterr.com/a/wsa/%s-%s-chords-s%d", artistSlug, titleSlug, songId);

            String html = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);

            if (html == null || html.isBlank()) {
                return List.of();
            }

            Set<String> extractedChords = new LinkedHashSet<>();
            Matcher matcher = CHORD_DIAGRAM_PATTERN.matcher(html);
            while (matcher.find()) {
                String chordName = matcher.group(1).trim();
                if (!chordName.isBlank()) {
                    extractedChords.add(chordName);
                }
            }

            if (!extractedChords.isEmpty()) {
                List<ChordDefinition> matched = mapChordNames(new ArrayList<>(extractedChords));
                if (!matched.isEmpty()) {
                    log.info("Successfully fetched {} chords from Songsterr for '{}'", matched.size(), songTitle);
                    return matched;
                }
            }
        } catch (Exception ex) {
            log.warn("Could not fetch chords from Songsterr for '{}': {}", songTitle, ex.getMessage());
        }

        return List.of();
    }

    public Optional<ChordDefinition> getChord(String chordName) {
        if (chordName == null) return Optional.empty();
        return Optional.ofNullable(CHORD_DICTIONARY.get(chordName.toLowerCase().trim()));
    }

    private List<ChordDefinition> mapChordNames(List<String> names) {
        List<ChordDefinition> result = new ArrayList<>();
        for (String name : names) {
            ChordDefinition def = CHORD_DICTIONARY.get(name.toLowerCase());
            if (def != null && !result.contains(def)) {
                result.add(def);
            }
        }
        return List.copyOf(result);
    }
}
