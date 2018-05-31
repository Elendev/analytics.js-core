import initDebug from "debug";
import { object as isObject } from "is";

const debug = initDebug("analytics.js:normalize");

/**
 * HOP.
 */

const has = Object.prototype.hasOwnProperty;

/**
 * Toplevel properties.
 */

const toplevel = ["integrations", "anonymousId", "timestamp", "context"];

/**
 * Normalize `msg` based on integrations `list`.
 *
 * @param {Object} msg
 * @param {Array} list
 * @return {Function}
 */

export default function normalize(msg, list) {
  const lower = [];
  list.forEach(s => lower.push(s.toLowerCase()));
  const opts = msg.options || {};
  const integrations = opts.integrations || {};
  const providers = opts.providers || {};
  const context = opts.context || {};
  let ret = {};
  debug("<-", msg);

  // integrations.
  for (const key in opts) {
    if (has.call(opts, key) && integration(key)) {
      if (!has.call(integrations, key)) {
        integrations[key] = opts[key];
      }
      delete opts[key];
    }
  }

  // providers.
  delete opts.providers;
  for (const key in providers) {
    if (
      !has.call(providers, key) ||
      integration(key) ||
      isObject(integrations[key]) ||
      (has.call(integrations, key) && typeof providers[key] === "boolean")
    ) {
      continue;
    }
    integrations[key] = providers[key];
  }

  // move all toplevel options to msg
  // and the rest to context.
  for (const key in opts) {
    if (toplevel.indexOf(key) > -1) {
      ret[key] = opts[key];
    } else {
      context[key] = opts[key];
    }
  }

  // cleanup
  delete msg.options;
  ret.integrations = integrations;
  ret.context = context;
  ret = { ...msg, ...ret };
  debug("->", ret);
  return ret;

  function integration(name) {
    return !!(
      list.indexOf(name) > -1 ||
      name.toLowerCase() === "all" ||
      lower.indexOf(name.toLowerCase()) > -1
    );
  }
}
