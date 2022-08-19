/**
 * パーセンテージを計算します
 * @param part 計算対象の量
 * @param total 合計量
 * @returns 計算後のパーセンテージ
 */
export function GetPercentage(part:number, total:number){
  return Math.round(part / total * 100 * 100) / 100;
}
