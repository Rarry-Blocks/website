import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { activeSprite } from "../scripts/editor";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
  "say_message",
  function () {
    this.appendValueInput("MESSAGE").appendField("say");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const message =
      generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) || "";

    return `sayMessage(${message});\nyield;\n`;
  }
);

quickBlockMaker(
  "say_message_duration",
  function () {
    this.appendValueInput("MESSAGE").appendField("say");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("seconds");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const message =
      generator.valueToCode(block, "MESSAGE", BlocklyJS.Order.NONE) || "";
    const duration =
      generator.valueToCode(block, "DURATION", BlocklyJS.Order.ATOMIC) || 2;

    return `sayMessage(${message}, ${duration});\nyield;\n`;
  }
);

quickBlockMaker(
  "switch_costume",
  function () {
    this.appendValueInput("COSTUME")
      .setCheck("String")
      .appendField("switch costume to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const costume = generator.valueToCode(block, "COSTUME", BlocklyJS.Order.ATOMIC);
    return `switchCostume(${costume});\nyield;\n`;
  }
);

quickBlockMaker(
  "set_size",
  function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set size to");
    this.appendDummyInput().appendField("%");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 100;
    return `setSize(${amount}, false);\nyield;\n`;
  }
);

quickBlockMaker(
  "change_size",
  function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("change size by");
    this.appendDummyInput().appendField("%");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const amount =
      generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 100;
    return `setSize(${amount}, true);\nyield;\n`;
  }
);

quickBlockMaker(
  "get_costume_size",
  function () {
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
  function (block) {
    const menu = block.getFieldValue("MENU");
    return [`getCostumeSize("${menu}")`, BlocklyJS.Order.NONE];
  }
);

quickBlockMaker(
  "get_sprite_scale",
  function () {
    this.appendDummyInput().appendField("size");
    this.setOutput(true, "Number");
    this.setStyle("looks_blocks");
  },
  function () {
    return [`getSpriteScale()`, BlocklyJS.Order.NONE];
  }
);

quickBlockMaker(
  "looks_hide_sprite",
  function () {
    this.appendDummyInput().appendField("hide sprite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
  function () {
    return "toggleVisibility(false);\nyield;\n";
  }
);

quickBlockMaker(
  "looks_show_sprite",
  function () {
    this.appendDummyInput().appendField("show sprite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
  function () {
    return "toggleVisibility(true);\nyield;\n";
  }
);

quickBlockMaker(
  "looks_setVisibility_sprite",
  function () {
    this.appendValueInput("VISIBLE").setCheck("Boolean").appendField("set visibility to");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("looks_blocks");
  },
  function (block, generator) {
    const visible =
      generator.valueToCode(block, "VISIBLE", BlocklyJS.Order.ATOMIC) ?? "false";

    return `toggleVisibility(${visible});\nyield;\n`;
  }
);

quickBlockMaker(
  "looks_isVisible",
  function () {
    this.appendDummyInput().appendField("is visible");
    this.setOutput(true, "Boolean");
    this.setStyle("looks_blocks");
  },
  () => ["getTarget().visible", BlocklyJS.Order.NONE]
);

quickBlockMaker(
  "looks_costumes_menu",
  function () {
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
  function (block, generator) {
    return [generator.quote_(block.getFieldValue("MENU")), BlocklyJS.Order.ATOMIC];
  }
);
