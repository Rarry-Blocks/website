import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { deleteVariable, projectVariables } from "../scripts/editor";

function getVariables() {
  if (Object.keys(projectVariables).length === 0)
    return [["unknown", "unknown"]];
  else return Object.keys(projectVariables).map((name) => [name, name]);
}

Blockly.Blocks["get_global_var"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(() => getVariables()),
      "VAR"
    );
    this.setOutput(true);
    this.setTooltip("Get a global variable");
    this.setStyle("variable_blocks");
    this.customContextMenu = function (options) {
      options.push({
        text: `Delete "${varName}" variable`,
        enabled: true,
        callback: () => {
          const varName = this.getFieldValue("VAR");
          if (varName) deleteVariable(varName, true);
        },
      });
    };
  },
};

Blockly.Blocks["set_global_var"] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck(null)
      .appendField("set")
      .appendField(new Blockly.FieldDropdown(() => getVariables()), "VAR")
      .appendField("to");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("variable_blocks");
  },
};

Blockly.Blocks["change_global_var"] = {
  init: function () {
    this.appendValueInput("VALUE")
      .setCheck("Number")
      .appendField("change")
      .appendField(new Blockly.FieldDropdown(() => getVariables()), "VAR")
      .appendField("by");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("variable_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["get_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  return [`projectVariables["${name}"]`, BlocklyJS.Order.ATOMIC];
};

BlocklyJS.javascriptGenerator.forBlock["set_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  const value =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "VALUE",
      BlocklyJS.Order.ASSIGNMENT
    ) || "0";
  return `projectVariables["${name}"] = ${value};\n`;
};

BlocklyJS.javascriptGenerator.forBlock["change_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  const value =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "VALUE",
      BlocklyJS.Order.ATOMIC
    ) || "0";
  return `projectVariables["${name}"] += ${value};\n`;
};
