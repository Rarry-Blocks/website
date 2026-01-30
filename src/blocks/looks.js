import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["say_message"] = {
  init: function () {
    this.appendValueInput("MESSAGE").appendField("say");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["say_message_duration"] = {
  init: function () {
    this.appendValueInput("MESSAGE").appendField("say");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("seconds");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["switch_costume"] = {
  init: function () {
    this.appendValueInput("COSTUME")
      .setCheck("String")
      .appendField("switch costume to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("looks_blocks");
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
    this.setStyle("looks_blocks");
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
    this.setStyle("looks_blocks");
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
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["get_sprite_scale"] = {
  init: function () {
    this.appendDummyInput().appendField("size");
    this.setOutput(true, "Number");
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["looks_hide_sprite"] = {
  init: function () {
    this.appendDummyInput().appendField("hide sprite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["looks_show_sprite"] = {
  init: function () {
    this.appendDummyInput().appendField("show sprite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["looks_setVisibility_sprite"] = {
  init: function () {
    this.appendValueInput("VISIBLE").setCheck("Boolean").appendField("set visibility to");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
};

Blockly.Blocks["looks_isVisible"] = {
  init: function () {
    this.appendDummyInput().appendField("is visible");
    this.setOutput(true, "Boolean");
    this.setStyle("looks_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["say_message"] = function (
  block,
  generator
) {
  const message =
    generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) || "";

  return `sayMessage(${message});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["say_message_duration"] = function (
  block,
  generator
) {
  const message =
    generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) || "";
  const duration =
    generator.valueToCode(block, "DURATION", BlocklyJS.Order.ATOMIC) || 2;

  return `sayMessage(${message}, ${duration});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["switch_costume"] = function (
  block,
  generator
) {
  var costume = generator.valueToCode(block, "COSTUME", BlocklyJS.Order.ATOMIC);
  return `switchCostume(${costume});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["set_size"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 100;
  return `setSize(${amount}, false);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["change_size"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 100;
  return `setSize(${amount}, true);\n`;
};

BlocklyJS.javascriptGenerator.forBlock["get_costume_size"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getCostumeSize("${menu}")`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["get_sprite_scale"] = function () {
  return [`getSpriteScale()`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["looks_hide_sprite"] = function () {
  return "toggleVisibility(false);\n";
};

BlocklyJS.javascriptGenerator.forBlock["looks_show_sprite"] = function () {
  return "toggleVisibility(true);\n";
};

BlocklyJS.javascriptGenerator.forBlock["looks_setVisibility_sprite"] = function (
  block,
  generator
) {
  const visible =
    generator.valueToCode(block, "VISIBLE", BlocklyJS.Order.ATOMIC) ?? "false";

  return `toggleVisibility(${visible});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["looks_isVisible"] = () => [
  "sprite.visible",
  BlocklyJS.Order.NONE,
];
