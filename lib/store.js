import bindAll from 'bind-all';
import defaults from '@ndhoule/defaults';
import store from '@segment/store';


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

    options = options || {};
    defaults(options, { enabled: true });

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
