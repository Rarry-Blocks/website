import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["when_flag_clicked"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when")
      .appendField(
        new Blockly.FieldImage("icons/flag.svg", 25, 25, {
          alt: "Green flag",
          flipRtl: "FALSE",
        })
      )
      .appendField("clicked");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_flag_clicked"] = function (
  block,
  generator
) {
  const branch = generator.statementToCode(block, "DO");
  return `whenFlagClicked(async () => {\n${branch}});\n`;
};

const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."abcdefghijklmnopqrstuvwxyz0123456789".toUpperCase(),
];

Blockly.Blocks["when_key_clicked"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when key")
      .appendField(
        new Blockly.FieldDropdown([
          ["any", "any"],
          ["space", " "],
          ["enter", "Enter"],
          ["escape", "Escape"],
          ["up arrow", "ArrowUp"],
          ["down arrow", "ArrowDown"],
          ["left arrow", "ArrowLeft"],
          ["right arrow", "ArrowRight"],
          ...normalKeys.map((i) => [i, i]),
        ]),
        "KEY"
      )
      .appendField("pressed");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_key_clicked"] = function (
  block,
  generator
) {
  const key = block.getFieldValue("KEY");
  const safeKey = generator.quote_(key);
  const branch = generator.statementToCode(block, "DO");
  return `whenKeyPressed(${safeKey}, async () => {\n${branch}});\n`;
};

Blockly.Blocks["when_stage_clicked"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when stage clicked");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_stage_clicked"] = function (
  block,
  generator
) {
  const branch = generator.statementToCode(block, "DO");
  return `whenStageClicked(async () => {\n${branch}});\n`;
};

Blockly.Blocks["project_timer"] = {
  init: function () {
    this.appendDummyInput().appendField("project timer");
    this.setOutput(true, "Number");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["project_timer"] = function (block) {
  return ["projectTime()", BlocklyJS.Order.NONE];
};
