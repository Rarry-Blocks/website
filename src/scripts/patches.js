import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import * as PIXI from "pixi.js";

BlocklyJS.javascriptGenerator.INFINITE_LOOP_TRAP =
  'if (stopped()) throw new Error("shouldStop");\nif (!fastExecution) await new Promise(r => setTimeout(r, 16));\n';

Blockly.VerticalFlyout.prototype.getFlyoutScale = () => 0.8;

[
  "controls_if",
  "controls_if_if",
  "controls_if_elseif",
  "controls_if_else",
].forEach((type) => {
  Blockly.Blocks[type].init = (function (original) {
    return function () {
      original.call(this);
      this.setColour("#FFAB19");
    };
  })(Blockly.Blocks[type].init);
});

Blockly.Blocks["controls_forEach"].init = (function (original) {
  return function () {
    original.call(this);
    this.setColour("#e35340");
  };
})(Blockly.Blocks["controls_forEach"].init);

Blockly.Blocks["text"] = {
  init: function () {
    this.appendDummyInput().appendField(new Blockly.FieldTextInput(""), "TEXT");
    this.setOutput(true, "String");
    this.setStyle("text_blocks");
    this.setTooltip(Blockly.Msg["TEXT_TEXT_TOOLTIP"]);
    this.setHelpUrl(Blockly.Msg["TEXT_TEXT_HELPURL"]);

    Blockly.Extensions.apply("parent_tooltip_when_inline", this, false);
    setTimeout(() => {
      if (!this.isShadow()) {
        Blockly.Extensions.apply("text_quotes", this, false);
      }
    });
  },
};

Object.keys(Blockly.Blocks).forEach((type) => {
  const block = Blockly.Blocks[type];
  if (!block || typeof block.init !== "function") return;

  const originalInit = block.init;
  block.init = function () {
    originalInit.call(this);
    if (this.previousConnection && this.previousConnection.check_ === null)
      this.setPreviousStatement(true, "default");
    if (this.nextConnection && this.nextConnection.check_ === null)
      this.setNextStatement(true, "default");
  };
});

BlocklyJS.javascriptGenerator.forBlock["procedures_defnoreturn"] = function (
  block,
  generator
) {
  const procedureName = generator.getProcedureName(block.getFieldValue("NAME"));

  let injectedCode = "";
  if (generator.STATEMENT_PREFIX) {
    injectedCode += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    injectedCode += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (injectedCode) {
    injectedCode = generator.prefixLines(injectedCode, generator.INDENT);
  }

  let loopTrap = "";
  if (generator.INFINITE_LOOP_TRAP) {
    loopTrap = generator.prefixLines(
      generator.injectId(generator.INFINITE_LOOP_TRAP, block),
      generator.INDENT
    );
  }

  let bodyCode = "";
  if (block.getInput("STACK")) {
    bodyCode = generator.statementToCode(block, "STACK");
  }

  let returnCode = "";
  if (block.getInput("RETURN")) {
    returnCode =
      generator.valueToCode(block, "RETURN", BlocklyJS.Order.NONE) || "";
  }

  let returnWrapper = "";
  if (bodyCode && returnCode) {
    returnWrapper = injectedCode;
  }

  if (returnCode) {
    returnCode = generator.INDENT + "return " + returnCode + ";\n";
  }

  const args = [];
  const vars = block.getVars();
  for (let i = 0; i < vars.length; i++) {
    args[i] = generator.getVariableName(vars[i]);
  }

  let code =
    "async function " +
    procedureName +
    "(" +
    args.join(", ") +
    ") {\n" +
    injectedCode +
    loopTrap +
    bodyCode +
    returnWrapper +
    returnCode +
    "}";

  code = generator.scrub_(block, code);
  generator.definitions_["%" + procedureName] = code;

  return null;
};

BlocklyJS.javascriptGenerator.forBlock["procedures_defreturn"] = function (
  block,
  generator
) {
  const procedureName = generator.getProcedureName(block.getFieldValue("NAME"));

  let statementWrapper = "";
  if (generator.STATEMENT_PREFIX) {
    statementWrapper += generator.injectId(generator.STATEMENT_PREFIX, block);
  }
  if (generator.STATEMENT_SUFFIX) {
    statementWrapper += generator.injectId(generator.STATEMENT_SUFFIX, block);
  }
  if (statementWrapper) {
    statementWrapper = generator.prefixLines(
      statementWrapper,
      generator.INDENT
    );
  }

  let loopTrapCode = "";
  if (generator.INFINITE_LOOP_TRAP) {
    loopTrapCode = generator.prefixLines(
      generator.injectId(generator.INFINITE_LOOP_TRAP, block),
      generator.INDENT
    );
  }

  let bodyCode = "";
  if (block.getInput("STACK")) {
    bodyCode = generator.statementToCode(block, "STACK");
  }

  let returnCode = "";
  if (block.getInput("RETURN")) {
    returnCode =
      generator.valueToCode(block, "RETURN", BlocklyJS.Order.NONE) || "";
  }

  let returnWrapper = "";
  if (bodyCode && returnCode) {
    returnWrapper = statementWrapper;
  }

  if (returnCode) {
    returnCode = generator.INDENT + "return " + returnCode + ";\n";
  }

  const args = [];
  const vars = block.getVars();
  for (let i = 0; i < vars.length; i++) {
    args[i] = generator.getVariableName(vars[i]);
  }

  let code =
    "async function " +
    procedureName +
    "(" +
    args.join(", ") +
    ") {\n" +
    statementWrapper +
    loopTrapCode +
    bodyCode +
    returnWrapper +
    returnCode +
    "}";

  code = generator.scrub_(block, code);
  generator.definitions_["%" + procedureName] = code;

  return null;
};

BlocklyJS.javascriptGenerator.forBlock["procedures_callreturn"] = function (
  block,
  generator
) {
  const procedureName = generator.getProcedureName(block.getFieldValue("NAME"));

  const args = [];
  const vars = block.getVars();
  for (let i = 0; i < vars.length; i++) {
    args[i] =
      generator.valueToCode(block, "ARG" + i, BlocklyJS.Order.NONE) || "null";
  }

  return [
    "await " + procedureName + "(" + args.join(", ") + ")",
    BlocklyJS.Order.FUNCTION_CALL,
  ];
};

BlocklyJS.javascriptGenerator.forBlock["procedures_callnoreturn"] = function (
  block,
  generator
) {
  const code = generator.forBlock.procedures_callreturn(block, generator)[0];
  return code + ";\n";
};

export const SpriteChangeEvents = new PIXI.utils.EventEmitter();

const originalX = Object.getOwnPropertyDescriptor(
  PIXI.DisplayObject.prototype,
  "x"
);
const originalY = Object.getOwnPropertyDescriptor(
  PIXI.DisplayObject.prototype,
  "y"
);
const originalAngle = Object.getOwnPropertyDescriptor(
  PIXI.DisplayObject.prototype,
  "angle"
);
const originalTexture = Object.getOwnPropertyDescriptor(
  PIXI.Sprite.prototype,
  "texture"
);

Object.defineProperty(PIXI.Sprite.prototype, "x", {
  get() {
    return originalX.get.call(this);
  },
  set(value) {
    if (this.x !== value) {
      originalX.set.call(this, value);
      SpriteChangeEvents.emit("positionChanged", this);
    }
  },
});

Object.defineProperty(PIXI.Sprite.prototype, "y", {
  get() {
    return originalY.get.call(this);
  },
  set(value) {
    if (this.y !== value) {
      originalY.set.call(this, value);
      SpriteChangeEvents.emit("positionChanged", this);
    }
  },
});

PIXI.Sprite.prototype.setPosition = function({ x = null, y = null, add = false, silent = false } = {}) {
  const newX = x !== null ? (add ? this.x + x : x) : this.x;
  const newY = y !== null ? (add ? this.y + y : y) : this.y;

  if (silent) {
    originalX.set.call(this, newX);
    originalY.set.call(this, newY);
  } else {
    const changed = (this.x !== newX) || (this.y !== newY);
    originalX.set.call(this, newX);
    originalY.set.call(this, newY);
    if (changed) SpriteChangeEvents.emit("positionChanged", this);
  }
};

Object.defineProperty(PIXI.Sprite.prototype, "angle", {
  get() {
    return originalAngle.get.call(this);
  },
  set(value) {
    if (this.angle !== value) {
      originalAngle.set.call(this, value);
      SpriteChangeEvents.emit("positionChanged", this);
    }
  },
});

Object.defineProperty(PIXI.Sprite.prototype, "texture", {
  get() {
    return originalTexture.get.call(this);
  },
  set(value) {
    if (this.constructor === PIXI.Sprite && this.texture !== value) {
      originalTexture.set.call(this, value);
      SpriteChangeEvents.emit("textureChanged", this);
    } else {
      originalTexture.set.call(this, value);
    }
  },
});

const originalObsPointSet = PIXI.ObservablePoint.prototype.set;

PIXI.ObservablePoint.prototype.set = function (x, y) {
  const result = originalObsPointSet.call(this, x, y);
  if (this._parentScaleEvent) {
    SpriteChangeEvents.emit("scaleChanged", this._parentScaleEvent);
  }
  return result;
};

class ToolboxBubbleCategory extends Blockly.ToolboxCategory {
  createIconDom_() {
    const element = document.createElement("div");
    element.classList.add("categoryBubble");
    element.style.backgroundColor = this.colour_;
    return element;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.TOOLBOX_ITEM,
  Blockly.ToolboxCategory.registrationName,
  ToolboxBubbleCategory,
  true
);
