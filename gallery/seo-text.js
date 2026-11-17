// Pure helpers for the public SEO text fields: validation, summary derivation and the public-response allow-lists.
// No AWS or network access here, so it can be unit tested directly (see test/seo-text.test.js).
// blog/seo-text.js carries the same text helpers; keep the shared parts in sync.

export const MAX_SUMMARY_LENGTH = 160;
export const MIN_SUMMARY_LENGTH = 120;
export const MAX_ALT_LENGTH = 125;
export const MAX_LOCATION_LABEL_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 3000;
export const MAX_TITLE_LENGTH = 120;

export const LEVELS = ['category', 'subCategory', 'collection'];
const LEVEL_DEPTH = { category: 1, subCategory: 2, collection: 3 };
const SLUG_SEGMENT = /^[a-z0-9][a-z0-9_.()'-]{0,79}$/;

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

const SUMMARY_RULES = { field: 'summary', min: MIN_SUMMARY_LENGTH, max: MAX_SUMMARY_LENGTH };
const ALT_RULES = (field) => ({ field, max: MAX_ALT_LENGTH });
const DESCRIPTION_RULES = { field: 'description', max: MAX_DESCRIPTION_LENGTH, markdown: true, multiline: true };

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

/** Album text fields sent to createOrUpdateAlbum. Only fields present in `data` are returned. */
export const validateAlbumMeta = (data) => collect(data || {}, {
    description: DESCRIPTION_RULES,
    summary: SUMMARY_RULES,
    coverAlt: ALT_RULES('coverAlt'),
    locationLabel: { field: 'locationLabel', max: MAX_LOCATION_LABEL_LENGTH }
});

/** Body of createOrUpdateAlbumLevelMeta. Returns { errors, value }; value has every field. */
export const validateLevelMeta = (data) => {
    if (!data || typeof data !== 'object' || Array.isArray(data)) {
        return { errors: ['Request body must be a JSON object'] };
    }
    const errors = [];
    if (!LEVELS.includes(data.level)) {
        errors.push(`level must be one of ${LEVELS.join(', ')}`);
    }
    const pathErrors = validateLevelPath(data.level, data.path);
    if (LEVELS.includes(data.level)) errors.push(...pathErrors);
    else if (!isString(data.path)) errors.push('path is required');
    const { errors: textErrors, value } = collect(data, {
        title: { field: 'title', max: MAX_TITLE_LENGTH },
        description: DESCRIPTION_RULES,
        summary: SUMMARY_RULES,
        coverAlt: ALT_RULES('coverAlt')
    });
    errors.push(...textErrors);
    if (!value.title) errors.push('title is required');
    if (errors.length > 0) return { errors };
    return {
        errors,
        value: {
            level: data.level,
            path: data.path,
            title: value.title,
            summary: value.summary || '',
            description: value.description || '',
            coverAlt: value.coverAlt || ''
        }
    };
};

/** `category`, `category/sub-category` or `category/sub-category/collection`, each segment a slug. */
export const validateLevelPath = (level, path) => {
    if (!isString(path) || path.length === 0 || path.length > 300) return ['path is required'];
    const segments = path.split('/');
    if (!segments.every((segment) => SLUG_SEGMENT.test(segment))) {
        return ['path must be slugs (lower case letters, digits and hyphens) separated by /'];
    }
    if (LEVEL_DEPTH[level] && segments.length !== LEVEL_DEPTH[level]) {
        return [`path for ${level} must have ${LEVEL_DEPTH[level]} part${LEVEL_DEPTH[level] > 1 ? 's' : ''}`];
    }
    return [];
};

/** Most recent of updatedDateTime (falling back to endDateTime) over the items, as the original string. */
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

const pick = (source, keys) => {
    const result = {};
    for (const key of keys) {
        if (source[key] !== undefined) result[key] = source[key];
    }
    return result;
};

// Fields the public album list responses may carry. Everything else on the stored item is dropped:
// no id, searchName, albumLocation, titlePhoto, production, photoList, videoList or signed URLs.
export const PUBLIC_ALBUM_FIELDS = [
    'category', 'subCategory', 'collection', 'name', 'startDateTime', 'endDateTime',
    'photoCount', 'viewCount', 'description', 'summary', 'coverAlt', 'locationLabel', 'videoCount', 'updatedDateTime'
];

/** Allow-listed public view of a stored album. `coverUrl` is the public, unsigned cover; the list module reads it as `signedUrl`. */
export const toPublicAlbum = (album, coverUrl) => {
    const result = pick(album, PUBLIC_ALBUM_FIELDS);
    result.summary = album.summary || deriveSummary(album.description);
    result.updatedDateTime = modifiedOf(album);
    if (result.updatedDateTime === undefined) delete result.updatedDateTime;
    result.signedUrl = coverUrl;
    return result;
};

export const PUBLIC_LEVEL_FIELDS = ['level', 'path', 'title', 'summary', 'description', 'coverAlt', 'updatedDateTime'];

export const toPublicLevelMeta = (item, coverUrl) => ({
    ...pick(item, PUBLIC_LEVEL_FIELDS),
    signedUrl: coverUrl
});
