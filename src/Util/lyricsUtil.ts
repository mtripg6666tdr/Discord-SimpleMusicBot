import * as https from "https";
import { DownloadText, htmlEntities } from "./util";

export async function GetLyrics(keyword:string):Promise<songInfo>{
  const data = JSON.parse(await DownloadText("https://customsearch.googleapis.com/customsearch/v1?cx=89ebccacdc32461f2&key=" + process.env.CSE_KEY + "&q=" + encodeURIComponent(keyword))) as CSE_Result;
  if(data.items.length===0) throw "No results found";
  const url = data.items[0].link;
  var doc:string;
  var lyric = await DownloadWithoutRuby(url);
  lyric = htmlEntities(lyric, "decode");
  [doc, lyric] = lyric.split("<div class=\"hiragana\" >");
  [lyric, ] = lyric.split("</div>");
  lyric = lyric.replace(/<span class="rt rt_hidden">.+?<\/span>/g, "");
  lyric = lyric.replace(/\n/g, "");
  lyric = lyric.replace(/<br \/>/g, "\n");
  lyric = lyric.replace(/[\r\n]{2}/g, "\n");
  lyric = lyric.replace(/<.+?>/g, "");
  const match = doc.match(/<meta name="description" content="(?<artist>.+?)が歌う(?<title>.+)の歌詞ページ.+です。.+">/);
  return {
    lyric: lyric,
    artist: decodeURIComponent(match.groups.artist),
    title: decodeURIComponent(match.groups.title)
  };
}

function DownloadWithoutRuby(url:string):Promise<string>{
  return new Promise((resolve,reject)=>{
    const durl = new URL(url);
    const req = https.request({
      protocol: durl.protocol,
      host: durl.host,
      path: durl.pathname,
      method: "GET",
      headers: {
        "Cookie": "lyric_ruby=off;"
      }
    }, res => {
      var data = "";
      res.on("data", (chunk)=>{
        data += chunk;
      });
      res.on("end", ()=>{
        resolve(data);
      });
      res.on("error", reject);
    }).on("error", reject);
    req.end();
  });
}

type songInfo = {
  lyric:string;
  artist:string;
  title:string;
}

export interface CSE_Result {
  kind:              string;
  url:               URL;
  queries:           Queries;
  context:           Context;
  searchInformation: SearchInformation;
  items:             Item[];
}

export interface Context {
  title: string;
}

export interface Item {
  kind:             Kind;
  title:            string;
  htmlTitle:        string;
  link:             string;
  displayLink:      DisplayLink;
  snippet:          string;
  htmlSnippet:      string;
  cacheId:          string;
  formattedUrl:     string;
  htmlFormattedUrl: string;
  pagemap:          Pagemap;
}

export enum DisplayLink {
  UtatenCOM = "utaten.com",
}

export enum Kind {
  CustomsearchResult = "customsearch#result",
}

export interface Pagemap {
  cse_thumbnail?: CSEThumbnail[];
  metatags:       { [key: string]: string }[];
  cse_image:      CSEImage[];
  listitem?:      Listitem[];
  Article?:       Article[];
}

export interface Article {
  datePublished: string;
  image:         string;
  itemtype:      string;
  description:   string;
  dateModified:  string;
  headline:      string;
}

export interface CSEImage {
  src: string;
}

export interface CSEThumbnail {
  src:    string;
  width:  string;
  height: string;
}

export interface Listitem {
  item:     string;
  name:     string;
  position: string;
}

export interface Queries {
  request: Request[];
}

export interface Request {
  title:          string;
  totalResults:   string;
  searchTerms:    string;
  count:          number;
  startIndex:     number;
  inputEncoding:  string;
  outputEncoding: string;
  safe:           string;
  cx:             string;
}

export interface SearchInformation {
  searchTime:            number;
  formattedSearchTime:   string;
  totalResults:          string;
  formattedTotalResults: string;
}

export interface URL {
  type:     string;
  template: string;
}
