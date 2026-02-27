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
  return `registerEvent("flag", null, function* (sprite) {\n${branch}});\n`;
};

const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."abcdefghijklmnopqrstuvwxyz0123456789".toUpperCase(),
];

Blockly.Blocks["when_key_clicked"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when")
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
      .appendField("key pressed");
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
  return `registerEvent("key", ${safeKey}, function* (sprite) {\n${branch}});\n`;
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
  return `registerEvent("stageClick", null, function* (sprite) {\n${branch}});\n`;
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

Blockly.Blocks["when_timer_reaches"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when timer reaches")
      .appendField(new Blockly.FieldNumber(2, 0), "VALUE")
      .appendField("seconds");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_timer_reaches"] = function (
  block,
  generator
) {
  const value = block.getFieldValue("VALUE");
  const branch = generator.statementToCode(block, "DO");
  return `registerEvent("timer", ${value}, function* (sprite) {\n${branch}});\n`;
};

Blockly.Blocks["every_seconds"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("every")
      .appendField(new Blockly.FieldNumber(2, 0.1), "SECONDS")
      .appendField("seconds");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["every_seconds"] = function (
  block,
  generator
) {
  const seconds = block.getFieldValue("SECONDS");
  const branch = generator.statementToCode(block, "DO");
  return `registerEvent("interval", ${seconds}, function* (sprite) {\n${branch}});\n`;
};

Blockly.Blocks["when_custom_event_triggered"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("when")
      .appendField(new Blockly.FieldTextInput("event_name"), "EVENT")
      .appendField("triggered");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_custom_event_triggered"] = function (
  block,
  generator
) {
  const event = generator.quote_(block.getFieldValue("EVENT"));
  const branch = generator.statementToCode(block, "DO");
  return `registerEvent("custom", ${event}, function* (sprite) {\n${branch}});\n`;
};

Blockly.Blocks["trigger_custom_event"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("trigger")
      .appendField(new Blockly.FieldTextInput("event_name"), "EVENT");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["trigger_custom_event"] = function (
  block
) {
  const event = BlocklyJS.javascriptGenerator.quote_(block.getFieldValue("EVENT"));
  return `triggerCustomEvent(${event});\n`;
};
