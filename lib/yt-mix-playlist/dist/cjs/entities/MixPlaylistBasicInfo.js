"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helper_js_1 = require("../helper.js");
class MixPlaylistBasicInfo {
    constructor(data) {
        this.id = data.playlistId;
        this.title = (0, helper_js_1.parseText)(data.title || data.titleText);
        this.author = (0, helper_js_1.parseText)(data.longBylineText || data.data.ownerName);
        this.url = (0, helper_js_1.sanitizeUrl)(data.shareUrl || data.playlistShareUrl);
    }
}
exports.default = MixPlaylistBasicInfo;
//# sourceMappingURL=MixPlaylistBasicInfo.js.map