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
exports.GuildPreferencesManager = void 0;
const tslib_1 = require("tslib");
const ServerManagerBase_1 = require("../Structure/ServerManagerBase");
const decorators_1 = require("../Util/decorators");
const GuildPreferences_1 = require("../types/GuildPreferences");
let GuildPreferencesManager = (() => {
    var _a, _GuildPreferencesManager_addRelated_accessor_storage, _GuildPreferencesManager_equallyPlayback_accessor_storage, _GuildPreferencesManager_disableSkipSession_accessor_storage, _GuildPreferencesManager_nowPlayingNotificationLevel_accessor_storage;
    let _classSuper = ServerManagerBase_1.ServerManagerBase;
    let _addRelated_decorators;
    let _addRelated_initializers = [];
    let _addRelated_extraInitializers = [];
    let _equallyPlayback_decorators;
    let _equallyPlayback_initializers = [];
    let _equallyPlayback_extraInitializers = [];
    let _disableSkipSession_decorators;
    let _disableSkipSession_initializers = [];
    let _disableSkipSession_extraInitializers = [];
    let _nowPlayingNotificationLevel_decorators;
    let _nowPlayingNotificationLevel_initializers = [];
    let _nowPlayingNotificationLevel_extraInitializers = [];
    return _a = class GuildPreferencesManager extends _classSuper {
            constructor(parent) {
                super("GuildPreferencesManager", parent);
                _GuildPreferencesManager_addRelated_accessor_storage.set(this, tslib_1.__runInitializers(this, _addRelated_initializers, void 0));
                _GuildPreferencesManager_equallyPlayback_accessor_storage.set(this, (tslib_1.__runInitializers(this, _addRelated_extraInitializers), tslib_1.__runInitializers(this, _equallyPlayback_initializers, void 0)));
                _GuildPreferencesManager_disableSkipSession_accessor_storage.set(this, (tslib_1.__runInitializers(this, _equallyPlayback_extraInitializers), tslib_1.__runInitializers(this, _disableSkipSession_initializers, void 0)));
                _GuildPreferencesManager_nowPlayingNotificationLevel_accessor_storage.set(this, (tslib_1.__runInitializers(this, _disableSkipSession_extraInitializers), tslib_1.__runInitializers(this, _nowPlayingNotificationLevel_initializers, void 0)));
                tslib_1.__runInitializers(this, _nowPlayingNotificationLevel_extraInitializers);
                this.logger.info("GuildPreferencesManager initialized.");
                this.init();
            }
            init() {
                this.addRelated = false;
                this.equallyPlayback = false;
                this.disableSkipSession = false;
                this.nowPlayingNotificationLevel = GuildPreferences_1.NowPlayingNotificationLevel.Normal;
            }
            exportPreferences() {
                return {
                    addRelatedSongs: this.addRelated,
                    equallyPlayback: this.equallyPlayback,
                    disableSkipSession: this.disableSkipSession,
                    nowPlayingNotificationLevel: this.nowPlayingNotificationLevel,
                };
            }
            importPreferences(preferences) {
                this.addRelated = preferences.addRelatedSongs;
                this.equallyPlayback = preferences.equallyPlayback;
                this.disableSkipSession = preferences.disableSkipSession;
                this.nowPlayingNotificationLevel = preferences.nowPlayingNotificationLevel;
            }
            /** 関連動画自動追加が有効 */
            get addRelated() { return tslib_1.__classPrivateFieldGet(this, _GuildPreferencesManager_addRelated_accessor_storage, "f"); }
            set addRelated(value) { tslib_1.__classPrivateFieldSet(this, _GuildPreferencesManager_addRelated_accessor_storage, value, "f"); }
            /** 均等再生が有効 */
            get equallyPlayback() { return tslib_1.__classPrivateFieldGet(this, _GuildPreferencesManager_equallyPlayback_accessor_storage, "f"); }
            set equallyPlayback(value) { tslib_1.__classPrivateFieldSet(this, _GuildPreferencesManager_equallyPlayback_accessor_storage, value, "f"); }
            /** スキップ投票を無効にするか */
            get disableSkipSession() { return tslib_1.__classPrivateFieldGet(this, _GuildPreferencesManager_disableSkipSession_accessor_storage, "f"); }
            set disableSkipSession(value) { tslib_1.__classPrivateFieldSet(this, _GuildPreferencesManager_disableSkipSession_accessor_storage, value, "f"); }
            /** 現在再生中パネルの表示レベル */
            get nowPlayingNotificationLevel() { return tslib_1.__classPrivateFieldGet(this, _GuildPreferencesManager_nowPlayingNotificationLevel_accessor_storage, "f"); }
            set nowPlayingNotificationLevel(value) { tslib_1.__classPrivateFieldSet(this, _GuildPreferencesManager_nowPlayingNotificationLevel_accessor_storage, value, "f"); }
        },
        _GuildPreferencesManager_addRelated_accessor_storage = new WeakMap(),
        _GuildPreferencesManager_equallyPlayback_accessor_storage = new WeakMap(),
        _GuildPreferencesManager_disableSkipSession_accessor_storage = new WeakMap(),
        _GuildPreferencesManager_nowPlayingNotificationLevel_accessor_storage = new WeakMap(),
        (() => {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
            _addRelated_decorators = [(0, decorators_1.emitEventOnMutation)("updateSettings")];
            _equallyPlayback_decorators = [(0, decorators_1.emitEventOnMutation)("updateSettings")];
            _disableSkipSession_decorators = [(0, decorators_1.emitEventOnMutation)("updateSettings")];
            _nowPlayingNotificationLevel_decorators = [(0, decorators_1.emitEventOnMutation)("updateSettings")];
            tslib_1.__esDecorate(_a, null, _addRelated_decorators, { kind: "accessor", name: "addRelated", static: false, private: false, access: { has: obj => "addRelated" in obj, get: obj => obj.addRelated, set: (obj, value) => { obj.addRelated = value; } }, metadata: _metadata }, _addRelated_initializers, _addRelated_extraInitializers);
            tslib_1.__esDecorate(_a, null, _equallyPlayback_decorators, { kind: "accessor", name: "equallyPlayback", static: false, private: false, access: { has: obj => "equallyPlayback" in obj, get: obj => obj.equallyPlayback, set: (obj, value) => { obj.equallyPlayback = value; } }, metadata: _metadata }, _equallyPlayback_initializers, _equallyPlayback_extraInitializers);
            tslib_1.__esDecorate(_a, null, _disableSkipSession_decorators, { kind: "accessor", name: "disableSkipSession", static: false, private: false, access: { has: obj => "disableSkipSession" in obj, get: obj => obj.disableSkipSession, set: (obj, value) => { obj.disableSkipSession = value; } }, metadata: _metadata }, _disableSkipSession_initializers, _disableSkipSession_extraInitializers);
            tslib_1.__esDecorate(_a, null, _nowPlayingNotificationLevel_decorators, { kind: "accessor", name: "nowPlayingNotificationLevel", static: false, private: false, access: { has: obj => "nowPlayingNotificationLevel" in obj, get: obj => obj.nowPlayingNotificationLevel, set: (obj, value) => { obj.nowPlayingNotificationLevel = value; } }, metadata: _metadata }, _nowPlayingNotificationLevel_initializers, _nowPlayingNotificationLevel_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
})();
exports.GuildPreferencesManager = GuildPreferencesManager;
//# sourceMappingURL=preferencesManager.js.map