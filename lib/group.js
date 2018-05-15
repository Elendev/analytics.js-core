import Entity from './entity';
import bindAll from 'bind-all';
import initDebug from 'debug';

const debug = initDebug('analytics:group');

export class Group extends Entity {

  debug = debug;

  /**
   * Group defaults
   */
  defaults = {
    persist: true,
    cookie: {
      key: 'ajs_group_id'
    },
    localStorage: {
      key: 'ajs_group_properties'
    }
  };

  /**
   * Initialize a new `Group` with `options`.
   *
   * @param {Object} options
   */
  constructor(options) {
    super(options);
  }
}

/**
 * Expose the group singleton.
 */
export default bindAll(new Group());
