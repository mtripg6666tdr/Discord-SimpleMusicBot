import { RequestInfo, RequestInit, Response } from 'node-fetch';
import MixPlaylistEndpointItem from './entities/MixPlaylistEndpointItem.js';
interface Context {
    endpointItem: MixPlaylistEndpointItem | null;
    options: {
        gl?: string;
        hl?: string;
    };
    fetchFn: (input: RequestInfo, init?: RequestInit) => Promise<Response>;
}
export default Context;
//# sourceMappingURL=Context.d.ts.map