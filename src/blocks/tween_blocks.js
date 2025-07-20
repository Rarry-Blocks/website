import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

const TweenEasing = {
  InLinear: (t) => t,
  OutLinear: (t) => t,
  InOutLinear: (t) => t,
  InSine: (t) => 1 - Math.cos((t * Math.PI) / 2),
  OutSine: (t) => Math.sin((t * Math.PI) / 2),
  InOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
  InQuad: (t) => t * t,
  OutQuad: (t) => 1 - (1 - t) * (1 - t),
  InOutQuad: (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2),
  InCubic: (t) => t * t * t,
  OutCubic: (t) => 1 - Math.pow(1 - t, 3),
  InOutCubic: (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  InQuart: (t) => t * t * t * t,
  OutQuart: (t) => 1 - Math.pow(1 - t, 4),
  InOutQuart: (t) =>
    t < 0.5 ? 8 * t * t * t * t : 1 - Math.pow(-2 * t + 2, 4) / 2,
  InQuint: (t) => t * t * t * t * t,
  OutQuint: (t) => 1 - Math.pow(1 - t, 5),
  InOutQuint: (t) =>
    t < 0.5 ? 16 * t * t * t * t * t : 1 - Math.pow(-2 * t + 2, 5) / 2,
  InExpo: (t) => (t === 0 ? 0 : Math.pow(2, 10 * t - 10)),
  OutExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
  InOutExpo: (t) => {
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? Math.pow(2, 20 * t - 10) / 2
      : (2 - Math.pow(2, -20 * t + 10)) / 2;
  },
  InCirc: (t) => 1 - Math.sqrt(1 - Math.pow(t, 2)),
  OutCirc: (t) => Math.sqrt(1 - Math.pow(t - 1, 2)),
  InOutCirc: (t) =>
    t < 0.5
      ? (1 - Math.sqrt(1 - Math.pow(2 * t, 2))) / 2
      : (Math.sqrt(1 - Math.pow(-2 * t + 2, 2)) + 1) / 2,
  InBack: (t) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  },
  OutBack: (t) => {
    const c1 = 1.70158,
      c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  },
  InOutBack: (t) => {
    const c1 = 1.70158,
      c2 = c1 * 1.525;
    return t < 0.5
      ? (Math.pow(2 * t, 2) * ((c2 + 1) * 2 * t - c2)) / 2
      : (Math.pow(2 * t - 2, 2) * ((c2 + 1) * (2 * t - 2) + c2) + 2) / 2;
  },
  InElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * c4);
  },
  OutElastic: (t) => {
    const c4 = (2 * Math.PI) / 3;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  },
  InOutElastic: (t) => {
    const c5 = (2 * Math.PI) / 4.5;
    if (t === 0) return 0;
    if (t === 1) return 1;
    return t < 0.5
      ? -(Math.pow(2, 20 * t - 10) * Math.sin((20 * t - 11.125) * c5)) / 2
      : (Math.pow(2, -20 * t + 10) * Math.sin((20 * t - 11.125) * c5)) / 2 + 1;
  },
  InBounce: (t) => 1 - TweenEasing.OutBounce(1 - t),
  OutBounce: (t) => {
    const n1 = 7.5625,
      d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  },
  InOutBounce: (t) =>
    t < 0.5
      ? (1 - TweenEasing.OutBounce(1 - 2 * t)) / 2
      : (1 + TweenEasing.OutBounce(2 * t - 1)) / 2,
};
window.TweenEasing = TweenEasing;

Blockly.Blocks["tween_block"] = {
  init: function () {
    this.appendValueInput("FROM").setCheck("Number").appendField("tween from");
    this.appendValueInput("TO").setCheck("Number").appendField("to");
    this.appendDummyInput().appendField("in");
    this.appendValueInput("DURATION").setCheck("Number");
    this.appendDummyInput().appendField("seconds using");
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown([
          ["linear", "Linear"],
          ["sine", "Sine"],
          ["quadratic", "Quad"],
          ["cubic", "Cubic"],
          ["quartic", "Quart"],
          ["quintic", "Quint"],
          ["expo", "Expo"],
          ["circ", "Circ"],
          ["back", "Back"],
          ["elastic", "Elastic"],
          ["bounce", "Bounce"],
        ]),
        "EASING_TYPE"
      )
      .appendField(
        new Blockly.FieldDropdown([
          ["in", "In"],
          ["out", "Out"],
          ["in-out", "InOut"],
        ]),
        "EASING_MODE"
      );

    this.appendStatementInput("DO").setCheck(null);
    this.appendDummyInput()
      .setAlign(1)
      .appendField(
        new Blockly.FieldDropdown([
          ["wait", "WAIT"],
          ["don't wait", "DONT_WAIT"],
        ]),
        "WAIT_MODE"
      )
      .appendField("until finished");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#32a2c0");
    this.setTooltip(
      "Tween a value from one number to another over time using easing"
    );
  },
};

BlocklyJS.javascriptGenerator.forBlock["tween_block"] = function (block, generator) {
  const easingType = block.getFieldValue("EASING_TYPE");
  const easingMode = block.getFieldValue("EASING_MODE");
  const from =
    generator.valueToCode(block, "FROM", BlocklyJS.Order.ATOMIC) ||
    "0";
  const to =
    generator.valueToCode(block, "TO", BlocklyJS.Order.ATOMIC) || "0";
  const duration =
    generator.valueToCode(block, "DURATION", BlocklyJS.Order.ATOMIC) ||
    "1";
  const waitMode = block.getFieldValue("WAIT_MODE");

  let branch = BlocklyJS.javascriptGenerator.statementToCode(block, "DO");
  branch = BlocklyJS.javascriptGenerator.addLoopTrap(branch, block);

  const code = `await startTween({
  from: ${from},
  to: ${to},
  duration: ${duration},
  easing: "${easingMode + easingType}",
  wait: ${waitMode === "WAIT"},
  onUpdate: async (tweenValue) => {
    ${branch}  }
});\n`;

  return code;
};

Blockly.Blocks["tween_block_value"] = {
  init: function () {
    this.appendDummyInput("name").appendField("current tween value");
    this.setInputsInline(true);
    this.setColour("#32a2c0");
    this.setOutput(true, "Number");
  },
};

BlocklyJS.javascriptGenerator.forBlock["tween_block_value"] = () => [
  "tweenValue",
  BlocklyJS.Order.NONE,
];

Blockly.Blocks["tween_sprite_property"] = {
  init: function () {
    this.appendValueInput("TO")
      .setCheck("Number")
      .appendField("tween")
      .appendField(
        new Blockly.FieldDropdown([
          ["x position", "x"],
          ["y position", "y"],
          ["angle", "angle"],
          ["size", "size"],
        ]),
        "PROPERTY"
      )
      .appendField("to");
    this.appendValueInput("DURATION").setCheck("Number").appendField("in");
    this.appendDummyInput()
      .appendField("seconds using")
      .appendField(
        new Blockly.FieldDropdown([
          ["linear", "Linear"],
          ["sine", "Sine"],
          ["quadratic", "Quad"],
          ["cubic", "Cubic"],
          ["quartic", "Quart"],
          ["quintic", "Quint"],
          ["expo", "Expo"],
          ["circ", "Circ"],
          ["back", "Back"],
          ["elastic", "Elastic"],
          ["bounce", "Bounce"],
        ]),
        "EASING_TYPE"
      )
      .appendField(
        new Blockly.FieldDropdown([
          ["in", "In"],
          ["out", "Out"],
          ["in-out", "InOut"],
        ]),
        "EASING_MODE"
      );
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#32a2c0");
    this.setTooltip(
      "Tween a sprite property to a target value over time using easing"
    );
  },
};

BlocklyJS.javascriptGenerator.forBlock["tween_sprite_property"] = function (
  block,
  generator
) {
  const prop = block.getFieldValue("PROPERTY");
  const to =
    generator.valueToCode(block, "TO", BlocklyJS.Order.ATOMIC) || "0";
  const duration =
    generator.valueToCode(block, "DURATION", BlocklyJS.Order.ATOMIC) ||
    "1";
  const easingType = block.getFieldValue("EASING_TYPE");
  const easingMode = block.getFieldValue("EASING_MODE");

  let fromGetter, setter;
  if (prop === "size") {
    fromGetter = "getSpriteScale()";
    setter = `setSize(tweenValue, false)`;
  } else if (prop === "angle") {
    fromGetter = `getAngle()`;
    setter = `setAngle(tweenValue, false)`;
  } else {
    fromGetter = `getPosition("${prop}")`;
    setter = `setPosition("${prop}", tweenValue)`;
  }

  setter = generator.addLoopTrap(setter, block);

  const code = `await startTween({
  from: ${fromGetter},
  to: ${to},
  duration: ${duration},
  easing: "${easingMode + easingType}",
  onUpdate: async (tweenValue) => {
    ${setter};
  }
});\n`;

  return code;
};
