export function getColor(key:colorkey):number{
  const cmap:{[key in colorkey]:number} = {
    "COMMAND": 0xE9506A,
    "HELP": 0x4898F0,
    "SEARCH": 0x60F246,
    "NP": 0xBC42F7,
    "QUEUE": 0xF4BCFC,
    "UPTIME": 0xD3FEFE,
    "SONG_ADDED": 0x77EAC8,
    "LYRIC": 0xE4F004,
  };
  return cmap[key];
}

type colorkey = "COMMAND"|"HELP"|"SEARCH"|"NP"|"QUEUE"|"UPTIME"|"SONG_ADDED"|"LYRIC";