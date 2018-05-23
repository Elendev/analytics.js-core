
import initDebug from 'debug';
import isObject from 'lodash/isObject';

const debug = initDebug('analytics.js:normalize');

/**
 * HOP.
 */

var has = Object.prototype.hasOwnProperty;

/**
 * Toplevel properties.
 */

var toplevel = [
  'integrations',
  'anonymousId',
  'timestamp',
  'context'
];

/**
 * Normalize `msg` based on integrations `list`.
 *
 * @param {Object} msg
 * @param {Array} list
 * @return {Function}
 */

export default function normalize(msg, list) {
  var lower = [];
  list.forEach((s) => lower.push(s.toLowerCase()));
  var opts = msg.options || {};
  var integrations = opts.integrations || {};
  var providers = opts.providers || {};
  var context = opts.context || {};
  var ret = {};
  debug('<-', msg);

  // integrations.
  for (const key in opts) { 
    if (has.call(opts, key) && integration(key)) {
      if (!has.call(integrations, key)) integrations[key] = opts[key];
      delete opts[key];
    }
  }

  // providers.
  delete opts.providers;
  for (const key in providers) { 
    if (!has.call(providers, key) || integration(key) || isObject(integrations[key]) || has.call(integrations, key) && typeof providers[key] === 'boolean') continue;
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
  debug('->', ret);
  return ret;

  function integration(name) {
    return !!(list.indexOf(name) > -1 || name.toLowerCase() === 'all' || lower.indexOf(name.toLowerCase()) > -1);
  }
}
