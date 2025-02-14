import { BASE_URL } from './Constants.js';
export function parseText(data) {
    return (data?.simpleText || data?.runs?.map((a) => a?.text || '').join('')) || '';
}
export function sanitizeUrl(url) {
    return url ? new URL(url, BASE_URL).toString() : null;
}
//# sourceMappingURL=helper.js.map