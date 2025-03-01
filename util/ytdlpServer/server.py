#!/usr/bin/env python3
"""
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
"""
from aioconsole import get_standard_streams
from yt_dlp import YoutubeDL
import json
import asyncio

async def get_info(ytdl, payload):
  try:
    url = payload["url"]
    info = ytdl.extract_info(url, download=False)
    return {"oid": payload["oid"], "status": "ok", "info": info}
  except Exception as e:
    return {"oid": payload["oid"], "status": "error", "message": str(e)}

async def process_line(ytdl, write_line, line):
    try:
      req_obj = json.loads(line)

      if(req_obj["oid"] == "echo"):
        write_line(json.dumps({ "oid": "echo", "status": "ok" }))
        return

      res_obj = await get_info(ytdl, req_obj)
      write_line(json.dumps(res_obj))
    except:
      pass

async def main():
    reader, writer = await get_standard_streams()

    def write_line(data):
      writer.write(data + "\n")

    ytdl_options = {
      "quiet": True,
      "color": "never",
    }

    with YoutubeDL(ytdl_options) as ytdl:
      while True:
          line = await reader.readline()
          asyncio.create_task(process_line(ytdl, write_line, line))

if __name__ == "__main__":
    asyncio.run(main())
