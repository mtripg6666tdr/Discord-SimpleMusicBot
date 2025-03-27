/*
 * Copyright 2021-2025 mtripg6666tdr
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

import candyget from "candyget";

export function isTrustedSessionAvailable() {
  return !!((process.env.PO_TOKEN && process.env.VISITOR_DATA) || process.env.TSG_URL);
}

export async function getTrustedSession(): Promise<TrustedSession> {
  if (process.env.PO_TOKEN && process.env.VISITOR_DATA) {
    return {
      potoken: process.env.PO_TOKEN,
      visitor_data: process.env.VISITOR_DATA,
    };
  } else if (process.env.TSG_URL) {
    try {
      const { body: trustedSession } = await candyget.json(process.env.TSG_URL);

      return trustedSession;
    } catch {
      /* empty */
    }
  }

  return {
    potoken: undefined,
    visitor_data: undefined,
  };
}

interface TrustedSession {
  updated?: number;
  potoken: string | undefined;
  visitor_data: string | undefined;
}
