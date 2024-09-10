"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const bdmbd_1 = tslib_1.__importDefault(require("./bdmbd"));
const bgm_1 = tslib_1.__importDefault(require("./bgm"));
const bulk_delete_1 = tslib_1.__importDefault(require("./bulk_delete"));
const bulk_play_1 = tslib_1.__importDefault(require("./bulk_play"));
const cancel_1 = tslib_1.__importDefault(require("./cancel"));
const command_1 = tslib_1.__importDefault(require("./command"));
const disconnect_1 = tslib_1.__importDefault(require("./disconnect"));
const effect_1 = tslib_1.__importDefault(require("./effect"));
const end_1 = tslib_1.__importDefault(require("./end"));
const equalplayback_1 = tslib_1.__importDefault(require("./equalplayback"));
const export_1 = tslib_1.__importDefault(require("./export"));
const frame_1 = tslib_1.__importDefault(require("./frame"));
const help_1 = tslib_1.__importDefault(require("./help"));
const import_1 = tslib_1.__importDefault(require("./import"));
const invoke_1 = tslib_1.__importDefault(require("./invoke"));
const join_1 = tslib_1.__importDefault(require("./join"));
const leaveclean_1 = tslib_1.__importDefault(require("./leaveclean"));
const log_1 = tslib_1.__importDefault(require("./log"));
const loop_1 = tslib_1.__importDefault(require("./loop"));
const looponce_1 = tslib_1.__importDefault(require("./looponce"));
const loopqueue_1 = tslib_1.__importDefault(require("./loopqueue"));
const lyrics_1 = tslib_1.__importDefault(require("./lyrics"));
const move_1 = tslib_1.__importDefault(require("./move"));
const movelastsongtofirst_1 = tslib_1.__importDefault(require("./movelastsongtofirst"));
const news_1 = tslib_1.__importDefault(require("./news"));
const nowplaying_1 = tslib_1.__importDefault(require("./nowplaying"));
const pause_1 = tslib_1.__importDefault(require("./pause"));
const ping_1 = tslib_1.__importDefault(require("./ping"));
const play_1 = tslib_1.__importDefault(require("./play"));
const play_private_1 = tslib_1.__importDefault(require("./play_private"));
const queue_1 = tslib_1.__importDefault(require("./queue"));
const radio_1 = tslib_1.__importDefault(require("./radio"));
const related_1 = tslib_1.__importDefault(require("./related"));
const remove_1 = tslib_1.__importDefault(require("./remove"));
const removeall_1 = tslib_1.__importDefault(require("./removeall"));
const removedupes_1 = tslib_1.__importDefault(require("./removedupes"));
const reset_1 = tslib_1.__importDefault(require("./reset"));
const rewind_1 = tslib_1.__importDefault(require("./rewind"));
const search_1 = tslib_1.__importDefault(require("./search"));
const searchb_1 = tslib_1.__importDefault(require("./searchb"));
const searchnico_1 = tslib_1.__importDefault(require("./searchnico"));
const searchqueue_1 = tslib_1.__importDefault(require("./searchqueue"));
const searchsoundcloud_1 = tslib_1.__importDefault(require("./searchsoundcloud"));
const seek_1 = tslib_1.__importDefault(require("./seek"));
const setting_nowplaying_1 = tslib_1.__importDefault(require("./setting_nowplaying"));
const setting_skipvote_1 = tslib_1.__importDefault(require("./setting_skipvote"));
const shuffle_1 = tslib_1.__importDefault(require("./shuffle"));
const skip_1 = tslib_1.__importDefault(require("./skip"));
const sleeptimer_1 = tslib_1.__importDefault(require("./sleeptimer"));
const thumbnail_1 = tslib_1.__importDefault(require("./thumbnail"));
const uptime_1 = tslib_1.__importDefault(require("./uptime"));
const volume_1 = tslib_1.__importDefault(require("./volume"));
const commands = [
    new bdmbd_1.default(),
    new bgm_1.default(),
    new bulk_delete_1.default(),
    new bulk_play_1.default(),
    new cancel_1.default(),
    new command_1.default(),
    new disconnect_1.default(),
    new effect_1.default(),
    new end_1.default(),
    new equalplayback_1.default(),
    new export_1.default(),
    new frame_1.default(),
    new help_1.default(),
    new import_1.default(),
    new invoke_1.default(),
    new join_1.default(),
    new leaveclean_1.default(),
    new log_1.default(),
    new loop_1.default(),
    new looponce_1.default(),
    new loopqueue_1.default(),
    new lyrics_1.default(),
    new move_1.default(),
    new movelastsongtofirst_1.default(),
    new news_1.default(),
    new nowplaying_1.default(),
    new pause_1.default(),
    new ping_1.default(),
    new play_1.default(),
    new play_private_1.default(),
    new queue_1.default(),
    new radio_1.default(),
    new related_1.default(),
    new remove_1.default(),
    new removeall_1.default(),
    new removedupes_1.default(),
    new reset_1.default(),
    new rewind_1.default(),
    new search_1.default(),
    new searchb_1.default(),
    new searchnico_1.default(),
    new searchqueue_1.default(),
    new searchsoundcloud_1.default(),
    new seek_1.default(),
    new setting_nowplaying_1.default(),
    new setting_skipvote_1.default(),
    new shuffle_1.default(),
    new skip_1.default(),
    new sleeptimer_1.default(),
    new thumbnail_1.default(),
    new uptime_1.default(),
    new volume_1.default(),
];
exports.default = commands;
//# sourceMappingURL=_index.js.map