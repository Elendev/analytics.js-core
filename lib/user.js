import bindAll from "bind-all";
import initDebug from "debug";
import uuidV4 from "uuid/v4";

import Entity from "./entity";

const debug = initDebug("analytics:user");

export class User extends Entity {
  debug = debug;

  /**
   * User defaults
   */
  defaults = {
    persist: true,
    cookie: {
      key: "ajs_user_id"
    },
    localStorage: {
      key: "ajs_user_traits"
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
    const prev = this._getId();
    const ret = Entity.prototype.id.apply(this, arguments);
    if (prev == null) {
      return ret;
    }
    // FIXME: We're relying on coercion here (1 == "1"), but our API treats these
    // two values differently. Figure out what will break if we remove this and
    // change to strict equality
    /* eslint-disable eqeqeq */
    if (prev != id && id) {
      this.anonymousId(null);
    }
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
    const store = this.storage();

    // set / remove
    if (arguments.length) {
      store.set("ajs_anonymous_id", anonymousId);
      return this;
    }

    // new
    anonymousId = store.get("ajs_anonymous_id");
    if (anonymousId) {
      return anonymousId;
    }

    // empty
    anonymousId = uuidV4();
    store.set("ajs_anonymous_id", anonymousId);
    return store.get("ajs_anonymous_id");
  }

  /**
   * Remove anonymous id on logout too.
   */
  logout() {
    Entity.prototype.logout.call(this);
    this.anonymousId(null);
  }
}

/**
 * Expose the user singleton.
 */

export default bindAll(new User());
