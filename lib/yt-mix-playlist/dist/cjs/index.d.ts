import MixPlaylist from './entities/MixPlaylist.js';
export default function getMixPlaylist(videoId: string, options?: {
    gl?: string;
    hl?: string;
    preferInitialPlaylistGuessing?: boolean;
}): Promise<MixPlaylist | null>;
export { default as MixPlaylist } from './entities/MixPlaylist.js';
export { default as MixPlaylistItem } from './entities/MixPlaylistItem.js';
//# sourceMappingURL=index.d.ts.map