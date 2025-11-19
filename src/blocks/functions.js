import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

const ARG_BLOCK_TYPE = "FunctionsArgumentBlock";

class CustomChecker extends Blockly.ConnectionChecker {
  canConnect(a, b, isDragging, opt_distance) {
    const from = a.getSourceBlock();
    const to = b.getSourceBlock();

    if (!isDragging) {
      return super.canConnect(a, b, isDragging, opt_distance);
    }

    const existing = b.targetConnection && b.targetConnection.getSourceBlock();

    if (
      existing &&
      existing.type === "functions_argument_block" &&
      existing.isShadow()
    ) {
      return false;
    }

    return super.canConnect(a, b, isDragging, opt_distance);
  }
}

Blockly.registry.register(
  Blockly.registry.Type.CONNECTION_CHECKER,
  "CustomChecker",
  CustomChecker,
  true
);

class DuplicateOnDrag {
  constructor(block) {
    this.block = block;
  }

  isMovable() {
    return true;
  }

  startDrag(e) {
    const data = this.block.toCopyData();
    this.copy = Blockly.clipboard.paste(data, this.block.workspace);
    this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.copy);
    this.copy.setDragStrategy(this.baseStrat);
    this.baseStrat.startDrag(e);
  }

  drag(e) {
    this.block.workspace
      .getGesture(e)
      .getCurrentDragger()
      .setDraggable(this.copy);
    this.baseStrat.drag(e);
  }

  endDrag(e) {
    this.baseStrat?.endDrag(e);
  }

  revertDrag(e) {
    this.copy?.dispose();
  }
}

Blockly.Blocks["functions_argument_block"] = {
  init() {
    this.setStyle("procedure_blocks");
    this.appendDummyInput().appendField(
      new Blockly.FieldLabel("arg"),
      "ARG_NAME"
    );
    this.setOutput(true, ["String", "Number", ARG_BLOCK_TYPE]);
    this.setMovable(true);
    this.setDeletable(true);
    if (this.setDragStrategy) this.setDragStrategy(new DuplicateOnDrag(this));
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    const name = this.getFieldValue("ARG_NAME") || "arg";
    container.setAttribute("name", name);
    return container;
  },

  domToMutation: function (xmlElement) {
    const name = xmlElement.getAttribute("name") || "arg";
    if (this.getField("ARG_NAME")) {
      this.setFieldValue(name, "ARG_NAME");
    } else {
      this.appendDummyInput().appendField(
        new Blockly.FieldLabel(name),
        "ARG_NAME"
      );
    }
  },
};

Blockly.Blocks["functions_definition"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.setTooltip("Function definition with a variable number of inputs.");
    this.setInputsInline(true);

    this.itemCount_ = 0;
    this.argTypes_ = [];
    this.argNames_ = [];

    this.updateShape_();
    this.setMutator(
      new Blockly.icons.MutatorIcon(
        ["functions_args_string", "functions_args_label"],
        this
      )
    );
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("items", String(this.itemCount_));

    for (let i = 0; i < this.itemCount_; i++) {
      const item = Blockly.utils.xml.createElement("item");
      item.setAttribute("type", this.argTypes_[i] || "arg");
      item.setAttribute(
        "name",
        this.argNames_[i] || (this.argTypes_[i] === "label" ? "text" : "arg")
      );
      container.appendChild(item);
    }

    return container;
  },

  domToMutation: function (xmlElement) {
    const items = xmlElement.getAttribute("items");
    this.itemCount_ = items ? parseInt(items, 10) : 0;
    this.argTypes_ = [];
    this.argNames_ = [];

    const children = [...xmlElement.children].filter(
      (n) => n.tagName.toLowerCase() === "item"
    );
    for (let i = 0; i < children.length; i++) {
      const t = children[i].getAttribute("type") || "arg";
      const n =
        children[i].getAttribute("name") || (t === "label" ? "text" : "arg");
      this.argTypes_[i] = t;
      this.argNames_[i] = n;
    }

    while (this.argTypes_.length < this.itemCount_) this.argTypes_.push("arg");
    while (this.argNames_.length < this.itemCount_) this.argNames_.push("arg");

    this.updateShape_();
  },

  saveExtraState: function () {
    return {
      itemCount: this.itemCount_,
      argTypes: this.argTypes_,
      argNames: this.argNames_,
    };
  },

  loadExtraState: function (state) {
    this.itemCount_ = state.itemCount || 0;
    this.argTypes_ = state.argTypes || [];
    this.argNames_ = state.argNames || [];
    this.updateShape_();
  },

  decompose: function (workspace) {
    const containerBlock = workspace.newBlock("functions_args_container");
    if (workspace.rendered)  containerBlock.initSvg();
    let connection = containerBlock.getInput("STACK").connection;

    for (let i = 0; i < this.itemCount_; i++) {
      const type = this.argTypes_[i] || "arg";
      const itemBlock = workspace.newBlock(
        type === "label" ? "functions_args_label" : "functions_args_string"
      );
      if (workspace.rendered) itemBlock.initSvg();

      if (type === "arg") {
        itemBlock.setFieldValue(this.argNames_[i] || "arg", "ARG_NAME");
        itemBlock.valueConnection_ = null;
      } else {
        itemBlock.setFieldValue(this.argNames_[i] || "text", "LABEL_TEXT");
      }

      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }
    return containerBlock;
  },

  compose: function (containerBlock) {
    const newTypes = [];
    const newNames = [];

    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    while (itemBlock) {
      if (!(itemBlock.isInsertionMarker && itemBlock.isInsertionMarker())) {
        if (itemBlock.type === "functions_args_string") {
          newTypes.push("arg");
          newNames.push(itemBlock.getFieldValue("ARG_NAME") || "arg");
        } else if (itemBlock.type === "functions_args_label") {
          newTypes.push("label");
          newNames.push(itemBlock.getFieldValue("LABEL_TEXT") || "text");
        }
      }
      itemBlock = itemBlock.getNextBlock();
    }

    for (let i = this.itemCount_ - 1; i >= 0; i--) {
      const inputName = this.argTypes_[i] === "arg" ? "ARG" + i : "LABEL" + i;
      const input = this.getInput(inputName);
      if (input) {
        const conn = input.connection && input.connection.targetConnection;
        if (conn) {
          conn.disconnect();
          const block = conn.getSourceBlock();
          if (block) block.dispose(false);
        }
        this.removeInput(inputName);
      }
    }

    this.itemCount_ = newTypes.length;
    this.argTypes_ = newTypes.slice();
    this.argNames_ = newNames.slice();

    this.updateShape_();
  },

  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      if (!(itemBlock.isInsertionMarker && itemBlock.isInsertionMarker())) {
        if (itemBlock.type === "functions_args_string") {
          const input = this.getInput("ARG" + i);
          itemBlock.valueConnection_ =
            input && input.connection && input.connection.targetConnection;
        } else {
          itemBlock.valueConnection_ = null;
        }
        i++;
      }
      itemBlock = itemBlock.getNextBlock();
    }
  },

  getInputForTypeIndex_: function (index) {
    return this.getInput("ARG" + index) || this.getInput("LABEL" + index);
  },

  createDefaultArgBlock_: function () {
    const ws = this.workspace;
    if (!ws) return null;

    const block = ws.newBlock("functions_argument_block");
    block.setShadow(true);
    block.setEditable(false);

    if (ws.rendered) {
      block.initSvg();
      block.render();
    }

    return block;
  },

  updateShape_: function () {
    let savedBodyConnection = null;
    const bodyInput = this.getInput("BODY");
    if (bodyInput && bodyInput.connection?.targetConnection) {
      savedBodyConnection = bodyInput.connection.targetConnection;
    }

    if (bodyInput) this.removeInput("BODY");
    if (this.getInput("EMPTY")) this.removeInput("EMPTY");

    this.inputList.slice().forEach((input) => {
      if (input.name?.startsWith("ARG") || input.name?.startsWith("LABEL")) {
        const conn = input.connection?.targetConnection;
        if (conn) conn.getSourceBlock()?.dispose(false);
        this.removeInput(input.name);
      }
    });

    let firstArgAdded = this.argTypes_[0] === "label";
    for (let j = 0; j < this.itemCount_; j++) {
      const type = this.argTypes_[j] || "arg";
      const name = this.argNames_[j] || (type === "label" ? "text" : "arg");

      if (type === "label") {
        this.appendDummyInput("LABEL" + j).appendField(
          new Blockly.FieldLabel(name)
        );
      } else {
        const input = this.appendValueInput("ARG" + j)
          .setCheck(ARG_BLOCK_TYPE)
          .setAlign(Blockly.inputs.Align.RIGHT);

        if (!firstArgAdded) {
          input.appendField("my block with");
          firstArgAdded = true;
        }

        const reporter = this.createDefaultArgBlock_();
        reporter.setFieldValue(name, "ARG_NAME");
        try {
          reporter.outputConnection.connect(input.connection);
        } catch (e) {}
      }
    }

    if (this.itemCount_ === 0 && !this.getInput("EMPTY")) {
      this.appendDummyInput("EMPTY").appendField("my block");
    }

    const newBody = this.appendStatementInput("BODY").setCheck("default");
    if (savedBodyConnection) {
      try {
        savedBodyConnection.connect(newBody.connection);
      } catch (e) {}
    }
  },
};

Blockly.Blocks["functions_args_container"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.appendDummyInput().appendField("arguments");
    this.appendStatementInput("STACK");
    this.contextMenu = false;
  },
};

Blockly.Blocks["functions_args_string"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.appendDummyInput()
      .appendField("string argument")
      .appendField(new Blockly.FieldTextInput("arg"), "ARG_NAME");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
    this.valueConnection_ = null;
  },
};

Blockly.Blocks["functions_args_label"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.appendDummyInput()
      .appendField("label")
      .appendField(new Blockly.FieldTextInput("text"), "LABEL_TEXT");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
  },
};

Blockly.Blocks["functions_call"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.setInputsInline(true);

    this.definitionId_ = null;
    this.argTypes_ = [];
    this.argNames_ = [];

    this.updateShape_();
    this.setPreviousStatement(true);
    this.setNextStatement(true);
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    if (this.definitionId_)
      container.setAttribute("definitionId", this.definitionId_);
    container.setAttribute("items", this.argTypes_.length);

    for (let i = 0; i < this.argTypes_.length; i++) {
      const item = Blockly.utils.xml.createElement("item");
      item.setAttribute("type", this.argTypes_[i]);
      item.setAttribute("name", this.argNames_[i]);
      container.appendChild(item);
    }
    return container;
  },

  domToMutation: function (xmlElement) {
    this.definitionId_ = xmlElement.getAttribute("definitionId");
    const items = parseInt(xmlElement.getAttribute("items") || "0", 10);

    this.argTypes_ = [];
    this.argNames_ = [];
    for (let i = 0; i < items; i++) {
      const item = xmlElement.children[i];
      this.argTypes_[i] = item.getAttribute("type");
      this.argNames_[i] = item.getAttribute("name");
    }
    this.updateShape_();
  },

  matchDefinition: function (defBlock) {
    this.definitionId_ = defBlock.id;
    this.argTypes_ = defBlock.argTypes_.slice();
    this.argNames_ = defBlock.argNames_.slice();
    this.updateShape_();
    if (defBlock.workspace.rendered) this.render();
  },

  updateShape_: function () {
    const oldConnections = {};
    this.inputList.slice().forEach((input) => {
      if (input.name?.startsWith("ARG")) {
        if (input.connection && input.connection.targetBlock()) {
          oldConnections[input.name] = input.connection.targetBlock();
        }
        this.removeInput(input.name);
      }
      if (input.name?.startsWith("LABEL") || input.name === "EMPTY") {
        this.removeInput(input.name);
      }
    });

    if (this.getInput("EMPTY")) this.removeInput("EMPTY");

    if (!this.argTypes_ || this.argTypes_.length === 0) {
      this.appendDummyInput("EMPTY").appendField("my block");
    } else {
      let firstArgAdded = this.argTypes_[0] === "label";

      for (let i = 0; i < this.argTypes_.length; i++) {
        const type = this.argTypes_[i];
        const name = this.argNames_[i];

        if (type === "label") {
          this.appendDummyInput("LABEL" + i).appendField(name);
        } else {
          const input = this.appendValueInput("ARG" + i).setCheck("String");
          if (!firstArgAdded) {
            input.appendField("my block with");
            firstArgAdded = true;
          }

          const oldBlock = oldConnections["ARG" + i];
          if (oldBlock) input.connection.connect(oldBlock.outputConnection);
        }
      }
    }
  },
};

BlocklyJS.javascriptGenerator.forBlock["functions_argument_block"] = function (
  block
) {
  const name = block.getFieldValue("ARG_NAME") || "arg";
  return [name, BlocklyJS.Order.ATOMIC];
};

function sanitizeId(id) {
  let sanitized = id.replace(/[^a-zA-Z0-9_$]/g, "_");
  if (/^\d/.test(sanitized)) sanitized = "_" + sanitized;
  return sanitized;
}

BlocklyJS.javascriptGenerator.forBlock["functions_definition"] = function (
  block,
  generator
) {
  const args = [];
  for (let i = 0; i < block.itemCount_; i++) {
    if (block.argTypes_[i] === "arg") {
      args.push(block.argNames_[i]);
    }
  }

  const bodyCode = generator.statementToCode(block, "BODY");
  const funcName = sanitizeId(block.id);

  const code = `function ${funcName}(${args.join(", ")}) {\n${bodyCode}}\n`;
  return code;
};

BlocklyJS.javascriptGenerator.forBlock["functions_call"] = function (
  block,
  generator
) {
  const args = [];
  for (let i = 0; i < block.argTypes_.length; i++) {
    if (block.argTypes_[i] === "arg") {
      const argCode =
        generator.valueToCode(block, "ARG" + i, BlocklyJS.Order.NONE) ||
        "undefined";
      args.push(argCode);
    }
  }

  const funcName = sanitizeId(this.definitionId_);
  if (!funcName) return "";
  else return `${funcName}(${args.join(", ")});\n`;
};
