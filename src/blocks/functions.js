import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

const ARG_BLOCK_TYPE = "FunctionsArgumentBlock";

class CustomChecker extends Blockly.ConnectionChecker {
  canConnect(a, b, isDragging, opt_distance) {
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
    const ws = this.block.workspace;

    let typeToCreate = this.block.type;
    if (this.block.argType_ === "statement") {
      typeToCreate = "functions_statement_argument_block";
    }

    let data = this.block.toCopyData();
    if (data?.blockState) {
      data.blockState.type = typeToCreate;
    } else {
      data.blockState = { type: typeToCreate };
    }

    if (this.block.mutationToDom) {
      const mutation = this.block.mutationToDom();
      if (mutation) {
        data.blockState.extraState = mutation.outerHTML;
      }
    }

    this.copy = Blockly.clipboard.paste(data, ws);
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

function typeToBlocklyCheck(type) {
  return (
    {
      string: "String",
      number: "Number",
      boolean: "Boolean",
      array: "Array",
      object: "Object",
    }[type] || null
  );
}

function findDuplicateArgNames(types, names) {
  const used = {};
  const duplicates = [];

  for (let i = 0; i < types.length; i++) {
    const key = types[i] + ":" + names[i];
    if (!names[i]) continue;

    if (used[key]) duplicates.push(i);
    else used[key] = true;
  }
  return duplicates;
}

function isValidIdentifier(name) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name);
}

Blockly.Blocks["functions_argument_block"] = {
  init() {
    if (!this.argType_) this.argType_ = "string";
    if (!this.argName_) this.argName_ = "arg";

    this.setStyle("procedure_blocks");
    this.appendDummyInput().appendField(
      new Blockly.FieldLabel(this.argName_),
      "ARG_NAME"
    );

    this.setOutput(true, null);
    this.setMovable(true);
    this.setDeletable(true);

    setTimeout(() => {
      if (this.setDragStrategy && this.isShadow()) {
        this.setDragStrategy(new DuplicateOnDrag(this));
      }
    });
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("type", this.argType_ || "string");
    container.setAttribute("name", this.argName_ || "arg");
    return container;
  },

  domToMutation: function (xmlElement) {
    const type = xmlElement.getAttribute("type") || "string";
    const name = xmlElement.getAttribute("name") || "arg";
    this.updateType_(type);
    this.updateName_(name);
  },

  updateType_: function (type) {
    this.argType_ = type;
    if (type === "statement") {
      this.setOutputShape(3);
      this.setOutput(true, ARG_BLOCK_TYPE);
    } else {
      const outputType = typeToBlocklyCheck(type) || "String";
      this.setOutput(true, [outputType, ARG_BLOCK_TYPE]);
    }
  },

  updateName_: function (name) {
    this.argName_ = name;
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

Blockly.Blocks["functions_statement_argument_block"] = {
  init() {
    if (!this.argName_) this.argName_ = "arg";

    this.setStyle("procedure_blocks");
    this.appendDummyInput().appendField(
      new Blockly.FieldLabel(this.argName_),
      "ARG_NAME"
    );

    this.setNextStatement(true, "default");
    this.setPreviousStatement(true, "default");
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("name", this.argName_ || "arg");
    return container;
  },

  domToMutation: function (xmlElement) {
    const name = xmlElement.getAttribute("name") || "arg";
    this.updateName_(name);
  },

  updateName_: function (name) {
    this.argName_ = name;
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

    this.functionId_ = Blockly.utils.idGenerator.genUid();
    this.itemCount_ = 0;
    this.argTypes_ = [];
    this.argNames_ = [];
    this.blockShape_ = "statement";

    this.updateShape_();
    this.setMutator(
      new Blockly.icons.MutatorIcon(["functions_args_generic"], this)
    );
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("functionId", this.functionId_);
    container.setAttribute("items", String(this.itemCount_));
    container.setAttribute("shape", this.blockShape_ || "statement");

    for (let i = 0; i < this.itemCount_; i++) {
      const item = Blockly.utils.xml.createElement("item");
      item.setAttribute("type", this.argTypes_[i]);
      item.setAttribute("name", this.argNames_[i]);
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
      this.argTypes_[i] = children[i].getAttribute("type");
      this.argNames_[i] = children[i].getAttribute("name");
    }

    while (this.argTypes_.length < this.itemCount_)
      this.argTypes_.push("label");
    while (this.argNames_.length < this.itemCount_) this.argNames_.push("text");

    this.functionId_ =
      xmlElement.getAttribute("functionId") ||
      Blockly.utils.idGenerator.genUid();
    this.blockShape_ = xmlElement.getAttribute("shape") || "statement";
    this.updateShape_();
  },

  saveExtraState: function () {
    return {
      functionId: this.functionId_,
      itemCount: this.itemCount_,
      argTypes: this.argTypes_,
      argNames: this.argNames_,
      shape: this.blockShape_,
    };
  },

  loadExtraState: function (state) {
    this.functionId_ = state.functionId || Blockly.utils.idGenerator.genUid();
    this.itemCount_ = state.itemCount || 0;
    this.argTypes_ = state.argTypes || [];
    this.argNames_ = state.argNames || [];
    this.blockShape_ = state.shape || "statement";
    this.updateShape_();
  },

  createDefaultArgBlock_: function (type, name = "arg") {
    Blockly.Events.disable();

    let block;
    try {
      const ws = this.workspace;
      block = ws.newBlock("functions_argument_block");
      block.setShadow(true);
      block.setEditable(false);
      block.updateType_(type);
      block.updateName_(name);

      if (ws?.rendered) {
        block.initSvg();
        block.render();
      }
    } catch (_) {}

    Blockly.Events.enable();
    return block;
  },

  updateShape_: function () {
    let savedBody = null;

    const bodyInput = this.getInput("BODY");
    if (bodyInput && bodyInput.connection?.targetConnection) {
      savedBody = bodyInput.connection.targetConnection;
    }

    if (bodyInput) this.removeInput("BODY");
    if (this.getInput("EMPTY")) this.removeInput("EMPTY");
    if (this.getInput("SHAPE")) this.removeInput("SHAPE");

    this.inputList.slice().forEach((input) => {
      const connection = input.connection?.targetConnection;
      if (connection) connection.getSourceBlock()?.dispose(false);
      this.removeInput(input.name);
    });

    let firstArgAdded = this.argTypes_[0] === "label";

    for (let i = 0; i < this.itemCount_; i++) {
      const type = this.argTypes_[i];
      const name = this.argNames_[i];

      if (type === "label") {
        this.appendDummyInput().appendField(new Blockly.FieldLabel(name));
      } else {
        const input = this.appendValueInput(name).setCheck(
          typeToBlocklyCheck(type)
        );

        if (!firstArgAdded) {
          input.appendField("my block with");
          firstArgAdded = true;
        }

        const reporter = this.createDefaultArgBlock_(type, name);
        reporter.setFieldValue(name, "ARG_NAME");

        try {
          reporter.outputConnection.connect(input.connection);
        } catch (e) {}
      }
    }

    if (this.itemCount_ === 0) {
      this.appendDummyInput("EMPTY").appendField("my block");
    }

    const newBody = this.appendStatementInput("BODY").setCheck("default");
    if (savedBody) {
      try {
        newBody.connection.connect(savedBody);
      } catch (e) {}
    }
  },

  decompose: function (workspace) {
    const containerBlock = workspace.newBlock("functions_args_container");
    if (workspace.rendered) containerBlock.initSvg();
    let connection = containerBlock.getInput("STACK").connection;

    for (let i = 0; i < this.itemCount_; i++) {
      const type = this.argTypes_[i] || "label";
      const name = this.argNames_[i] || "text";
      const itemBlock = workspace.newBlock("functions_args_generic");
      itemBlock.setFieldValue(type, "ARG_TYPE");
      itemBlock.setFieldValue(name, "ARG_NAME");
      if (workspace.rendered) itemBlock.initSvg();
      itemBlock.valueConnection_ = null;

      connection.connect(itemBlock.previousConnection);
      connection = itemBlock.nextConnection;
    }

    containerBlock.setFieldValue(this.blockShape_, "SHAPEMENU");

    return containerBlock;
  },

  compose: function (containerBlock) {
    const newTypes = [];
    const newNames = [];

    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    while (itemBlock) {
      if (!(itemBlock.isInsertionMarker && itemBlock.isInsertionMarker())) {
        const type = itemBlock.getFieldValue("ARG_TYPE");
        const name = itemBlock.getFieldValue("ARG_NAME");
        newTypes.push(type);
        newNames.push(name);
      }
      itemBlock = itemBlock.getNextBlock();
    }

    const dups = findDuplicateArgNames(newTypes, newNames);

    const invalid = [];
    for (let i = 0; i < newTypes.length; i++) {
      const type = newTypes[i];
      const name = newNames[i];
      if (type !== "label") {
        if (!isValidIdentifier(name)) {
          invalid.push(i);
        }
      }
    }

    itemBlock = containerBlock.getInputTargetBlock("STACK");
    let index = 0;
    while (itemBlock) {
      if (!(itemBlock.isInsertionMarker && itemBlock.isInsertionMarker())) {
        if (dups.includes(index)) {
          itemBlock.setWarningText(
            "This argument name is already used for this type."
          );
        } else if (invalid.includes(index)) {
          itemBlock.setWarningText("This argument name is not a valid.");
        } else {
          itemBlock.setWarningText(null);
        }

        index++;
      }
      itemBlock = itemBlock.getNextBlock();
    }

    const newBlockShape =
      containerBlock.getFieldValue("SHAPEMENU") || "statement";

    if (dups.length > 0 || invalid.length > 0) return;

    this.itemCount_ = newTypes.length;
    this.argTypes_ = newTypes;
    this.argNames_ = newNames;
    this.blockShape_ = newBlockShape;

    this.updateShape_();
  },

  saveConnections: function (containerBlock) {
    let itemBlock = containerBlock.getInputTargetBlock("STACK");
    let i = 0;
    while (itemBlock) {
      if (!(itemBlock.isInsertionMarker && itemBlock.isInsertionMarker())) {
        const key = this.argTypes_[i] + "_" + this.argNames_[i];
        const input = this.getInput(key);
        itemBlock.valueConnection_ =
          input && input.connection && input.connection.targetConnection;
        i++;
      }
      itemBlock = itemBlock.getNextBlock();
    }
  },
};

Blockly.Blocks["functions_args_container"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.appendDummyInput().appendField("arguments");
    this.appendStatementInput("STACK");
    this.appendDummyInput()
      .appendField("shape")
      .appendField(
        new Blockly.FieldDropdown([
          [
            {
              src: "icons/statement.svg",
              width: 98 * 0.6,
              height: 57 * 0.6,
              alt: "A block with top and bottom connections",
            },
            "statement",
          ],
          [
            {
              src: "icons/terminal.svg",
              width: 98 * 0.6,
              height: 48 * 0.6,
              alt: "A block with only a top connection",
            },
            "terminal",
          ],
        ]),
        "SHAPEMENU"
      );
    this.contextMenu = false;
  },
};

Blockly.Blocks["functions_args_generic"] = {
  init() {
    this.setStyle("procedure_blocks");

    this.appendDummyInput()
      .appendField("argument")
      .appendField(
        new Blockly.FieldDropdown([
          ["label", "label"],
          ["string", "string"],
          ["number", "number"],
          ["boolean", "boolean"],
          ["array", "array"],
          ["object", "object"],
          ["statement", "statement"],
        ]),
        "ARG_TYPE"
      )
      .appendField(new Blockly.FieldTextInput("arg"), "ARG_NAME");

    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.contextMenu = false;
    this.valueConnection_ = null;
  },
};

Blockly.Blocks["functions_call"] = {
  init: function () {
    this.setStyle("procedure_blocks");
    this.setInputsInline(true);

    this.functionId_ = null;
    this.blockShape_ = null;
    this.argTypes_ = [];
    this.argNames_ = [];
    this.previousArgTypes_ = [];
    this.previousArgNames_ = [];

    this.updateShape_();
  },

  mutationToDom: function () {
    const container = Blockly.utils.xml.createElement("mutation");
    container.setAttribute("functionId", this.functionId_);
    container.setAttribute("items", this.argTypes_.length);
    container.setAttribute("shape", this.blockShape_ || "statement");

    for (let i = 0; i < this.argTypes_.length; i++) {
      const item = Blockly.utils.xml.createElement("item");
      item.setAttribute("type", this.argTypes_[i]);
      item.setAttribute("name", this.argNames_[i]);
      container.appendChild(item);
    }
    return container;
  },

  domToMutation: function (xmlElement) {
    this.functionId_ = xmlElement.getAttribute("functionId");
    this.blockShape_ = xmlElement.getAttribute("shape") || "statement";
    this.previousArgTypes_ = [...this.argTypes_];
    this.previousArgNames_ = [...this.argNames_];
    this.argTypes_ = [];
    this.argNames_ = [];

    const items = parseInt(xmlElement.getAttribute("items") || "0", 10);
    for (let i = 0; i < items; i++) {
      const item = xmlElement.children[i];
      this.argTypes_[i] = item.getAttribute("type");
      this.argNames_[i] = item.getAttribute("name");
    }

    this.updateShape_();
  },

  matchDefinition: function (defBlock) {
    this.functionId_ = defBlock.functionId_;
    this.previousArgTypes_ = [...this.argTypes_];
    this.previousArgNames_ = [...this.argNames_];
    this.argTypes_ = [...defBlock.argTypes_];
    this.argNames_ = [...defBlock.argNames_];
    this.blockShape_ = defBlock.blockShape_.slice();
    this.updateShape_();
    if (defBlock.workspace.rendered) this.render();
  },

  updateShape_: function () {
    const oldConnections = {};

    [...this.inputList].forEach((input) => {
      if (input.connection && input.connection.targetBlock()) {
        oldConnections[input.name] = input.connection.targetConnection;
      }
      this.removeInput(input.name);
    });

    const shape = this.blockShape_ || "statement";
    const nextConn = this.nextConnection;

    if (shape === "statement") {
      this.setPreviousStatement(true, "default");
      this.setNextStatement(true, "default");
    } else if (shape === "terminal") {
      if (nextConn && nextConn.isConnected()) {
        const blockBelow = nextConn.targetBlock();
        blockBelow.unplug(true);
      }

      this.setNextStatement(false);
      this.setPreviousStatement(true, "default");
    }

    if (!this.argTypes_ || this.argTypes_.length === 0) {
      this.appendDummyInput("EMPTY").appendField("my block");
      return;
    }

    let firstLabel = this.argTypes_[0] === "label";

    for (let i = 0; i < this.argTypes_.length; i++) {
      const type = this.argTypes_[i];
      const name = this.argNames_[i];

      if (!type || !name) continue;

      if (type === "label") {
        this.appendDummyInput().appendField(name);
        continue;
      }

      if (!firstLabel) {
        this.appendDummyInput().appendField("my block with");
        firstLabel = true;
      }

      let input;
      const key = type + "_" + name;
      if (type === "statement") {
        input = this.appendStatementInput(key).setCheck("default");
      } else {
        input = this.appendValueInput(key).setCheck(typeToBlocklyCheck(type));
      }

      if (oldConnections[key]) {
        try {
          input.connection.connect(
            oldConnections[key].targetBlock()?.outputConnection ||
              oldConnections[key]
          );
        } catch (e) {}
      }
    }
  },
};

BlocklyJS.javascriptGenerator.forBlock["functions_argument_block"] = function (
  block
) {
  const key = block.argType_ + "_" + block.argName_;
  return [key, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["functions_statement_argument_block"] =
  function (block) {
    const key = "statement_" + block.argName_ + "();\n";
    return key;
  };

BlocklyJS.javascriptGenerator.forBlock["functions_definition"] = function (
  block,
  generator
) {
  const params = block.argTypes_
    .map((type, i) => {
      if (type === "label") return null;
      return type + "_" + block.argNames_[i];
    })
    .filter(Boolean);

  const body = BlocklyJS.javascriptGenerator.statementToCode(block, "BODY");
  return `MyFunctions[${generator.quote_(
    block.functionId_
  )}] = async (${params.join(", ")}) => {\n${body}};\n`;
};

BlocklyJS.javascriptGenerator.forBlock["functions_call"] = function (
  block,
  generator
) {
  const args = [];

  for (let i = 0; i < block.argTypes_.length; i++) {
    const type = block.argTypes_[i];
    const name = block.argNames_[i];
    const key = `${type}_${name}`;

    if (type === "label") continue;

    if (type === "statement")
      args.push(`async () => {${generator.statementToCode(block, key)}}`);
    else
      args.push(
        generator.valueToCode(block, key, BlocklyJS.Order.NONE) || "null"
      );
  }

  return `await MyFunctions[${generator.quote_(block.functionId_)}](${args.join(
    ", "
  )});\n`;
};
