// lib/strings.ts

/**
 * Remove the extension from the last '.' onward.
 * "Rosette Nebula.png" -> "Rosette Nebula"
 * "Ara.Final.Web 2.jpg" -> "Ara.Final.Web 2"
 */
export function stripExtension(name: string | undefined | null): string | undefined {
    if (!name) return undefined;
    const i = name.lastIndexOf('.');
    return i > 0 ? name.slice(0, i) : name;
}

/**
 * Determine if a title likely "lacks capitalization":
 * - contains at least one letter
 * - contains no uppercase letters
 * This avoids overriding intentional stylings like "eROSITA" or "iPhone".
 */
function looksUncapitalized(s: string): boolean {
    const hasLetter = /[a-z]/i.test(s);
    const hasUpper = /[A-Z]/.test(s);
    return hasLetter && !hasUpper;
}

/**
 * Title-case a string with common English "small words" rules:
 * - Capitalize first & last words always.
 * - Lowercase small words (a, an, the, of, in, on, at, to, for, and, or, nor, but)
 *   unless they are the first or last word.
 * - Preserve acronyms/initialisms and words already containing digits.
 * - Capitalize each part of hyphenated words.
 *
 * Note: This is intentionally conservative and only applied when the input
 * appears uncapitalized (see looksUncapitalized). This helps avoid
 * clobbering deliberate casing from the user or metadata.
 */
export function toTitleCaseConservative(s: string): string {
    const SMALL_WORDS = new Set([
        'a', 'an', 'the',
        'and', 'but', 'or', 'nor',
        'as', 'at', 'by', 'for', 'in', 'of', 'on', 'per', 'to', 'via'
    ]);

    const tokens = s.split(/\s+/);
    const result = tokens.map((word, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === tokens.length - 1;

        if (!word) return word;

        // Preserve all-caps (acronyms) or words containing digits (e.g., M42, NGC 2070)
        if (/^[A-Z0-9]+$/.test(word) || /\d/.test(word)) {
            return word;
        }

        // Handle hyphenated words by capitalizing each segment
        if (word.includes('-')) {
            return word
                .split('-')
                .map(seg => seg ? seg[0].toUpperCase() + seg.slice(1).toLowerCase() : seg)
                .join('-');
        }

        const lower = word.toLowerCase();

        // Small words remain lower unless first or last
        if (!isFirst && !isLast && SMALL_WORDS.has(lower)) {
            return lower;
        }

        // Default: capitalize first letter, rest lower
        return lower[0].toUpperCase() + lower.slice(1);
    });

    return result.join(' ');
}

/**
 * Convert a display title to a URL-friendly slug.
 * "Southern Pleiades" → "southern-pleiades"
 * "Rosette Nebula (NGC 2237)" → "rosette-nebula-ngc-2237"
 */
export function toSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')   // replace non-alphanumeric runs with hyphens
        .replace(/^-+|-+$/g, '');       // trim leading/trailing hyphens
}

/**
 * Make a display-friendly title:
 * 1) Prefer EXIF-provided title if present.
 * 2) Otherwise fall back to filename without extension.
 * 3) Optionally capitalize conservatively when the chosen title looks uncapitalized.
 * 4) Fall back to the provided `fallback` if nothing usable.
 */
export function pickDisplayTitle(
    exifTitle?: string | null,
    originalFileName?: string | null,
    fallback?: string
): string | undefined {
    // Clean candidates
    const exif = exifTitle?.trim();
    const fileBase = stripExtension(originalFileName?.trim() ?? undefined);

    let chosen = exif || fileBase || fallback || undefined;
    if (!chosen) return undefined;

    // Only auto-capitalize when it *looks* uncapitalized
    if (looksUncapitalized(chosen)) {
        chosen = toTitleCaseConservative(chosen);
    }

    return chosen;
}
