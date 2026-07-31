package com.cuberank.backend.ingest;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

public final class ShopifyProductDtos {

    private ShopifyProductDtos() {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record ProductsResponse(List<Product> products) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Product(
            Long id,
            String title,
            String handle,
            String vendor,
            List<String> tags,
            List<Image> images) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record Image(String src) {
    }
}
