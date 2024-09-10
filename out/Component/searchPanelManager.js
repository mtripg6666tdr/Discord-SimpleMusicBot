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
exports.SearchPanelManager = void 0;
const searchPanel_1 = require("./searchPanel");
const Commands_1 = require("../Commands");
const Structure_1 = require("../Structure");
class SearchPanelManager extends Structure_1.ServerManagerBase {
    constructor(parent) {
        super("SearchPanelManager", parent);
        this._searchPanels = new Map();
    }
    get size() {
        return this._searchPanels.size;
    }
    create(_commandMessage, query, isRawTitle = false) {
        const { t } = (0, Commands_1.getCommandExecutionContext)();
        if (this._searchPanels.size >= 3) {
            _commandMessage.reply(`:cry:${t("components:search.maximumSearch")}`)
                .catch(this.logger.error);
            return null;
        }
        const panel = new searchPanel_1.SearchPanel(_commandMessage, query, isRawTitle);
        panel.once("open", this.bindSearchPanel.bind(this, panel));
        this.emit("create", panel);
        return panel;
    }
    get(userId) {
        return this._searchPanels.get(userId);
    }
    has(userId) {
        return this._searchPanels.has(userId);
    }
    bindSearchPanel(panel) {
        this._searchPanels.set(panel.commandMessage.member.id, panel);
        const destroyPanel = panel.destroy.bind(panel);
        const timeout = setTimeout(destroyPanel, 10 * 60 * 1000).unref();
        panel.once("destroy", () => {
            clearTimeout(timeout);
            this._searchPanels.delete(panel.commandMessage.member.id);
            this.emit("delete", panel);
        });
        this.emit("bind", panel);
    }
}
exports.SearchPanelManager = SearchPanelManager;
//# sourceMappingURL=searchPanelManager.js.map