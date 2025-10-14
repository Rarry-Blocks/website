import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks["sets_create_with"] = {
  init: function () {
    this.setStyle("set_blocks");
    this.setHelpUrl("");
    this.itemCount_ = 0;
    this.updateShape_();
    this.setOutput(true, "Set");
    this.setMutator(
      new Blockly.icons.MutatorIcon(["sets_create_with_item"], this)
    );
    this.setTooltip("Create a set with any number of elements.");
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("items", String(this.itemCount_));
    return container;
  },

  domToMutation: function (xmlElement) {
    const items = xmlElement.getAttribute("items");
    this.itemCount_ = items ? parseInt(items, 10) : 0;
    this.updateShape_();
  },

  saveExtraState: function () {
    return { itemCount: this.itemCount_ };
  },

  loadExtraState: function (state) {
    if (state && typeof state.itemCount === "number") {
      this.itemCount_ = state.itemCount;
    } else {
      this.itemCount_ = 0;
    }
    this.updateShape_();
  },

  decompose: function (workspace) {
    const containerBlock = workspace.newBlock("sets_create_with_container");
    containerBlock.initSvg();
    let connection = containerBlock.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock("sets_create_with_item");
      itemBlock.initSvg();
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },

  compose: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    const connections = [];
    while (itemBlock) {
      if (itemBlock.isInsertionMarker && itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock();
        continue;
      }
      connections.push(itemBlock.valueConnection_ || null);
      itemBlock = itemBlock.getNextBlock();
    }

    for (let i = 0; i < this.itemCount_; i++) {
      const input = this.getInput("ADD" + i);
      const targetConnection =
        input && input.connection && input.connection.targetConnection;
      if (targetConnection && !connections.includes(targetConnection)) {
        targetConnection.disconnect();
      }
    }

    this.itemCount_ = connections.length;
    this.updateShape_();

    for (let i = 0; i < this.itemCount_; i++) {
      if (connections[i]) {
        connections[i].reconnect(this, "ADD" + i);
      }
    }
  },

  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      if (itemBlock.isInsertionMarker && itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock();
        continue;
      }
      const input = this.getInput("ADD" + i);
      itemBlock.valueConnection_ =
        input && input.connection && input.connection.targetConnection;
      itemBlock = itemBlock.getNextBlock();
      i++;
    }
  },

  updateShape_: function () {
    if (this.itemCount_ === 0) {
      if (!this.getInput("EMPTY")) {
        this.appendDummyInput("EMPTY").appendField("create empty set");
      }
    } else {
      if (this.getInput("EMPTY")) {
        this.removeInput("EMPTY");
      }
    }

    for (let i = 0; i < this.itemCount_; i++) {
      if (!this.getInput("ADD" + i)) {
        const input = this.appendValueInput("ADD" + i).setAlign(
          Blockly.inputs.Align.RIGHT
        );
        if (i === 0) {
          input.appendField("create set with");
        }
      }
    }

    let i = this.itemCount_;
    while (this.getInput("ADD" + i)) {
      this.removeInput("ADD" + i);
      i++;
    }
  },
};

Blockly.Blocks["sets_create_with_container"] = {
  init: function () {
    this.setStyle("set_blocks");
    this.appendDummyInput().appendField("set");
    this.appendStatementInput("STACK");
    this.contextMenu = false;
  },
};

Blockly.Blocks["sets_create_with_item"] = {
  init: function () {
    this.setStyle("set_blocks");
    this.appendDummyInput().appendField("element");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
    /** @type {Blockly.Connection?} */
    this.valueConnection_ = null;
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_create_with"] = function (
  block,
  generator
) {
  const elements = [];
  for (let i = 0; i < block.itemCount_; i++) {
    const code =
      generator.valueToCode(block, "ADD" + i, BlocklyJS.Order.NONE) || "null";
    elements.push(code);
  }
  let code;
  if (elements.length === 0) {
    code = "new Set()";
  } else {
    code = "new Set([" + elements.join(", ") + "])";
  }
  return [code, BlocklyJS.Order.NONE];
};

Blockly.Blocks["sets_convert"] = {
  init: function () {
    const dropdown = new Blockly.FieldDropdown([
      ["set from list", "SET"],
      ["list from set", "LIST"],
    ]);
    dropdown.setValidator((newMode) => {
      this.updateType_(newMode);
    });

    this.setStyle("set_blocks");
    this.appendValueInput("INPUT")
      .setCheck("String")
      .appendField("make")
      .appendField(dropdown, "MODE");
    this.setInputsInline(true);
    this.setOutput(true, "Set");
    this.setTooltip(() => {
      const mode = this.getFieldValue("MODE");
      if (mode === "SET") {
        return "Convert a list into a set (removes duplicates).";
      } else if (mode === "LIST") {
        return "Convert a set into a list.";
      }
      throw Error("Unknown mode: " + mode);
    });
  },
  updateType_: function (newMode) {
    const mode = this.getFieldValue("MODE");
    if (mode !== newMode) {
      const inputConnection = this.getInput("INPUT")?.connection;
      inputConnection?.setShadowDom(null);
      const inputBlock = inputConnection?.targetBlock();

      if (inputBlock) {
        inputConnection.disconnect();
        if (inputBlock.isShadow()) {
          inputBlock.dispose(false);
        } else {
          this.bumpNeighbours();
        }
      }
    }
    if (newMode === "SET") {
      this.outputConnection.setCheck("Set");
      this.getInput("INPUT").setCheck("Array");
    } else {
      this.outputConnection.setCheck("Array");
      this.getInput("INPUT").setCheck("Set");
    }
  },
  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("mode", this.getFieldValue("MODE"));
    return container;
  },
  domToMutation: function (xmlElement) {
    this.updateType_(xmlElement.getAttribute("mode"));
  },
  saveExtraState: function () {
    return { mode: this.getFieldValue("MODE") };
  },
  loadExtraState: function (state) {
    this.updateType_(state["mode"]);
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_convert"] = function (block) {
  const input =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "INPUT",
      BlocklyJS.Order.ATOMIC
    ) || "null";
  const mode = block.getFieldValue("MODE");

  if (mode === "SET") {
    return [`new Set(${input})`, BlocklyJS.Order.NONE];
  } else if (mode === "LIST") {
    return [`[...${input}]`, BlocklyJS.Order.NONE];
  }
};

Blockly.Blocks["sets_add"] = {
  init: function () {
    this.appendValueInput("SET").setCheck("Set").appendField("in set");
    this.appendValueInput("VALUE").setCheck(null).appendField("add");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setStyle("set_blocks");
    this.setTooltip("Adds a value to the set.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_add"] = function (
  block,
  generator
) {
  const set = generator.valueToCode(block, "SET", BlocklyJS.Order.ATOMIC);
  const value = generator.valueToCode(block, "VALUE", BlocklyJS.Order.ATOMIC);
  return `${set}.add(${value});\n`;
};

Blockly.Blocks["sets_delete"] = {
  init: function () {
    this.appendValueInput("SET").setCheck("Set").appendField("in set");
    this.appendValueInput("VALUE").setCheck(null).appendField("delete");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setStyle("set_blocks");
    this.setTooltip("Deletes a value from the set.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_delete"] = function (
  block,
  generator
) {
  const set = generator.valueToCode(block, "SET", BlocklyJS.Order.ATOMIC);
  const value = generator.valueToCode(block, "VALUE", BlocklyJS.Order.ATOMIC);
  return `${set}.delete(${value});\n`;
};

Blockly.Blocks["sets_has"] = {
  init: function () {
    this.appendValueInput("SET").setCheck("Set").appendField("does set");
    this.appendValueInput("VALUE").setCheck(null).appendField("have");
    this.setOutput(true, "Boolean");
    this.setInputsInline(true);
    this.setStyle("set_blocks");
    this.setTooltip("Returns true if the set contains the value.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_has"] = function (
  block,
  generator
) {
  const set = generator.valueToCode(block, "SET", BlocklyJS.Order.ATOMIC);
  const value = generator.valueToCode(block, "VALUE", BlocklyJS.Order.ATOMIC);
  return [`${set}.has(${value})`, BlocklyJS.Order.NONE];
};

Blockly.Blocks["sets_size"] = {
  init: function () {
    this.appendValueInput("SET").setCheck("Set").appendField("size of set");
    this.setOutput(true, "Number");
    this.setInputsInline(true);
    this.setStyle("set_blocks");
    this.setTooltip("Returns how many items are in the set.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_size"] = function (
  block,
  generator
) {
  const set = generator.valueToCode(block, "SET", BlocklyJS.Order.ATOMIC);
  return [`${set}.size`, BlocklyJS.Order.NONE];
};

Blockly.Blocks["sets_merge"] = {
  init: function () {
    this.appendValueInput("SET1").setCheck("Set").appendField("merge set");
    this.appendValueInput("SET2").setCheck("Set").appendField("with");
    this.setOutput(true, "Set");
    this.setInputsInline(true);
    this.setStyle("set_blocks");
    this.setTooltip("Creates a new set combining all values from two sets");
  },
};

BlocklyJS.javascriptGenerator.forBlock["sets_merge"] = function (
  block,
  generator
) {
  const set1 = generator.valueToCode(block, "SET1", BlocklyJS.Order.ATOMIC);
  const set2 = generator.valueToCode(block, "SET2", BlocklyJS.Order.ATOMIC);
  return [`new Set([...${set1}, ...${set2}])`, BlocklyJS.Order.NONE];
};
