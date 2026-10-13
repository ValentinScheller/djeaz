// tsx charge les modules serveur en CommonJS. `server-only` lève alors à l'import ;
// Next le remplace par un module vide, ce préchargement fait de même pour `db:seed`.
// `--require` impose CommonJS : `require` est le seul mécanisme disponible ici.
/* eslint-disable @typescript-eslint/no-require-imports */
const Module = require("node:module");
const path = require("node:path");

const stub = path.join(__dirname, "server-only-stub.cjs");
const resolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveServerOnly(request, parent, isMain, options) {
  if (request === "server-only") {
    return stub;
  }

  return resolveFilename.call(this, request, parent, isMain, options);
};
