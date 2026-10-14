package com.clarkurbon.catstore;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class CatStoreApiIntegrationTest {
    private static final String ADMIN_EMAIL = "admin@cat-store.test";
    private static final String ADMIN_PASSWORD = "Test-admin-password-2026!";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void customerRegistrationOrdersAndAdminFulfillmentPersistInventoryTransitions() throws Exception {
        MvcResult publicCatsResult = mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode cats = objectMapper.readTree(publicCatsResult.getResponse().getContentAsString());
        assertThat(cats.size()).isGreaterThanOrEqualTo(3);
        long catId = cats.get(0).get("id").asLong();
        String originalCatName = cats.get(0).get("name").asText();
        long originalPrice = cats.get(0).get("priceCents").asLong();

        mockMvc.perform(get("/api/admin/cats"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Sign in is required for this action."));

        String email = "customer-" + UUID.randomUUID() + "@example.test";
        String registration = """
                {
                  "firstName": "Taylor",
                  "lastName": "Customer",
                  "email": "%s",
                  "password": "customer-password-2026",
                  "phone": null
                }
                """.formatted(email);
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.user.role").value("CUSTOMER"))
                .andReturn();
        String customerToken = objectMapper.readTree(registrationResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/admin/cats").header("Authorization", bearer(customerToken)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/auth/me").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email));

        String placeOrder = objectMapper.writeValueAsString(java.util.Map.of("catIds", new long[]{catId}));
        MvcResult orderResult = mockMvc.perform(post("/api/customer/orders")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(placeOrder))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PLACED"))
                .andExpect(jsonPath("$.totalCents").isNumber())
                .andReturn();
        long orderId = objectMapper.readTree(orderResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + catId + ")]").isEmpty());
        mockMvc.perform(get("/api/customer/orders").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(orderId));

        String adminLogin = objectMapper.writeValueAsString(java.util.Map.of(
                "email", ADMIN_EMAIL,
                "password", ADMIN_PASSWORD,
                "accountType", "ADMIN"
        ));
        MvcResult adminLoginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminLogin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andReturn();
        String adminToken = objectMapper.readTree(adminLoginResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(get("/api/admin/orders").header("Authorization", bearer(adminToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customerEmail").value(email));
        mockMvc.perform(put("/api/admin/orders/{id}/status", orderId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"CANCELLED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));

        mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + catId + ")]").isNotEmpty());
        mockMvc.perform(put("/api/admin/cats/{id}", catId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Updated demo name",
                                  "breed": "Domestic Shorthair",
                                  "ageMonths": 10,
                                  "description": "Updated after cancellation.",
                                  "priceCents": 81000
                                }
                                """))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/customer/orders").header("Authorization", bearer(customerToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].items[0].name").value(originalCatName))
                .andExpect(jsonPath("$[0].items[0].unitPriceCents").value(originalPrice));

        String retryOrder = objectMapper.writeValueAsString(java.util.Map.of("catIds", new long[]{catId}));
        MvcResult retryOrderResult = mockMvc.perform(post("/api/customer/orders")
                        .header("Authorization", bearer(customerToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(retryOrder))
                .andExpect(status().isCreated())
                .andReturn();
        long retryOrderId = objectMapper.readTree(retryOrderResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(put("/api/admin/orders/{id}/status", retryOrderId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"FULFILLED"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("FULFILLED"));
        mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + catId + ")]").isEmpty());
    }

    @Test
    void publicRegistrationCannotCreateAdminAndAdminModeIsCheckedAgainstDatabaseRole() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "firstName": "Impersonator",
                                  "lastName": "Account",
                                  "email": "admin@cat-store.test",
                                  "password": "another-admin-password",
                                  "phone": null
                                }
                                """))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email": "admin@cat-store.test",
                                  "password": "Test-admin-password-2026!",
                                  "accountType": "CUSTOMER"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void malformedJsonReceivesStructuredClientError() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(
                        "Request body contains invalid JSON or an unsupported value."
                ));
    }

    @Test
    void customerCannotPlaceDuplicateCatsInOneOrder() throws Exception {
        String email = "duplicate-" + UUID.randomUUID() + "@example.test";
        String registration = """
                {
                  "firstName": "Avery",
                  "lastName": "Tester",
                  "email": "%s",
                  "password": "customer-password-2026"
                }
                """.formatted(email);
        MvcResult registrationResult = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration))
                .andExpect(status().isCreated())
                .andReturn();
        String token = objectMapper.readTree(registrationResult.getResponse().getContentAsString())
                .get("accessToken").asText();

        mockMvc.perform(post("/api/customer/orders")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"catIds":[1,1]}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("A cat can only appear once in an order."));
    }

    @Test
    void adminCanCreateEditArchiveAndRestoreCatListings() throws Exception {
        String adminToken = adminToken();
        String createCat = """
                {
                  "name": "Tinsel",
                  "breed": "Domestic Shorthair",
                  "ageMonths": 9,
                  "description": "A fictional demo listing.",
                  "priceCents": 75000
                }
                """;
        MvcResult createResult = mockMvc.perform(post("/api/admin/cats")
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createCat))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("AVAILABLE"))
                .andReturn();
        long catId = objectMapper.readTree(createResult.getResponse().getContentAsString())
                .get("id").asLong();

        mockMvc.perform(put("/api/admin/cats/{id}", catId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Tinsel",
                                  "breed": "Domestic Shorthair",
                                  "ageMonths": 10,
                                  "description": "Updated demo listing.",
                                  "priceCents": 80000
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.priceCents").value(80000));

        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .delete("/api/admin/cats/{id}", catId)
                        .header("Authorization", bearer(adminToken)))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + catId + ")]").isEmpty());

        mockMvc.perform(put("/api/admin/cats/{id}/status", catId)
                        .header("Authorization", bearer(adminToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"status":"AVAILABLE"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("AVAILABLE"));
        mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id == " + catId + ")]").isNotEmpty());
    }

    @Test
    void concurrentCustomersCannotReserveTheSameCat() throws Exception {
        MvcResult publicCatsResult = mockMvc.perform(get("/api/cats"))
                .andExpect(status().isOk())
                .andReturn();
        long catId = objectMapper.readTree(publicCatsResult.getResponse().getContentAsString())
                .get(0).get("id").asLong();
        String firstToken = customerToken("first");
        String secondToken = customerToken("second");
        String orderJson = objectMapper.writeValueAsString(java.util.Map.of("catIds", new long[]{catId}));
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        var executor = Executors.newFixedThreadPool(2);

        try {
            var first = executor.submit(() -> placeOrderWhenReleased(firstToken, orderJson, ready, start));
            var second = executor.submit(() -> placeOrderWhenReleased(secondToken, orderJson, ready, start));
            ready.await();
            start.countDown();
            List<Integer> statuses = new ArrayList<>(List.of(first.get(), second.get()));
            assertThat(statuses).containsExactlyInAnyOrder(201, 409);
        } finally {
            executor.shutdownNow();
        }
    }

    private String adminToken() throws Exception {
        String adminLogin = objectMapper.writeValueAsString(java.util.Map.of(
                "email", ADMIN_EMAIL,
                "password", ADMIN_PASSWORD,
                "accountType", "ADMIN"
        ));
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminLogin))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    private String customerToken(String label) throws Exception {
        String email = label + "-" + UUID.randomUUID() + "@example.test";
        String registration = """
                {
                  "firstName": "Concurrency",
                  "lastName": "Tester",
                  "email": "%s",
                  "password": "customer-password-2026"
                }
                """.formatted(email);
        MvcResult result = mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registration))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString())
                .get("accessToken").asText();
    }

    private int placeOrderWhenReleased(String token,
                                       String requestBody,
                                       CountDownLatch ready,
                                       CountDownLatch start) throws Exception {
        ready.countDown();
        start.await();
        return mockMvc.perform(post("/api/customer/orders")
                        .header("Authorization", bearer(token))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andReturn()
                .getResponse()
                .getStatus();
    }

    private String bearer(String token) {
        return "Bearer " + token;
    }
}
