import Facade from "./Facade";
import Track from "./Track";

export default class Page extends Facade {
  category() {
    return this.obj.category;
  }

  name() {
    return this.obj.name;
  }

  /**
   * Get the facade's action.
   *
   * @return {string}
   */
  type() {
    return "page";
  }

  /**
   * Get the page fullName.
   *
   * @return {string}
   */
  fullName() {
    const category = this.category();
    const name = this.name();
    return name && category ? `${category} ${name}` : name;
  }

  /**
   * Convert this Page to a Track facade with `name`.
   *
   * @param {string} name Name of the event
   * @return {Track}
   */
  track(name) {
    const json = this.json();
    json.event = this.event(name);
    json.timestamp = this.timestamp();
    json.properties = this.properties();
    return new Track(json, this.opts);
  }
}
