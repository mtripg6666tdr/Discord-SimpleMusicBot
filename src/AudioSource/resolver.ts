/*
 * Copyright 2021-2023 mtripg6666tdr
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
import type { i18n } from "i18next";

import * as AudioSource from ".";
import { isAvailableRawAudioURL } from "../Util";
import { useConfig } from "../config";
import { getLogger } from "../logger";

type AudioSourceBasicInfo = {
  type: KnownAudioSourceIdentifer,
  url: string,
  knownData: AudioSource.exportableCustom,
  forceCache: boolean,
};

const { isDisabledSource } = useConfig();
const logger = getLogger("Resolver");

export async function resolve(info: AudioSourceBasicInfo, cacheManager: SourceCache, preventSourceCache: boolean, t: i18n["t"]){
  let basicInfo = null as AudioSource.AudioSource<any>;

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
    basicInfo = await AudioSource.initYouTube(url, gotData as AudioSource.exportableYouTube, cache);
  }else if(!isDisabledSource("custom") && (type === "custom" || type === "unknown" && isAvailableRawAudioURL(url))){
    // カスタムストリーム
    basicInfo = await new AudioSource.CustomStream().init(url, info.knownData, t);
  }else if(!isDisabledSource("soundcloud") && (type === "soundcloud" || AudioSource.SoundCloudS.validateUrl(url))){
    // soundcloud
    basicInfo = await new AudioSource.SoundCloudS().init(url, gotData as AudioSource.exportableSoundCloud);
  }else if(!isDisabledSource("spotify") && (type === "spotify" || AudioSource.Spotify.validateTrackUrl(url)) && AudioSource.Spotify.available){
    // spotify
    basicInfo = await new AudioSource.Spotify().init(url, gotData as AudioSource.exportableSpotify);
  }else if(type === "unknown"){
    // google drive
    if(!isDisabledSource("googledrive") && AudioSource.GoogleDrive.validateUrl(url)){
      basicInfo = await new AudioSource.GoogleDrive().init(url, info.knownData, t);
    }else if(!isDisabledSource("streamable") && AudioSource.StreamableApi.getVideoId(url)){
      // Streamable
      basicInfo = await new AudioSource.Streamable().init(url, gotData as AudioSource.exportableStreamable);
    }else if(process.env.BD_ENABLE && AudioSource.BestdoriApi.instance.getAudioId(url)){
      // Bestdori
      basicInfo = await new AudioSource.BestdoriS().init(url, gotData as AudioSource.exportableBestdori);
    }else if(process.env.HIBIKI_ENABLE && AudioSource.HibikiApi.validateURL(url)){
      // Hibiki
      basicInfo = await new AudioSource.Hibiki().init(url);
    }else if(!isDisabledSource("niconico") && AudioSource.NicoNicoS.validateUrl(url)){
      // NicoNico
      basicInfo = await new AudioSource.NicoNicoS().init(url, gotData as AudioSource.exportableNicoNico, t);
    }else if(!isDisabledSource("twitter") && AudioSource.Twitter.validateUrl(url)){
      // Twitter
      basicInfo = await new AudioSource.Twitter().init(url, gotData as AudioSource.exportableTwitter, t);
    }
  }

  if(preventSourceCache){
    logger.debug("Skipping source-caching due to private source");
  }else if(basicInfo && !isNaN(basicInfo.lengthSeconds) && !basicInfo.unableToCache){
    cacheManager.addSource(basicInfo, fromPersistentCache);
  }

  return basicInfo;
}
