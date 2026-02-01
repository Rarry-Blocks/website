import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

const tweensList = [
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
];

Blockly.Blocks["tween_block"] = {
  init: function () {
    this.appendValueInput("FROM").setCheck("Number").appendField("tween from");
    this.appendValueInput("TO").setCheck("Number").appendField("to");
    this.appendDummyInput().appendField("in");
    this.appendValueInput("DURATION").setCheck("Number");
    this.appendDummyInput().appendField("seconds using");
    this.appendDummyInput()
      .appendField(
        new Blockly.FieldDropdown(tweensList),
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

    this.appendStatementInput("DO").setCheck("default");
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
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
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

  const code = `yield* startTween({
  from: ${from},
  to: ${to},
  duration: ${duration},
  easing: "${easingMode + easingType}",
  wait: ${waitMode === "WAIT"},
  onUpdate: function* (tweenValue) => {
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
        new Blockly.FieldDropdown(tweensList),
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
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
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
    fromGetter = `sprite.angle`;
    setter = `setAngle(tweenValue, false)`;
  } else {
    fromGetter = `sprite["${prop}"]`;
    setter = `sprite["${prop}"] = tweenValue`;
  }

  setter = generator.addLoopTrap(setter, block);

  const code = `yield* startTween({
  from: ${fromGetter},
  to: ${to},
  duration: ${duration},
  easing: "${easingMode + easingType}",
  onUpdate: function* (tweenValue) => {
    ${setter};
  }
});\n`;

  return code;
};
