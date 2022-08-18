import { exec } from "child_process";
import { Util } from "../Util";

const log = (content:string) => {
  if(Util.config.debug){
    Util.logger.log("[YouTube(fallback)]" + content.replace(/\n/g, ""));
  }
};

export function execAsync(command:string):Promise<string>{
  return new Promise((resolve, reject) => {
    try{
      const id = Date.now();
      log(`Executing the following command(#${id}): ${command}`);
      exec(command, (error, stdout, stderr) => {
        if(error){
          log(`Command execution #${id} failed: ${stderr}`);
          reject(stderr);
        }else{
          log(`Command execution #${id} ends successfully: ${stdout}`);
          resolve(stdout);
        }
      });
    }
    catch(e){
      Util.logger.log(e, "error");
      reject("Main library threw an error and fallback library also threw an error");
    }
  });
}

async function dlbinary(ver:string){
  const releases = JSON.parse(await Util.web.DownloadText("https://api.github.com/repos/ytdl-org/youtube-dl/releases/latest", {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "Discord-SimpleMusicBot"
  })) as GitHubRelease;
  log(`Latest: ${releases.tag_name}`);
  if(ver !== releases.tag_name){
    log(`Start downloading`);
    await execAsync("curl -L -o \"youtube-dl" + (process.platform === "win32" ? ".exe" : "") + "\" " + releases.assets.filter(a => a.name === (process.platform === "win32" ? "youtube-dl.exe" : "youtube-dl"))[0].browser_download_url);
    if(process.platform !== "win32"){
      log("Configuring permission");
      await execAsync("chmod 777 youtube-dl");
    }
  }
  ytdlUpdateCheck.last = new Date();
}

export async function getYouTubeDlInfo(url:string):Promise<Promise<string>>{
  try{
    let version = "";
    try{
      const buf = await execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --version");
      version = buf.trim();
    }
    catch(e){
      await dlbinary("");
    }
    if(new Date().getTime() - ytdlUpdateCheck.last.getTime() >= 1000 * 60 /*1sec*/ * 60 /*1min*/ * 60 /*1hour*/ * 3){
      await dlbinary(version);
    }
    return execAsync("." + (process.platform === "win32" ? "\\" : "/") + "youtube-dl --skip-download --print-json \"" + url + "\"");
  }
  catch(e){
    throw "Main library threw an error and fallback library was not found or occurred an error";
  }
}

class ytdlUpdateCheckData {
  last:Date = new Date(0);
}
export const ytdlUpdateCheck = new ytdlUpdateCheckData();

// QuickType of youtube-dl json
export interface YoutubeDlInfo {
  id:                   string;
  title:                string;
  formats:              Format[];
  thumbnails:           Thumbnail[];
  description:          string;
  upload_date:          string;
  uploader:             string;
  uploader_id:          string;
  uploader_url:         string;
  channel_id:           string;
  channel_url:          string;
  duration:             number;
  view_count:           number;
  average_rating:       number;
  age_limit:            number;
  webpage_url:          string;
  categories:           string[];
  tags:                 string[];
  is_live:              null;
  automatic_captions:   { [key: string]: AutomaticCaption[] };
  subtitles:            Subtitles;
  like_count:           number;
  dislike_count:        number;
  channel:              string;
  track:                string;
  artist:               string;
  album:                string;
  creator:              string;
  alt_title:            string;
  extractor:            string;
  webpage_url_basename: string;
  extractor_key:        string;
  playlist:             null;
  playlist_index:       null;
  thumbnail:            string;
  display_id:           string;
  requested_subtitles:  null;
  requested_formats:    Format[];
  format:               string;
  format_id:            string;
  width:                number;
  height:               number;
  resolution:           null;
  fps:                  number;
  vcodec:               string;
  vbr:                  number;
  stretched_ratio:      null;
  acodec:               Acodec;
  abr:                  number;
  ext:                  TempEXT;
  fulltitle:            string;
  _filename:            string;
}

enum Acodec {
  Mp4A402 = "mp4a.40.2",
  None = "none",
  Opus = "opus",
}

interface AutomaticCaption {
  ext: AutomaticCaptionEXT;
  url: string;
}

enum AutomaticCaptionEXT {
  Srv1 = "srv1",
  Srv2 = "srv2",
  Srv3 = "srv3",
  Ttml = "ttml",
  Vtt = "vtt",
}

enum TempEXT {
  M4A = "m4a",
  Mp4 = "mp4",
  Webm = "webm",
}

interface Format {
  asr:                 number | null;
  filesize:            number;
  format_id:           string;
  format_note:         string;
  fps:                 number | null;
  height:              number | null;
  quality:             number;
  tbr:                 number;
  url:                 string;
  width:               number | null;
  ext:                 TempEXT;
  vcodec:              string;
  acodec:              Acodec;
  abr?:                number;
  downloader_options?: DownloaderOptions;
  container?:          Container;
  format:              string;
  protocol:            Protocol;
  http_headers:        HTTPHeaders;
  vbr?:                number;
}

enum Container {
  M4ADash = "m4a_dash",
  Mp4Dash = "mp4_dash",
  WebmDash = "webm_dash",
}

interface DownloaderOptions {
  http_chunk_size: number;
}

interface HTTPHeaders {
  "User-Agent":      string;
  "Accept-Charset":  AcceptCharset;
  Accept:            Accept;
  "Accept-Encoding": AcceptEncoding;
  "Accept-Language": AcceptLanguage;
}

enum Accept {
  TextHTMLApplicationXHTMLXMLApplicationXMLQ09Q08 = "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
}

enum AcceptCharset {
  ISO88591UTF8Q07Q07 = "ISO-8859-1,utf-8;q=0.7,*;q=0.7",
}

enum AcceptEncoding {
  GzipDeflate = "gzip, deflate",
}

enum AcceptLanguage {
  EnUsEnQ05 = "en-us,en;q=0.5",
}

enum Protocol {
  HTTPS = "https",
}

interface Subtitles {
}

interface Thumbnail {
  height:     number;
  url:        string;
  width:      number;
  resolution: string;
  id:         string;
}


// QuickType of GitHub Releases API
interface GitHubRelease {
  url:              string;
  assets_url:       string;
  upload_url:       string;
  html_url:         string;
  id:               number;
  author:           Author;
  node_id:          string;
  tag_name:         string;
  target_commitish: any;
  name:             string;
  draft:            boolean;
  prerelease:       boolean;
  created_at:       string;
  published_at:     string;
  assets:           Asset[];
  tarball_url:      string;
  zipball_url:      string;
  body:             string;
  reactions?:       Reactions;
}

export interface Asset {
  url:                  string;
  id:                   number;
  node_id:              string;
  name:                 string;
  label:                string;
  uploader:             Author;
  content_type:         ContentType;
  state:                State;
  size:                 number;
  download_count:       number;
  created_at:           string;
  updated_at:           string;
  browser_download_url: string;
}

export enum ContentType {
  ApplicationOctetStream = "application/octet-stream",
  ApplicationPGPSignature = "application/pgp-signature",
  ApplicationXTar = "application/x-tar",
}

export enum State {
  Uploaded = "uploaded",
}

export interface Author {
  login:               any;
  id:                  number;
  node_id:             any;
  avatar_url:          string;
  gravatar_id:         string;
  url:                 string;
  html_url:            string;
  followers_url:       string;
  following_url:       any;
  gists_url:           any;
  starred_url:         any;
  subscriptions_url:   string;
  organizations_url:   string;
  repos_url:           string;
  events_url:          any;
  received_events_url: string;
  type:                Type;
  site_admin:          boolean;
}

enum Type {
  User = "User",
}

interface Reactions {
  url:         string;
  total_count: number;
  "+1":        number;
  "-1":        number;
  laugh:       number;
  hooray:      number;
  confused:    number;
  heart:       number;
  rocket:      number;
  eyes:        number;
}
