"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const helper_js_1 = require("../helper.js");
const Author_js_1 = __importDefault(require("./Author.js"));
const Thumbnail_js_1 = __importDefault(require("./Thumbnail.js"));
class MixPlaylistItem {
    constructor(data) {
        this.id = data.videoId;
        this.title = (0, helper_js_1.parseText)(data.title);
        this.author = Author_js_1.default.parse(data);
        const endpointUrl = data.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
        this.url = (0, helper_js_1.sanitizeUrl)(endpointUrl);
        this.selected = !!data.selected;
        this.duration = (0, helper_js_1.parseText)(data.lengthText);
        this.thumbnails = Thumbnail_js_1.default.parse(data.thumbnail?.thumbnails);
    }
    static parse(data) {
        const videoData = data?.playlistPanelVideoRenderer;
        return videoData?.videoId ? new MixPlaylistItem(videoData) : null;
    }
}
exports.default = MixPlaylistItem;
//# sourceMappingURL=MixPlaylistItem.js.map