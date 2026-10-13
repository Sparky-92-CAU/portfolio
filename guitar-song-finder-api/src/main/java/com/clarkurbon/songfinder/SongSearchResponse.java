package com.clarkurbon.songfinder;

import java.util.List;

public record SongSearchResponse(
        String song,
        String artist,
        List<VideoResult> videos,
        List<ChordDefinition> chords
) {
}
