Blockly.VerticalFlyout.prototype.getFlyoutScale = () => 0.9;

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
    this.appendDummyInput().appendField(
      new Blockly.FieldTextInput(""),
      "TEXT"
    );
    this.setOutput(true, "String");
    this.setStyle("text_blocks");
    this.setTooltip(Blockly.Msg["TEXT_TEXT_TOOLTIP"]);
    this.setHelpUrl(Blockly.Msg["TEXT_TEXT_HELPURL"]);

    Blockly.Extensions.apply("parent_tooltip_when_inline", this, false);
    setTimeout(() => {
      if (!this.isShadow()) {
        Blockly.Extensions.apply("text_quotes", this, false);
      }
    }, 0);
  },
};  

Blockly.JavaScript.forBlock["procedures_defnoreturn"] = function (
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
      generator.valueToCode(block, "RETURN", Blockly.JavaScript.ORDER_NONE) ||
      "";
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

Blockly.JavaScript.forBlock["procedures_defreturn"] = function (
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
      generator.valueToCode(block, "RETURN", Blockly.JavaScript.ORDER_NONE) ||
      "";
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

Blockly.JavaScript.forBlock["procedures_callreturn"] = function (
  block,
  generator
) {
  const procedureName = generator.getProcedureName(block.getFieldValue("NAME"));

  const args = [];
  const vars = block.getVars();
  for (let i = 0; i < vars.length; i++) {
    args[i] =
      generator.valueToCode(block, "ARG" + i, Blockly.JavaScript.ORDER_NONE) ||
      "null";
  }

  return [
    "await " + procedureName + "(" + args.join(", ") + ")",
    Blockly.JavaScript.ORDER_FUNCTION_CALL,
  ];
};

Blockly.JavaScript.forBlock["procedures_callnoreturn"] = function (
  block,
  generator
) {
  const code = generator.forBlock.procedures_callreturn(block, generator)[0];
  return code + ";\n";
};
