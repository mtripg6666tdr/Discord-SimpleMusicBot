
const localRequire = require;
// hi-jack require function and replace path if needed
// hi-jack fs.readFileSync function and return content in package.json if needed
const Module = localRequire("module");

Module.prototype.require = new Proxy(Module.prototype.require, {
  apply(target, thisArg, args) {
    if(args[0] === "../lib/play-dl"){
      args[0] = "./lib/play-dl";
    }else if(args[0] === "fs"){
      const originalFs = target.apply(thisArg, args);
      const originalReadFileSync = originalFs.readFileSync;
      originalFs.readFileSync = (path, options) => {
        if(path === "config.json"){
          const pkg = localRequire("./package.json");
          console.log("pkg", pkg);
          const config = pkg.config;
          if(config){
            return JSON.stringify(config);
          }
        }
        return originalReadFileSync(path, options);
      };
      return originalFs;
    }
    return target.apply(thisArg, args);
  }
});

// read environment variables from package.json if defined
// console.log(localRequire("./package.json"));
const env = localRequire("./package.json").env || {};
Object.entries(env).forEach(([key, value]) => value && (process.env[key] = value));

// Check injection
console.log(process.env.VAL_ON_PKG_JSON);
