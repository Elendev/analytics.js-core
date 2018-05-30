import clone from 'clone';
import cookie from './cookie';
import initDebug from 'debug';
import memory from './memory';
import store from './store';

const debug = initDebug('analytics:entity');

/**
 * Expose `Entity`
 */

export default class Entity {

  /**
   * Initialize new `Entity` with `options`.
   *
   * @param {Object} options
   */
  constructor(options) {
    this.options(options);
    this.initialize();
  }

  /**
   * Initialize picks the storage.
   *
   * Checks to see if cookies can be set
   * otherwise fallsback to localStorage.
   */
  initialize() {
    cookie.set('ajs:cookies', true);

    // cookies are enabled.
    if (cookie.get('ajs:cookies')) {
      cookie.remove('ajs:cookies');
      this._storage = cookie;
      return;
    }

    // localStorage is enabled.
    if (store.enabled) {
      this._storage = store;
      return;
    }

    // fallback to memory storage.
    debug('warning using memory store both cookies and localStorage are disabled');
    this._storage = memory;
  }

  /**
   * Get the storage.
   */
  storage() {
    return this._storage;
  }

  /**
   * Get or set storage `options`.
   *
   * @param {Object} options
   *   @property {Object} cookie
   *   @property {Object} localStorage
   *   @property {Boolean} persist (default: `true`)
   */
  options(options) {
    if (arguments.length === 0) return this._options;
    this._options = { ...this.defaults || {}, ...options || {} };
  }

  /**
   * Get or set the entity's `id`.
   *
   * @param {String} id
   */
  id(id) {
    switch (arguments.length) {
    case 0: return this._getId();
    case 1: return this._setId(id);
    default:
      // No default case
    }
  }

  /**
   * Get the entity's id.
   *
   * @return {String}
   */
  _getId() {
    var ret = this._options.persist
      ? this.storage().get(this._options.cookie.key)
      : this._id;
    return ret === undefined ? null : ret;
  }

  /**
   * Set the entity's `id`.
   *
   * @param {String} id
   */
  _setId(id) {
    if (this._options.persist) {
      this.storage().set(this._options.cookie.key, id);
    } else {
      this._id = id;
    }
  }

  /**
   * Get or set the entity's `traits`.
   *
   * BACKWARDS COMPATIBILITY: aliased to `properties`
   *
   * @param {Object} traits
   */
  traits(traits) {
    switch (arguments.length) {
    case 0: return this._getTraits();
    case 1: return this._setTraits(traits);
    default:
      // No default case
    }
  }

  properties(traits) {
    this.traits(traits);
  }

  /**
   * Get the entity's traits. Always convert ISO date strings into real dates,
   * since they aren't parsed back from local storage.
   *
   * @return {Object}
   */
  _getTraits() {
    var ret = this._options.persist ? store.get(this._options.localStorage.key) : this._traits;
    return ret ? clone(ret) : {};
  }

  /**
   * Set the entity's `traits`.
   *
   * @param {Object} traits
   */
  _setTraits(traits) {
    traits = traits || {};
    if (this._options.persist) {
      store.set(this._options.localStorage.key, traits);
    } else {
      this._traits = traits;
    }
  }

  /**
   * Identify the entity with an `id` and `traits`. If we it's the same entity,
   * extend the existing `traits` instead of overwriting.
   *
   * @param {String} id
   * @param {Object} traits
   */
  identify(id, traits) {
    traits = traits || {};
    var current = this.id();
    if (current === null || current === id) traits = { ...this.traits(), ...traits };
    if (id) this.id(id);
    this.debug('identify %o, %o', id, traits);
    this.traits(traits);
    this.save();
  }

  /**
   * Save the entity to local storage and the cookie.
   *
   * @return {Boolean}
   */
  save() {
    if (!this._options.persist) return false;
    cookie.set(this._options.cookie.key, this.id());
    store.set(this._options.localStorage.key, this.traits());
    return true;
  }

  /**
   * Log the entity out, reseting `id` and `traits` to defaults.
   */
  logout() {
    this.id(null);
    this.traits({});
    cookie.remove(this._options.cookie.key);
    store.remove(this._options.localStorage.key);
  }

  /**
   * Reset all entity state, logging out and returning options to defaults.
   */
  reset() {
    this.logout();
    this.options({});
  }

  /**
   * Load saved entity `id` or `traits` from storage.
   */
  load() {
    this.id(cookie.get(this._options.cookie.key));
    this.traits(store.get(this._options.localStorage.key));
  }
}