package com.vestige.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/** Serve the bundled React app for browser navigation; API routes stay separate. */
@Controller
public class SpaController {
    @GetMapping({"/", "/portals", "/login", "/register", "/admin/login", "/login/{role}",
            "/register/{role}", "/user/{page}", "/vendor/{page}", "/admin/{page}"})
    public String index() {
        return "forward:/index.html";
    }
}
