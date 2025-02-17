import { sanitizeUrl } from '../helper.js';
export default class Thumbnail {
    constructor(data) {
        this.url = sanitizeUrl(data.url);
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
//# sourceMappingURL=Thumbnail.js.map