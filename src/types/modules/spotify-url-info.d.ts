/*
 * Copyright 2021-2024 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

declare module "spotify-url-info" {
  export interface Track {
    type: "track";
    name: string;
    uri: string;
    id: id;
    title: string;
    artists: Artist[];
    coverArt: CoverArt;
    releaseDate: ReleaseDate;
    duration: number;
    maxDuration: number;
    isPlayable: boolean;
    isExplicit: boolean;
    audioPreview: AudioPreview;
    hasVideo: boolean;
    relatedEntityUri: string;
  }
  export interface Playlist {
    type: "playlist";
    name: string;
    uri: string;
    id: string;
    title: string;
    subtitle: string;
    coverArt: CoverArt;
    releaseDate: null;
    duration: 0;
    maxDuration: 0;
    isPlayable: boolean;
    isExplicit: boolean;
    hasVideo: boolean;
    relatedEntityUri: string;
    trackList: PlaylistDataTrack[];
  }
  export interface PlaylistDataTrack {
    uri: string;
    uid: string;
    title: string;
    subtitle: string;
    isExplicit: boolean;
    duration: number;
    isPlayable: boolean;
    audioPreview: AudioPreview;
  }
  export interface PlaylistTrack {
    artist: string;
    duration: number;
    name: string;
    previewUrl: string;
    uri: string;
  }
  interface Artist {
    name: string;
    uri: string;
  }
  interface CoverArt {
    extractedColors: ExtractedColors;
    sources: Source[];
  }
  interface ExtractedColors {
    colorDark: Color;
    colorLight: Color;
  }
  interface Color {
    hex: string;
  }
  interface Source {
    url: string;
    width: number;
    height: number;
  }
  interface ReleaseDate {
    isoString: string;
  }
  interface AudioPreview {
    url: string;
    format: string;
  }
  type fetchType = (url: string|URL, opts: { headers: { [key: string]: string } }) => Promise<{ text: () => string|Promise<string> }>;
  type SpotifyUrlInfoClient = {
    getTracks: (url: string) => Promise<PlaylistTrack[]>,
    getData: (url: string) => Promise<Track|Playlist>,
  };
  function SpotifyUrlInfo(fetchImplement: fetchType): SpotifyUrlInfoClient;
  export = SpotifyUrlInfo;
}
