import * as Blockly from "blockly/core";

export class Checkbox extends Blockly.FieldCheckbox {
  constructor(value, validator, config) {
    super(value, validator, config);
  }

  static fromJson(options) {
    return new Checkbox(options["checked"], undefined, options);
  }

  initView() {
    this.checkPath_ = "M 0 6.5 6.5 13 16.25 0";
    this.xPath_ = "M 14.625 0 L 1.625 13 M 14.625 13 L 1.625 0";
    this.borderRect_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.RECT,
      {
        x: 0,
        y: 0,
        width: 16.25,
        height: 13,
        opacity: 0,
        cursor: "pointer",
      },
      this.fieldGroup_,
    );
    this.checkElement_ = Blockly.utils.dom.createSvgElement(
      Blockly.utils.Svg.PATH,
      {
        d: this.getValueBoolean() ? this.checkPath_ : this.xPath_,
        stroke: "#ffffff",
        opacity: this.getValueBoolean() ? 0.5 : 0,
        "stroke-width": 4,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
        fill: "none",
        cursor: "pointer",
      },
      this.fieldGroup_,
    );

    this.mouseEnterWrapper_ = Blockly.browserEvents.bind(
      this.fieldGroup_,
      "mouseenter",
      this,
      this.onMouseEnter_,
    );
    this.mouseLeaveWrapper_ = Blockly.browserEvents.bind(
      this.fieldGroup_,
      "mouseleave",
      this,
      this.onMouseLeave_,
    );
  }

  onMouseEnter_() {
    this.isHovered_ = true;
    if (this.checkElement_) {
      this.checkElement_.setAttribute("opacity", 0.5);
    }
  }

  onMouseLeave_() {
    this.isHovered_ = false;
    if (this.checkElement_ && !this.getValueBoolean()) {
      this.checkElement_.setAttribute("opacity", 0);
    }
  }

  doValueUpdate_(newValue) {
    super.doValueUpdate_(newValue);
    if (this.checkElement_) {
      this.checkElement_.setAttribute(
        "d",
        this.getValueBoolean() ? this.checkPath_ : this.xPath_,
      );
      this.checkElement_.setAttribute(
        "opacity",
        this.getValueBoolean() || this.isHovered_ ? 0.5 : 0,
      );
    }
  }

  render_() {
    this.size_.width = 16.25;
    this.size_.height = 13;
  }

  dispose() {
    if (this.mouseEnterWrapper_) {
      Blockly.browserEvents.unbind(this.mouseEnterWrapper_);
    }
    if (this.mouseLeaveWrapper_) {
      Blockly.browserEvents.unbind(this.mouseLeaveWrapper_);
    }
    super.dispose();
  }
}

Blockly.fieldRegistry.unregister("field_checkbox");
Blockly.fieldRegistry.register("field_checkbox", Checkbox);
