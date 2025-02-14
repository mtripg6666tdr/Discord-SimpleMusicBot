"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MixPlaylistItem = exports.MixPlaylist = void 0;
const MixPlaylist_js_1 = __importDefault(require("./entities/MixPlaylist.js"));
async function getMixPlaylist(videoId, options) {
    return MixPlaylist_js_1.default.fetch(videoId, options);
}
exports.default = getMixPlaylist;
var MixPlaylist_js_2 = require("./entities/MixPlaylist.js");
Object.defineProperty(exports, "MixPlaylist", { enumerable: true, get: function () { return __importDefault(MixPlaylist_js_2).default; } });
var MixPlaylistItem_js_1 = require("./entities/MixPlaylistItem.js");
Object.defineProperty(exports, "MixPlaylistItem", { enumerable: true, get: function () { return __importDefault(MixPlaylistItem_js_1).default; } });
//# sourceMappingURL=index.js.map