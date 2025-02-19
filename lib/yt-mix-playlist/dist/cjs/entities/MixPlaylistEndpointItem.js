"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a, _MixPlaylistEndpointItem_parse, _MixPlaylistEndpointItem_findInResults, _MixPlaylistEndpointItem_fetchByContinuation;
Object.defineProperty(exports, "__esModule", { value: true });
const fetch_js_1 = require("../fetch.js");
const helper_js_1 = require("../helper.js");
const MixPlaylistBasicInfo_js_1 = __importDefault(require("./MixPlaylistBasicInfo.js"));
const Thumbnail_js_1 = __importDefault(require("./Thumbnail.js"));
const MAX_CONTINUATION_RUNS = 5;
class MixPlaylistEndpointItem extends MixPlaylistBasicInfo_js_1.default {
    constructor(data) {
        super(data);
        this.videoCount = (0, helper_js_1.parseText)(data.videoCountText);
        this.thumbnails = Thumbnail_js_1.default.parse(data.thumbnail?.thumbnails);
    }
    static async fetch(videoId, context) {
        const results = await (0, fetch_js_1.getWatchPageResults)(videoId, context);
        const parsed = __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_findInResults).call(this, results);
        if (typeof parsed === 'string') {
            /**
             * Continuation:
             * Sometimes, the target is not among the items initially shown on the watch page.
             * You would have to scroll further down the page to obtain more items which may then
             * contain the target. Programatically, we use the continuation token to fetch
             * these additional items.
             */
            return await __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_fetchByContinuation).call(this, context, parsed);
        }
        return parsed;
    }
    static async getGuessedEndpointItem(videoId) {
        const guessedItemData = {
            playlistId: `RD${videoId}`,
            videoCountText: null,
            thumbnail: {
                thumbnails: []
            },
            title: {
                simpleText: 'DUMMY'
            },
            longBylineText: 'DUMMY'
        };
        return __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_parse).call(this, guessedItemData);
    }
}
exports.default = MixPlaylistEndpointItem;
_a = MixPlaylistEndpointItem, _MixPlaylistEndpointItem_parse = function _MixPlaylistEndpointItem_parse(data) {
    if (!data?.playlistId) {
        return null;
    }
    return new MixPlaylistEndpointItem(data);
}, _MixPlaylistEndpointItem_findInResults = function _MixPlaylistEndpointItem_findInResults(data, isContinuation = false) {
    const items = isContinuation ?
        data?.onResponseReceivedEndpoints?.[0]?.appendContinuationItemsAction?.continuationItems :
        data?.contents?.twoColumnWatchNextResults?.secondaryResults?.secondaryResults?.results;
    if (!items) {
        return null;
    }
    if (Array.isArray(items)) {
        const item = items.find((item) => item
            ?.lockupViewModel
            ?.contentImage
            ?.collectionThumbnailViewModel
            ?.primaryThumbnail
            ?.thumbnailViewModel
            ?.overlays
            ?.find((o) => o
            ?.thumbnailOverlayBadgeViewModel
            ?.thumbnailBadges?.[0]
            ?.thumbnailBadgeViewModel
            ?.icon
            ?.sources
            ?.find((s) => s?.clientResource?.imageName === 'MIX')));
        const itemData = Object.assign({}, {
            videoCountText: null,
            thumbnail: {
                thumbnails: item?.lockupViewModel?.contentImage?.collectionThumbnailViewModel?.primaryThumbnail?.thumbnailViewModel?.image?.sources
            },
            title: {
                simpleText: item?.lockupViewModel?.metadata?.lockupMetadataViewModel?.title?.content
            },
            longBylineText: 'DUMMY',
            shareUrl: ''
        }, item?.lockupViewModel?.rendererContext?.commandContext?.onTap?.innertubeCommand?.watchEndpoint);
        if (itemData) {
            return __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_parse).call(this, itemData);
        }
        const token = items[items.length - 1]?.continuationItemRenderer?.continuationEndpoint?.continuationCommand?.token;
        if (token) {
            return token;
        }
    }
    return null;
}, _MixPlaylistEndpointItem_fetchByContinuation = async function _MixPlaylistEndpointItem_fetchByContinuation(context, token, rt = MAX_CONTINUATION_RUNS) {
    if (rt === 0) {
        /**
         * Give up after MAX_CONTINUATION_RUNS. It is possible there is no mix playlist for the video
         * after all and it would make no sense to keep on going forever.
         */
        return null;
    }
    const contents = await (0, fetch_js_1.getContinuationResults)(context, token);
    const parsed = __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_findInResults).call(this, contents, true);
    if (typeof parsed === 'string') {
        // Got another continuation token - dig deeper.
        return __classPrivateFieldGet(this, _a, "m", _MixPlaylistEndpointItem_fetchByContinuation).call(this, context, parsed, rt - 1);
    }
    return parsed;
};
//# sourceMappingURL=MixPlaylistEndpointItem.js.map