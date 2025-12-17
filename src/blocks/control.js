import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["wait_one_frame"] = {
  init: function () {
    this.appendDummyInput().appendField("wait one frame");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

Blockly.Blocks["wait_block"] = {
  init: function () {
    this.appendValueInput("AMOUNT").setCheck("Number").appendField("wait");
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["seconds", "1000"],
        ["milliseconds", "1"],
      ]),
      "MENU"
    );
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["wait_one_frame"] = function (block) {
  return `await waitOneFrame();\n`;
};

BlocklyJS.javascriptGenerator.forBlock["wait_block"] = function (
  block,
  generator
) {
  const duration =
    generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  const menu = block.getFieldValue("MENU") || 0;
  return `await wait(${duration} * ${+menu});\n`;
};

Blockly.Blocks["controls_thread_create"] = {
  init: function () {
    this.appendDummyInput().appendField("create thread");
    this.appendStatementInput("code").setCheck("default");
    this.setTooltip("Create and run the code specified in a new thread");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_create"] = function (
  block,
  generator
) {
  const code = generator.statementToCode(block, "code");
  return `Thread.getCurrentContext().spawn(async () => {\n${code}});`;
};

Blockly.Blocks["controls_thread_current"] = {
  init: function () {
    this.appendDummyInput().appendField("current thread");
    this.setOutput(true, "ThreadID");
    this.setStyle("control_blocks");
    this.setTooltip("Return the ID of the currently running thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_current"] = () => [
  `Thread.getCurrentContext().id`,
  BlocklyJS.Order.MEMBER,
];

Blockly.Blocks["controls_thread_set_var"] = {
  init: function () {
    this.appendValueInput("NAME")
      .setCheck("String")
      .appendField("set variable");
    this.appendValueInput("VALUE").appendField("to");
    this.appendValueInput("THREAD")
      .setCheck("ThreadID")
      .appendField("in thread");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("control_blocks");
    this.setTooltip("Set a variable inside the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_set_var"] = function (
  block,
  generator
) {
  const threadId =
    generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name =
    generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
  const value =
    generator.valueToCode(block, "VALUE", BlocklyJS.Order.NONE) || "undefined";
  return `Thread.set(${threadId}, ${name}, ${value});\n`;
};

Blockly.Blocks["controls_thread_get_var"] = {
  init: function () {
    this.appendValueInput("NAME")
      .setCheck("String")
      .appendField("get variable");
    this.appendValueInput("THREAD")
      .setCheck("ThreadID")
      .appendField("from thread");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("control_blocks");
    this.setTooltip("Get a variable from the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_get_var"] = function (
  block,
  generator
) {
  const threadId =
    generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name =
    generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
  const code = `Thread.get(${threadId}, ${name})`;
  return [code, BlocklyJS.Order.FUNCTION_CALL];
};

Blockly.Blocks["controls_thread_has_var"] = {
  init: function () {
    this.appendValueInput("NAME").setCheck("String").appendField("variable");
    this.appendValueInput("THREAD")
      .setCheck("ThreadID")
      .appendField("exists in thread");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("control_blocks");
    this.setTooltip("Checks if a variable exists in the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_has_var"] = function (
  block,
  generator
) {
  const threadId =
    generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name =
    generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
  const code = `Thread.has(${threadId}, ${name})`;
  return [code, BlocklyJS.Order.FUNCTION_CALL];
};

Blockly.Blocks["controls_run_instantly"] = {
  init: function () {
    this.appendDummyInput().appendField("run instantly");
    this.appendStatementInput("do");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("control_blocks");
    this.setTooltip("Run inside code without frame delay");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_run_instantly"] = function (
  block
) {
  const branch = BlocklyJS.javascriptGenerator.statementToCode(block, "do");
  return `let _prevFast = fastExecution;
fastExecution = true;
${branch}fastExecution = _prevFast;\n`;
};

Blockly.Blocks["controls_stopscript"] = {
  init: function () {
    this.appendDummyInput().appendField("stop this script");
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_stopscript"] = () =>
  'throw new Error("shouldStop");\n';
