import Emitter from 'component-emitter';
import bindAll from 'bind-all';
import clone from '@ndhoule/clone';
import debug from 'debug';
import each from '@ndhoule/each';
import foldl from '@ndhoule/foldl';
import is from 'is';
import isMeta from '@segment/is-meta';
import keys from '@ndhoule/keys';
import nextTick from 'next-tick';
import { bind as on } from 'component-event';
import prevent from '@segment/prevent-default';
import { parse } from 'component-querystring';
import isElement from 'lodash/isElement';
import isString from 'lodash/isString';
import isObject from 'lodash/isObject';

import cookie from './cookie';
import group from './group';
import memory from './memory';
import normalize from './normalize';
import pageDefaults from './pageDefaults';
import store from './store';
import user from './user';
import Track from './facades/Track';
import Page from './facades/Page';
import Identify from './facades/Identify';

export default class Analytics extends Emitter {

  // Just so the snippet cannot be called again
  invoked = true;

  /**
   * Initialize a new `Analytics` instance.
   */

  constructor() {
    super();
    this._options({});
    this.Integrations = {};
    this._integrations = {};
    this._readied = false;
    this._timeout = 300;
    // XXX: BACKWARDS COMPATIBILITY
    this._user = user;
    this.log = debug('analytics.js');
    this.createDebug = debug;
    bindAll(this);

    var self = this;
    this.on('initialize', function(settings, options) {
      if (options.initialPageview) self.page();
      self._parseQuery(window.location.search);
    });
  }

  /**
   * Use a `plugin`.
   *
   * @param {Function} plugin
   * @return {Analytics}
   */

  use(plugin) {
    plugin()(this);
    return this;
  }

  start(calls, configuration) {

    // Replace dummy implementation with the real thing
    window.analytics = this;

    // Include all integrations
    calls.filter(item => item[0] === "use").forEach(item => {
      this.use(item[1]);
    });

    // Initialize configuration
    this.initialize(configuration);

    let pageCalled = false;

    // Replay all events
    calls.filter(item => item[0] !== "use").forEach(args => {
      const method = args.shift();
      pageCalled = (method == "page" || pageCalled);
      this[method].apply(this, args);
    });

    if (!pageCalled) {
      // Make the first page call to load the integrations.
      this.page();
    }

    return this;
  }

  /**
   * Define a new `Integration`.
   *
   * @param {Function} Integration
   * @return {Analytics}
   */

  addIntegration(Integration) {
    var name = Integration.prototype.name;
    if (!name) throw new TypeError('attempted to add an invalid integration');
    this.Integrations[name] = Integration;
    return this;
  }

  /**
   * Initialize with the given integration `settings` and `options`.
   *
   * Aliased to `init` for convenience.
   *
   * @param {Object} [settings={}]
   * @param {Object} [options={}]
   * @return {Analytics}
   */
  initialize(settings, options) {
    settings = settings || {};
    options = options || {};

    this._options(options);
    this._readied = false;

    // clean unknown integrations from settings
    var self = this;
    each(function(opts, name) {
      var Integration = self.Integrations[name];
      if (!Integration) delete settings[name];
    }, settings);

    // add integrations
    each(function(opts, name) {
      var Integration = self.Integrations[name];
      var integration = new Integration(clone(opts));
      self.log('initialize %o - %o', name, opts);
      self.add(integration);
    }, settings);

    var integrations = this._integrations;

    // load user now that options are set
    user.load();
    group.load();

    // make ready callback
    var integrationCount = keys(integrations).length;
    let calledReady = 0;
    var ready = function() {
      calledReady++;

      if (calledReady >= integrationCount) {
        self._readied = true;
        self.emit('ready');
      }
    };

    // init if no integrations
    if (integrationCount <= 0) {
      ready();
    }

    // initialize integrations, passing ready
    each(function(integration) {
      if (options.initialPageview && integration.options.initialPageview === false) {
        const oldPage = integration.page;
        integration.page = function() {
          integration.page = oldPage;
        };
      }

      integration.analytics = self;
      integration.once('ready', ready);
      integration.initialize();
    }, integrations);

    // backwards compat with angular plugin.
    // TODO: remove
    this.initialized = true;

    this.emit('initialize', settings, options);
    return this;
  }

  init() {
    return this.init.apply(this, arguments);
  }

  /**
   * Set the user's `id`.
   *
   * @param {Mixed} id
   */

  setAnonymousId(id) {
    this.user().anonymousId(id);
    return this;
  }

  /**
   * Add an integration.
   *
   * @param {Integration} integration
   */

  add(integration) {
    this._integrations[integration.name] = integration;
    return this;
  }

  /**
   * Identify a user by optional `id` and `traits`.
   *
   * @param {string} [id=user.id()] User ID.
   * @param {Object} [traits=null] User traits.
   * @param {Object} [options=null]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  identify(id, traits, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(traits)) fn = traits, options = null, traits = null;
    if (is.object(id)) options = traits, traits = id, id = user.id();
    /* eslint-enable no-unused-expressions, no-sequences */

    // clone traits before we manipulate so we don't do anything uncouth, and take
    // from `user` so that we carryover anonymous traits
    user.identify(id, traits);

    var msg = this.normalize({
      options: options,
      traits: user.traits(),
      userId: user.id()
    });

    // We only track a user's ID as that's the only information we should track
    this._invoke('identify', new Identify(msg));

    // emit
    this.emit('identify', id, traits, options);
    this._callback(fn);
    return this;
  }

  /**
   * Return the current user.
   *
   * @return {Object}
   */

  user() {
    return user;
  }

  /**
   * Track an `event` that a user has triggered with optional `properties`.
   *
   * @param {string} event
   * @param {Object} [properties=null]
   * @param {Object} [options=null]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  track(event, properties, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(properties)) fn = properties, options = null, properties = null;
    /* eslint-enable no-unused-expressions, no-sequences */

    // figure out if the event is archived.
    var plan = this.options.plan || {};
    var events = plan.track || {};

    // normalize
    var msg = this.normalize({
      properties: properties,
      options: options,
      event: event
    });

    // plan.
    plan = events[event];
    if (plan) {
      this.log('plan %o - %o', event, plan);
      if (plan.enabled === false) return this._callback(fn);
      msg.integrations = { ...plan.integrations || {}, ...msg.integrations };
    }

    this._invoke('track', new Track(msg));

    this.emit('track', event, properties, options);
    this._callback(fn);
    return this;
  }

  /**
   * Helper method to track an outbound link that would normally navigate away
   * from the page before the analytics calls were sent.
   *
   * BACKWARDS COMPATIBILITY: aliased to `trackClick`.
   *
   * @param {Element|Array} links
   * @param {string|Function} event
   * @param {Object|Function} properties (optional)
   * @return {Analytics}
   */
  trackLink(links, event, properties) {
    if (!links) return this;
    // always arrays, handles jquery
    if (isElement(links)) links = [links];

    var self = this;
    each(function(el) {
      if (!isElement(el)) {
        throw new TypeError('Must pass HTMLElement to `analytics.trackLink`.');
      }
      on(el, 'click', function(e) {
        var ev = is.fn(event) ? event(el) : event;
        var props = is.fn(properties) ? properties(el) : properties;
        var href = el.getAttribute('href')
          || el.getAttributeNS('http://www.w3.org/1999/xlink', 'href')
          || el.getAttribute('xlink:href');

        self.track(ev, props);

        if (href && el.target !== '_blank' && !isMeta(e)) {
          prevent(e);
          self._callback(function() {
            window.location.href = href;
          });
        }
      });
    }, links);

    return this;
  }

  trackClick() {
    return this.trackLink.apply(this, arguments);
  }

  /**
   * Helper method to track an outbound form that would normally navigate away
   * from the page before the analytics calls were sent.
   *
   * BACKWARDS COMPATIBILITY: aliased to `trackSubmit`.
   *
   * @param {Element|Array} forms
   * @param {string|Function} event
   * @param {Object|Function} properties (optional)
   * @return {Analytics}
   */
  trackForm(forms, event, properties) {
    if (!forms) return this;
    // always arrays, handles jquery
    if (isElement(forms)) forms = [forms];

    var self = this;
    each(function(el) {
      if (!isElement(el)) throw new TypeError('Must pass HTMLElement to `analytics.trackForm`.');
      function handler(e) {
        prevent(e);

        var ev = is.fn(event) ? event(el) : event;
        var props = is.fn(properties) ? properties(el) : properties;
        self.track(ev, props);

        self._callback(function() {
          el.submit();
        });
      }

      // Support the events happening through jQuery or Zepto instead of through
      // the normal DOM API, because `el.submit` doesn't bubble up events...
      var $ = window.jQuery || window.Zepto;
      if ($) {
        $(el).submit(handler);
      } else {
        on(el, 'submit', handler);
      }
    }, forms);

    return this;
  }

  trackSubmit() {
    return this.trackForm.apply(this, arguments);
  }

  /**
   * Trigger a pageview, labeling the current page with an optional `category`,
   * `name` and `properties`.
   *
   * @param {string} [category]
   * @param {string} [name]
   * @param {Object|string} [properties] (or path)
   * @param {Object} [options]
   * @param {Function} [fn]
   * @return {Analytics}
   */
  page(category, name, properties, options, fn) {
    // Argument reshuffling.
    /* eslint-disable no-unused-expressions, no-sequences */
    if (is.fn(options)) fn = options, options = null;
    if (is.fn(properties)) fn = properties, options = properties = null;
    if (is.fn(name)) fn = name, options = properties = name = null;
    if (isObject(category)) options = name, properties = category, name = category = null;
    if (isObject(name)) options = properties, properties = name, name = null;
    if (isString(category) && !isString(name)) name = category, category = null;
    /* eslint-enable no-unused-expressions, no-sequences */

    properties = clone(properties) || {};
    if (name) properties.name = name;
    if (category) properties.category = category;

    // Ensure properties has baseline spec properties.
    // TODO: Eventually move these entirely to `options.context.page`
    var defs = pageDefaults();
    properties = { ...defs, ...properties };

    // Mirror user overrides to `options.context.page` (but exclude custom properties)
    // (Any page defaults get applied in `this.normalize` for consistency.)
    // Weird, yeah--moving special props to `context.page` will fix this in the long term.
    const overrides = {};
    for (const key in defs) {
      if (defs.hasOwnProperty(key)) {
        overrides[key] = properties[key];
      }
    }

    if (!is.empty(overrides)) {
      options = options || {};
      options.context = options.context || {};
      options.context.page = overrides;
    }

    var msg = this.normalize({
      properties: properties,
      category: category,
      options: options,
      name: name
    });

    this._invoke('page', new Page(msg));

    this.emit('page', category, name, properties, options);
    this._callback(fn);
    return this;
  }

  /**
   * Register a `fn` to be fired when all the analytics services are ready.
   *
   * @param {Function} fn
   * @return {Analytics}
   */
  ready(fn) {
    if (is.fn(fn)) {
      if (this._readied) {
        nextTick(fn);
      } else {
        this.once('ready', fn);
      }
    }
    return this;
  }

  /**
   * Set the `timeout` (in milliseconds) used for callbacks.
   *
   * @param {Number} timeout
   */
  timeout(timeout) {
    this._timeout = timeout;
  }

  /**
   * Enable or disable debug.
   *
   * @param {string|boolean} str
   */
  debug(str) {
    if (!arguments.length || str) {
      debug.enable('analytics:' + (str || '*'));
    } else {
      debug.disable();
    }
  }

  /**
   * Apply options.
   *
   * @param {Object} options
   * @return {Analytics}
   * @api private
   */

  _options(options) {
    options = options || {};
    this.options = options;
    cookie.options(options.cookie);
    store.options(options.localStorage);
    user.options(options.user);
    group.options(options.group);
    return this;
  }

  /**
   * Callback a `fn` after our defined timeout period.
   *
   * @param {Function} fn
   * @return {Analytics}
   * @api private
   */

  _callback(fn) {
    if (is.fn(fn)) {
      this._timeout ? setTimeout(fn, this._timeout) : nextTick(fn);
    }
    return this;
  }

  /**
   * Call `method` with `facade` on all enabled integrations.
   *
   * @param {string} method
   * @param {Facade} facade
   * @return {Analytics}
   * @api private
   */
  _invoke(method, facade) {
    this.emit('invoke', facade);

    each(function(integration, name) {
      if (!facade.enabled(name)) return;
      integration.invoke.call(integration, method, facade);
    }, this._integrations);

    return this;
  }

  /**
   * Push `args`.
   *
   * @param {Array} args
   * @api private
   */

  push(args) {
    var method = args.shift();
    if (!this[method]) return;
    this[method].apply(this, args);
  }

  /**
   * Reset group and user traits and id's.
   *
   * @api public
   */

  reset() {
    this.user().logout();
    this.group().logout();
  }

  /**
   * Parse the query string for callable methods.
   *
   * @param {String} query
   * @return {Analytics}
   * @api private
   */
  _parseQuery(query) {
    // Parse querystring to an object
    var q = parse(query);
    // Create traits and properties objects, populate from querysting params
    var traits = pickPrefix('ajs_trait_', q);
    var props = pickPrefix('ajs_prop_', q);
    // Trigger based on callable parameters in the URL
    if (q.ajs_uid) this.identify(q.ajs_uid, traits);
    if (q.ajs_event) this.track(q.ajs_event, props);
    if (q.ajs_aid) user.anonymousId(q.ajs_aid);
    return this;

    /**
     * Create a shallow copy of an input object containing only the properties
     * whose keys are specified by a prefix, stripped of that prefix
     *
     * @param {String} prefix
     * @param {Object} object
     * @return {Object}
     * @api private
     */

    function pickPrefix(prefix, object) {
      var length = prefix.length;
      var sub;
      return foldl(function(acc, val, key) {
        if (key.substr(0, length) === prefix) {
          sub = key.substr(length);
          acc[sub] = val;
        }
        return acc;
      }, {}, object);
    }
  }

  /**
   * Normalize the given `msg`.
   *
   * @param {Object} msg
   * @return {Object}
   */
  normalize(msg) {
    msg = normalize(msg, keys(this._integrations));
    if (msg.anonymousId) user.anonymousId(msg.anonymousId);
    msg.anonymousId = user.anonymousId();

    // Ensure all outgoing requests include page data in their contexts.
    msg.context.page = { ...pageDefaults(), ...msg.context.page || {} };

    return msg;
  }
}

Analytics.memory = memory;
Analytics.store = store;
Analytics.cookie = cookie;
