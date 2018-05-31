import Facade from "./Facade";

export default class Track extends Facade {
  action() {
    return "track";
  }

  name() {
    return this.properties.name || this.properties.label;
  }

  category() {
    return this.properties.category;
  }

  value() {
    return this.properties.value;
  }

  event() {
    return this.obj.event;
  }

  revenue() {
    return this.properties.revenue;
  }
}
