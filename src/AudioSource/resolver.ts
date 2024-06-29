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

import type { KnownAudioSourceIdentifer } from "../Component/queueManager";
import type { SourceCache } from "../Component/sourceCache";

import * as AudioSource from ".";
import { getResourceTypeFromUrl } from "../Util";
import { getConfig } from "../config";
import { getLogger } from "../logger";

type AudioSourceBasicInfo = {
  type: KnownAudioSourceIdentifer,
  url: string,
  knownData: AudioSource.AudioSourceBasicJsonFormat | null,
  forceCache: boolean,
};

const { isDisabledSource } = getConfig();
const logger = getLogger("Resolver");

export async function resolve(info: AudioSourceBasicInfo, cacheManager: SourceCache, preventSourceCache: boolean){
  let basicInfo: AudioSource.AudioSource<any, any> | null = null;

  const type = info.type;
  const url = info.url;
  const cache = info.forceCache;
  let gotData = info.knownData;
  let fromPersistentCache = !!gotData;

  if(cacheManager.hasSource(url)){
    logger.debug("cache found");
    return cacheManager.getSource(url);
  }else if(!gotData && cacheManager.hasExportable(url)){
    gotData = await cacheManager.getExportable(url);
    if(gotData){
      logger.debug("exportable cache found");
      fromPersistentCache = true;
    }
  }

  if(gotData){
    logger.debug("initializing source with cache");
  }else{
    logger.debug("initializing source from scratch");
  }

  if(!isDisabledSource("youtube") && (type === "youtube" || type === "unknown" && AudioSource.YouTube.validateURL(url))){
    // youtube
    basicInfo = await AudioSource.initYouTube(url, gotData as AudioSource.YouTubeJsonFormat, cache);
  }else if(!isDisabledSource("custom") && (type === "custom" || type === "unknown" && getResourceTypeFromUrl(url) !== "none")){
    // カスタムストリーム
    basicInfo = await new AudioSource.CustomStream().init(url, info.knownData);
  }else if(!isDisabledSource("soundcloud") && (type === "soundcloud" || AudioSource.SoundCloudS.validateUrl(url))){
    // soundcloud
    basicInfo = await new AudioSource.SoundCloudS().init(url, gotData as AudioSource.SoundcloudJsonFormat);
  }else if(!isDisabledSource("spotify") && (type === "spotify" || AudioSource.Spotify.validateTrackUrl(url)) && AudioSource.Spotify.available){
    // spotify
    basicInfo = await new AudioSource.Spotify().init(url, gotData as AudioSource.SpotifyJsonFormat);
  }else if(type === "unknown"){
    // google drive
    if(!isDisabledSource("googledrive") && AudioSource.GoogleDrive.validateUrl(url)){
      basicInfo = await new AudioSource.GoogleDrive().init(url, info.knownData);
    }else if(!isDisabledSource("streamable") && AudioSource.StreamableApi.getVideoId(url)){
      // Streamable
      basicInfo = await new AudioSource.Streamable().init(url, gotData as AudioSource.StreamableJsonFormat);
    }else if(process.env.BD_ENABLE && AudioSource.BestdoriApi.instance.getAudioId(url)){
      // Bestdori
      basicInfo = await new AudioSource.BestdoriS().init(url, gotData as AudioSource.BestdoriJsonFormat);
    }else if(!isDisabledSource("niconico") && AudioSource.NicoNicoS.validateUrl(url)){
      // NicoNico
      basicInfo = await new AudioSource.NicoNicoS().init(url, gotData as AudioSource.NiconicoJsonFormat);
    }else if(!isDisabledSource("twitter") && AudioSource.Twitter.validateUrl(url)){
      // Twitter
      basicInfo = await new AudioSource.Twitter().init(url, gotData as AudioSource.TwitterJsonFormat);
    }
  }

  if(preventSourceCache){
    logger.debug("Skipping source-caching due to private source");
  }else if(basicInfo && !isNaN(basicInfo.lengthSeconds) && basicInfo.isCachable){
    cacheManager.addSource(basicInfo, fromPersistentCache);
  }

  return basicInfo;
}
