/* global JSON */
import bindAll from 'bind-all';
import clone from '@ndhoule/clone';
import cookie from 'component-cookie';
import initDebug from 'debug';
import topDomain from '@segment/top-domain';

const debug = initDebug('analytics.js:cookie');

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

  options(options) {
    if (arguments.length === 0) return this._options;

    options = options || {};

    var domain = '.' + topDomain(window.location.href);
    if (domain === '.') domain = null;

    this._options = {
      // default to a year
      maxage: 31536000000,
      path: '/',
      domain: domain,
      ...options
    };

    // http://curl.haxx.se/rfc/cookie_spec.html
    // https://publicsuffix.org/list/effective_tld_names.dat
    //
    // try setting a dummy cookie with the options
    // if the cookie isn't set, it probably means
    // that the domain is on the public suffix list
    // like myapp.herokuapp.com or localhost / ip.
    this.set('ajs:test', true);
    if (!this.get('ajs:test')) {
      debug('fallback to domain=null');
      this._options.domain = null;
    }
    this.remove('ajs:test');
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
      value = JSON.stringify(value);
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
    try {
      var value = cookie(key);
      value = value ? JSON.parse(value) : null;
      return value;
    } catch (e) {
      return null;
    }
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
}


/**
 * Expose the cookie singleton.
 */

export default bindAll(new Cookie());
