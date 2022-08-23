import type { exportableYouTube } from "..";
import type { ReadableStreamInfo, UrlStreamInfo } from "../../audiosource";
import type { Cache } from "./base";

import { exec } from "child_process";

import m3u8stream from "m3u8stream";

import { Util } from "../../../Util";
import { Strategy } from "./base";

type youtubeDl = "youtubeDl";
const youtubeDl:youtubeDl = "youtubeDl";

export class youtubeDlStrategy extends Strategy<Cache<youtubeDl, YoutubeDlInfo>, YoutubeDlInfo> {
  get cacheType(){
    return youtubeDl;
  }
  
  last:number = 0;

  async getInfo(url:string){
    this.useLog();
    const t = Util.time.timer.start(`YouTube(Strategy${this.priority})#getInfo`);
    let info = null as YoutubeDlInfo;
    try{
      info = JSON.parse(await this.getYouTubeDlInfo(url)) as YoutubeDlInfo;
    }
    finally{
      t.end(this.logger);
    }
    return {
      data: this.mapToExportable(url, info),
      cache: {
        type: youtubeDl,
        data: info,
      }
    };
  }

  async fetch(url: string, forceUrl:boolean = false, cache?: Cache<any, any>){
    this.useLog();
    const t = Util.time.timer.start(`YouTube(Strategy${this.priority})#fetch`);
    let info = null as YoutubeDlInfo;
    try{
      const availableCache = cache?.type === youtubeDl && cache.data as YoutubeDlInfo;
      this.logger(`[AudioSource:youtube] ${availableCache ? "using cache without obtaining" : "obtaining info"}`);
      info = availableCache || JSON.parse(await this.getYouTubeDlInfo(url)) as YoutubeDlInfo;
    }
    finally{
      t.end(this.logger);
    }
    const partialResult = {
      info: this.mapToExportable(url, info),
      relatedVideos: null as exportableYouTube[],
    };
    if(info.is_live){
      const format = info.formats.filter(f => f.format_id === info.format_id);
      if(forceUrl){
        return {
          ...partialResult,
          stream: {
            type: "url",
            url: format[0].url,
          } as UrlStreamInfo
        };
      }
      // don't use initpassthrough here
      const stream = Util.general.InitPassThrough();
      const req = m3u8stream(format[0].url, {
        begin: Date.now(),
        parser: "m3u8",
      });
      req
        .on("error", e => stream.emit("error", e))
        .pipe(stream)
        .on("error", e => stream.emit("error", e))
      ;
      return {
        ...partialResult,
        stream: {
          type: "readable",
          stream,
        } as ReadableStreamInfo
      };
    }else{
      const format = info.formats.filter(f => f.format_note === "tiny");
      if(format.length === 0) throw new Error("no format found!");
      format.sort((fa, fb) => fb.abr - fa.abr);
      return {
        ...partialResult,
        stream: {
          type: "url",
          url: format[0].url
        } as UrlStreamInfo
      };
    }
  }

  private readonly debugLog = (content:string) => {
    if(Util.config.debug){
      this.logger("[YouTube(fallback)]" + content.replace(/\n/g, ""), "debug");
    }
  };

  protected mapToExportable(url:string, info:YoutubeDlInfo):exportableYouTube{
    return {
      url: url,
      title: info.title,
      description: info.description,
      length: Number(info.duration),
      channel: info.channel,
      channelUrl: info.channel_url,
      thumbnail: info.thumbnail,
      isLive: info.is_live,
    };
  }

  private execAsync(command:string):Promise<string>{
    return new Promise((resolve, reject) => {
      try{
        const id = Date.now();
        this.debugLog(`Executing the following command(#${id}): ${command}`);
        exec(command, (error, stdout, stderr) => {
          if(error){
            this.debugLog(`Command execution #${id} failed: ${stderr}`);
            reject(stderr);
          }else{
            this.debugLog(`Command execution #${id} ends successfully: ${stdout}`);
            resolve(stdout);
          }
        });
      }
      catch(e){
        this.logger(e, "error");
        reject("Main library threw an error and fallback library also threw an error");
      }
    });
  }

  private async dlbinary(ver:string){
    const releases = JSON.parse(await Util.web.DownloadText("https://api.github.com/repos/ytdl-org/youtube-dl/releases/latest", {
      "Accept": "application/vnd.github.v3+json",
      "User-Agent": "Discord-SimpleMusicBot"
    })) as GitHubRelease;
    this.debugLog(`Latest: ${releases.tag_name}`);
    if(ver !== releases.tag_name){
      this.debugLog("Start downloading");
      await this.execAsync("curl -L -o \"youtube-dl" + (process.platform === "win32" ? ".exe" : "") + "\" " + releases.assets.filter(a => a.name === (process.platform === "win32" ? "youtube-dl.exe" : "youtube-dl"))[0].browser_download_url);
      if(process.platform !== "win32"){
        this.debugLog("Configuring permission");
        await this.execAsync("chmod 777 youtube-dl");
      }
    }
    this.last = Date.now();
  }

  private async getYouTubeDlInfo(url:string):Promise<Promise<string>>{
    try{
      let version = "";
      try{
        const buf = await this.execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --version");
        version = buf.trim();
      }
      catch(e){
        await this.dlbinary("");
      }
      if(new Date().getTime() - this.last >= 1000 * 60 /*1sec*/ * 60 /*1min*/ * 60 /*1hour*/ * 3){
        await this.dlbinary(version);
      }
      return await this.execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --skip-download --print-json \"" + url + "\"");
    }
    catch(e){
      // eslint-disable-next-line @typescript-eslint/no-throw-literal
      throw "Main library threw an error and fallback library was not found or occurred an error";
    }
  }
}

// QuickType of youtube-dl json
export interface YoutubeDlInfo {
  id: string;
  title: string;
  formats: Format[];
  thumbnails: Thumbnail[];
  description: string;
  upload_date: string;
  uploader: string;
  uploader_id: string;
  uploader_url: string;
  channel_id: string;
  channel_url: string;
  duration: number;
  view_count: number;
  average_rating: number;
  age_limit: number;
  webpage_url: string;
  categories: string[];
  tags: string[];
  is_live: null;
  automatic_captions: { [key: string]: any[] };
  subtitles: any;
  like_count: number;
  dislike_count: number;
  channel: string;
  track: string;
  artist: string;
  album: string;
  creator: string;
  alt_title: string;
  extractor: string;
  webpage_url_basename: string;
  extractor_key: string;
  playlist: null;
  playlist_index: null;
  thumbnail: string;
  display_id: string;
  requested_subtitles: null;
  requested_formats: Format[];
  format: string;
  format_id: string;
  width: number;
  height: number;
  resolution: null;
  fps: number;
  vcodec: string;
  vbr: number;
  stretched_ratio: null;
  acodec: Acodec;
  abr: number;
  ext: TempEXT;
  fulltitle: string;
  _filename: string;
}

enum Acodec {
  Mp4A402 = "mp4a.40.2",
  None = "none",
  Opus = "opus"
}

enum TempEXT {
  M4A = "m4a",
  Mp4 = "mp4",
  Webm = "webm"
}

interface Format {
  asr: number | null;
  filesize: number;
  format_id: string;
  format_note: string;
  fps: number | null;
  height: number | null;
  quality: number;
  tbr: number;
  url: string;
  width: number | null;
  ext: TempEXT;
  vcodec: string;
  acodec: Acodec;
  abr?: number;
  downloader_options?: DownloaderOptions;
  container?: Container;
  format: string;
  protocol: Protocol;
  http_headers: HTTPHeaders;
  vbr?: number;
}

enum Container {
  M4ADash = "m4a_dash",
  Mp4Dash = "mp4_dash",
  WebmDash = "webm_dash"
}

interface DownloaderOptions {
  http_chunk_size: number;
}

interface HTTPHeaders {
  "User-Agent": string;
  "Accept-Charset": AcceptCharset;
  Accept: Accept;
  "Accept-Encoding": AcceptEncoding;
  "Accept-Language": AcceptLanguage;
}

enum Accept {
  TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

enum AcceptCharset {
  ISO88591UTF8Q07Q07 = "ISO-8859-1,utf-8;q=0.7,*;q=0.7"
}

enum AcceptEncoding {
  GzipDeflate = "gzip, deflate"
}

enum AcceptLanguage {
  EnUsEnQ05 = "en-us,en;q=0.5"
}

enum Protocol {
  HTTPS = "https"
}

interface Thumbnail {
  height: number;
  url: string;
  width: number;
  resolution: string;
  id: string;
}

// QuickType of GitHub Releases API
interface GitHubRelease {
  url: string;
  assets_url: string;
  upload_url: string;
  html_url: string;
  id: number;
  author: Author;
  node_id: string;
  tag_name: string;
  target_commitish: any;
  name: string;
  draft: boolean;
  prerelease: boolean;
  created_at: string;
  published_at: string;
  assets: Asset[];
  tarball_url: string;
  zipball_url: string;
  body: string;
  reactions?: Reactions;
}

export interface Asset {
  url: string;
  id: number;
  node_id: string;
  name: string;
  label: string;
  uploader: Author;
  content_type: ContentType;
  state: State;
  size: number;
  download_count: number;
  created_at: string;
  updated_at: string;
  browser_download_url: string;
}

export enum ContentType {
  ApplicationOctetStream = "application/octet-stream",
  ApplicationPGPSignature = "application/pgp-signature",
  ApplicationXTar = "application/x-tar"
}

export enum State {
  Uploaded = "uploaded"
}

export interface Author {
  login: any;
  id: number;
  node_id: any;
  avatar_url: string;
  gravatar_id: string;
  url: string;
  html_url: string;
  followers_url: string;
  following_url: any;
  gists_url: any;
  starred_url: any;
  subscriptions_url: string;
  organizations_url: string;
  repos_url: string;
  events_url: any;
  received_events_url: string;
  type: Type;
  site_admin: boolean;
}

enum Type {
  User = "User"
}

interface Reactions {
  url: string;
  total_count: number;
  "+1": number;
  "-1": number;
  laugh: number;
  hooray: number;
  confused: number;
  heart: number;
  rocket: number;
  eyes: number;
}
