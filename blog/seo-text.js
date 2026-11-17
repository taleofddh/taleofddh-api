// Pure helpers for the public SEO text fields: validation, summary derivation and the public-response allow-lists.
// No AWS or network access here, so it can be unit tested directly (see test/seo-text.test.js).
// The text helpers are the same as gallery/seo-text.js; keep them in sync.

export const MAX_SUMMARY_LENGTH = 160;
export const MIN_SUMMARY_LENGTH = 120;
export const MAX_ALT_LENGTH = 125;

// Control characters (single-line fields reject newlines and tabs too) plus invisible/bidi formatting characters.
const CONTROL_SINGLE_LINE = /[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060\uFEFF]/;
const CONTROL_MULTI_LINE = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F\u200B-\u200F\u202A-\u202E\u2060\uFEFF]/;
const HTML_TAG = /<\s*\/?\s*[a-zA-Z!?]/;
const SCRIPT_URL = /(?:javascript|vbscript|data)\s*:/i;

const isString = (value) => typeof value === 'string';
const length = (value) => [...value].length;

/** Removes markdown syntax and returns plain text on one line. */
export const stripMarkdown = (text) => {
    if (!isString(text)) return '';
    return text
        .replace(/\r\n?/g, '\n')
        .replace(/```[\s\S]*?```/g, ' ')
        .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
        .replace(/\[([^\]]*)\]\[[^\]]*\]/g, '$1')
        .replace(/^\s{0,3}#{1,6}\s+/gm, '')
        .replace(/^\s{0,3}>\s?/gm, '')
        .replace(/^\s*(?:[-*+]|\d+[.)])\s+/gm, '')
        .replace(/^\s*(?:[-*_]\s*){3,}$/gm, ' ')
        .replace(/^\s*\|?[\s:|-]{3,}\|?\s*$/gm, ' ')
        .replace(/\|/g, ' ')
        .replace(/(\*\*|__|~~)(.*?)\1/g, '$2')
        .replace(/[*_`~]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
};

/**
 * Summary from the start of a markdown description: strip markdown, cut at a word boundary, add an ellipsis
 * when the text was cut. The result is at most `max` characters including the ellipsis.
 */
export const deriveSummary = (description, max = MAX_SUMMARY_LENGTH) => {
    const plain = stripMarkdown(description);
    if (length(plain) <= max) return plain;
    const room = max - 1;
    const chars = [...plain];
    let cut = chars.slice(0, room).join('');
    if (chars[room] !== ' ') {
        const lastSpace = cut.lastIndexOf(' ');
        if (lastSpace > 0) cut = cut.slice(0, lastSpace);
    }
    return cut.replace(/[\s,;:.\-–—]+$/, '') + '…';
};

/**
 * Validates one text field. Returns { value, errors }. `value` is undefined when the field is absent
 * (so the caller leaves the stored value alone), and '' when it was sent empty.
 * HTML, script URLs and control characters are rejected. Markdown syntax is stripped from plain-text
 * fields; fields with `markdown: true` keep it (the UI escapes on output).
 */
export const cleanText = (raw, { field, max, min = 0, markdown = false, multiline = false }) => {
    if (raw === undefined || raw === null) return { value: undefined, errors: [] };
    if (!isString(raw)) return { value: undefined, errors: [`${field} must be text`] };
    const errors = [];
    let value = raw.replace(/\r\n?/g, '\n').trim();
    if ((multiline ? CONTROL_MULTI_LINE : CONTROL_SINGLE_LINE).test(value)) {
        errors.push(`${field} must not contain control characters`);
    }
    if (HTML_TAG.test(value) || SCRIPT_URL.test(value)) {
        errors.push(`${field} must not contain HTML or script`);
    }
    if (errors.length > 0) return { value: undefined, errors };
    if (!markdown) value = stripMarkdown(value);
    if (value.length === 0) return { value: '', errors: [] };
    if (length(value) > max) errors.push(`${field} must be at most ${max} characters`);
    if (min > 0 && length(value) < min) errors.push(`${field} must be at least ${min} characters`);
    return { value, errors };
};

const collect = (data, rules) => {
    const errors = [];
    const value = {};
    for (const [key, rule] of Object.entries(rules)) {
        const result = cleanText(data[key], rule);
        errors.push(...result.errors);
        if (result.value !== undefined) value[key] = result.value;
    }
    return { errors, value };
};

/** Blog SEO fields sent to createOrUpdateBlog. Only fields present in `data` are returned. */
export const validateBlogMeta = (data) => collect(data || {}, {
    summary: { field: 'summary', min: MIN_SUMMARY_LENGTH, max: MAX_SUMMARY_LENGTH },
    titlePhotoAlt: { field: 'titlePhotoAlt', max: MAX_ALT_LENGTH }
});

/** updatedDateTime, falling back to endDateTime for blogs saved before the field existed. */
export const modifiedOf = (item) => item?.updatedDateTime || item?.endDateTime || undefined;

export const latestModified = (items) => {
    let best;
    let bestTime = -Infinity;
    for (const item of items || []) {
        const value = modifiedOf(item);
        const time = value ? Date.parse(value) : NaN;
        if (!Number.isNaN(time) && time > bestTime) {
            best = value;
            bestTime = time;
        }
    }
    return best;
};

/** Adds the SEO fields every blog response carries. Existing fields are untouched. */
export const withBlogMeta = (blog) => ({ ...blog, updatedDateTime: modifiedOf(blog) });
