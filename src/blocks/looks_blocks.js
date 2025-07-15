import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["say_message"] = {
  init: function () {
    this.appendValueInput("MESSAGE").setCheck(null).appendField("say");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["say_message_duration"] = {
  init: function () {
    this.appendValueInput("MESSAGE").setCheck(null).appendField("say");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("seconds");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["switch_costume"] = {
  init: function () {
    this.appendValueInput("COSTUME")
      .setCheck("String")
      .appendField("switch costume to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["set_size"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set size to");
    this.appendDummyInput().appendField("%");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["change_size"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("change size by");
    this.appendDummyInput().appendField("%");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["get_costume_size"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("costume")
      .appendField(
        new Blockly.FieldDropdown([
          ["width", "width"],
          ["height", "height"],
        ]),
        "MENU"
      );
    this.setOutput(true, "Number");
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["get_sprite_scale"] = {
  init: function () {
    this.appendDummyInput().appendField("size");
    this.setOutput(true, "Number");
    this.setColour("#9966FF");
  },
};

BlocklyJS.javascriptGenerator.forBlock["say_message"] = function (block, generator) {
  const message =
    generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) ||
    "";

  return `sayMessage(${message});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["say_message_duration"] = function (
  block,
  generator
) {
  const message =
    generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) ||
    "";
  const duration =
    generator.valueToCode(block, "DURATION", BlocklyJS.Order.ATOMIC) ||
    2;

  return `sayMessage(${message}, ${duration});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["switch_costume"] = function (block, generator) {
  var costume = generator.valueToCode(
    block,
    "COSTUME",
    BlocklyJS.Order.ATOMIC
  );
  return `switchCostume(${costume});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["set_size"] = function (block, generator) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) ||
    100;
  return `setSize(${amount}, false);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["change_size"] = function (block, generator) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) ||
    100;
  return `setSize(${amount}, true);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["get_costume_size"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getCostumeSize("${menu}")`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["get_sprite_scale"] = function () {
  return [`getSpriteScale()`, BlocklyJS.Order.NONE];
};
