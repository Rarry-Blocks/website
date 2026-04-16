import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
  "when_flag_clicked",
  function () {
    this.appendDummyInput()
      .appendField("when")
      .appendField(
        new Blockly.FieldImage("icons/flag.svg", 25, 25, "flag", null, false)
      )
      .appendField("clicked");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
  function (block, generator) {
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("flag", null, function* (sprite) {\n${branch}});\n`;
  }
);

const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."abcdefghijklmnopqrstuvwxyz0123456789".toUpperCase(),
];

quickBlockMaker(
  "when_key_clicked",
  function () {
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
  function (block, generator) {
    const key = block.getFieldValue("KEY");
    const safeKey = generator.quote_(key);
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("key", ${safeKey}, function* (sprite) {\n${branch}});\n`;
  }
);

quickBlockMaker(
  "when_stage_clicked",
  function () {
    this.appendDummyInput()
      .appendField("when stage clicked");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
  function (block, generator) {
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("stageClick", null, function* (sprite) {\n${branch}});\n`;
  }
);

quickBlockMaker(
  "project_timer",
  function () {
    this.appendDummyInput().appendField("project timer");
    this.setOutput(true, "Number");
    this.setStyle("events_blocks");
  },
  function () {
    return ["projectTime()", BlocklyJS.Order.NONE];
  }
);

quickBlockMaker(
  "when_timer_reaches",
  function () {
    this.appendDummyInput()
      .appendField("when timer reaches")
      .appendField(new Blockly.FieldNumber(2, 0), "VALUE")
      .appendField("seconds");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
  function (block, generator) {
    const value = block.getFieldValue("VALUE");
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("timer", ${value}, function* (sprite) {\n${branch}});\n`;
  }
);

quickBlockMaker(
  "every_seconds",
  function () {
    this.appendDummyInput()
      .appendField("every")
      .appendField(new Blockly.FieldNumber(2, 0.1), "SECONDS")
      .appendField("seconds");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
  function (block, generator) {
    const seconds = block.getFieldValue("SECONDS");
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("interval", ${seconds}, function* (sprite) {\n${branch}});\n`;
  }
);

quickBlockMaker(
  "when_custom_event_triggered",
  function () {
    this.appendDummyInput()
      .appendField("when")
      .appendField(new Blockly.FieldTextInput("event_name"), "EVENT")
      .appendField("triggered");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("events_blocks");
  },
  function (block, generator) {
    const event = generator.quote_(block.getFieldValue("EVENT"));
    const branch = generator.statementToCode(block, "DO");
    return `registerEvent("custom", ${event}, function* (sprite) {\n${branch}});\n`;
  }
);

quickBlockMaker(
  "trigger_custom_event",
  function () {
    this.appendDummyInput()
      .appendField("trigger")
      .appendField(new Blockly.FieldTextInput("event_name"), "EVENT");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("events_blocks");
  },
  function (block) {
    const event = BlocklyJS.javascriptGenerator.quote_(block.getFieldValue("EVENT"));
    return `triggerCustomEvent(${event});\n`;
  }
);
