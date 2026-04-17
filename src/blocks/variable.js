import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
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
        text: `Delete this variable`,
        enabled: true,
        callback: () => {
          const varName = this.getFieldValue("VAR");
          if (typeof varName === "string") deleteVariable(varName, true);
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

javascriptGenerator.forBlock["get_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  return [`projectVariables["${name}"]`, Order.ATOMIC];
};

javascriptGenerator.forBlock["set_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ASSIGNMENT
    ) || "0";
  return `projectVariables["${name}"] = ${value};\n`;
};

javascriptGenerator.forBlock["change_global_var"] = function (block) {
  const name = block.getFieldValue("VAR");
  const value =
    javascriptGenerator.valueToCode(
      block,
      "VALUE",
      Order.ATOMIC
    ) || "0";
  return `projectVariables["${name}"] += ${value};\n`;
};
