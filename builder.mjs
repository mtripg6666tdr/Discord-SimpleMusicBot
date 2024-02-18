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

async function buildAssets(){
  const [mainCompilation, workerCompilation] = await Promise.all([
    createDefaultBuilder("build/index.js")(),
    createDefaultBuilder("build/AudioSource/youtube/worker.js")(),
  ]);

  if(!fs.existsSync(url.fileURLToPath(resolveRelativePath("./dist")))){
    await fs.promises.mkdir(url.fileURLToPath(resolveRelativePath("./dist")))
  }
  await Promise.all([
    fs.promises.writeFile(url.fileURLToPath(resolveRelativePath("./dist/index.js")), mainCompilation.bundled),
    fs.promises.writeFile(url.fileURLToPath(resolveRelativePath("./dist/index.min.js")), mainCompilation.minified),
    fs.promises.writeFile(url.fileURLToPath(resolveRelativePath("./dist/worker.js")), workerCompilation.bundled),
    fs.promises.writeFile(url.fileURLToPath(resolveRelativePath("./dist/worker.min.js")), workerCompilation.minified),
  ]);

  await rimraf(url.fileURLToPath(resolveRelativePath("./build")));
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
// If you want to make this file up-to-date, please run 'npm run build'
import type { BaseCommand } from ".";
${commandNames.map((n, i) => `import _${n} from "./${n}";`).join("\n")}

const commands: BaseCommand[] = [
${commandNames.map(d => `  new _${d}(),`).join("\n")}
];

export default commands;
`.trimStart());
}

console.log("Discord-SimpleMusicBot Build Tool");

switch(process.argv[2]){
  case "bake":
    bakeDynamicImports();
    break;
  case "build":
    void buildAssets();
    break;
  default:
    console.error("Invalid verb.");
    break;
}
