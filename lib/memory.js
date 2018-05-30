import bindAll from 'bind-all';
import clone from 'clone';

class Memory {
  /**
   * Initialize `Memory` store
   */
  store = {};

  /**
   * Set a `key` and `value`.
   *
   * @param {String} key
   * @param {Mixed} value
   * @return {Boolean}
   */

  set(key, value) {
    this.store[key] = clone(value);
    return true;
  }

  /**
   * Get a `key`.
   *
   * @param {String} key
   */

  get(key) {
    if (!this.store.hasOwnProperty(key)) return;
    return clone(this.store[key]);
  }

  /**
   * Remove a `key`.
   *
   * @param {String} key
   * @return {Boolean}
   */

  remove(key) {
    delete this.store[key];
    return true;
  }
}

/**
 * Expose `Memory`
 */
export default bindAll(new Memory());