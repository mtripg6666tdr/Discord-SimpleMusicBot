"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getContinuationResults = exports.getWatchPageResults = void 0;
const Constants_js_1 = require("./Constants.js");
const helper_js_1 = require("./helper.js");
async function getWatchPageResults(videoId, context, rt = 3) {
    if (rt === 0) {
        throw Error(`Failed to obtain JSON data from watch page of video Id: ${videoId}`);
    }
    const query = { v: videoId };
    if (context.endpointItem)
        query.list = context.endpointItem.id;
    if (context.options.gl)
        query.gl = context.options.gl;
    if (context.options.hl)
        query.hl = context.options.hl;
    const params = new URLSearchParams(query);
    const response = await context.fetchFn(Constants_js_1.WATCH_URL + params.toString());
    const body = await response.text();
    const json = getJsonFromBody(body);
    // Retry if unable to find json
    if (!json)
        return getWatchPageResults(videoId, context, rt - 1);
    // Pass errors from the API
    if (json.alerts && !json.contents) {
        const error = json.alerts.find((a) => a?.alertRenderer?.type === 'ERROR');
        if (error) {
            throw Error(`API error returned by watch page of video Id ${videoId}: ${(0, helper_js_1.parseText)(error.alertRenderer.text)}`);
        }
    }
    return json;
}
exports.getWatchPageResults = getWatchPageResults;
function getJsonFromBody(body) {
    return jsonAfter(body, 'window["ytInitialData"] = ') || jsonAfter(body, 'var ytInitialData = ');
}
function jsonAfter(haystack, left) {
    const pos = haystack.indexOf(left);
    if (pos === -1) {
        return null;
    }
    haystack = haystack.slice(pos + left.length);
    try {
        return JSON.parse(cutAfterJSON(haystack));
    }
    catch (e) {
        return null;
    }
}
function cutAfterJSON(mixedJson) {
    let open, close;
    if (mixedJson?.[0] === '[') {
        open = '[';
        close = ']';
    }
    else if (mixedJson?.[0] === '{') {
        open = '{';
        close = '}';
    }
    if (!open) {
        throw Error(`Failed to obtain JSON data: need to begin with '[' or '{' but got: '${mixedJson?.[0]}'.`);
    }
    // States if the loop is currently in a string
    let isString = false;
    // Current open brackets to be closed
    let counter = 0;
    for (let i = 0; i < mixedJson.length; i++) {
        // Toggle the isString boolean when leaving/entering string
        if (mixedJson[i] === '"' && mixedJson[i - 1] !== '\\') {
            isString = !isString;
            continue;
        }
        if (isString)
            continue;
        if (mixedJson[i] === open) {
            counter++;
        }
        else if (mixedJson[i] === close) {
            counter--;
        }
        // All brackets have been closed, thus end of JSON is reached
        if (counter === 0) {
            // Return the cut JSON
            return mixedJson.substr(0, i + 1);
        }
    }
    // We ran through the whole string and ended up with an unclosed bracket
    throw Error('Failed to obtain JSON data: no matching closing bracket found.');
}
async function getContinuationResults(context, token) {
    const postData = {
        context: {
            client: {
                clientName: 'WEB',
                clientVersion: '2.20230331.00.00'
            }
        },
        continuation: token
    };
    if (context.options.gl)
        postData.context.client.gl = context.options.gl;
    if (context.options.hl)
        postData.context.client.hl = context.options.hl;
    const response = await context.fetchFn(Constants_js_1.CONTINUATION_URL, {
        method: 'POST',
        body: JSON.stringify(postData),
        headers: { 'Content-Type': 'application/json; charset=UTF-8' }
    });
    return await response.json();
}
exports.getContinuationResults = getContinuationResults;
//# sourceMappingURL=fetch.js.map