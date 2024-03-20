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

import type { Readable } from "stream";

import { spawn } from "child_process";
import fs from "fs";
import path from "path";

import { lock, LockObj } from "@mtripg6666tdr/async-lock";
import candyget from "candyget";
import pEvent from "p-event";

import { LogEmitter } from "../Structure";
import { createPassThrough, requireIfAny } from "../Util";

const ffmpegStatic: string | null = requireIfAny("ffmpeg-static") as typeof import("ffmpeg-static").default;

type BinaryManagerOptions = {
  binaryName: string,
  localBinaryName: string,
  binaryRepo: string,
  checkImmediately: boolean,
  checkVersionArgs?: readonly string[],
  checkUpdateTimeout?: number,
};

// eslint-disable-next-line @typescript-eslint/ban-types
export class BinaryManager extends LogEmitter<{}> {
  protected readonly checkUpdateTimeout = this.options.checkUpdateTimeout || 1000 * 60 /* 1 min */ * 60 /* 1 hour */ * 3/* 3 hour */;
  protected baseUrl = path.join(__dirname, global.BUNDLED ? "../bin" : "../../bin");
  protected lastChecked: number = 0;
  protected releaseInfo: GitHubRelease | null = null;

  get binaryPath(){
    return path.join(this.baseUrl, "./", this.options.localBinaryName + (process.platform === "win32" ? ".exe" : ""));
  }

  get isStaleInfo(){
    return Date.now() - this.lastChecked >= this.checkUpdateTimeout;
  }

  constructor(protected options: Readonly<BinaryManagerOptions>){
    super(`BinaryManager(${options.localBinaryName})`);
    if(!fs.existsSync(this.baseUrl)){
      try{
        fs.mkdirSync(this.baseUrl);
      }
      catch(e){
        this.logger.warn(e);
        this.logger.info("Fallbacking to the root directory");
        this.baseUrl = path.join(__dirname, global.BUNDLED ? "../" : "../../");
      }
    }
    if(options.checkImmediately){
      const latest = this.checkIsLatestVersion();
      if(!latest){
        this.downloadBinary().catch(this.logger.error);
      }
    }
  }

  private readonly getReleaseInfoLocker = new LockObj();
  protected async getReleaseInfo(){
    return lock(this.getReleaseInfoLocker, async () => {
      if(this.releaseInfo && !this.isStaleInfo){
        this.logger.info("Skipping the binary info fetching due to valid info cache found");
        return this.releaseInfo;
      }
      const { body } = await candyget.json<GitHubRelease>(`https://api.github.com/repos/${this.options.binaryRepo}/releases/latest`, {
        headers: {
          "Accept": "application/vnd.github.v3+json",
          "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot",
        },
        validator: (res): res is GitHubRelease => true,
      });
      return this.releaseInfo = body;
    });
  }

  protected async checkIsLatestVersion(){
    this.lastChecked = Date.now();
    if(!fs.existsSync(this.binaryPath)){
      return false;
    }else{
      this.logger.info("Checking the latest version");
      const [latestVersion, currentVersion] = await Promise.all([
        this.getReleaseInfo().then(info => info.tag_name),
        this.exec(this.options.checkVersionArgs || ["--version"]).then(output => output.trim()),
      ]);
      const isLatest = latestVersion === currentVersion;
      this.logger.info(isLatest ? "The binary is latest" : "The binary is stale");
      return isLatest;
    }
  }

  protected async downloadBinary(){
    if(!this.releaseInfo){
      await this.getReleaseInfo();
    }
    const binaryUrl = this.releaseInfo!.assets.find(asset => asset.name === `${this.options.binaryName}${process.platform === "win32" ? ".exe" : ""}`)?.browser_download_url;
    if(!binaryUrl){
      throw new Error("No binary url detected");
    }else{
      this.logger.info("Start downloading the binary");
      const result = await candyget.stream(binaryUrl, {
        headers: {
          "Accept": "*/*",
          "User-Agent": "mtripg6666tdr/Discord-SimpleMusicBot",
        },
      });
      const fileStream = result.body.pipe(fs.createWriteStream(this.binaryPath, {
        mode: 0o777,
      }));
      await Promise.all([
        pEvent(
          result.body,
          "close",
        ),
        pEvent(
          fileStream,
          "close",
        ),
      ]);
      this.lastChecked = Date.now();
      this.logger.info("Finish downloading the binary");
    }
  }

  async exec(args: readonly string[], signal?: AbortSignal): Promise<string>{
    if(!fs.existsSync(this.binaryPath) || this.isStaleInfo){
      const latest = await this.checkIsLatestVersion();
      if(!latest){
        await this.downloadBinary();
      }
    }
    return new Promise((resolve, reject) => {
      try{
        this.logger.info(`Passing arguments: ${args.join(" ")}`);
        const process = spawn(this.binaryPath, args, {
          stdio: ["ignore", "pipe", "pipe"],
          shell: false,
          windowsHide: true,
        });
        let bufs: Buffer[] = [];
        let ended = false;
        const onEnd = () => {
          if(ended) return;
          ended = true;
          resolve(
            Buffer.concat(bufs).toString()
              .trim()
          );
          if(process.connected){
            process.kill("SIGTERM");
          }
        };
        process.stdout.on("data", (chunk: Buffer) => bufs.push(chunk));
        process.stdout.on("end", onEnd);
        process.on("exit", onEnd);
        process.stdout.on("error", err => {
          bufs = null!;
          reject(err);
        });
        process.stderr.on("data", (chunk: Buffer) => this.logger.info(`[Child] ${chunk.toString()}`));
        signal?.addEventListener("abort", () => {
          reject("Aborted");
          process.kill("SIGKILL");
        });
      }
      catch(e){
        reject(e);
      }
    });
  }

  async execStream(args: readonly string[]): Promise<Readable> {
    if(!fs.existsSync(this.binaryPath) || this.isStaleInfo){
      const latest = await this.checkIsLatestVersion();
      if(!latest){
        await this.downloadBinary();
      }
    }

    const stream = createPassThrough();

    setImmediate(() => {
      this.logger.info(`Passing arguments: ${args.join(" ")}`);
      const childProcess = spawn(this.binaryPath, args, {
        stdio: ["ignore", "pipe", "pipe"],
        shell: false,
        windowsHide: true,
        env: {
          ...process.env,
          "TOKEN": "",
          "DB_TOKEN": "",
          "CSE_KEY": "",
          "PATH": ffmpegStatic
            ? `${process.env.PATH}${process.platform === "win32" ? ";" : ":"}${path.join(ffmpegStatic, "..")}`
            : process.env.PATH,
        },
      });
      let ended = false;
      const onEnd = () => {
        if(ended) return;
        ended = true;
        if(childProcess.connected){
          childProcess.kill("SIGKILL");
        }
      };
      childProcess.stdout.pipe(stream);
      childProcess.on("exit", onEnd);
      childProcess.stdout.on("error", err => {
        stream.destroy(err);
      });
      childProcess.stderr.on("data", (chunk: Buffer) => this.logger.info(`[Child] ${chunk.toString()}`));
      stream.on("close", () => {
        if(childProcess.connected){
          childProcess.kill("SIGKILL");
        }
      });
    });

    return stream;
  }
}

// GitHub Release JSON structure generated by QuickType Visual Studio Code Extension
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
