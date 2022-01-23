// main structure
export * from "./audiosource";
// resolver
export * from "./resolver";
// concrete sources
export * from "./bestdori";
export * from "./custom";
export * from "./googledrive";
export * from "./hibiki";
export * from "./soundcloud";
export * from "./streamable";
export * from "./youtube";
export * from "./youtube.spawner"; // must export from here not in "./youtube", preventing from inifinite spawned workers