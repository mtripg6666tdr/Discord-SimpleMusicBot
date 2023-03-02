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

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import candyget from "candyget";
import { pEvent } from "p-event";

import { LogEmitter } from "../Structure";

type BinaryManagerOptions = {
  binaryName:string,
  binaryRepo:string,
  checkImmediately:boolean,
  checkVersionArgs?:readonly string[],
};

export class BinaryManager extends LogEmitter {
  protected baseUrl = path.join(__dirname, "../../bin");
  protected lastChecked:number = 0;
  protected releaseInfo:GitHubRelease = null;

  get binaryPath(){
    return path.join(this.baseUrl, "./", this.options.binaryName);
  }

  constructor(protected options:Readonly<BinaryManagerOptions>){
    super({
      captureRejections: true,
    });
    this.setTag(`BinaryManager(${options.binaryName})`);
    if(!fs.existsSync(this.baseUrl)){
      try{
        fs.mkdirSync(this.baseUrl);
      }
      catch(e){
        this.Log(e, "warn");
        this.Log("Fallbacking to the root directory");
        this.baseUrl = path.join(__dirname, "../../");
      }
    }
    if(options.checkImmediately){
      this.checkIsLatestVersion();
    }
  }

  async checkIsLatestVersion(){
    this.lastChecked = Date.now();
    if(!fs.existsSync(this.binaryPath)){
      return false;
    }else{
      const [latestVersion, currentVersion] = await Promise.all([
        candyget.json<GitHubRelease>(`https://api.github.com/repos/${this.options.binaryRepo}/releases/latest`, {
          headers: {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot"
          },
          validator: (res): res is GitHubRelease => true,
        }).then(r => (this.releaseInfo = r.body).tag_name),
        this.exec(this.options.checkVersionArgs || ["--version"]).then(output => output.trim()),
      ]);
      return latestVersion === currentVersion;
    }
  }

  async downloadBinary(){
    const binaryUrl = this.releaseInfo.assets.find(asset => asset.name === `${this.options.binaryName}${process.platform === "win32" ? ".exe" : ""}`)?.browser_download_url;
    if(!binaryUrl){
      throw new Error("No binary url detected");
    }else{
      const result = await candyget.stream(binaryUrl, {
        headers: {
          "Accept": "*/*",
          "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot"
        }
      });
      await pEvent(
        result.body.pipe(fs.createWriteStream(this.binaryPath, {
          mode: 0o777,
        })),
        "end"
      );
    }
  }

  exec(args:readonly string[]):Promise<string>{
    return new Promise((resolve, reject) => {
      const process = spawn(this.binaryPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        windowsHide: true,
      });
      let bufs:Buffer[] = [];
      let ended = false;
      const onEnd = () => {
        if(ended) return;
        ended = true;
        resolve(Buffer.concat(bufs).toString());
      };
      process.stdout.on("data", (chunk:Buffer) => bufs.push(chunk));
      process.stdout.on("end", onEnd);
      process.on("exit", onEnd);
      process.stdout.on("error", err => {
        bufs = null;
        reject(err);
      });
      process.stderr.on("data", (chunk:Buffer) => this.Log(`[Child] ${chunk.toString()}`));
    });
  }
}

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
