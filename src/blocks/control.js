import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { spriteManager } from "../scripts/editor";
const xmlUtils = Blockly.utils.xml;

Blockly.Blocks["controls_switch"] = {
  init: function () {
    this.appendValueInput("VALUE").appendField("switch");
    this.appendStatementInput("DO").setCheck("switchcase");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
    this.setTooltip("Make the input be used to be matched inside of cases.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_switch"] = function (block, generator) {
  const branch = generator.statementToCode(block, "DO");
  const value = generator.valueToCode(block, "VALUE", BlocklyJS.Order.ATOMIC) || "''";
  return `switch (${value}) {
  ${branch}}\n`;
};

Blockly.Blocks["controls_switch_case"] = {
  init: function () {
    this.setInputsInline(true);
    this.setPreviousStatement(true, "switchcase");
    this.setNextStatement(true, "switchcase");
    this.setStyle("control_blocks");
    this.setTooltip("Adds a case for a switch block.");

    this.itemCount_ = 1;
    this.messageList = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
    this.updateShape_();
  },

  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
    container.setAttribute("items", this.itemCount_);
    return container;
  },

  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute("items"), 10);
    this.updateShape_();
  },

  updateShape_: function () {
    const doInput = this.getInput("DO");
    const savedDoConnection = doInput?.connection.targetConnection ?? null;
    if (savedDoConnection) savedDoConnection.disconnect();
    if (doInput) this.removeInput("DO");

    if (this.getInput("ARROWS")) this.removeInput("ARROWS");

    for (let i = 0; i < this.itemCount_; i++) {
      let input = this.getInput("CASE" + i);

      if (!input) {
        const shadow = document.createElement("shadow");
        shadow.setAttribute("type", "text");

        const field = document.createElement("field");
        field.setAttribute("name", "TEXT");
        field.textContent = this.messageList[i] || "..";
        shadow.append(field);

        input = this.appendValueInput("CASE" + i);
        input.setAlign(Blockly.inputs.Align.RIGHT);
        input.connection.setShadowDom(shadow);
      }

      if (i === 0) {
        if (!input.fieldRow.length) {
          input.appendField("case");
        }
      }
    }

    for (let i = this.itemCount_; this.getInput("CASE" + i); i++) {
      this.removeInput("CASE" + i);
    }

    const arrowsInput = this.appendDummyInput("ARROWS").setAlign(
      Blockly.inputs.Align.RIGHT,
    );

    if (this.itemCount_ === 0) {
      arrowsInput.appendField("default");
    }

    arrowsInput
      .appendField(
        new Blockly.FieldImage(
          "/icons/blocks/caretLeft.svg",
          18,
          25,
          "remove an input",
          this.decrease_.bind(this),
        ),
      )
      .appendField(
        new Blockly.FieldImage(
          "/icons/blocks/caretRight.svg",
          18,
          25,
          "add an input",
          this.increase_.bind(this),
        ),
      );

    const newDo = this.appendStatementInput("DO").setCheck("default");
    if (savedDoConnection) newDo.connection.connect(savedDoConnection);
  },

  increase_: function () {
    if (this.itemCount_ > 99) return;
    this.itemCount_++;
    this.updateShape_();
  },

  decrease_: function () {
    if (this.itemCount_ < 1) return; // 0 is now the minimum
    this.itemCount_--;
    this.updateShape_();
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_switch_case"] = function (
  block,
  generator,
) {
  const branch = generator.statementToCode(block, "DO");

  if (block.itemCount_ === 0) {
    return `default: {\n  ${branch}break;\n}`;
  }

  const parts = [];
  for (let i = 0; i < block.itemCount_; i++) {
    const value = generator.valueToCode(block, "CASE" + i, BlocklyJS.Order.NONE) || "";
    parts.push(`case ${value}:`);
  }

  return `${parts.join(" ")} {\n  ${branch}break;\n}`;
};

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
  return `yield* waitOneFrame();\n`;
};

BlocklyJS.javascriptGenerator.forBlock["wait_block"] = function (block, generator) {
  const duration = generator.valueToCode(block, "AMOUNT", BlocklyJS.Order.ATOMIC) || 0;
  const menu = block.getFieldValue("MENU") || 0;
  return `yield* wait(${duration} * ${+menu});\n`;
};

Blockly.Blocks["controls_thread_create"] = {
  init: function () {
    this.appendDummyInput().appendField("run in new thread");
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
  return `vm.execute(function* (sprite) {\n${code}}, getTargetData());\n`;
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
  `/* Thread.getCurrentContext().id */`,
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
  return `/* Thread.set(${threadId}, ${name}, ${value}); */\n`;
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
  const code = `/* Thread.get(${threadId}, ${name}) */`;
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
  const code = `/* Thread.has(${threadId}, ${name}) */`;
  return [code, BlocklyJS.Order.FUNCTION_CALL];
};

Blockly.Blocks["controls_run_instantly"] = {
  init: function () {
    this.appendDummyInput().appendField("run instantly");
    this.appendStatementInput("do");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
    this.setTooltip("Run inside code without frame delay.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_run_instantly"] = function (block) {
  const branch = BlocklyJS.javascriptGenerator.statementToCode(block, "do");
  return `/* let _prevFast = fastExecution;
fastExecution = true; */
${branch}/* fastExecution = _prevFast; */\n`;
};

Blockly.Blocks["controls_stopscript"] = {
  init: function () {
    this.appendDummyInput().appendField("stop this script");
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_stopscript"] = () => "return;\n";

Blockly.Blocks["controls_stopblock"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("stop")
      .appendField(
        new Blockly.FieldDropdown(
          [
            ["this script", "script"],
            ["my other scripts", "others"],
            ["every other sprite", "othersprites"],
            ["the project", "project"],
          ],
          function (selection) {
            this.getSourceBlock().updateShape_(selection);
          },
        ),
        "MODE",
      );
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
  updateShape_: function (newMode) {
    const isTerminal = newMode === "script" || newMode === "project";
    const hasNext = !!this.nextConnection;

    if (isTerminal && hasNext) {
      if (this.nextConnection.isConnected()) {
        this.nextConnection.disconnect();
      }
      this.setNextStatement(false);
    } else if (!isTerminal && !hasNext) {
      this.setNextStatement(true, "default");
    }
  },
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("has_next", !!this.nextConnection);
    return container;
  },
  domToMutation: function (xmlElement) {
    const hasNext = xmlElement.getAttribute("has_next") === "true";
    this.setNextStatement(hasNext, "default");
  },
  saveExtraState: function () {
    return { hasNext: !!this.nextConnection };
  },
  loadExtraState: function (state) {
    this.setNextStatement(state["hasNext"], "default");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_stopblock"] = block => {
  const mode = block.getFieldValue("MODE");

  if (mode === "script") return "return;\n";
  if (mode === "others") return "vm.stopOtherScriptsForTarget(getTargetData());\n";
  if (mode === "othersprites") return "vm.stopAllExceptTarget(getTargetData());\n";
  if (mode === "project") return "stopProject();\n";

  return "";
};

Blockly.Blocks["controls_stop_sprite"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("stop sprite");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
    this.setTooltip("Stops all scripts for the specified sprite.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_stop_sprite"] = function (
  block,
  generator,
) {
  const spriteId = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC) || "''";
  return `vm.stopForTarget(vm.runtime.getTargetById(${spriteId}));\n`;
};

Blockly.Blocks["controls_sprites_menu"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(() => {
        const sprites = spriteManager.getOriginals();
        return sprites.length < 1
          ? [["No sprites.", ""]]
          : sprites.map(i => [i.name, i.id]);
      }),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("control_blocks");
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
  return `if (getTargetData().clone) {
  spriteManager.remove(getTargetData()); 
  return;
}\n`;
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
  return ["getTargetData().clone", BlocklyJS.Order.ATOMIC];
};

Blockly.Blocks["controls_clones_list"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("list clones of");
    this.setOutput(true, "Array");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_clones_list"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC);
  return [`spriteManager.get(${ID})?.getAllClones()`, BlocklyJS.Order.NONE];
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
  return `registerEvent("clone", null, function* (sprite) {\n${branch}});\n`;
};

Blockly.Blocks["controls_as_sprite"] = {
  init() {
    this.appendValueInput("ID").setCheck("String").appendField("as sprite");
    this.appendStatementInput("DO").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
    this.setTooltip("Run the code as another sprite or clone.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_as_sprite"] = function (
  block,
  generator,
) {
  const target = generator.valueToCode(block, "ID", BlocklyJS.Order.NONE) || '""';
  const code = generator.statementToCode(block, "DO");

  return `vm.execute(function* () {\n${code}}, spriteManager.get(${target}));\n`;
};

Blockly.Blocks["controls_forever"] = {
  init: function () {
    this.appendDummyInput().appendField("forever");
    this.appendStatementInput("DO").setCheck("default");
    this.setPreviousStatement(true, "default");
    this.setStyle("control_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_forever"] = function (block, generator) {
  const branch = generator.statementToCode(block, "DO");
  const loopTrap = generator.addLoopTrap(branch, block);
  return `while (true) {\n${loopTrap}}\n`;
};

Blockly.Blocks["controls_forLoop_var"] = {
  init() {
    this.appendDummyInput().appendField("i");
    this.setOutput(true, "Number");
    this.setDuplicateOnDrag(true);
    this.setStyle("control_blocks");
    this.setTooltip("The current value of i in the for loop.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_forLoop_var"] = () => [
  `controlsForLoopVar`,
  BlocklyJS.Order.ATOMIC,
];

Blockly.Blocks["controls_forLoop"] = {
  init() {
    this.appendValueInput("VAR").appendField("for each");
    this.appendValueInput("START").setCheck("Number").appendField("in range");
    this.appendValueInput("END").setCheck("Number").appendField("to");
    this.appendStatementInput("DO").setCheck("default").appendField("do");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setStyle("control_blocks");
    this.setTooltip("Runs the code for each value of i from start to end (inclusive).");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_forLoop"] = function (block, generator) {
  const start = generator.valueToCode(block, "START", BlocklyJS.Order.NONE) || "0";
  const end = generator.valueToCode(block, "END", BlocklyJS.Order.NONE) || "0";
  const branch = generator.statementToCode(block, "DO");
  const loopTrap = generator.addLoopTrap(branch, block);

  const code = `for (let controlsForLoopVar = ${start}; controlsForLoopVar <= ${end}; controlsForLoopVar++) {
  ${loopTrap}}\n`;

  return code;
};
