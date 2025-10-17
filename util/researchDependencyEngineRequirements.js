#!/usr/bin/env node

/*
 * Copyright 2021-2025 mtripg6666tdr
 * 
 * This file is part of mtripg6666tdr/Discord-SimpleMusicBot. 
 * (npm package name: 'discord-music-bot' / repository url: <https://github.com/mtripg6666tdr/Discord-SimpleMusicBot> )
 * 
 * mtripg6666tdr/Discord-SimpleMusicBot is free software: you can redistribute it and/or modify it 
 * under the terms of the GNU General Public License as published by the Free Software Foundation, 
 * either version 3 of the License, or (at your option) any later version.
 *
 * mtripg6666tdr/Discord-SimpleMusicBot is distributed in the hope that it will be useful, 
 * but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. 
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with mtripg6666tdr/Discord-SimpleMusicBot. 
 * If not, see <https://www.gnu.org/licenses/>.
 */

const packageLock = require("../package-lock.json");
const packageJson = require("../package.json");

const rootPackageName = packageJson.name;
let targetPackage = process.argv[2];

if (!targetPackage) {
  console.error("Please provide a package name as an argument.");
  process.exit(1);
}

function createIdFromBasesAndName(bases, name) {
  if (bases.length === 0 && name === rootPackageName) {
    return "";
  }

  return bases.length > 0
      ? ["node_modules", bases.join("/node_modules/"), "node_modules", name].join("/")
      : ["node_modules", name].join("/")
};

function dependencyObjectFromId(id) {
  return packageLock.packages[id];
}

function getDependenciesFromId(id) {
  const pkg = dependencyObjectFromId(id);
  if (!pkg) {
    return null;
  }

  const dependencies = Object.assign({}, pkg.dependencies || {}, pkg.optionalDependencies || {});

  if (pkg.optionalDependenciesMeta) {
    for (const [depName, meta] of Object.entries(pkg.optionalDependenciesMeta)) {
      if (meta.optional) {
        delete dependencies[depName];
      }
    }
  }

  return dependencies;
}

let data = [["[Package]", "[Expected Version]", "[Actual Version]", "[Node Engine Requirement]"]];

const indent = 2;

function getDependencies(name, expectableVersion = null, depth = 0, expectableBases = []) {
  let dep = null;
  for (let i = expectableBases.length; i >= 0; i--) {
    const basesToTry = expectableBases.slice(0, i);
    const idToTry = createIdFromBasesAndName(basesToTry, name);
    dep = getDependenciesFromId(idToTry);
    if (dep !== null) {
      data.push([" ".repeat(depth * indent) + name, expectableVersion || "N/A", dependencyObjectFromId(idToTry).version || "N/A", dependencyObjectFromId(idToTry).engines?.node || "N/A"]);
      break;
    }
  }
  if (dep !== null) {
    Object.keys(dep).forEach(depName => {
      getDependencies(depName, dep[depName], depth + 1, [...expectableBases, name]);
    });
  } else {
    data.push([" ".repeat((depth + 1) * indent) + name + " (not found)"]);
  }
}

getDependencies(targetPackage, packageJson.dependencies?.[targetPackage] || packageJson.devDependencies?.[targetPackage] || packageJson.optionalDependencies?.[targetPackage] || null);

function formatTabbedString(squareArr, pad = 3) {
  const maxLengths = squareArr.reduce((max, current) => {
    return Math.max(max, current.length)
  }, 0);

  let columnLengths = [];
  for (let i = 0; i < maxLengths; i++) {
    columnLengths.push(squareArr.reduce((max, current) => Math.max(max, (current[i] || "").length), 0));
  }

  for (let i = 0; i < columnLengths.length - 1; i++) {
    columnLengths[i] += pad;
  }

  return squareArr.map(row => {
    return row.map((cell, index) => {
      return cell + " ".repeat(columnLengths[index] - (cell ? cell.length : 0));
    }).join("");
  }).join("\n");
}

console.log(formatTabbedString(data));
