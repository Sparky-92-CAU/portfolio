package com.clarkurbon.catstore.auth;

import com.clarkurbon.catstore.dto.AuthResponse;
import com.clarkurbon.catstore.dto.LoginRequest;
import com.clarkurbon.catstore.dto.RegisterRequest;
import com.clarkurbon.catstore.dto.UserResponse;
import com.clarkurbon.catstore.error.ApiException;
import com.clarkurbon.catstore.model.Account;
import com.clarkurbon.catstore.model.AccountRole;
import com.clarkurbon.catstore.model.CustomerProfile;
import com.clarkurbon.catstore.repository.AccountRepository;
import com.clarkurbon.catstore.repository.CustomerProfileRepository;
import com.clarkurbon.catstore.security.JwtService;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;

@Service
public class AuthService {
    private final AccountRepository accountRepository;
    private final CustomerProfileRepository customerProfileRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthService(AccountRepository accountRepository,
                       CustomerProfileRepository customerProfileRepository,
                       PasswordEncoder passwordEncoder,
                       AuthenticationManager authenticationManager,
                       JwtService jwtService) {
        this.accountRepository = accountRepository;
        this.customerProfileRepository = customerProfileRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = Account.normalizeEmail(request.email());
        if (accountRepository.existsByEmail(email)) {
            throw new ApiException(HttpStatus.CONFLICT, "An account with that email already exists.");
        }
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "Password must be no more than 72 UTF-8 bytes.");
        }

        Account account = accountRepository.save(new Account(
                email,
                passwordEncoder.encode(request.password()),
                AccountRole.CUSTOMER
        ));
        String firstName = request.firstName().strip();
        String lastName = request.lastName().strip();
        String phone = request.phone() == null || request.phone().isBlank()
                ? null
                : request.phone().strip();
        customerProfileRepository.save(new CustomerProfile(account, firstName, lastName, phone));
        return jwtService.createResponse(account, firstName + " " + lastName);
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String email = Account.normalizeEmail(request.email());
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(email, request.password())
            );
        } catch (AuthenticationException exception) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }

        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));
        if (account.getRole() != request.accountType()) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }
        String displayName = account.getRole() == AccountRole.CUSTOMER
                ? customerProfileRepository.findByAccountEmail(email)
                    .map(profile -> profile.getFirstName() + " " + profile.getLastName())
                    .orElseThrow(() -> new IllegalStateException("Customer profile is missing."))
                : "Store administrator";
        return jwtService.createResponse(account, displayName);
    }

    @Transactional(readOnly = true)
    public UserResponse currentUser(String email) {
        Account account = accountRepository.findByEmail(email)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Account was not found."));
        String displayName = account.getRole() == AccountRole.CUSTOMER
                ? customerProfileRepository.findByAccountEmail(email)
                    .map(profile -> profile.getFirstName() + " " + profile.getLastName())
                    .orElseThrow(() -> new IllegalStateException("Customer profile is missing."))
                : "Store administrator";
        return UserResponse.from(account, displayName);
    }
}
