package com.cuberank.backend.service;

import com.cuberank.backend.config.AppProperties;
import com.cuberank.backend.config.AppProperties.CollectionSource;
import com.cuberank.backend.domain.Cube;
import com.cuberank.backend.domain.CubeStatus;
import com.cuberank.backend.ingest.ShopifyProductDtos.Product;
import com.cuberank.backend.ingest.ShopifyProductDtos.ProductsResponse;
import com.cuberank.backend.repository.CubeRepository;
import com.cuberank.backend.web.dto.CatalogIngestResult;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.client.RestClient;
import org.springframework.web.util.UriComponentsBuilder;

@Service
public class CatalogIngestService {

    private static final Logger log = LoggerFactory.getLogger(CatalogIngestService.class);
    private static final String SOURCE_STORE = "thecubicle";

    private final AppProperties appProperties;
    private final CubeRepository cubeRepository;
    private final RestClient restClient;
    private final TransactionTemplate transactionTemplate;

    public CatalogIngestService(
            AppProperties appProperties,
            CubeRepository cubeRepository,
            RestClient.Builder restClientBuilder,
            TransactionTemplate transactionTemplate) {
        this.appProperties = appProperties;
        this.cubeRepository = cubeRepository;
        this.restClient = restClientBuilder.build();
        this.transactionTemplate = transactionTemplate;
    }

    /**
     * Fetches every configured TheCubicle collection (paginated, {@code limit=250})
     * and upserts cubes. New rows are always {@code STAGING}.
     * Each product upsert runs in its own short transaction.
     */
    public CatalogIngestResult ingestAll() {
        AppProperties.Ingest ingest = appProperties.ingest();
        List<String> warnings = new ArrayList<>();
        Set<Long> seenProductIds = new HashSet<>();

        int pagesFetched = 0;
        int productsSeen = 0;
        int created = 0;
        int updated = 0;
        int skippedBlocked = 0;
        int skippedDuplicates = 0;
        int collectionsProcessed = 0;

        List<CollectionSource> collections = Optional.ofNullable(ingest.collections()).orElse(List.of());
        for (CollectionSource collection : collections) {
            collectionsProcessed++;
            int page = 1;
            while (true) {
                String url = buildPageUrl(ingest.baseUrl(), collection, page, ingest.pageSize());
                log.info("Ingest fetching {}", url);

                ProductsResponse response;
                try {
                    response = restClient.get()
                            .uri(url)
                            .retrieve()
                            .body(ProductsResponse.class);
                } catch (Exception ex) {
                    String warning = "Failed to fetch " + url + ": " + ex.getMessage();
                    log.warn(warning, ex);
                    warnings.add(warning);
                    break;
                }

                pagesFetched++;
                List<Product> products = response == null || response.products() == null
                        ? List.of()
                        : response.products();

                if (products.isEmpty()) {
                    break;
                }

                for (Product product : products) {
                    productsSeen++;
                    if (product.id() == null) {
                        skippedBlocked++;
                        continue;
                    }
                    if (isBlocked(product, ingest.blockedKeywords())) {
                        skippedBlocked++;
                        continue;
                    }
                    if (!seenProductIds.add(product.id())) {
                        skippedDuplicates++;
                        warnings.add("Duplicate product " + product.id() + " skipped in collection "
                                + collection.handle() + " (already ingested earlier in this run)");
                        continue;
                    }

                    UpsertOutcome outcome = transactionTemplate.execute(
                            status -> upsertProduct(product, collection, warnings));
                    if (outcome == UpsertOutcome.CREATED) {
                        created++;
                    } else if (outcome == UpsertOutcome.UPDATED) {
                        updated++;
                    }
                }

                page++;
                sleepQuietly(ingest.requestDelayMs());
            }
            sleepQuietly(ingest.requestDelayMs());
        }

        CatalogIngestResult result = new CatalogIngestResult(
                collectionsProcessed,
                pagesFetched,
                productsSeen,
                created,
                updated,
                skippedBlocked,
                skippedDuplicates,
                warnings);
        log.info("Catalog ingest complete: {}", result);
        return result;
    }

    private UpsertOutcome upsertProduct(Product product, CollectionSource collection, List<String> warnings) {
        Optional<Cube> existing =
                cubeRepository.findBySourceStoreAndShopifyProductId(SOURCE_STORE, product.id());

        String name = nullToEmpty(product.title());
        String brand = nullToEmpty(product.vendor()).isBlank() ? "Unknown" : product.vendor().trim();
        String imageUrl = firstImage(product);
        String productUrl = productUrl(product.handle());

        if (existing.isPresent()) {
            Cube cube = existing.get();
            if (!collection.type().equals(cube.getType())) {
                warnings.add("Product " + product.id() + " already typed as " + cube.getType()
                        + "; keeping type (would have been " + collection.type() + " from "
                        + collection.handle() + ")");
            }
            cube.setName(name);
            cube.setBrand(brand);
            cube.setImageUrl(imageUrl);
            cube.setProductUrl(productUrl);
            cubeRepository.save(cube);
            return UpsertOutcome.UPDATED;
        }

        Cube cube = Cube.builder()
                .name(name)
                .brand(brand)
                .type(collection.type())
                .status(CubeStatus.STAGING)
                .shopifyProductId(product.id())
                .sourceStore(SOURCE_STORE)
                .imageUrl(imageUrl)
                .productUrl(productUrl)
                .build();
        cubeRepository.save(cube);
        return UpsertOutcome.CREATED;
    }

    private static String buildPageUrl(String baseUrl, CollectionSource collection, int page, int pageSize) {
        UriComponentsBuilder builder = UriComponentsBuilder
                .fromUriString(trimTrailingSlash(baseUrl))
                .path("/collections/")
                .path(collection.handle())
                .path("/products.json")
                .queryParam("limit", pageSize)
                .queryParam("page", page);

        String extra = collection.extraQuery();
        String built = builder.build(true).toUriString();
        if (extra != null && !extra.isBlank()) {
            return built + (built.contains("?") ? "&" : "?") + extra.trim();
        }
        return built;
    }

    private static String productUrl(String handle) {
        if (handle == null || handle.isBlank()) {
            return null;
        }
        return "https://www.thecubicle.com/products/" + handle.trim();
    }

    private static String firstImage(Product product) {
        if (product.images() == null || product.images().isEmpty()) {
            return null;
        }
        return product.images().getFirst().src();
    }

    private static boolean isBlocked(Product product, List<String> keywords) {
        if (keywords == null || keywords.isEmpty()) {
            return false;
        }
        String haystack = (nullToEmpty(product.title()) + " "
                + String.join(" ", product.tags() == null ? List.of() : product.tags()))
                .toLowerCase(Locale.ROOT);
        for (String keyword : keywords) {
            if (keyword != null && !keyword.isBlank() && haystack.contains(keyword.toLowerCase(Locale.ROOT))) {
                return true;
            }
        }
        return false;
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "https://www.thecubicle.com";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    private static String nullToEmpty(String value) {
        return value == null ? "" : value.trim();
    }

    private static void sleepQuietly(long delayMs) {
        if (delayMs <= 0) {
            return;
        }
        try {
            Thread.sleep(delayMs);
        } catch (InterruptedException ex) {
            Thread.currentThread().interrupt();
        }
    }

    private enum UpsertOutcome {
        CREATED,
        UPDATED
    }
}
