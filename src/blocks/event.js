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

Blockly.Blocks["project_timer"] = {
  init: function () {
    this.appendDummyInput().appendField("project timer");
    this.setOutput(true, "Number");
    this.setStyle("events_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["when_flag_clicked"] = function (block, generator) {
  const branch = generator.statementToCode(block, "DO");
  return `whenFlagClicked(async () => {\n${branch}});\n`;
};

BlocklyJS.javascriptGenerator.forBlock["project_timer"] = function (block) {
  return ["projectTime()", BlocklyJS.Order.NONE];
};
