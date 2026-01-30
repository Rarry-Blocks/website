import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { spriteManager } from "../scripts/editor";

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
      "MENU",
    );
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["wait_one_frame"] = function (block) {
  return `await waitOneFrame();\n`;
};

BlocklyJS.javascriptGenerator.forBlock["wait_block"] = function (block, generator) {
  const duration = generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
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
  generator,
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
    this.appendValueInput("NAME").setCheck("String").appendField("set variable");
    this.appendValueInput("VALUE").appendField("to");
    this.appendValueInput("THREAD").setCheck("ThreadID").appendField("in thread");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("control_blocks");
    this.setTooltip("Set a variable inside the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_set_var"] = function (
  block,
  generator,
) {
  const threadId = generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name = generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
  const value =
    generator.valueToCode(block, "VALUE", BlocklyJS.Order.NONE) || "undefined";
  return `Thread.set(${threadId}, ${name}, ${value});\n`;
};

Blockly.Blocks["controls_thread_get_var"] = {
  init: function () {
    this.appendValueInput("NAME").setCheck("String").appendField("get variable");
    this.appendValueInput("THREAD").setCheck("ThreadID").appendField("from thread");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("control_blocks");
    this.setTooltip("Get a variable from the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_get_var"] = function (
  block,
  generator,
) {
  const threadId = generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name = generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
  const code = `Thread.get(${threadId}, ${name})`;
  return [code, BlocklyJS.Order.FUNCTION_CALL];
};

Blockly.Blocks["controls_thread_has_var"] = {
  init: function () {
    this.appendValueInput("NAME").setCheck("String").appendField("variable");
    this.appendValueInput("THREAD").setCheck("ThreadID").appendField("exists in thread");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("control_blocks");
    this.setTooltip("Checks if a variable exists in the given thread");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_thread_has_var"] = function (
  block,
  generator,
) {
  const threadId = generator.valueToCode(block, "THREAD", BlocklyJS.Order.NONE) || "null";
  const name = generator.valueToCode(block, "NAME", BlocklyJS.Order.NONE) || '""';
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

BlocklyJS.javascriptGenerator.forBlock["controls_run_instantly"] = function (block) {
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

Blockly.Blocks["controls_stopblock"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("stop")
      .appendField(
        new Blockly.FieldDropdown([
          ["this script", "script"],
          ["the project", "project"],
        ]),
        "MODE",
      );
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_stopblock"] = block => {
  const mode = block.getFieldValue("MODE");
  if (mode === "script") return 'throw new Error("shouldStop");\n';
  else if (mode === "project") return "stopProject();\n";
};

Blockly.Extensions.register("dynamic_sprites_menu", function () {
  this.getField("MENU").setOptions(function () {
    const sprites = spriteManager.getOriginals();
    const options =
      sprites.length < 1 ? [["No sprites.", ""]] : sprites.map(i => [i.name, i.id]);
    return options;
  });
});

Blockly.Blocks["controls_sprites_menu"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([["No sprites.", ""]]),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("control_blocks");
    Blockly.Extensions.apply("dynamic_sprites_menu", this, false);
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_sprites_menu"] = function (
  block,
  generator,
) {
  return [generator.quote_(block.getFieldValue("MENU")), BlocklyJS.Order.ATOMIC];
};

Blockly.Blocks["controls_createclone"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("create clone of");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_createclone"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC);
  return `spriteManager.clone(spriteManager.get(${ID}));\n`;
};

Blockly.Blocks["controls_delete_this_clone"] = {
  init: function () {
    this.appendDummyInput().appendField("delete this clone");
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_delete_this_clone"] = function () {
  return `if (sprite.clone) spriteManager.remove(spriteData);\n`;
};

Blockly.Blocks["controls_delete_all_clones"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("delete all clones of");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_delete_all_clones"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC);
  return `spriteManager.removeClones(spriteManager.get(${ID}));\n`;
};

Blockly.Blocks["controls_is_clone"] = {
  init: function () {
    this.appendDummyInput().appendField("is clone?");
    this.setOutput(true, "Boolean");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_is_clone"] = function () {
  return ["spriteData.clone", BlocklyJS.Order.ATOMIC];
};

Blockly.Blocks["controls_clone_count"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("number of clones of");
    this.setOutput(true, "Number");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_clone_count"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC);
  return [
    `(spriteManager.get(${ID})?.getAllClones().length ?? 0)`,
    BlocklyJS.Order.ATOMIC,
  ];
};

Blockly.Blocks["controls_whenstartasclone"] = {
  init: function () {
    this.appendDummyInput().appendField("when I start as a clone");
    this.appendStatementInput("DO").setCheck("default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_whenstartasclone"] = function (
  block,
  generator,
) {
  const branch = generator.statementToCode(block, "DO");
  return `registerEvent("clone", null, async () => {\n${branch}});\n`;
};
