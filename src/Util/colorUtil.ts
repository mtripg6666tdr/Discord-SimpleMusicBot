const cmap = {
  "COMMAND": 0xE9506A,
  "HELP": 0x4898F0,
  "SEARCH": 0x60F246,
  "NP": 0xBC42F7,
  "QUEUE": 0xF4BCFC,
  "UPTIME": 0xD3FEFE,
  "SONG_ADDED": 0x77EAC8,
  "LYRIC": 0xE4F004,
  "AUTO_NP": 0xC4F74D,
  "PLAYLIST_COMPLETED": 0xF152DA,
  "THUMB": 0xBEEF16,
  "RELATIVE_SETUP": 0xFD0202,
  "EFFECT": 0xCCFFCC,
  "EQUALLY": 0xF8D53E,
};

export function getColor(key:colorkey):number{
  return cmap[key];
}

type colorkey = keyof typeof cmap;
