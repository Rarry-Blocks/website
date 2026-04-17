import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { activeSprite } from "../scripts/editor";

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

javascriptGenerator.forBlock["say_message"] = function (
  block,
  generator
) {
  const message =
    generator.valueToCode(block, "MESSAGE", Order.NONE) || "";

  return `sayMessage(${message});\nyield;\n`;
};

javascriptGenerator.forBlock["say_message_duration"] = function (
  block,
  generator
) {
  const message =
    generator.valueToCode(block, "MESSAGE", Order.NONE) || "";
  const duration =
    generator.valueToCode(block, "DURATION", Order.ATOMIC) || 2;

  return `sayMessage(${message}, ${duration});\nyield;\n`;
};

javascriptGenerator.forBlock["switch_costume"] = function (
  block,
  generator
) {
  var costume = generator.valueToCode(block, "COSTUME", Order.ATOMIC);
  return `switchCostume(${costume});\nyield;\n`;
};

javascriptGenerator.forBlock["set_size"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", Order.ATOMIC) || 100;
  return `setSize(${amount}, false);\nyield;\n`;
};

javascriptGenerator.forBlock["change_size"] = function (
  block,
  generator
) {
  const amount =
    generator.valueToCode(block, "AMOUNT", Order.ATOMIC) || 100;
  return `setSize(${amount}, true);\nyield;\n`;
};

javascriptGenerator.forBlock["get_costume_size"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getCostumeSize("${menu}")`, Order.NONE];
};

javascriptGenerator.forBlock["get_sprite_scale"] = function () {
  return [`getSpriteScale()`, Order.NONE];
};

javascriptGenerator.forBlock["looks_hide_sprite"] = function () {
  return "toggleVisibility(false);\nyield;\n";
};

javascriptGenerator.forBlock["looks_show_sprite"] = function () {
  return "toggleVisibility(true);\nyield;\n";
};

javascriptGenerator.forBlock["looks_setVisibility_sprite"] = function (
  block,
  generator
) {
  const visible =
    generator.valueToCode(block, "VISIBLE", Order.ATOMIC) ?? "false";

  return `toggleVisibility(${visible});\nyield;\n`;
};

javascriptGenerator.forBlock["looks_isVisible"] = () => [
  "getTarget().visible",
  Order.NONE,
];

Blockly.Blocks["looks_costumes_menu"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(() => {
        const costumes = activeSprite.costumes;
        return costumes.length < 1
          ? [["...", ""]]
          : costumes.map(i => [i.name, i.id]);
      }),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("looks_blocks");
  },
};

javascriptGenerator.forBlock["looks_costumes_menu"] = function (
  block,
  generator,
) {
  return [generator.quote_(block.getFieldValue("MENU")), Order.ATOMIC];
};