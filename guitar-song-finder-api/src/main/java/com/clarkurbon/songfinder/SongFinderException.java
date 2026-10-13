package com.clarkurbon.songfinder;

import org.springframework.http.HttpStatus;

public class SongFinderException extends RuntimeException {
    private final HttpStatus status;

    public SongFinderException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus getStatus() {
        return status;
    }
}
