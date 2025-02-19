import Context from '../Context.js';
import MixPlaylistBasicInfo from './MixPlaylistBasicInfo.js';
import Thumbnail from './Thumbnail.js';
export default class MixPlaylistEndpointItem extends MixPlaylistBasicInfo {
    #private;
    /** @deprecated */
    videoCount: string;
    thumbnails: Thumbnail[];
    constructor(data: any);
    static fetch(videoId: string, context: Context): Promise<MixPlaylistEndpointItem | null>;
    static getGuessedEndpointItem(videoId: string): Promise<MixPlaylistEndpointItem | null>;
}
//# sourceMappingURL=MixPlaylistEndpointItem.d.ts.map