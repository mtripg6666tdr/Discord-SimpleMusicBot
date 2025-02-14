import { parseText, sanitizeUrl } from '../helper.js';
import Author from './Author.js';
import Thumbnail from './Thumbnail.js';
export default class MixPlaylistItem {
    constructor(data) {
        this.id = data.videoId;
        this.title = parseText(data.title);
        this.author = Author.parse(data);
        const endpointUrl = data.navigationEndpoint?.commandMetadata?.webCommandMetadata?.url;
        this.url = sanitizeUrl(endpointUrl);
        this.selected = !!data.selected;
        this.duration = parseText(data.lengthText);
        this.thumbnails = Thumbnail.parse(data.thumbnail?.thumbnails);
    }
    static parse(data) {
        const videoData = data?.playlistPanelVideoRenderer;
        return videoData?.videoId ? new MixPlaylistItem(videoData) : null;
    }
}
//# sourceMappingURL=MixPlaylistItem.js.map