import MixPlaylist from './entities/MixPlaylist.js';
export default async function getMixPlaylist(videoId, options) {
    return MixPlaylist.fetch(videoId, options);
}
export { default as MixPlaylist } from './entities/MixPlaylist.js';
export { default as MixPlaylistItem } from './entities/MixPlaylistItem.js';
//# sourceMappingURL=index.js.map