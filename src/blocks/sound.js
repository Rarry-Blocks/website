import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { activeSprite } from "../scripts/editor";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
  "sound_sounds_menu",
  function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(() => {
        const sounds = activeSprite.sounds;
        return sounds.length < 1
          ? [["...", ""]]
          : sounds.map(i => [i.name, i.id]);
      }),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("sound_blocks");
  },
  function (block, generator) {
    return [generator.quote_(block.getFieldValue("MENU")), BlocklyJS.Order.ATOMIC];
  }
);

quickBlockMaker(
  "play_sound",
  function () {
    this.appendValueInput("name").setCheck("String").appendField("play sound");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["until finished", "true"],
        ["without waiting", "false"],
      ]),
      "wait"
    );
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
  function (block, generator) {
    const name = generator.valueToCode(block, "name", BlocklyJS.Order.ATOMIC);
    const wait = block.getFieldValue("wait");
    return `yield* playSound(${name}, ${wait});\n`;
  }
);

quickBlockMaker(
  "stop_sound",
  function () {
    this.appendValueInput("name").setCheck("String").appendField("stop sound");
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
  function (block, generator) {
    const name = generator.valueToCode(block, "name", BlocklyJS.Order.ATOMIC);
    return `stopSound(${name});\n`;
  }
);

quickBlockMaker(
  "stop_all_sounds",
  function () {
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
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
  function (block) {
    const who = block.getFieldValue("who");
    return `stopAllSounds(${who});\n`;
  }
);

quickBlockMaker(
  "set_sound_property",
  function () {
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
    this.setStyle("sound_blocks");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
  },
  function (block, generator) {
    const value = generator.valueToCode(block, "value", BlocklyJS.Order.ATOMIC);
    const property = block.getFieldValue("property");
    return `setSoundProperty("${property}", ${value});\n`;
  }
);

quickBlockMaker(
  "get_sound_property",
  function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["volume", "volume"],
        ["speed", "speed"],
      ]),
      "property"
    );
    this.setStyle("sound_blocks");
    this.setOutput(true, "Number");
  },
  function (block) {
    const property = block.getFieldValue("property");
    return [`soundProperties["${property}"]`, BlocklyJS.Order.NONE];
  }
);
