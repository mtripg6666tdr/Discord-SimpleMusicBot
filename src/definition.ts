/*
 * Copyright 2021-2022 mtripg6666tdr
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

export const DefaultAudioThumbnailURL = "https://cdn.discordapp.com/attachments/757824315294220329/846737267951271946/Audio_icon-icons.com_71845.png";
export const FallBackNotice = "現在、通常の方法で情報を取得できなかったため、代替ライブラリにフォールバックして取得しました。これが異常だと思われる場合はサポートまでお問い合わせください。\r\n処理に時間がかかる、突然終了するなど、正常なオペレーションができない場合があります。なお、フォールバックしたあとの動作はサポート対象外です。問題が発生した場合、`リセット`コマンドを使用すると、サーバーのデータをすべて初期化することができます。";
export const NotSendableMessage = ":warning: コマンドが実行されたチャンネルでのボットの権限が不足しています。[メッセージを読む][メッセージ履歴を読む][メッセージの送信][埋め込みリンク][メッセージの管理][ファイルの添付]の権限があるかどうかご確認のうえ、もう一度お試しください。";
export const FFmpegDefaultNetworkArgs = [
  "-reconnect", "1",
  "-reconnect_streamed", "1",
  "-reconnect_on_network_error", "1",
  "-reconnect_on_http_error", "4xx,5xx",
  "-reconnect_delay_max", "30",
] as const;
