package com.clarkurbon.songfinder;

import java.util.List;

public record ChordDefinition(
        String name,
        String key,
        String fretString, // e.g. "x32010" for C major (6 strings E A D G B e)
        String fingering,  // e.g. "032010" (0=open/mute, 1=index, 2=middle, 3=ring, 4=pinky)
        int baseFret       // 1 for open chords, >1 for barre/high frets
) {
}
