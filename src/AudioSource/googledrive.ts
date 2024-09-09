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

import type { AudioSourceBasicJsonFormat, UrlStreamInfo } from ".";

import candyget from "candyget";
import * as htmlEntities from "html-entities";

import { AudioSource } from "./audiosource";
import { getCommandExecutionContext } from "../Commands";
import { requestHead, retrieveHttpStatusCode, retrieveRemoteAudioInfo } from "../Util";
import { DefaultUserAgent } from "../definition";

export class GoogleDrive extends AudioSource<string, AudioSourceBasicJsonFormat> {
  protected resourceUrlCache: UrlStreamInfo | null = null;

  constructor() {
    super({ isCacheable: false });
  }

  async init(url: string, prefetched: AudioSourceBasicJsonFormat | null) {
    const { t } = getCommandExecutionContext();

    if (prefetched) {
      this.title = prefetched.title || t("audioSources.driveStream");
      this.url = url;
      this.lengthSeconds = prefetched.length;
    } else {
      this.title = await GoogleDrive.retriveFilename(url);
      this.url = url;
      if (await retrieveHttpStatusCode(this.url) !== 200) {
        throw new Error(t("urlNotFound"));
      }
      const info = await retrieveRemoteAudioInfo((await this.fetch()).url);
      this.lengthSeconds = info.lengthSeconds || 0;
    }
    return this;
  }

  async fetch(): Promise<UrlStreamInfo> {
    if (this.resourceUrlCache) {
      return this.resourceUrlCache;
    }

    const id = GoogleDrive.getId(this.url);
    let resourceUrl = `https://drive.usercontent.google.com/uc?id=${id}&export=download`;

    this.logger.debug("Fetching resource URL.");
    const { statusCode, headers, body } = await candyget(resourceUrl, "stream", {
      headers: {
        "User-Agent": DefaultUserAgent,
      },
    });
    const contentType = headers["content-type"];
    let canBeWithVideo = !!contentType?.startsWith("video/");

    if (statusCode >= 400 || !contentType) {
      body.destroy();
      throw new Error("The requested resource is not available right now.");
    }

    const isDoc = contentType.startsWith("text/html");

    if (isDoc) {
      this.logger.debug("Resource URL is a document. Reading resource URL from document.");
      const document = await new Promise<string>((resolve, reject) => {
        const buf: Buffer[] = [];
        body
          .on("data", chunk => buf.push(chunk))
          .on("error", reject)
          .on("end", () => {
            resolve(Buffer.concat(buf).toString());
          });
      });
      const { url: actionUrl } = document.match(/action="(?<url>.+?)"/)?.groups || {};
      const resourceUrlObj = new URL(actionUrl);
      for (const match of document.matchAll(/<input type="hidden" name="(?<name>.+?)" value="(?<value>.+?)">/g)) {
        const { name, value } = match.groups!;
        resourceUrlObj.searchParams.set(name, value);
      }

      resourceUrl = resourceUrlObj.toString();

      this.logger.debug("Fetching resource URL to check if it is playable");
      const { statusCode: resourceStatusCode, headers: resourceHeaders } = await requestHead(resourceUrl);
      const resourceContentType = resourceHeaders["content-type"];

      if (
        resourceStatusCode >= 400
        || !resourceContentType
        || (!resourceContentType.startsWith("audio/") && !resourceContentType.startsWith("video/"))
      ) {
        throw new Error("The requested resource is not available right now.");
      }

      canBeWithVideo = !!resourceContentType.startsWith("video/");
    }

    body.destroy();

    return this.resourceUrlCache = {
      type: "url",
      streamType: "unknown",
      url: resourceUrl,
      canBeWithVideo,
    };
  }

  toField(_: boolean) {
    const { t } = getCommandExecutionContext();

    return [
      {
        name: `:asterisk:${t("moreInfo")}`,
        value: t("audioSources.fileInDrive"),
      },
    ];
  }

  npAdditional() {
    return "";
  }

  exportData(): AudioSourceBasicJsonFormat {
    return {
      url: this.url,
      length: this.lengthSeconds,
      title: this.title,
    };
  }

  override purgeCache(): void {
    this.resourceUrlCache = null;
  }

  static validateUrl(url: string) {
    return Boolean(url.match(/^https?:\/\/drive\.google\.com\/file\/d\/([^/?]+)(\/.+)?$/));
  }

  static getId(url: string) {
    const match = url.match(/^https?:\/\/drive\.google\.com\/file\/d\/(?<id>[^/?]+)(\/.+)?$/);
    return match?.groups?.id || null;
  }

  static async retriveFilename(url: string) {
    const source = await candyget.get(url, "string", { maxRedirects: 0 });
    if (source.statusCode !== 200) {
      throw new Error("The requested file is not available right now.");
    }

    const name = source.body.match(/<meta property="og:title" content="(?<name>.+?)">/)?.groups?.name;

    if (!name) {
      throw new Error("Something went wrong while fetching the file data.");
    }

    return htmlEntities.decode(name);
  }
}
