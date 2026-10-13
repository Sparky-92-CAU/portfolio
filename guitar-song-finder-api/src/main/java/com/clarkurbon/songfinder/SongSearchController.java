package com.clarkurbon.songfinder;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class SongSearchController {
    private static final int MAX_QUERY_LENGTH = 120;

    private final YouTubeSearchService youTubeSearchService;

    public SongSearchController(YouTubeSearchService youTubeSearchService) {
        this.youTubeSearchService = youTubeSearchService;
    }

    @GetMapping("/search")
    public SongSearchResponse search(
            @RequestParam(required = false) String song,
            @RequestParam(required = false) String artist
    ) {
        String normalizedSong = normalizeQuery(song, "Song title", true);
        String normalizedArtist = normalizeQuery(artist, "Artist", false);
        return youTubeSearchService.search(normalizedSong, normalizedArtist);
    }

    private String normalizeQuery(String value, String fieldName, boolean required) {
        String normalized = value == null ? "" : value.trim();
        if (required && normalized.isEmpty()) {
            throw new SongFinderException(HttpStatus.BAD_REQUEST, fieldName + " is required.");
        }
        if (normalized.length() > MAX_QUERY_LENGTH) {
            throw new SongFinderException(
                    HttpStatus.BAD_REQUEST,
                    fieldName + " must be " + MAX_QUERY_LENGTH + " characters or fewer."
            );
        }
        return normalized;
    }
}
