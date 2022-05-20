import type { KnownAudioSourceIdentifer } from "../Component/QueueManager";
import * as ytdl from "ytdl-core";
import * as AudioSource from ".";
import { Util } from "../Util";

type AudioSourceBasicInfo = {
  type: KnownAudioSourceIdentifer;
  url: string;
  knownData: AudioSource.exportableCustom;
  forceCache: boolean;
}

export async function Resolve(info:AudioSourceBasicInfo){
  let basicInfo = null as AudioSource.AudioSource;
  const {type, url, knownData:gotData, forceCache: cache} = info;
  if(type === "youtube" || (type === "unknown" && ytdl.validateURL(url))){
    // youtube
    basicInfo = await AudioSource.initYouTube(url, gotData as AudioSource.exportableYouTube, cache);
  }else if(type === "custom" || (type === "unknown" && Util.fs.isAvailableRawAudioURL(url))){
    // カスタムストリーム
    basicInfo = await new AudioSource.CustomStream().init(url);
  }else if(type === "soundcloud" || AudioSource.SoundCloudS.validateUrl(url)){
    // soundcloud
    basicInfo = await new AudioSource.SoundCloudS().init(url, gotData as AudioSource.exportableSoundCloud);
  }else if(type === "unknown"){
    // google drive
    if(AudioSource.GoogleDrive.validateUrl(url)){
      basicInfo = await new AudioSource.GoogleDrive().init(url);
    }else if(AudioSource.StreamableApi.getVideoId(url)){
      // Streamable
      basicInfo = await new AudioSource.Streamable().init(url, gotData as AudioSource.exportableStreamable);
    }else if(AudioSource.BestdoriApi.getAudioId(url)){
      // Bestdori
      basicInfo = await new AudioSource.BestdoriS().init(url, gotData as AudioSource.exportableBestdori);
    }else if(AudioSource.HibikiApi.validateURL(url)){
      // Hibiki
      basicInfo = await new AudioSource.Hibiki().init(url);
    }else if(AudioSource.NicoNicoS.validateUrl(url)){
      // NicoNico
      basicInfo = await new AudioSource.NicoNicoS().init(url, gotData as AudioSource.exportableNicoNico);
    }
  }

  return basicInfo;
}