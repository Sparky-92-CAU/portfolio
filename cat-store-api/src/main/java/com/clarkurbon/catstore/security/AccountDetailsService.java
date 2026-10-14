package com.clarkurbon.catstore.security;

import com.clarkurbon.catstore.model.Account;
import com.clarkurbon.catstore.repository.AccountRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class AccountDetailsService implements UserDetailsService {
    private final AccountRepository accountRepository;

    public AccountDetailsService(AccountRepository accountRepository) {
        this.accountRepository = accountRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        Account account = accountRepository.findByEmail(Account.normalizeEmail(email))
                .orElseThrow(() -> new UsernameNotFoundException("Account not found"));
        return new User(
                account.getEmail(),
                account.getPasswordHash(),
                account.isEnabled(),
                true,
                true,
                true,
                List.of(new SimpleGrantedAuthority("ROLE_" + account.getRole().name()))
        );
    }
}
