package com.massgs.controller;

import com.massgs.service.MediaStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.util.Map;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

    private final MediaStorageService mediaStorageService;

    @PostMapping("/upload")
    public ResponseEntity<Map<String, String>> uploadProductPhoto(@RequestParam("file") MultipartFile file) {
        String fileUrl = mediaStorageService.storeFile(file);
        return ResponseEntity.ok(Map.of(
                "url", fileUrl,
                "message", "Photo uploaded successfully as seller visual evidence."
        ));
    }

    @GetMapping("/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String fileName) {
        Resource resource = mediaStorageService.loadFileAsResource(fileName);

        String contentType = "image/jpeg";
        try {
            if (resource.getFile() != null) {
                String detected = Files.probeContentType(resource.getFile().toPath());
                if (detected != null) {
                    contentType = detected;
                }
            }
        } catch (IOException ignored) {}

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                .body(resource);
    }
}
