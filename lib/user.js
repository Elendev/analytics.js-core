import Entity from './entity';
import bindAll from 'bind-all';
import cookie from './cookie';
import initDebug from 'debug';
import rawCookie from 'component-cookie';
import uuidV4 from 'uuid/v4';

const debug = initDebug('analytics:user');

export class User extends Entity {
  debug = debug;

  /**
   * User defaults
   */
  defaults = {
    persist: true,
    cookie: {
      key: 'ajs_user_id',
      oldKey: 'ajs_user'
    },
    localStorage: {
      key: 'ajs_user_traits'
    }
  };

  /**
   * Initialize a new `User` with `options`.
   *
   * @param {Object} options
   */
  constructor(options) {
    super(options);
  }


  /**
   * Set/get the user id.
   *
   * When the user id changes, the method will reset his anonymousId to a new one.
   *
   * // FIXME: What are the mixed types?
   * @param {string} id
   * @return {Mixed}
   * @example
   * // didn't change because the user didn't have previous id.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * assert.equal(anonymousId, user.anonymousId());
   *
   * // didn't change because the user id changed to null.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * user.id(null);
   * assert.equal(anonymousId, user.anonymousId());
   *
   * // change because the user had previous id.
   * anonymousId = user.anonymousId();
   * user.id('foo');
   * user.id('baz'); // triggers change
   * user.id('baz'); // no change
   * assert.notEqual(anonymousId, user.anonymousId());
   */

  id(id) {
    var prev = this._getId();
    var ret = Entity.prototype.id.apply(this, arguments);
    if (prev == null) return ret;
    // FIXME: We're relying on coercion here (1 == "1"), but our API treats these
    // two values differently. Figure out what will break if we remove this and
    // change to strict equality
    /* eslint-disable eqeqeq */
    if (prev != id && id) this.anonymousId(null);
    /* eslint-enable eqeqeq */
    return ret;
  }

  /**
   * Set / get / remove anonymousId.
   *
   * @param {String} anonymousId
   * @return {String|User}
   */
  anonymousId(anonymousId) {
    var store = this.storage();

    // set / remove
    if (arguments.length) {
      store.set('ajs_anonymous_id', anonymousId);
      return this;
    }

    // new
    anonymousId = store.get('ajs_anonymous_id');
    if (anonymousId) {
      return anonymousId;
    }

    // old - it is not stringified so we use the raw cookie.
    anonymousId = rawCookie('_sio');
    if (anonymousId) {
      anonymousId = anonymousId.split('----')[0];
      store.set('ajs_anonymous_id', anonymousId);
      store.remove('_sio');
      return anonymousId;
    }

    // empty
    anonymousId = uuidV4();
    store.set('ajs_anonymous_id', anonymousId);
    return store.get('ajs_anonymous_id');
  }

  /**
   * Remove anonymous id on logout too.
   */
  logout() {
    Entity.prototype.logout.call(this);
    this.anonymousId(null);
  }

  /**
   * Load saved user `id` or `traits` from storage.
   */

  load() {
    if (this._loadOldCookie()) return;
    Entity.prototype.load.call(this);
  }


  /**
   * BACKWARDS COMPATIBILITY: Load the old user from the cookie.
   *
   * @api private
   * @return {boolean}
   */

  _loadOldCookie() {
    var user = cookie.get(this._options.cookie.oldKey);
    if (!user) return false;

    this.id(user.id);
    this.traits(user.traits);
    cookie.remove(this._options.cookie.oldKey);
    return true;
  }
}


/**
 * Expose the user singleton.
 */

export default bindAll(new User());
