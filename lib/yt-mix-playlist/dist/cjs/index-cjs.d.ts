import { default as main } from './index.js';
import * as ytmpl from './index.js';
declare const _default: typeof main & {
    default(videoId: string, options?: {
        gl?: string | undefined;
        hl?: string | undefined;
    } | undefined): Promise<ytmpl.MixPlaylist | null>;
    MixPlaylist: typeof ytmpl.MixPlaylist;
    MixPlaylistItem: typeof ytmpl.MixPlaylistItem;
};
export = _default;
//# sourceMappingURL=index-cjs.d.ts.map