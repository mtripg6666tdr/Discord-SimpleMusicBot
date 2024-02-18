import fs from "fs";
import { build } from "esbuild";
import { minify } from "@swc/core";
import url from "url";
import { rimraf } from "rimraf"

/** @param {string} path */
function createDefaultBuilder(path){
  return async function(){
    const res = await build({
      entryPoints: [path],
      minify: false,
      bundle: true,
      platform: "node",
      target: "node16",
      packages: "external",
      external: ["node_modules/*"],
      write: false,
      define: {
        "BUNDLED": "true"
      },
    });

    const bundled = res.outputFiles[0].text;

    const { code: minified } = await minify(bundled, {
      compress: true,
      mangle: true,
    });

    return { bundled, minified };
  };
}

(async () => {
  const [mainCompilation, workerCompilation] = await Promise.all([
    createDefaultBuilder("build/index.js")(),
    createDefaultBuilder("build/AudioSource/worker.js")(),
  ]);

  if(!fs.existsSync(url.fileURLToPath(import.meta.resolve("./dist")))){
    await fs.promises.mkdir(url.fileURLToPath(import.meta.resolve("./dist")))
  }
  await Promise.all([
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/index.js")), mainCompilation.bundled),
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/index.min.js")), mainCompilation.minified),
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/worker.js")), workerCompilation.bundled),
    fs.promises.writeFile(url.fileURLToPath(import.meta.resolve("./dist/worker.min.js")), workerCompilation.minified),
  ]);

  await rimraf(url.fileURLToPath(import.meta.resolve("./build")));
})()
