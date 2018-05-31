/* global JSON */
import bindAll from 'bind-all';

// Store.js
const store = {};
const win = window;
const localStorageName = 'localStorage';
let storage;

store.enabled = false;
store.set = function(key, value) {};
store.get = function(key, defaultVal) {};
store.remove = function(key) {};

function serialize(value) {
  return JSON.stringify(value);
}

function deserialize(value) {
  if (typeof value !== 'string') {
    return undefined;
  }
  try {
    return JSON.parse(value);
  } catch (e) {
    return value || undefined;
  }
}

// Functions to encapsulate questionable FireFox 3.6.13 behavior
// when about.config::dom.storage.enabled === false
// See https://github.com/marcuswestin/store.js/issues#issue/13
function isLocalStorageNameSupported() {
  try {
    return localStorageName in win && win[localStorageName];
  } catch (err) {
    return false;
  }
}

if (isLocalStorageNameSupported()) {
  storage = win[localStorageName];
  store.set = function(key, val) {
    if (val === undefined) {
      return store.remove(key);
    }
    storage.setItem(key, serialize(val));
    return val;
  };
  store.get = function(key, defaultVal) {
    var val = deserialize(storage.getItem(key));
    return val === undefined ? defaultVal : val;
  };
  store.remove = function(key) {
    storage.removeItem(key);
  };

  try {
    var testKey = '__storejs__';
    store.set(testKey, testKey);
    if (store.get(testKey) !== testKey) {
      store.enabled = false;
    }
    store.remove(testKey);
  } catch (e) {
    store.enabled = false;
  }
}

export class Store {
  /**
   * Initialize a new `Store` with `options`.
   *
   * @param {Object} options
   */

  constructor(options) {
    this.options(options);
  }

  /**
   * Set the `options` for the store.
   *
   * @param {Object} options
   *   @field {Boolean} enabled (true)
   */

  options(options) {
    if (arguments.length === 0) return this._options;

    options = { enabled: true, ...(options || {}) };

    this.enabled = options.enabled && store.enabled;
    this._options = options;
  }

  /**
   * Set a `key` and `value` in local storage.
   *
   * @param {string} key
   * @param {Object} value
   */

  set(key, value) {
    if (!this.enabled) return false;
    return store.set(key, value);
  }

  /**
   * Get a value from local storage by `key`.
   *
   * @param {string} key
   * @return {Object}
   */

  get(key) {
    if (!this.enabled) return null;
    return store.get(key);
  }

  /**
   * Remove a value from local storage by `key`.
   *
   * @param {string} key
   */

  remove(key) {
    if (!this.enabled) return false;
    return store.remove(key);
  }
}

/**
 * Expose the store singleton.
 */
export default bindAll(new Store());
