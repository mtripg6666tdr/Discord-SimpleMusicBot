"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_js_1 = require("../helper.js");
class Thumbnail {
    constructor(data) {
        this.url = (0, helper_js_1.sanitizeUrl)(data.url);
        this.width = data.width || 0;
        this.height = data.height || 0;
    }
    static parse(data) {
        if (!data || !Array.isArray(data)) {
            return [];
        }
        const resolved = data.reduce((r, d) => {
            if (d?.url) {
                r.push(new Thumbnail(d));
            }
            return r;
        }, []);
        resolved.sort((a, b) => (b.width - a.width));
        return resolved;
    }
}
exports.default = Thumbnail;
//# sourceMappingURL=Thumbnail.js.map