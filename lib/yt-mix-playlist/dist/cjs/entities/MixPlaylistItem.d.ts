import Author from './Author.js';
import Thumbnail from './Thumbnail.js';
export default class MixPlaylistItem {
    id: string;
    title: string;
    author: Author | null;
    url: string | null;
    selected: boolean;
    duration: string;
    thumbnails: Thumbnail[];
    constructor(data: any);
    static parse(data: any): MixPlaylistItem | null;
}
//# sourceMappingURL=MixPlaylistItem.d.ts.map