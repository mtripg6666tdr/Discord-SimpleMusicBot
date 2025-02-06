#!/usr/bin/env node
import fs from "fs";
import { build } from "esbuild";
import { minify } from "@swc/core";
import url from "url";
import { rimraf } from "rimraf"
import path from "path";

function resolveRelativePath(spec){
  return import.meta.resolve
    ? url.fileURLToPath(import.meta.resolve(spec))
    : path.join(url.fileURLToPath(import.meta.url), "..", spec);
}

/** @param {string} path */
function createDefaultBuilder(path){
  return async function({ generateMetafile }){
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
        "global.BUNDLED": "true",
        "__dirname": "\"./dist\"",
      },
      inject: ["./inject.js"],
      sourcemap: false,
      metafile: generateMetafile,
    });

    const bundled = res.outputFiles[0].text;

    const { code: minified } = await minify(bundled, {
      compress: true,
      mangle: true,
    });

    return { bundled, minified, metafile: res.metafile };
  };
}

async function bundleAssets({ leaveBuildArtifact, generateMetafile, useOutDir }){
  const [mainCompilation, ] = await Promise.all([
    createDefaultBuilder("build/index.js")({ generateMetafile }),
    //createDefaultBuilder("build/AudioSource/youtube/worker.js")({ generateMetafile }),
  ]);

  const outDirBase = useOutDir ? "./out" : "./dist";
  const outPath = (path) => `${outDirBase}/${path}`;

  if(!fs.existsSync(resolveRelativePath(outDirBase))){
    await fs.promises.mkdir(resolveRelativePath(outDirBase), { recursive: true });
  }

  // await Promise.all([
  //   fs.promises.writeFile(resolveRelativePath(outPath("index.js")), mainCompilation.bundled),
  //   fs.promises.writeFile(resolveRelativePath(outPath("index.min.js")), mainCompilation.minified),
  //   mainCompilation.metafile && fs.promises.writeFile(resolveRelativePath(outPath("index.meta.json")), JSON.stringify(mainCompilation.metafile, null)),
  //   fs.promises.writeFile(resolveRelativePath(outPath("worker.js")), workerCompilation.bundled),
  //   fs.promises.writeFile(resolveRelativePath(outPath("worker.min.js")), workerCompilation.minified),
  //   workerCompilation.metafile && fs.promises.writeFile(resolveRelativePath(outPath("worker.meta.json")), JSON.stringify(workerCompilation.metafile)),
  // ].filter(Boolean));

  if(!leaveBuildArtifact){
    await rimraf(resolveRelativePath("./build"));
  }

  const outputPackageJson = (await import("./package.json", { with: { type: "json" } })).default;
  outputPackageJson.scripts = {
    start: "node --dns-result-order=ipv4first -e eval(require('./package.json').__files.index_js)",
  };
  outputPackageJson.engines.node = ">=18";
  delete outputPackageJson.devDependencies;
  delete outputPackageJson.main;
  outputPackageJson.version += "-pkgjson.0";
  outputPackageJson.name += "-package-json-edition";
  outputPackageJson.description += " or any js files";
  outputPackageJson.env = {
    "VAL_ON_PKG_JSON": "Seeing this message means environment variables in package.json was successfully loaded!\nWelcome to the Discord-SimpleMusicBot package.json edition!",
    "TOKEN": "",
  };
  outputPackageJson.config = eval(`(${await fs.promises.readFile(resolveRelativePath("./config.json"), "utf-8")})`);
  outputPackageJson.__files = {
    index_js: mainCompilation.minified,
  };
  await fs.promises.writeFile(resolveRelativePath(outPath("package.json")), JSON.stringify(outputPackageJson, null, 2));
};

function bakeDynamicImports(){
  const commandNames = fs.readdirSync(path.join(url.fileURLToPath(import.meta.url), "..", "./src/Commands"), { withFileTypes: true })
  .filter(d => d.isFile())
  .map(d => d.name)
  .filter(n => n.endsWith(".ts") && n !== "index.ts" && n !== "_index.ts")
  .map(n => n.slice(0, -3));

  fs.writeFileSync(path.join(url.fileURLToPath(import.meta.url), "..", "./src/Commands/_index.ts"), `
// This file was generated automatically
// Do not edit manually
// If you want to make this file up-to-date, please run 'npm run build:bundled'
import type { BaseCommand } from ".";
${commandNames.map((n, i) => `import _${n} from "./${n}";`).join("\n")}

const commands: BaseCommand[] = [
${commandNames.map(d => `  new _${d}(),`).join("\n")}
];

export default commands;
`.trimStart());
}

switch(process.argv[2]){
  case "bake":
    bakeDynamicImports();
    break;
  case "bundle":
    void bundleAssets({
      leaveBuildArtifact: process.argv.includes("--leave-build-artifact"),
      generateMetafile: process.argv.includes("--generate-metafile"),
      useOutDir: process.argv.includes("--use-out-dir"),
    });
    break;
  default:
    console.error("Invalid verb.");
    break;
}
