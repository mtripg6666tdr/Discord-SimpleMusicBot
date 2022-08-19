/**
 * ローオーディオファイルのURLであるかどうかをURLの末尾の拡張子から判断します
 * @param str 検査対象のURL
 * @returns ローオーディオファイルのURLであるならばtrue、それ以外の場合にはfalse
 */
export function isAvailableRawAudioURL(str:string){
  const exts = [".mp3", ".wav", ".wma", ".mov", ".mp4", ".ogg"];
  return exts.filter(ext => str.endsWith(ext)).length > 0;
}

export function isAvailableRawVideoURL(str:string){
  const exts = [".mov", ".mp4"];
  return exts.filter(ext => str.endsWith(ext)).length > 0;
}
