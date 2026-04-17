import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { activeSprite } from "../scripts/editor";

Blockly.Blocks["sound_sounds_menu"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(function () {
        const sounds = activeSprite?.sounds || [];
        const options =
          sounds.length < 1 ? [["...", ""]] : sounds.map(i => [i.name, i.id]);

        const val = this.getValue();
        if (val && !options.some(opt => opt[1] === val)) {
          options.push([val, val]);
        }

        return options;
      }),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("sound_blocks");
  },
};

javascriptGenerator.forBlock["sound_sounds_menu"] = function (block, generator) {
  return [generator.quote_(block.getFieldValue("MENU")), Order.ATOMIC];
};

Blockly.Blocks["play_sound"] = {
  init: function () {
    this.appendValueInput("name").setCheck("String").appendField("play sound");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["until finished", "true"],
        ["without waiting", "false"],
      ]),
      "wait",
    );
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

javascriptGenerator.forBlock["play_sound"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
  var wait = block.getFieldValue("wait");
  return `yield* playSound(${name}, ${wait});\n`;
};

Blockly.Blocks["stop_sound"] = {
  init: function () {
    this.appendValueInput("name").setCheck("String").appendField("stop sound");
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

javascriptGenerator.forBlock["stop_sound"] = function (block, generator) {
  var name = generator.valueToCode(block, "name", Order.ATOMIC);
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
        "who",
      )
      .appendField("sounds");
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

javascriptGenerator.forBlock["stop_all_sounds"] = function (block) {
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
        "property",
      )
      .appendField("to");
    this.appendDummyInput().appendField("%");
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
};

javascriptGenerator.forBlock["set_sound_property"] = function (block, generator) {
  var value = generator.valueToCode(block, "value", Order.ATOMIC);
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
      "property",
    );
    this.setStyle("sound_blocks");
    this.setOutput(true, "Number");
  },
};

javascriptGenerator.forBlock["get_sound_property"] = function (block) {
  var property = block.getFieldValue("property");
  return [`soundProperties["${property}"]`, Order.NONE];
};
