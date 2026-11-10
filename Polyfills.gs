/** -----------------------------------------------------------------
 *  Polyfills for pdf-lib in Apps Script (server-side V8).
 *  They synchronously call the handler because Apps Script
 *  has no event loop; pdf-lib only uses them to queue micro-tasks.
 *  ---------------------------------------------------------------- */
if (typeof setTimeout === 'undefined') {
  globalThis.setTimeout = function (fn /*, ms */) { return fn(), 0; };
}
if (typeof clearTimeout === 'undefined') {
  globalThis.clearTimeout = function (/* id */) { /* no-op */ };
}
