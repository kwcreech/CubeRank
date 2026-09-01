package com.cuberank.backend.catalog;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Derives a base-model family and version label from a Shopify product title.
 * Grouping is display-only; each product remains its own cube row.
 */
public final class CubeNameGrouper {

    public record ParsedName(String baseName, String versionLabel, String groupKey) {}

    private static final Pattern TRAILING_PREORDER =
            Pattern.compile("\\s*\\[Pre-?Order]\\s*$", Pattern.CASE_INSENSITIVE);
    private static final Pattern ALL_PARENS = Pattern.compile("\\(([^)]*)\\)");
    private static final Pattern TRAILING_DASH_SUFFIX = Pattern.compile("\\s*[-–—]\\s*([^–—-]+)$");
    private static final Pattern EDITION_KEYWORD = Pattern.compile(
            "(?i)\\b(Special Edition|Limited Edition|Anniversary|PiCube|SAOCube)\\b");
    private static final Pattern NXN_SIZE = Pattern.compile("(?i)(?<!\\w)[2-7]x[2-7](?!\\w)");
    private static final Pattern GENERATION_SUFFIX_M = Pattern.compile("(?i)(\\bV\\d+)\\s+M\\b");
    private static final Pattern LEFTOVER_SEPARATORS = Pattern.compile("(?:^|\\s)[+,]+(?:\\s|$)");
    private static final Pattern WHITESPACE = Pattern.compile("\\s+");
    private static final Pattern NON_KEY_CHARS = Pattern.compile("[^a-z0-9+]+");

    private static final Pattern VERSION_TOKEN = Pattern.compile(
            "(?i)(?<!\\w)("
                    + "Robot Cube Stand|"
                    + "Spring Tension|"
                    + "Magnetic Core|"
                    + "UV Coated|"
                    + "Ball-Core|"
                    + "Ball Core|"
                    + "Pre-Order|"
                    + "Preorder|"
                    + "NewBlack|"
                    + "Mag-Lev|"
                    + "MagLev|"
                    + "Standard|"
                    + "Pioneer|"
                    + "Flagship|"
                    + "Premium|"
                    + "Magnetic|"
                    + "Coated|"
                    + "UV|"
                    + "AI|"
                    + "\\d+-Magnet"
                    + ")(?!\\w)");

    private static final Map<String, String> TOKEN_LABELS = tokenLabels();

    private CubeNameGrouper() {}

    /**
     * @param type catalog puzzle type (NxN tokens are stripped from titles; names like FTO stay)
     */
    public static ParsedName parse(String name, String brand, String type) {
        String original = name == null ? "" : name.trim();
        String brandValue = brand == null ? "" : brand.trim();
        if (original.isEmpty()) {
            String fallback = brandValue.isEmpty() ? "Unknown" : brandValue;
            return new ParsedName(fallback, "Standard", groupKey(fallback));
        }

        String working = original;
        List<String> preorderParts = new ArrayList<>();
        while (true) {
            Matcher preorder = TRAILING_PREORDER.matcher(working);
            if (preorder.find()) {
                preorderParts.add(0, "Pre-Order");
                working = working.substring(0, preorder.start()).trim();
                continue;
            }
            break;
        }

        List<String> parenParts = new ArrayList<>();
        working = extractParens(working, parenParts);

        working = NXN_SIZE.matcher(working).replaceAll(" ");
        working = collapse(working);

        List<String> dashParts = new ArrayList<>();
        working = peelEditionDashSuffixes(working, dashParts);

        List<String> bodyTokens = new ArrayList<>();
        Matcher tokenMatcher = VERSION_TOKEN.matcher(working);
        while (tokenMatcher.find()) {
            bodyTokens.add(canonicalizeToken(tokenMatcher.group()));
        }
        String baseName = collapse(VERSION_TOKEN.matcher(working).replaceAll(" "));

        Matcher generationM = GENERATION_SUFFIX_M.matcher(baseName);
        if (generationM.find()) {
            bodyTokens.add("M");
            baseName = collapse(GENERATION_SUFFIX_M.matcher(baseName).replaceAll("$1"));
        }

        if (baseName.isEmpty()) {
            baseName = collapse(NXN_SIZE.matcher(original).replaceAll(" "));
        }
        if (baseName.isEmpty()) {
            baseName = original;
        }

        List<String> versionParts = new ArrayList<>();
        for (String token : bodyTokens) {
            addUnique(versionParts, token);
        }
        for (String part : parenParts) {
            addUnique(versionParts, part);
        }
        for (String part : dashParts) {
            addUnique(versionParts, part);
        }
        for (String part : preorderParts) {
            addUnique(versionParts, part);
        }
        String versionLabel = versionParts.isEmpty() ? "Standard" : String.join(" + ", versionParts);
        return new ParsedName(baseName, versionLabel, groupKey(baseName));
    }

    static String groupKey(String baseName) {
        return normalizeKey(baseName);
    }

    private static String extractParens(String working, List<String> dest) {
        Matcher matcher = ALL_PARENS.matcher(working);
        StringBuilder out = new StringBuilder();
        int last = 0;
        while (matcher.find()) {
            out.append(working, last, matcher.start());
            out.append(' ');
            String inner = matcher.group(1).trim();
            if (!inner.isEmpty()) {
                dest.add(inner);
            }
            last = matcher.end();
        }
        out.append(working.substring(last));
        return collapse(out.toString());
    }

    private static String peelEditionDashSuffixes(String working, List<String> dest) {
        String current = working;
        while (true) {
            Matcher matcher = TRAILING_DASH_SUFFIX.matcher(current);
            if (!matcher.find()) {
                break;
            }
            String suffix = matcher.group(1).trim();
            if (!EDITION_KEYWORD.matcher(suffix).find()) {
                break;
            }
            dest.add(suffix);
            current = current.substring(0, matcher.start()).trim();
        }
        return current;
    }

    private static void addUnique(List<String> parts, String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        String trimmed = value.trim();
        for (String existing : parts) {
            if (existing.equalsIgnoreCase(trimmed)) {
                return;
            }
        }
        parts.add(trimmed);
    }

    private static String canonicalizeToken(String matched) {
        String key = matched.toLowerCase(Locale.ROOT).replace('-', ' ').replaceAll("\\s+", " ").trim();
        String mapped = TOKEN_LABELS.get(key);
        if (mapped != null) {
            return mapped;
        }
        Matcher magnet = Pattern.compile("(?i)(\\d+)-Magnet").matcher(matched.trim());
        if (magnet.matches()) {
            return magnet.group(1) + "-Magnet";
        }
        return matched.trim();
    }

    private static String collapse(String value) {
        String separatorsCleared = LEFTOVER_SEPARATORS.matcher(value).replaceAll(" ");
        return WHITESPACE.matcher(separatorsCleared).replaceAll(" ").trim();
    }

    private static String normalizeKey(String value) {
        String lower = value == null ? "" : value.toLowerCase(Locale.ROOT);
        return WHITESPACE.matcher(NON_KEY_CHARS.matcher(lower).replaceAll(" ")).replaceAll(" ").trim();
    }

    private static Map<String, String> tokenLabels() {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("robot cube stand", "Robot Cube Stand");
        labels.put("spring tension", "Spring Tension");
        labels.put("magnetic core", "Magnetic Core");
        labels.put("uv coated", "UV Coated");
        labels.put("ball core", "Ball-Core");
        labels.put("pre order", "Pre-Order");
        labels.put("preorder", "Pre-Order");
        labels.put("newblack", "NewBlack");
        labels.put("mag lev", "MagLev");
        labels.put("maglev", "MagLev");
        labels.put("standard", "Standard");
        labels.put("pioneer", "Pioneer");
        labels.put("flagship", "Flagship");
        labels.put("premium", "Premium");
        labels.put("magnetic", "Magnetic");
        labels.put("coated", "Coated");
        labels.put("uv", "UV");
        labels.put("ai", "AI");
        return Map.copyOf(labels);
    }
}
