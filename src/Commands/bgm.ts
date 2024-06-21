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

import type { CommandArgs } from ".";
import type { CommandMessage } from "../Component/commandResolver/CommandMessage";

import { BaseCommand } from ".";

export default class Bgm extends BaseCommand {
  constructor(){
    super({
      alias: ["bgm", "study"],
      unlist: false,
      category: "playlist",
      requiredPermissionsOr: [],
      shouldDefer: true,
    });
  }

  @BaseCommand.updateBoundChannel
  async run(message: CommandMessage, context: CommandArgs){
    const { t } = context;

    // attempt to join
    if(!await context.server.joinVoiceChannel(message, { replyOnFail: true })) return;

    // check existing search panel
    if(context.server.searchPanel.has(message.member.id)){
      message.reply(t("search.alreadyOpen")).catch(this.logger.error);
      return;
    }

    const searchPanel = context.server.searchPanel.create(
      message,
      t("commands:bgm.listOfPresetBGM"),
      true
    );
    if(!searchPanel){
      return;
    }
    await searchPanel.consumeSearchResult(
      Promise.resolve(bgms),
      items => items.map(item => ({
        title: item.title,
        author: item.author.name,
        description: `${
          t("length")
        }: ${item.duration}, ${
          t("channelName")
        }: ${item.author.name}`,
        duration: item.duration,
        thumbnail: item.thumbnails[0].url,
        url: item.url,
      })),
    );
  }
}

type BgmItem = {
  title: string,
  author: {
    name: string,
  },
  duration: string,
  thumbnails: [{
    url: string,
  }],
  url: string,
};

const bgms: BgmItem[] = JSON.parse(`[
  {
    "title": "【勉強用・作業用BGM】α波で超集中・記憶力アップ【波の音×オルゴール】",
    "author": {
      "name": "Stardy -河野玄斗の神授業"
    },
    "duration": "2:00:00",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/vr9dLvJs7VE/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=vr9dLvJs7VE"
  },
  {
    "title": "カノン1時間【勉強用・作業用・睡眠用BGM】ピアノ/パッヘルベル/楽譜あり/Canon1hour/Pachelbel /Piano/Instrument Music/CANACANA",
    "author": {
      "name": "CANACANA family"
    },
    "duration": "1:02:39",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/ZrmqqFUVT8Y/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=ZrmqqFUVT8Y"
  },
  {
    "title": "１時間が１５分に感じる超集中 Study Music【勉強集中音楽BGM】",
    "author": {
      "name": "Study JaPan Bmg"
    },
    "duration": "1:01:28",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/ivuUUE1B4cU/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=ivuUUE1B4cU"
  },
  {
    "title": "【作業用 - 勉強用BGM】集中 | 記憶力を向上させる！ヒーリングピアノ曲集 - Study With Me",
    "author": {
      "name": "Japan Study Music "
    },
    "duration": "1:04:57",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/tTB8uoB0I5M/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=tTB8uoB0I5M"
  },
  {
    "title": "ディズニーピアノメドレー【作業用、勉強、睡眠用BGM】Disney Piano Medley for Studying and Sleeping (Piano Covered by kno)",
    "author": {
      "name": "kno Disney Piano Channel"
    },
    "duration": "2:30:36",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/LzhP4S7gV5w/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=LzhP4S7gV5w"
  },
  {
    "title": "ディズニーピアノメドレーVol.2【作業用、勉強、睡眠用BGM】Disney Piano Medley for Studying and Sleeping",
    "author": {
      "name": "kno Disney Piano Channel"
    },
    "duration": "3:31:04",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/O0Sd37i9AEc/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=O0Sd37i9AEc"
  },
  {
    "title": "【雨の音】超集中できる自然音。ポモドーロタイマー６セット｜（25分作業×5分休憩）×6セット【ポモドーロテクニック/作業用BGM/仕事用BGM/勉強用BGM】",
    "author": {
      "name": "マインドキング"
    },
    "duration": "2:57:03",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/UFiztcMoKa8/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=UFiztcMoKa8"
  },
  {
    "title": "【癒し系】ボカロピアノアレンジ【作業用BGM】",
    "author": {
      "name": "EMEProject"
    },
    "duration": "29:52",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/BB-MyQU6URs/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=BB-MyQU6URs"
  },
  {
    "title": "【合格する音楽】サブリミナル効果、合格祈願、勉強、テスト前日、引き寄せの法則、記憶力、受験勉強、ソルフェジオ周波数、音源",
    "author": {
      "name": "癒しのBGM"
    },
    "duration": "1:00:17",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/qGG04UK-DXA/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=qGG04UK-DXA"
  },
  {
    "title": "夢を撃ち抜け！受験勉強用BGM！2022",
    "author": {
      "name": "バンドリちゃんねる☆"
    },
    "duration": "1:04:13",
    "thumbnails": [
      {
        "url": "https://i.ytimg.com/vi/ZLWtxQsmD50/hqdefault.jpg"
      }
    ],
    "url": "https://www.youtube.com/watch?v=ZLWtxQsmD50"
  }
]`);
