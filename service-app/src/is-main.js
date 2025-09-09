import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
/**

Detects if the current module is executed as the main entry point.
Compatible with Node.js ESM, Bun, Deno.
@param {ImportMeta} [meta=import.meta] - The import.meta object of the module (default: current module)
@param {string[]} [argv=process.argv] - Optional argv array (injectable for tests)
@returns {boolean} True if the module is the main entry point, false otherwise.
 */
export function isMainModule(meta = import.meta, argv = (typeof process !== 'undefined' ? process.argv : undefined)) {
  // Deno/Bun: use import.meta.main if available
  if (typeof meta.main !== 'undefined') {
    return Boolean(meta.main);
  }

  if (!argv || argv.length < 2) {
    return false;
  }
  const entryArg = argv[1];
  if (!entryArg) return false;
  // Node.js ESM: compare file URLs, falling back to path comparison
  try {
    const entryUrl = pathToFileURL(path.resolve(entryArg)).href;
    if (entryUrl === meta.url) return true;
  } catch (e) {
    // ignore and try path fallback
  }
  try {
    const metaPath = fileURLToPath(meta.url);
    // normalise both paths
    if (path.resolve(metaPath) === path.resolve(entryArg)) return true;
  } catch (err) {
    // give up
  }
  return false;
}