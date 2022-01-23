import type { EmbedField } from "discord.js";
import { UrlStreamInfo } from ".";
import { DownloadText } from "../Util";
import { AudioSource } from "./audiosource"
import { exportableCustom } from "./custom";

export class Hibiki extends AudioSource {
  protected _lengthSeconds = 0;
  protected _serviceIdentifer = "hibiki";
  Thumnail = "";
  private programId = "";
  private radioInfo:HibikiAPIResult;
  private uploadedAt = "";
  private casts = "";
  
  async init(url:string){
    this.Url = url;
    const match = this.Url.match(/^https?:\/\/hibiki-radio.jp\/description\/(?<id>.+)\/detail([\/#].+)?$/);
    this.programId = match.groups.id;
    this.radioInfo = await HibikiApi.getBasicData(this.programId);
    this.Thumnail = this.radioInfo.sp_image_url;
    this.Title = this.radioInfo.episode.program_name + "(" + this.radioInfo.episode.name + ")";
    this._lengthSeconds = Math.floor(this.radioInfo.episode.video.duration);
    this.uploadedAt = this.radioInfo.episode.updated_at;
    this.Description = this.radioInfo.description;
    this.casts = this.radioInfo.cast;
    return this;
  }

  async fetch():Promise<UrlStreamInfo>{
    const playcheck = await HibikiApi.playCheck(this.radioInfo.episode.video.id.toString());
    return {
      type: "url",
      url: playcheck.playlist_url
    };
  }

  toField():EmbedField[]{
    return [
      {
        name: "アップロード日時",
        value: this.uploadedAt,
        inline: false
      },
      {
        name: "キャスト",
        value: this.casts,
        inline: false
      }
    ];
  }

  npAdditional(){
    return "\r\nキャスト: `" + this.casts + "`";
  }

  exportData():exportableCustom{
    return {
      url: this.Url,
      length: this._lengthSeconds,
    };
  }
}

export abstract class HibikiApi {
  static validateURL(url:string):boolean {
    return Boolean(url.match(/^https?:\/\/hibiki-radio.jp\/description\/(.+)\/detail(\/.+)?$/));
  }
  static async getBasicData(programId:string):Promise<HibikiAPIResult>{
    const api = "https://vcms-api.hibiki-radio.jp/api/v1/programs/" + programId;
    return JSON.parse(await DownloadText(api, {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
      "Referer": "https://hibiki-radio.jp/",
      "X-Requested-With": "XMLHttpRequest"
    })) as HibikiAPIResult;
  }
  static async playCheck(videoId:string):Promise<playCheckResult>{
    const playCheckURL = "https://vcms-api.hibiki-radio.jp/api/v1/videos/play_check?video_id=" + videoId;
    console.log(playCheckURL);
    return JSON.parse(await DownloadText(playCheckURL, {
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.101 Safari/537.36",
      "X-Requested-With": "XMLHttpRequest"
    })) as playCheckResult;
  }
}

interface HibikiAPIResult {
  access_id:                 string;
  id:                        number;
  name:                      string;
  name_kana:                 string;
  day_of_week:               number;
  description:               string;
  pc_image_url:              string;
  pc_image_info:             ImageInfo;
  sp_image_url:              string;
  sp_image_info:             ImageInfo;
  onair_information:         string;
  message_form_url:          string;
  email:                     string;
  new_program_flg:           boolean;
  copyright:                 string;
  priority:                  number;
  meta_title:                string;
  meta_keyword:              string;
  meta_description:          string;
  hash_tag:                  string;
  share_text:                string;
  share_url:                 string;
  cast:                      string;
  publish_start_at:          string;
  publish_end_at:            null;
  updated_at:                string;
  latest_episode_id:         number;
  latest_episode_name:       string;
  episode_updated_at:        string;
  update_flg:                boolean;
  episode:                   Episode;
  chapter_flg:               boolean;
  additional_video_flg:      boolean;
  segment_count:             number;
  program_information_count: number;
  product_information_count: number;
  user_favorite_flg:         boolean;
  program_links:             ProgramLink[];
  casts:                     Cast[];
  segments:                  Segment[];
}

interface Cast {
  id:               number;
  name:             string;
  roll_name:        null;
  pc_image_url:     string;
  pc_image_info:    ImageInfo;
  sp_image_url:     string;
  sp_image_info:    ImageInfo;
  publish_start_at: string;
  publish_end_at:   null;
  updated_at:       string;
}

interface ImageInfo {
  width:  number;
  height: number;
}

interface Episode {
  id:               number;
  program_id:       number;
  program_name:     string;
  name:             string;
  media_type:       number;
  video:            Video;
  additional_video: Video;
  html_description: string;
  link_url:         string;
  updated_at:       string;
  episode_parts:    ProgramLink[];
  chapters:         ProgramLink[];
}

interface Video {
  id:                number;
  duration:          number;
  live_flg:          boolean;
  delivery_start_at: null;
  delivery_end_at:   null;
  dvr_flg:           boolean;
  replay_flg:        boolean;
  media_type:        number;
}

interface ProgramLink {
  id:            number;
  start_time?:   number;
  pc_image_url:  string;
  pc_image_info: ImageInfo | null;
  sp_image_url:  string;
  sp_image_info: ImageInfo | null;
  name?:         string;
  description?:  string;
  sort_order?:   number | null;
  updated_at?:   string;
  link_url?:     string;
}

interface Segment {
  id:               number;
  name:             string;
  segment_parts:    ProgramLink[];
  html_description: string;
  publish_start_at: string;
  publish_end_at:   null;
  updated_at:       string;
}

interface playCheckResult {
    token:        string;
    playlist_url: string;
}