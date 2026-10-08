package com.vestige.controller;

import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.forwardedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class SpaControllerTest {
    private final MockMvc mvc = MockMvcBuilders.standaloneSetup(new SpaController()).build();

    @Test
    void supportsDirectNavigationToPortalPages() throws Exception {
        for (String path : new String[]{"/", "/login/user", "/admin/login", "/user/assessment", "/vendor/dashboard", "/admin/users"}) {
            mvc.perform(get(path)).andExpect(status().isOk()).andExpect(forwardedUrl("/index.html"));
        }
    }

    @Test
    void doesNotCaptureApiRequests() throws Exception {
        mvc.perform(get("/api/unknown")).andExpect(status().isNotFound());
    }
}
