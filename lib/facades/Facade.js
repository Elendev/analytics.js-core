import clone from "clone";

export default class Facade {
  constructor(obj, opts = {}) {
    if (!("clone" in opts)) {
      opts.clone = true;
    }
    this.opts = opts;
    this.obj = opts.clone ? clone(obj) : obj;
    this.obj.timestamp = new Date();

    if (!("options" in obj)) {
      obj.options = {};
    }

    this.properties = obj.properties || {};
  }

  options(integration) {
    const obj = this.obj.options || this.obj.context || {};
    const options = this.opts.clone ? clone(obj) : obj;
    if (!integration) {
      return options;
    }
    if (!this.enabled(integration)) {
      return false;
    }
    const integrations = this.integrations();
    return integrations[integration] || options[integration] || {};
  }

  properties() {
    return this.properties;
  }

  type() {
    return this.action();
  }

  json() {
    const ret = this.obj;
    if (this.type) {
      ret.type = this.type();
    }
    return ret;
  }

  integrations() {
    return this.obj.integrations || this.options();
  }

  enabled(integration) {
    let enabled = true;
    const options = this.integrations();

    // Next, check for the integration's existence in 'options' to enable it.
    // If the settings are a boolean, use that, otherwise it should be enabled.
    if (options.hasOwnProperty(integration)) {
      const settings = options[integration];
      if (typeof settings === "boolean") {
        enabled = settings;
      }
    }

    return !!enabled;
  }
}
