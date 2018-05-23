
import initDebug from 'debug';
import each from '@ndhoule/each';
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
  each(function(value, key) {
    if (!integration(key)) return;
    if (!has.call(integrations, key)) integrations[key] = value;
    delete opts[key];
  }, opts);

  // providers.
  delete opts.providers;
  each(function(value, key) {
    if (!integration(key)) return;
    if (isObject(integrations[key])) return;
    if (has.call(integrations, key) && typeof providers[key] === 'boolean') return;
    integrations[key] = value;
  }, providers);

  // move all toplevel options to msg
  // and the rest to context.
  each(function(value, key) {
    if (includes(key, toplevel)) {
      ret[key] = opts[key];
    } else {
      context[key] = opts[key];
    }
  }, opts);

  // cleanup
  delete msg.options;
  ret.integrations = integrations;
  ret.context = context;
  ret = {...msg, ...ret };
  debug('->', ret);
  return ret;

  function integration(name) {
    return !!(list.indexOf(name) > -1 || name.toLowerCase() === 'all' || lower.indexOf(name.toLowerCase()) > -1);
  }
}
