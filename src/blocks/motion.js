import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["move_steps"] = {
  init: function () {
    this.appendValueInput("STEPS").setCheck("Number").appendField("step");
    this.appendDummyInput().appendField("times");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["change_position"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("change")
      .appendField(
        new Blockly.FieldDropdown([
          ["x", "x"],
          ["y", "y"],
        ]),
        "MENU"
      )
      .appendField("by");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["set_position"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown([
          ["x", "x"],
          ["y", "y"],
        ]),
        "MENU"
      )
      .appendField("to");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["goto_position"] = {
  init: function () {
    this.appendValueInput("x").setCheck("Number").appendField("go to x");
    this.appendValueInput("y").setCheck("Number").appendField("y");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["get_position"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["x", "x"],
        ["y", "y"],
      ]),
      "MENU"
    );
    this.setOutput(true, "Number");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["angle_turn"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("turn")
      .appendField(
        new Blockly.FieldDropdown([
          [
            {
              src: "icons/right.svg",
              height: 30,
              width: 30,
              alt: "A circular arrow rotating to the right",
            },
            "right",
          ],
          [
            {
              src: "icons/left.svg",
              height: 30,
              width: 30,
              alt: "A circular arrow rotating to the left",
            },
            "left",
          ],
        ]),
        "DIRECTION"
      );
    this.appendDummyInput().appendField("degrees");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["angle_set"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set angle to");
    this.appendDummyInput().appendField("degrees");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["point_towards"] = {
  init: function () {
    this.appendValueInput("x")
      .setCheck("Number")
      .appendField("point towards x");
    this.appendValueInput("y").setCheck("Number").appendField("y");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
};

Blockly.Blocks["get_angle"] = {
  init: function () {
    this.appendDummyInput().appendField("angle");
    this.setOutput(true, "Number");
    this.setStyle("motion_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["move_steps"] = function (
  block,
  generator
) {
  const steps =
    generator.valueToCode(block, "STEPS", BlocklyJS.Order.ATOMIC) || 0;
  return `moveSteps(${steps});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["change_position"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  const menu = block.getFieldValue("MENU");
  if (menu === "y") return `sprite["${menu}"] -= ${amount};\n`;
  else return `sprite["${menu}"] += ${amount};\n`;
};

BlocklyJS.javascriptGenerator.forBlock["set_position"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  const menu = block.getFieldValue("MENU");
  if (menu === "y") return `sprite["${menu}"] = -${amount};\n`;
  else return `sprite["${menu}"] = ${amount};\n`;
};

BlocklyJS.javascriptGenerator.forBlock["goto_position"] = function (
  block,
  generator
) {
  const x = generator.valueToCode(block, "x", BlocklyJS.Order.ATOMIC) || 0;
  const y = generator.valueToCode(block, "y", BlocklyJS.Order.ATOMIC) || 0;
  return `sprite.x = ${x};\nsprite.y = -${y};\n`;
};

BlocklyJS.javascriptGenerator.forBlock["point_towards"] = function (
  block,
  generator
) {
  const x = generator.valueToCode(block, "x", BlocklyJS.Order.ATOMIC) || 0;
  const y = generator.valueToCode(block, "y", BlocklyJS.Order.ATOMIC) || 0;
  return `pointsTowards(${x}, ${y});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["get_position"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`sprite["${menu}"]`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["angle_turn"] = function (
  block,
  generator
) {
  const direction = block.getFieldValue("DIRECTION");
  let amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  if (direction === "left") amount = `-(${amount})`;
  return `setAngle(${amount}, true);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["angle_set"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  return `setAngle(${amount}, false);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["get_angle"] = () => [
  "sprite.angle",
  BlocklyJS.Order.NONE,
];
