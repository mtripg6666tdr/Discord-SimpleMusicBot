const normalizeTemplate = [
  {from: /０/g, to: "0"},
  {from: /１/g, to: "1"},
  {from: /２/g, to: "2"},
  {from: /３/g, to: "3"},
  {from: /４/g, to: "4"},
  {from: /５/g, to: "5"},
  {from: /６/g, to: "6"},
  {from: /７/g, to: "7"},
  {from: /８/g, to: "8"},
  {from: /９/g, to: "9"},
  {from: /　/g, to: " "},
  {from: /！/g, to: "!"},
  {from: /？/g, to: "?"},
  {from: /ｂ/g, to: "b"},
  {from: /ｃ/g, to: "c"},
  {from: /ｄ/g, to: "d"},
  {from: /ｆ/g, to: "f"},
  {from: /ｇ/g, to: "g"},
  {from: /ｈ/g, to: "h"},
  {from: /ｊ/g, to: "j"},
  {from: /ｋ/g, to: "k"},
  {from: /ｌ/g, to: "l"},
  {from: /ｍ/g, to: "m"},
  {from: /ｎ/g, to: "n"},
  {from: /ｐ/g, to: "p"},
  {from: /ｑ/g, to: "q"},
  {from: /ｒ/g, to: "r"},
  {from: /ｓ/g, to: "s"},
  {from: /ｔ/g, to: "t"},
  {from: /ｖ/g, to: "v"},
  {from: /ｗ/g, to: "w"},
  {from: /ｘ/g, to: "x"},
  {from: /ｙ/g, to: "y"},
  {from: /ｚ/g, to: "z"},
  {from: /＞/g, to: ">"},
] as Readonly<{from:Readonly<RegExp>, to:Readonly<string>}>[];

/**
 * 文字列を正規化します
 */
export function NormalizeText(rawText:string){
  let result = rawText;
  normalizeTemplate.forEach(reg => {
    result = result.replace(reg.from, reg.to);
  });
  return result;
}