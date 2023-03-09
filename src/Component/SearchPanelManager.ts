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

import type { CommandMessage } from "./CommandMessage";

import { SearchPanel } from "./SearchPanel";
import { ServerManagerBase } from "../Structure";

export class SearchPanelManager extends ServerManagerBase {
  protected _searchPanels = new Map<string, SearchPanel>();

  get size(){
    return this._searchPanels.size;
  }

  create(_commandMessage: CommandMessage, query: string, isRawTitle: boolean = false){
    if(this._searchPanels.size >= 3){
      _commandMessage.reply(":cry:すでに開いている検索パネルが上限を超えています").catch(er => this.Log(er, "error"));
      return null;
    }
    const panel = new SearchPanel(_commandMessage, query, isRawTitle);
    panel.once("open", this.bindSearchPanel.bind(this, panel));
    return panel;
  }

  get(userId: string){
    return this._searchPanels.get(userId);
  }

  has(userId: string){
    return this._searchPanels.has(userId);
  }

  protected bindSearchPanel(panel: SearchPanel){
    this._searchPanels.set(panel.commandMessage.member.id, panel);
    const destroyPanel = panel.destroy.bind(panel);
    const timeout = setTimeout(destroyPanel, 10 * 60 * 1000).unref();
    panel.once("destroy", () => {
      clearTimeout(timeout);
      this._searchPanels.delete(panel.commandMessage.member.id);
    });
  }
}
