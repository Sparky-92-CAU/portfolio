package com.clarkurbon.catstore.dto;

import com.clarkurbon.catstore.model.Account;
import com.clarkurbon.catstore.model.AccountRole;

public record UserResponse(
        Long id,
        String email,
        AccountRole role,
        String displayName
) {
    public static UserResponse from(Account account, String displayName) {
        return new UserResponse(account.getId(), account.getEmail(), account.getRole(), displayName);
    }
}
