package com.massgs.security;

import com.massgs.entity.User;
import com.massgs.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import java.util.Optional;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String identifier) throws UsernameNotFoundException {
        if (identifier == null || identifier.isBlank()) {
            throw new UsernameNotFoundException("Identifier cannot be blank");
        }

        String trimmed = identifier.trim();

        // 1. Try by Email
        Optional<User> userOpt = userRepository.findByEmail(trimmed);

        // 2. Try by MASSGS ID
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByMassgsId(trimmed.toUpperCase());
        }

        // 3. Try by Phone Number (raw or cleaned digits)
        if (userOpt.isEmpty()) {
            userOpt = userRepository.findByPhoneNumber(trimmed);
        }
        if (userOpt.isEmpty()) {
            String digitsOnly = trimmed.replaceAll("[^0-9]", "");
            if (!digitsOnly.isEmpty()) {
                userOpt = userRepository.findByPhoneNumber(digitsOnly);
            }
        }

        User user = userOpt.orElseThrow(() ->
                new UsernameNotFoundException("User not found with identifier: " + identifier));

        return UserPrincipal.create(user);
    }
}
