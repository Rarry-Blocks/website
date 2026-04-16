import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
  "move_steps",
  function () {
    this.appendValueInput("STEPS").setCheck("Number").appendField("step");
    this.appendDummyInput().appendField("times");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
  function (block, generator) {
    const steps =
      generator.valueToCode(block, "STEPS", BlocklyJS.Order.ATOMIC) || 0;
    return `moveSteps(${steps});\nyield;\n`;
  }
);

quickBlockMaker(
  "change_position",
  function () {
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
  function (block, generator) {
    const amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
    const menu = block.getFieldValue("MENU");
    if (menu === "x") return `getTarget().${menu} += ${amount};\nyield;\n`;
    if (menu === "y") return `getTarget().${menu} -= ${amount};\nyield;\n`;
    return "";
  }
);

quickBlockMaker(
  "set_position",
  function () {
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
  function (block, generator) {
    const amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
    const menu = block.getFieldValue("MENU");
    if (menu === "y") return `getTarget().${menu} = -${amount};\n`;
    return `getTarget().${menu} = ${amount};\nyield;\n`;
  }
);

quickBlockMaker(
  "goto_position",
  function () {
    this.appendValueInput("x").setCheck("Number").appendField("go to x");
    this.appendValueInput("y").setCheck("Number").appendField("y");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
  function (block, generator) {
    const x = generator.valueToCode(block, "x", BlocklyJS.Order.ATOMIC) || 0;
    const y = generator.valueToCode(block, "y", BlocklyJS.Order.ATOMIC) || 0;
    return `getTarget().x = ${x};\ngetTarget().y = -${y};\nyield;\n`;
  }
);

quickBlockMaker(
  "get_position",
  function () {
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
  function (block) {
    const menu = block.getFieldValue("MENU");
    return [`getTarget()["${menu}"]`, BlocklyJS.Order.NONE];
  }
);

quickBlockMaker(
  "angle_turn",
  function () {
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
  function (block, generator) {
    const direction = block.getFieldValue("DIRECTION");
    let amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
    if (direction === "left") amount = `-(${amount})`;
    return `setAngle(${amount}, true);\nyield;\n`;
  }
);

quickBlockMaker(
  "angle_set",
  function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set angle to");
    this.appendDummyInput().appendField("degrees");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
  function (block, generator) {
    const amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
    return `setAngle(${amount}, false);\nyield;\n`;
  }
);

quickBlockMaker(
  "point_towards",
  function () {
    this.appendValueInput("x")
      .setCheck("Number")
      .appendField("point towards x");
    this.appendValueInput("y").setCheck("Number").appendField("y");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("motion_blocks");
  },
  function (block, generator) {
    const x = generator.valueToCode(block, "x", BlocklyJS.Order.ATOMIC) || 0;
    const y = generator.valueToCode(block, "y", BlocklyJS.Order.ATOMIC) || 0;
    return `pointsTowards(${x}, ${y});\nyield;\n`;
  }
);

quickBlockMaker(
  "get_angle",
  function () {
    this.appendDummyInput().appendField("angle");
    this.setOutput(true, "Number");
    this.setStyle("motion_blocks");
  },
  () => ["getTarget().angle", BlocklyJS.Order.NONE]
);
