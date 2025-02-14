var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _a, _MixPlaylist_context, _MixPlaylist_parse, _MixPlaylist_doFetch;
import fetchCookie from 'fetch-cookie';
import nodeFetch from 'node-fetch';
import { getWatchPageResults } from '../fetch.js';
import MixPlaylistBasicInfo from './MixPlaylistBasicInfo.js';
import MixPlaylistEndpointItem from './MixPlaylistEndpointItem.js';
import MixPlaylistItem from './MixPlaylistItem.js';
export default class MixPlaylist extends MixPlaylistBasicInfo {
    constructor(data, context) {
        if (!context?.endpointItem) {
            throw Error('Context missing or invalid. Make sure you are not calling the constructor directly.');
        }
        super(data);
        _MixPlaylist_context.set(this, void 0);
        this.title = context.endpointItem.title;
        this.videoCount = context.endpointItem.videoCount;
        this.thumbnails = context.endpointItem.thumbnails;
        this.currentIndex = data.currentIndex;
        this.items = data.contents?.reduce((r, d) => {
            const parsed = MixPlaylistItem.parse(d);
            if (parsed) {
                r.push(parsed);
            }
            return r;
        }, []);
        __classPrivateFieldSet(this, _MixPlaylist_context, context, "f");
    }
    static async fetch(videoId, options) {
        const context = {
            endpointItem: null,
            options: {
                gl: options?.gl,
                hl: options?.hl
            },
            fetchFn: fetchCookie(nodeFetch)
        };
        const endpointItem = await MixPlaylistEndpointItem.fetch(videoId, context);
        if (endpointItem) {
            context.endpointItem = endpointItem;
            return __classPrivateFieldGet(this, _a, "m", _MixPlaylist_doFetch).call(this, videoId, context);
        }
        return null;
    }
    async select(target) {
        const videoId = typeof target === 'string' ? target : this.items[target].id;
        return __classPrivateFieldGet(MixPlaylist, _a, "m", _MixPlaylist_doFetch).call(MixPlaylist, videoId, __classPrivateFieldGet(this, _MixPlaylist_context, "f"));
    }
    async selectFirst() {
        return this.select(0);
    }
    async selectLast() {
        return this.select(this.items.length - 1);
    }
    getSelected() {
        return this.items[this.currentIndex];
    }
    getItemsBeforeSelected() {
        return this.items.slice(0, this.currentIndex);
    }
    getItemsAfterSelected() {
        return this.items.slice(this.currentIndex + 1);
    }
}
_a = MixPlaylist, _MixPlaylist_context = new WeakMap(), _MixPlaylist_parse = function _MixPlaylist_parse(data, context) {
    if (!data?.playlistId) {
        return null;
    }
    return new MixPlaylist(data, context);
}, _MixPlaylist_doFetch = async function _MixPlaylist_doFetch(videoId, context) {
    const results = await getWatchPageResults(videoId, context);
    const playlistData = results?.contents?.twoColumnWatchNextResults?.playlist?.playlist;
    return __classPrivateFieldGet(this, _a, "m", _MixPlaylist_parse).call(this, playlistData, context) || null;
};
//# sourceMappingURL=MixPlaylist.js.map