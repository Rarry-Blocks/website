import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
const xmlUtils = Blockly.utils.xml;

Blockly.Blocks["json_get"] = {
  init: function () {
    this.appendValueInput("KEY").setCheck("String").appendField("value of");
    this.appendValueInput("OBJECT").setCheck("Object").appendField("in object");
    this.setOutput(true);
    this.setInputsInline(true);
    this.setStyle("json_category");
    this.setTooltip("Returns the value of a key from a JSON object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_get"] = function (block) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.MEMBER
    ) || "{}";
  const key =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "KEY",
      BlocklyJS.Order.NONE
    ) || '""';
  return [`${obj}[${key}]`, BlocklyJS.Order.MEMBER];
};

Blockly.Blocks["json_set"] = {
  init: function () {
    this.appendValueInput("OBJECT").setCheck("Object").appendField("in object");
    this.appendValueInput("KEY").setCheck("String").appendField("set");
    this.appendValueInput("VALUE").appendField("to");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setInputsInline(true);
    this.setStyle("json_category");
    this.setTooltip("Sets a value to a key in a JSON object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_set"] = function (block) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.MEMBER
    ) || "{}";
  const key =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "KEY",
      BlocklyJS.Order.NONE
    ) || '""';
  const value =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "VALUE",
      BlocklyJS.Order.ASSIGNMENT
    ) || "null";
  return `${obj}[${key}] = ${value};\n`;
};

Blockly.Blocks["json_delete"] = {
  init: function () {
    this.appendValueInput("OBJECT").setCheck("Object").appendField("in object");
    this.appendValueInput("KEY").setCheck("String").appendField("remove");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setInputsInline(true);
    this.setStyle("json_category");
    this.setTooltip("Deletes a key from a JSON object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_delete"] = function (block) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.MEMBER
    ) || "{}";
  const key =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "KEY",
      BlocklyJS.Order.NONE
    ) || '""';
  return `delete ${obj}[${key}];\n`;
};

Blockly.Blocks["json_create_item"] = {
  init: function () {
    this.appendDummyInput().appendField("key and value");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setStyle("json_category");
    this.setTooltip("Add a key with a value to the object.");
    this.contextMenu = false;
  },
};

Blockly.Blocks["json_key_value"] = {
  init: function () {
    this.appendValueInput("KEY").setCheck("String").appendField("key");
    this.appendValueInput("VALUE").setCheck(null).appendField("value");
    this.setInputsInline(true);
    this.setStyle("json_category");
    this.setTooltip("A single key with a value.");
    this.setOutput(true, "ObjectItem");
    this.setInputsInline(true);
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_key_value"] = function (block) {
  const keyCode =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "KEY",
      BlocklyJS.Order.NONE
    ) || '""';
  const valCode =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "VALUE",
      BlocklyJS.Order.ATOMIC
    ) || "null";
  const code = `${keyCode}: ${valCode}`;
  return [code, BlocklyJS.Order.ATOMIC];
};

Blockly.Blocks["json_create"] = {
  init: function () {
    this.setOutput(true, "Object");
    this.setStyle("json_category");
    this.itemCount_ = 0;
    this.updateShape_();
    this.setMutator(new Blockly.icons.MutatorIcon(["json_create_item"], this));
    this.setTooltip("Create a JSON object with any number of keys.");
    this.setInputsInline(false);
  },
  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
    container.setAttribute("items", String(this.itemCount_));
    return container;
  },
  domToMutation: function (xmlElement) {
    const items = xmlElement.getAttribute("items");
    if (!items) throw new TypeError("element did not have items");
    this.itemCount_ = parseInt(items, 10);
    this.updateShape_();
  },
  saveExtraState: function () {
    return {
      itemCount: this.itemCount_,
    };
  },
  loadExtraState: function (state) {
    this.itemCount_ = state["itemCount"];
    this.updateShape_();
  },
  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      const input = this.getInput("ITEM" + i);
      itemBlock.valueConnection_ = input && input.connection.targetConnection;
      itemBlock = itemBlock.nextConnection?.targetBlock();
      i++;
    }
  },
  compose: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    const connections = [];
    while (itemBlock) {
      if (itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock();
        continue;
      }
      connections.push(itemBlock.valueConnection_);
      itemBlock = itemBlock.getNextBlock();
    }
    for (let i = 0; i < this.itemCount_; i++) {
      const connection = this.getInput("ADD" + i)?.connection?.targetConnection;
      if (connection && !connections.includes(connection)) {
        connection.disconnect();
      }
    }
    this.itemCount_ = connections.length;
    this.updateShape_();
    for (let i = 0; i < this.itemCount_; i++) {
      connections[i]?.reconnect(this, "ADD" + i);
    }
  },
  decompose: function (workspace) {
    const containerBlock = workspace.newBlock("json_create_container");
    containerBlock.initSvg();
    let connection = containerBlock.getInput("STACK").connection;
    for (let i = 0; i < this.itemCount_; i++) {
      const itemBlock = workspace.newBlock("json_create_item");
      itemBlock.initSvg();
      if (!itemBlock.previousConnection) {
        throw new Error("itemBlock has no previousConnection");
      }
      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },
  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      if (itemBlock.isInsertionMarker()) {
        itemBlock = itemBlock.getNextBlock();
        continue;
      }
      const input = this.getInput("ADD" + i);
      itemBlock.valueConnection_ = input?.connection?.targetConnection;
      itemBlock = itemBlock?.getNextBlock();
      i++;
    }
  },
  updateShape_: function () {
    if (this.itemCount_ && this.getInput("EMPTY")) {
      this.removeInput("EMPTY");
    } else if (!this.itemCount_ && !this.getInput("EMPTY")) {
      this.appendDummyInput("EMPTY").appendField("create empty object");
    }

    for (let i = 0; i < this.itemCount_; i++) {
      if (!this.getInput("ADD" + i)) {
        const input = this.appendValueInput("ADD" + i).setAlign(
          Blockly.inputs.Align.RIGHT
        );
        input.setCheck("ObjectItem");
        if (i === 0) input.appendField("create object with");
      }
    }

    for (let i = this.itemCount_; this.getInput("ADD" + i); i++) {
      this.removeInput("ADD" + i);
    }
  },
};

Blockly.Blocks["json_create_container"] = {
  init: function () {
    this.appendDummyInput().appendField("object");
    this.appendStatementInput("STACK");
    this.setStyle("json_category");
    this.setTooltip(
      "Add, remove, or reorder sections to configure this object block."
    );
    this.contextMenu = false;
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_create"] = function (block) {
  const entries = [];
  for (let i = 0; i < block.itemCount_; i++) {
    const pairCode = BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "ADD" + i,
      BlocklyJS.Order.NONE
    );
    if (pairCode) {
      entries.push(pairCode || "");
    }
  }
  const code = `{ ${entries.join(", ")} }`;
  return [code, BlocklyJS.Order.ATOMIC];
};

Blockly.Blocks["json_has_key"] = {
  init: function () {
    this.appendValueInput("OBJECT").setCheck("Object").appendField("does object");
    this.appendValueInput("KEY").setCheck("String").appendField("have");
    this.setOutput(true, "Boolean");
    this.setInputsInline(true);
    this.setStyle("json_category");
    this.setTooltip("Returns true if the key exists in the object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_has_key"] = function (block) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.MEMBER
    ) || "{}";
  const key =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "KEY",
      BlocklyJS.Order.NONE
    ) || '""';
  return [`(${key} in ${obj})`, BlocklyJS.Order.RELATIONAL];
};

Blockly.Blocks["json_property_list"] = {
  init: function () {
    this.appendValueInput("OBJECT")
      .setCheck("Object")
      .appendField(
        new Blockly.FieldDropdown([
          ["keys", "KEYS"],
          ["values", "VALUES"],
          ["entries", "ENTRIES"],
        ]),
        "MODE"
      )
      .appendField("of");
    this.setOutput(true, "Array");
    this.setStyle("json_category");
    this.setTooltip("Gets keys, values, or entries of the JSON object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_property_list"] = function (
  block
) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.FUNCTION_CALL
    ) || "{}";
  const mode = block.getFieldValue("MODE");

  let code;
  switch (mode) {
    case "KEYS":
      code = `Object.keys(${obj})`;
      break;
    case "VALUES":
      code = `Object.values(${obj})`;
      break;
    case "ENTRIES":
      code = `Object.entries(${obj})`;
      break;
    default:
      code = "[]";
  }

  return [code, BlocklyJS.Order.FUNCTION_CALL];
};

Blockly.Blocks["json_parse"] = {
  init: function () {
    const dropdown = new Blockly.FieldDropdown([
      ["object from text", "PARSE"],
      ["text from object", "STRINGIFY"],
    ]);
    dropdown.setValidator((newMode) => {
      this.updateType_(newMode);
    });

    this.setStyle("json_category");
    this.appendValueInput("INPUT")
      .setCheck("String")
      .appendField("make")
      .appendField(dropdown, "MODE");
    this.setInputsInline(true);
    this.setOutput(true, "Object");
    this.setTooltip(() => {
      const mode = this.getFieldValue("MODE");
      if (mode === "PARSE") {
        return "Convert a stringified object into an object.";
      } else if (mode === "STRINGIFY") {
        return "Convert an object into text representing an object.";
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
    if (newMode === "PARSE") {
      this.outputConnection.setCheck("Object");
      this.getInput("INPUT").setCheck("String");
    } else {
      this.outputConnection.setCheck("String");
      this.getInput("INPUT").setCheck("Object");
    }
  },
  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
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

BlocklyJS.javascriptGenerator.forBlock["json_parse"] = function (block) {
  const input =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "INPUT",
      BlocklyJS.Order.ATOMIC
    ) || "null";
  const mode = block.getFieldValue("MODE");

  if (mode === "PARSE") {
    return [`JSON.parse(${input})`, BlocklyJS.Order.NONE];
  } else if (mode === "STRINGIFY") {
    return [`JSON.stringify(${input})`, BlocklyJS.Order.NONE];
  }
};

Blockly.Blocks["json_clone"] = {
  init: function () {
    this.appendValueInput("OBJECT")
      .setCheck("Object")
      .appendField("clone object");
    this.setOutput(true, "Object");
    this.setStyle("json_category");
    this.setTooltip("Creates a deep clone of a JSON-compatible object.");
  },
};

BlocklyJS.javascriptGenerator.forBlock["json_clone"] = function (block) {
  const obj =
    BlocklyJS.javascriptGenerator.valueToCode(
      block,
      "OBJECT",
      BlocklyJS.Order.ATOMIC
    ) || "{}";
  return [`JSON.parse(JSON.stringify(${obj}))`, BlocklyJS.Order.FUNCTION_CALL];
};
