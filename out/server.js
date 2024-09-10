"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.createServer = createServer;
const tslib_1 = require("tslib");
const http = tslib_1.__importStar(require("http"));
const logger_1 = require("./logger");
const logger = (0, logger_1.getLogger)("Server");
function createServer(client, port) {
    return http.createServer((_, res) => {
        res.writeHead(200, { "Content-Type": "application/json" });
        const data = {
            status: 200,
            message: "Discord bot is active now",
            client: client.ready && client?.user ? Buffer.from(client?.user.id).toString("base64") : null,
            readyAt: client.ready && client?.uptime ? Buffer.from(client.uptime.toString()).toString("base64") : null,
            guilds: client?.guilds.size || null,
        };
        logger.info("Received a http request");
        res.end(JSON.stringify(data));
    }).listen(port);
}
//# sourceMappingURL=server.js.map