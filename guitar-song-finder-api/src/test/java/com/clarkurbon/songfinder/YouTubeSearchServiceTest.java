package com.clarkurbon.songfinder;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class YouTubeSearchServiceTest {
    @Test
    void mapsVideoResultsFromYouTubeResponse() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer.bindTo(builder).build();
        ChordService chordService = new ChordService();
        YouTubeSearchService service = new YouTubeSearchService(builder, "test-key", chordService);
        String expectedRequest =
                "https://www.googleapis.com/youtube/v3/search?part=snippet&type=video"
                        + "&maxResults=5&q=Artist%20Song%20acoustic%20guitar%20lesson%20tutorial"
                        + "&key=test-key";
        server.expect(requestTo(expectedRequest))
                .andExpect(method(HttpMethod.GET))
                .andRespond(withSuccess("""
                        {
                          "items": [
                            {
                              "id": {"videoId": "video-123"},
                              "snippet": {
                                "title": "Acoustic guitar lesson",
                                "channelTitle": "Marty Music",
                                "thumbnails": {
                                  "medium": {"url": "https://img.youtube.com/thumbnail.jpg"}
                                }
                              }
                            }
                          ]
                        }
                        """, MediaType.APPLICATION_JSON));

        SongSearchResponse response = service.search("Song", "Artist");

        assertThat(response.song()).isEqualTo("Song");
        assertThat(response.artist()).isEqualTo("Artist");
        assertThat(response.videos()).containsExactly(
                new VideoResult(
                        "video-123",
                        "Acoustic guitar lesson",
                        "Marty Music",
                        "https://img.youtube.com/thumbnail.jpg",
                        true
                )
        );
        server.verify();
    }

    @Test
    void reportsMissingApiKey() {
        YouTubeSearchService service = new YouTubeSearchService(RestClient.builder(), "", new ChordService());

        assertThatThrownBy(() -> service.search("Song", ""))
                .isInstanceOf(SongFinderException.class)
                .hasMessageContaining("YOUTUBE_API_KEY");
    }
}
