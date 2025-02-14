# yt-mix-playlist

Node module for fetching YouTube Mix playlists.

## Install

```
npm install yt-mix-playlist --save
```

## Usage

Import module:

```
// ESM
import ytmpl from 'yt-mix-playlist';

// CJS
const ytmpl = require('yt-mix-playlist');

```

Fetch Mix playlist for a video:

```
const videoId = 'XCcN-IoYIJA';
const mixPlaylist = await ytmpl(videoId);
console.log(mixPlaylist);
```

Result:
```
MixPlaylist {
  id: 'RDXCcN-IoYIJA',
  title: 'Mix - Wiljan & Xandra - Woodlands',
  author: 'YouTube',
  url: 'http://www.youtube.com/watch?v=XCcN-IoYIJA&list=RDXCcN-IoYIJA',
  videoCount: '50+ videos',
  thumbnails: [
    Thumbnail {
      url: 'https://i.ytimg.com/vi/XCcN-IoYIJA/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLARuI_29dvrA_u7pQj4xs8X_HUwDw',
      width: 336,
      height: 188
    },
    Thumbnail {
      url: 'https://i.ytimg.com/vi/XCcN-IoYIJA/hqdefault.jpg?sqp=-oaymwEWCKgBEF5IWvKriqkDCQgBFQAAiEIYAQ==&rs=AOn4CLCnA4XJbGLUcY1BPiU3TjMhKj1VXA',
      width: 168,
      height: 94
    }
  ],
  currentIndex: 0,
  items: [
    MixPlaylistItem {
      id: 'XCcN-IoYIJA',
      title: 'Wiljan & Xandra - Woodlands',
      author: [Author],
      url: 'https://www.youtube.com/watch?v=XCcN-IoYIJA&list=RDXCcN-IoYIJA&index=1',
      selected: true,
      duration: '5:30',
      thumbnails: [Array]
    },
    MixPlaylistItem {
      id: '_jYoI4rR_fg',
      title: 'Waking Dreams - Someone Else',
      author: [Author],
      url: 'https://www.youtube.com/watch?v=_jYoI4rR_fg&list=RDXCcN-IoYIJA&index=2',
      selected: false,
      duration: '4:49',
      thumbnails: [Array]
    },
    ...
  ]
}
```

`items` array contains videos currently in the playlist. `currentIndex` refers to the position of the selected video in the array.

On YouTube, when you select a video in a Mix playlist, the contents of the list may refresh depending on the position of the selected video. With this module, you can programatically 'select' a video and obtain an updated playlist with possibly changed contents.


To change selected video:
```
// Select by video Id or index from current list
const updatedPlaylist = await mixPlaylist.select(videoIdOrIndex);
```
or:
```
// Select the last video in current list
const updatedPlaylist = await mixPlaylist.selectLast();
```
or:
```
// Select the first video in current list
const updatedPlaylist = await mixPlaylist.selectFirst();
```

Each of the 'select' methods returns a new playlist. The original playlist remains unchanged.

Example:
```
// Select last video in the list
const updatedPlaylist = await mixPlaylist.selectLast();
console.log(updatedPlaylist);
```

Result:
```
MixPlaylist {
  id: 'RDXCcN-IoYIJA',
  title: 'Mix - Wiljan & Xandra - Woodlands',
  author: 'YouTube',
  url: 'http://www.youtube.com/watch?v=XXYlFuWEuKI&list=RDXCcN-IoYIJA',
  videoCount: '50+ videos',
  thumbnails: [
    Thumbnail {
      url: 'https://i.ytimg.com/vi/XCcN-IoYIJA/hqdefault.jpg?sqp=-oaymwEXCNACELwBSFryq4qpAwkIARUAAIhCGAE=&rs=AOn4CLARuI_29dvrA_u7pQj4xs8X_HUwDw',
      width: 336,
      height: 188
    },
    Thumbnail {
      url: 'https://i.ytimg.com/vi/XCcN-IoYIJA/hqdefault.jpg?sqp=-oaymwEWCKgBEF5IWvKriqkDCQgBFQAAiEIYAQ==&rs=AOn4CLCnA4XJbGLUcY1BPiU3TjMhKj1VXA',
      width: 168,
      height: 94
    }
  ],
  currentIndex: 24,
  items: [
    MixPlaylistItem {
      id: 'XCcN-IoYIJA',
      title: 'Wiljan & Xandra - Woodlands',
      author: [Author],
      url: 'https://www.youtube.com/watch?v=XCcN-IoYIJA&list=RDXCcN-IoYIJA&index=1',
      selected: false,
      duration: '5:30',
      thumbnails: [Array]
    },
    ...
    MixPlaylistItem {
      id: 'XXYlFuWEuKI',
      title: 'The Weeknd - Save Your Tears (Official Music Video)',
      author: [Author],
      url: 'https://www.youtube.com/watch?v=XXYlFuWEuKI&list=RDXCcN-IoYIJA&index=25',
      selected: true,
      duration: '4:09',
      thumbnails: [Array]
    },
    MixPlaylistItem {
      id: 'pxirHB4Hyzk',
      title: 'Maya Bay',
      author: [Author],
      url: 'https://www.youtube.com/watch?v=pxirHB4Hyzk&list=RDXCcN-IoYIJA&index=26',
      selected: false,
      duration: '3:13',
      thumbnails: [Array]
    },
    ...
  ]
}
```

Most times, we would be interested in obtaining new items from the playlist. We can do so as follows:
```
const updatedPlaylist = await mixPlaylist.selectLast();

// selectLast() will definitely return a list with new items.
// There will be some items carried over from the original list.
// To get the new items not in the original list, do this:

const newItems = updatedPlaylist.getItemsAfterSelected();
```
## API

**ytmpl(`videoId`: string, `options`?: { `gl`?: string, `hl`?: string }): Promise<`MixPlaylist` | `null`>**

Options:
- `hl`: language
- `gl`: region

Example:
```
const mixPlaylist = await ytmpl('XCcN-IoYIJA', { hl: 'en', gl: 'US' });
```

Returns a Promise that resolves to a `MixPlaylist` instance representing the Mix playlist for the video, or `null` if none found.

### `MixPlaylist` methods

**select(`index`: number): Promise<`MixPlaylist` | `null`>**\
**select(`videoId`: string): Promise<`MixPlaylist` | `null`>**

Selects video in the playlist by its `index` or `videoId`. Returns a Promise that resolves to a new `MixPlaylist` instance representing the updated playlist after selection. Original playlist is not changed.

**selectFirst(): Promise<`MixPlaylist` | `null`>**

Convenience method that passes the first item in the playlist to `select()` and returns the result.

**selectLast(): Promise<`MixPlaylist` | `null`>**

Convenience method that passes the last item in the playlist to `select()` and returns the result.

**getSelected(): `MixPlaylistItem`**

Returns a `MixPlaylistItem` object representing the selected item in the playlist. Same as calling `playlist.items[playlist.currentIndex]`.

**getItemsBeforeSelected(): Array<`MixPlaylistItem`>**

Returns playlist items as an array of `MixPlaylistItem` objects up to but not including the selected one.

**getItemsAfterSelected(): Array<`MixPlaylistItem`>**

Returns playlist items as an array of `MixPlaylistItem` objects after the selected one.

## Properties

|Property               |Remark                                           |
|-----------------------|-------------------------------------------------|
|id                     |Id of the Mix playlist                           |
|title                  |                                                 |
|author                 |'YouTube'                                        |
|url                    |Share URL                                        |
|items                  |Array<`MixPlaylistItem`>: videos in the playlist |
|currentIndex           |Index of the selected item                       |
|videoCount             |'50+ ...'                                        |
|thumbnails             |Array<`Thumbnail`>: {url, width, height}         |

Each item in the `items` array is a `MixPlaylistItem` object with the following properties:

|Property               |Remark                                     |
|-----------------------|-------------------------------------------|
|id                     |Video Id                                   |
|title                  |                                           |
|url                    |                                           |
|author                 |`Author`: { name, channelId, url }         |
|selected               |Whether item is selected in the playlist   |
|duration               |                                           |
|thumbnails             |Array<`Thumbnail`>: {url, width, height}   |

## Changelog

1.0.1:
- Fix fetching of continuation data
- Fix silly bug with reading undefined data

1.0.0:
- Rewrite with Typescript and as ESM + CJS hybrid module
- Replace [request](https://github.com/request/request) dependency with [node-fetch](https://github.com/node-fetch/node-fetch) + [fetch-cookie](https://github.com/valeriangalliat/fetch-cookie), as 'request' is deprecated and contains critical vulnerability.
- Changed license to MIT (not that it really affects anything...)

0.1.2-b.2:
- Fix regression bug

0.1.2-b:
- More robust fetching of mix playlists (using continuation tokens if necessary)
- Use semantic versioning from now on

0.1.1b:
- Fix dependencies

0.1.0b:
- Initial release

## License
MIT