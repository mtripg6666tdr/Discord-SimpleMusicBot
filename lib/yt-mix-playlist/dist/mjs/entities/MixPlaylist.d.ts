import Context from '../Context.js';
import MixPlaylistBasicInfo from './MixPlaylistBasicInfo.js';
import MixPlaylistItem from './MixPlaylistItem.js';
import Thumbnail from './Thumbnail.js';
export default class MixPlaylist extends MixPlaylistBasicInfo {
    #private;
    currentIndex: number;
    items: MixPlaylistItem[];
    videoCount: string;
    thumbnails: Thumbnail[];
    constructor(data: any, context: Context);
    static fetch(videoId: string, options?: {
        gl?: string;
        hl?: string;
        preferInitialPlaylistGuessing?: boolean;
    }): Promise<MixPlaylist | null>;
    select(videoId: string): Promise<MixPlaylist | null>;
    select(index: number): Promise<MixPlaylist | null>;
    selectFirst(): Promise<MixPlaylist | null>;
    selectLast(): Promise<MixPlaylist | null>;
    getSelected(): MixPlaylistItem;
    getItemsBeforeSelected(): MixPlaylistItem[];
    getItemsAfterSelected(): MixPlaylistItem[];
}
//# sourceMappingURL=MixPlaylist.d.ts.map