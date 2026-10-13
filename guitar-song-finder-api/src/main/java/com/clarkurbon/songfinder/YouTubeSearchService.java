package com.clarkurbon.songfinder;

import com.fasterxml.jackson.databind.JsonNode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

@Service
public class YouTubeSearchService {
    private static final int SEARCH_FETCH_LIMIT = 5;
    private static final int RETURN_LIMIT = 3;

    private static final List<String> TRUSTED_INSTRUCTORS = List.of(
            "marty music",
            "justinguitar",
            "guitarzero2hero",
            "andy guitar",
            "let'splayguitar",
            "letsplayguitar",
            "marin music center",
            "carl brown",
            "guitarlessons365"
    );

    private final RestClient restClient;
    private final String apiKey;
    private final ChordService chordService;

    public YouTubeSearchService(
            RestClient.Builder restClientBuilder,
            @Value("${youtube.api.key:}") String apiKey,
            ChordService chordService
    ) {
        this.restClient = restClientBuilder
                .baseUrl("https://www.googleapis.com/youtube/v3")
                .build();
        this.apiKey = apiKey;
        this.chordService = chordService;
    }

    public SongSearchResponse search(String song, String artist) {
        if (apiKey.isBlank()) {
            throw new SongFinderException(
                    HttpStatus.SERVICE_UNAVAILABLE,
                    "Video search is not configured. Set the YOUTUBE_API_KEY environment variable."
            );
        }

        String query = Stream.of(artist, song, "acoustic guitar lesson tutorial")
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .reduce((left, right) -> left + " " + right)
                .orElseThrow();

        JsonNode response;
        try {
            response = restClient.get()
                    .uri(uriBuilder -> uriBuilder
                            .path("/search")
                            .queryParam("part", "snippet")
                            .queryParam("type", "video")
                            .queryParam("maxResults", SEARCH_FETCH_LIMIT)
                            .queryParam("q", query)
                            .queryParam("key", apiKey)
                            .build())
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            throw new SongFinderException(
                    HttpStatus.BAD_GATEWAY,
                    "YouTube search returned HTTP " + exception.getStatusCode().value()
                            + ". Check the API key and quota, then try again."
            );
        } catch (ResourceAccessException exception) {
            throw new SongFinderException(
                    HttpStatus.BAD_GATEWAY,
                    "YouTube could not be reached. Please try again shortly."
            );
        }

        if (response == null || !response.path("items").isArray()) {
            throw new SongFinderException(
                    HttpStatus.BAD_GATEWAY,
                    "YouTube returned an invalid search response."
            );
        }

        List<VideoResult> videos = new ArrayList<>();
        for (JsonNode item : response.path("items")) {
            String videoId = item.path("id").path("videoId").asText("");
            if (videoId.isBlank()) {
                continue;
            }
            JsonNode snippet = item.path("snippet");
            String title = snippet.path("title").asText("Untitled video");
            String channelTitle = snippet.path("channelTitle").asText("Unknown channel");
            boolean isTrusted = isTrustedInstructor(channelTitle, title);

            videos.add(new VideoResult(
                    videoId,
                    title,
                    channelTitle,
                    findThumbnailUrl(snippet.path("thumbnails")),
                    isTrusted
            ));
        }

        // Sort so trusted instructors appear first
        videos.sort((a, b) -> Boolean.compare(b.trustedInstructor(), a.trustedInstructor()));

        List<VideoResult> limitedVideos = videos.stream().limit(RETURN_LIMIT).toList();
        List<ChordDefinition> chords = chordService.findChordsForSong(song, artist);

        return new SongSearchResponse(song, artist, limitedVideos, chords);
    }

    private boolean isTrustedInstructor(String channelTitle, String videoTitle) {
        String lowerChannel = channelTitle.toLowerCase();
        String lowerTitle = videoTitle.toLowerCase();
        return TRUSTED_INSTRUCTORS.stream().anyMatch(instructor ->
                lowerChannel.contains(instructor) || lowerTitle.contains(instructor)
        );
    }

    private String findThumbnailUrl(JsonNode thumbnails) {
        for (String size : List.of("medium", "high", "default")) {
            String url = thumbnails.path(size).path("url").asText("");
            if (!url.isBlank()) {
                return url;
            }
        }
        return "";
    }
}
