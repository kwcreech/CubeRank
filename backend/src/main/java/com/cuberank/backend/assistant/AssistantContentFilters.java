package com.cuberank.backend.assistant;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Best-effort input injection / jailbreak heuristics and output offensive-word checks.
 * Pattern matching is case-insensitive substring (or whole-word for output denylist).
 */
public final class AssistantContentFilters {

    private AssistantContentFilters() {
    }

    public static boolean matchesBlockedInput(String prompt, List<String> patterns) {
        if (prompt == null || patterns == null || patterns.isEmpty()) {
            return false;
        }
        String normalized = normalize(prompt);
        for (String pattern : patterns) {
            if (pattern == null || pattern.isBlank()) {
                continue;
            }
            if (normalized.contains(normalize(pattern))) {
                return true;
            }
        }
        return false;
    }

    /**
     * Returns true when the text contains any blocked word as a whole word
     * (letters/digits/_ boundaries), case-insensitive.
     */
    public static boolean containsBlockedOutputWord(String text, List<String> blockedWords) {
        if (text == null || blockedWords == null || blockedWords.isEmpty()) {
            return false;
        }
        for (String word : blockedWords) {
            if (word == null || word.isBlank()) {
                continue;
            }
            Pattern pattern = Pattern.compile(
                    "\\b" + Pattern.quote(word.trim()) + "\\b",
                    Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
            if (pattern.matcher(text).find()) {
                return true;
            }
        }
        return false;
    }

    public static List<String> normalizeList(List<String> values) {
        if (values == null) {
            return List.of();
        }
        List<String> out = new ArrayList<>(values.size());
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                out.add(value.trim());
            }
        }
        return List.copyOf(out);
    }

    private static String normalize(String value) {
        String nfkc = Normalizer.normalize(value, Normalizer.Form.NFKC);
        String stripped = nfkc.replaceAll("\\p{Cf}", "");
        return stripped.toLowerCase(Locale.ROOT).replaceAll("\\s+", " ").trim();
    }
}
