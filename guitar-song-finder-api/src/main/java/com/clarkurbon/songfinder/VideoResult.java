package com.clarkurbon.songfinder;

public record VideoResult(
        String videoId,
        String title,
        String channelTitle,
        String thumbnailUrl,
        boolean trustedInstructor
) {
}
