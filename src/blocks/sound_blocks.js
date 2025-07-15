import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["play_sound"] = {
  init: function () {
    this.appendValueInput("name").setCheck("String").appendField("play sound");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["until finished", "true"],
        ["without waiting", "false"],
      ]),
      "wait"
    );
    this.setColour("#ff66ba");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

BlocklyJS.javascriptGenerator.forBlock["play_sound"] = function (block, generator) {
  var name = generator.valueToCode(
    block,
    "name",
    BlocklyJS.Order.ATOMIC
  );
  var wait = block.getFieldValue("wait");
  return `await playSound(${name}, ${wait});\n`;
};

Blockly.Blocks["stop_sound"] = {
  init: function () {
    this.appendValueInput("name").setCheck("String").appendField("stop sound");
    this.setColour("#ff66ba");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

BlocklyJS.javascriptGenerator.forBlock["stop_sound"] = function (block, generator) {
  var name = generator.valueToCode(
    block,
    "name",
    BlocklyJS.Order.ATOMIC
  );
  return `stopSound(${name});\n`;
};

Blockly.Blocks["stop_all_sounds"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("stop")
      .appendField(
        new Blockly.FieldDropdown([
          ["all", "false"],
          ["my", "true"],
        ]),
        "who"
      )
      .appendField("sounds");
    this.setColour("#ff66ba");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

BlocklyJS.javascriptGenerator.forBlock["stop_all_sounds"] = function (block) {
  var who = block.getFieldValue("who");
  var code = `stopAllSounds(${who});\n`;
  return code;
};

Blockly.Blocks["set_sound_property"] = {
  init: function () {
    this.appendValueInput("value")
      .setCheck("Number")
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown([
          ["volume", "volume"],
          ["speed", "speed"],
        ]),
        "property"
      )
      .appendField("to");
    this.appendDummyInput().appendField("%");
    this.setColour("#ff66ba");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
  },
};

BlocklyJS.javascriptGenerator.forBlock["set_sound_property"] = function (
  block,
  generator
) {
  var value = generator.valueToCode(
    block,
    "value",
    BlocklyJS.Order.ATOMIC
  );
  var property = block.getFieldValue("property");
  return `setSoundProperty("${property}", ${value});\n`;
};

Blockly.Blocks["get_sound_property"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["volume", "volume"],
        ["speed", "speed"],
      ]),
      "property"
    );
    this.setColour("#ff66ba");
    this.setOutput(true, "Number");
  },
};

BlocklyJS.javascriptGenerator.forBlock["get_sound_property"] = function (block) {
  var property = block.getFieldValue("property");
  return [`getSoundProperty("${property}")`, BlocklyJS.Order.NONE];
};
