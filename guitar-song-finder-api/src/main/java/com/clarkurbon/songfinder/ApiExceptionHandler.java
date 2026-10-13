package com.clarkurbon.songfinder;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {
    @ExceptionHandler(SongFinderException.class)
    public ResponseEntity<ApiError> handleSongFinderException(SongFinderException exception) {
        return ResponseEntity
                .status(exception.getStatus())
                .body(new ApiError(exception.getMessage()));
    }
}
