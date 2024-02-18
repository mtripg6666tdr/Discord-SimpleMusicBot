import fs from "fs";
import { build } from "esbuild";
import { minify } from "@swc/core";
import url from "url";
import { rimraf } from "rimraf"

(async () => {
  const res = await build({
    entryPoints: ["build/index.js"],
    minify: false,
    bundle: true,
    platform: "node",
    target: "node16",
    packages: "external",
    external: ["node_modules/*"],
    write: false,
  });

  const minified = await minify(res.outputFiles[0].text, {
    compress: true,
    mangle: true,
  });

  if(!fs.existsSync(url.fileURLToPath(import.meta.resolve("./dist")))){
    await fs.promises.mkdir(url.fileURLToPath(import.meta.resolve("./dist")))
  }
  await Promise.all([
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/index.js")), res.outputFiles[0].text),
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/index.min.js")), minified.code),
  ]);

  await rimraf(url.fileURLToPath(import.meta.resolve("./build")));
})()
