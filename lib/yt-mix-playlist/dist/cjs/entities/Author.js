"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _Author_getEndpoint;
Object.defineProperty(exports, "__esModule", { value: true });
const helper_js_1 = require("../helper.js");
class Author {
    constructor(data) {
        this.name = (0, helper_js_1.parseText)(data.shortBylineText);
        const endpoint = __classPrivateFieldGet(Author, _a, "m", _Author_getEndpoint).call(Author, data);
        this.channelId = endpoint?.browseId || null;
        this.url = (0, helper_js_1.sanitizeUrl)(endpoint.canonicalBaseUrl);
    }
    static parse(data) {
        if (!__classPrivateFieldGet(this, _a, "m", _Author_getEndpoint).call(this, data)) {
            return null;
        }
        return new Author(data);
    }
}
exports.default = Author;
_a = Author, _Author_getEndpoint = function _Author_getEndpoint(data) {
    return data?.shortBylineText?.runs?.[0]?.navigationEndpoint?.browseEndpoint || null;
};
//# sourceMappingURL=Author.js.map