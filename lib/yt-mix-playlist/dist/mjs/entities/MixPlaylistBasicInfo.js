import { parseText, sanitizeUrl } from '../helper.js';
export default class MixPlaylistBasicInfo {
    constructor(data) {
        this.id = data.playlistId;
        this.title = parseText(data.title || data.titleText);
        this.author = parseText(data.longBylineText || data.data.ownerName);
        this.url = sanitizeUrl(data.shareUrl || data.playlistShareUrl);
    }
}
//# sourceMappingURL=MixPlaylistBasicInfo.js.map