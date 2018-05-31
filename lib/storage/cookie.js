/* global JSON */
import bindAll from 'bind-all';
import clone from 'clone';
import cookie from 'component-cookie';
import topDomain from '@segment/top-domain';

export class Cookie {
  /**
   * Initialize a new `Cookie` with `options`.
   *
   * @param {Object} options
   */
  constructor(options) {
    this.options(options);
  }

  /**
   * Get or set the cookie options.
   *
   * @param {Object} options
   *   @field {Number} maxage (1 year)
   *   @field {String} domain
   *   @field {String} path
   *   @field {Boolean} secure
   */

  options(options = {}) {
    //if (arguments.length === 0) return this._options;

    var domain = '.' + topDomain(window.location.href);
    if (domain === '.') domain = null;

    this._options = {
      // default to a year
      maxage: 31536000000,
      path: '/',
      domain: domain,
      ...options
    };
  }


  /**
   * Set a `key` and `value` in our cookie.
   *
   * @param {String} key
   * @param {Object} value
   * @return {Boolean} saved
   */

  set(key, value) {
    try {
      cookie(key, value, clone(this._options));
      return true;
    } catch (e) {
      return false;
    }
  }


  /**
   * Get a value from our cookie by `key`.
   *
   * @param {String} key
   * @return {Object} value
   */

  get(key) {
    return cookie.get(key);
  }


  /**
   * Remove a value from our cookie by `key`.
   *
   * @param {String} key
   * @return {Boolean} removed
   */

  remove(key) {
    try {
      cookie(key, null, clone(this._options));
      return true;
    } catch (e) {
      return false;
    }
  }

  isEnabled() {
    this.set('ajs:cookies', true);

    // cookies are enabled.
    if (this.get('ajs:cookies')) {
      this.remove('ajs:cookies');
      return true;
    }

    return false;
  }
}


/**
 * Expose the cookie singleton.
 */

export default bindAll(new Cookie());
