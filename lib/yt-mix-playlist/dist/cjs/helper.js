"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sanitizeUrl = exports.parseText = void 0;
const Constants_js_1 = require("./Constants.js");
function parseText(data) {
    return (data?.simpleText || data?.runs?.map((a) => a?.text || '').join('')) || '';
}
exports.parseText = parseText;
function sanitizeUrl(url) {
    return url ? new URL(url, Constants_js_1.BASE_URL).toString() : null;
}
exports.sanitizeUrl = sanitizeUrl;
//# sourceMappingURL=helper.js.map