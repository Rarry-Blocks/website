Blockly.Blocks["move_steps"] = {
  init: function () {
    this.appendValueInput("STEPS").setCheck("Number").appendField("move");
    this.appendDummyInput().appendField("steps");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
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
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
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
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["goto_position"] = {
  init: function () {
    this.appendValueInput("x").setCheck("Number").appendField("go to x:");
    this.appendValueInput("y").setCheck("Number").appendField("y:");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
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
    this.setColour("#4C97FF");
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
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["angle_set"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set angle to");
    this.appendDummyInput().appendField("degrees");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["get_angle"] = {
  init: function () {
    this.appendDummyInput().appendField("angle");
    this.setOutput(true, "Number");
    this.setColour("#4C97FF");
  },
};

Blockly.JavaScript.forBlock["move_steps"] = function (block, generator) {
  const steps =
    generator.valueToCode(block, "STEPS", Blockly.JavaScript.ORDER_ATOMIC) || 0;
  return `moveSteps(${steps});\n`;
};

Blockly.JavaScript.forBlock["change_position"] = function (block, generator) {
  const amount =
    generator.valueToCode(block, "AMOUNT", Blockly.JavaScript.ORDER_ATOMIC) ||
    0;
  const menu = block.getFieldValue("MENU");
  return `changePosition("${menu}", ${amount});\n`;
};

Blockly.JavaScript.forBlock["set_position"] = function (block, generator) {
  const amount =
    generator.valueToCode(block, "AMOUNT", Blockly.JavaScript.ORDER_ATOMIC) ||
    0;
  const menu = block.getFieldValue("MENU");
  return `setPosition("${menu}", ${amount});\n`;
};

Blockly.JavaScript.forBlock["goto_position"] = function (block, generator) {
  const x =
    generator.valueToCode(block, "x", Blockly.JavaScript.ORDER_ATOMIC) || 0;
  const y =
    generator.valueToCode(block, "y", Blockly.JavaScript.ORDER_ATOMIC) || 0;
  return `setPosition("x", ${x});\nsetPosition("y", ${y});\n`;
};

Blockly.JavaScript.forBlock["get_position"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getPosition("${menu}")`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript.forBlock["angle_turn"] = function (block, generator) {
  const direction = block.getFieldValue("DIRECTION");
  let amount =
    generator.valueToCode(block, "AMOUNT", Blockly.JavaScript.ORDER_ATOMIC) ||
    0;
  if (direction === "left") amount = `-(${amount})`;
  return `setAngle(${amount}, true);\n`;
};

Blockly.JavaScript.forBlock["angle_set"] = function (block, generator) {
  const amount =
    generator.valueToCode(block, "AMOUNT", Blockly.JavaScript.ORDER_ATOMIC) ||
    0;
  return `setAngle(${amount}, false);\n`;
};

Blockly.JavaScript.forBlock["get_angle"] = () => [
  "getAngle()",
  Blockly.JavaScript.ORDER_NONE,
];
