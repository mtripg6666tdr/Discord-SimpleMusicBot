export const DefaultAudioThumbnailURL = "https://cdn.discordapp.com/attachments/757824315294220329/846737267951271946/Audio_icon-icons.com_71845.png";
export const FallBackNotice = "現在、通常の方法で情報を取得できなかったため、代替としてPythonライブラリにフォールバックして取得しました。処理に時間がかかるなど、正常なオペレーションができない場合があります。";
export * from "./Util/ua";
export const NotSendableMessage = ":warning: コマンドが実行されたチャンネルでのボットの権限が不足しています。[メッセージを読む][メッセージ履歴を読む][メッセージの送信][埋め込みリンク][メッセージの管理][ファイルの添付]の権限があるかどうかご確認のうえ、もう一度お試しください。";
export const FFmpegDefaultArgs = [
  '-reconnect', '1', 
  '-reconnect_streamed', '1', 
  '-reconnect_on_network_error', '1', 
  '-reconnect_on_http_error', '4xx,5xx', 
  '-reconnect_delay_max', '30', 
  '-analyzeduration', '0', 
  '-loglevel', '0', 
] as const;
