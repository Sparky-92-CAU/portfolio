package com.clarkurbon.songfinder;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChordServiceTest {
    @Test
    void returnsAccurateChordsForCuratedSongs() {
        ChordService chordService = new ChordService();

        List<ChordDefinition> fastCar = chordService.findChordsForSong("Fast Car", "Tracy Chapman");
        assertThat(fastCar).extracting(ChordDefinition::name).containsExactly("C", "G", "Em", "D");

        List<ChordDefinition> hotelCalifornia = chordService.findChordsForSong("Hotel California", "Eagles");
        assertThat(hotelCalifornia).extracting(ChordDefinition::name).contains("Am", "E7", "G", "D", "F", "C", "Dm", "E");

        List<ChordDefinition> wonderwall = chordService.findChordsForSong("Wonderwall", "Oasis");
        assertThat(wonderwall).extracting(ChordDefinition::name).contains("Em7", "G", "Dsus4", "A7", "Cadd9");

        List<ChordDefinition> zombie = chordService.findChordsForSong("Zombie", "The Cranberries");
        assertThat(zombie).extracting(ChordDefinition::name).contains("Em", "C", "G", "D/F#");
    }

    @Test
    void returnsEmptyOrFallbackWhenNotFound() {
        ChordService chordService = new ChordService();
        List<ChordDefinition> result = chordService.findChordsForSong("UnknownRandomSongTitle12345", "Unknown");
        assertThat(result).isNotNull();
    }
}
