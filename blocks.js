Blockly.JavaScript.INFINITE_LOOP_TRAP = `
  if (shouldStop) throw new Error("shouldStop");
  await new Promise(r => setTimeout(r, 16));
`;

Blockly.Blocks["when_flag_clicked"] = {
  init: function () {
    this.appendDummyInput().appendField("when 🏁 clicked");
    this.appendStatementInput("DO").setCheck(null);
    this.setColour("#ffc400");
  },
};

Blockly.Blocks["project_timer"] = {
  init: function () {
    this.appendDummyInput().appendField("project timer");
    this.setOutput(true, "Number");
    this.setColour("#ffc400");
  },
};

Blockly.Blocks["move_steps"] = {
  init: function () {
    this.appendValueInput("STEPS").setCheck("Number").appendField("move");
    this.appendDummyInput().appendField("steps");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["change_position"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("change")
      .appendField(
        new Blockly.FieldDropdown([
          ["x", "x"],
          ["y", "y"],
        ]),
        "MENU"
      )
      .appendField("position by");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["set_position"] = {
  init: function () {
    this.appendValueInput("AMOUNT")
      .setCheck("Number")
      .appendField("set")
      .appendField(
        new Blockly.FieldDropdown([
          ["x", "x"],
          ["y", "y"],
        ]),
        "MENU"
      )
      .appendField("to");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["get_position"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["x", "x"],
        ["y", "y"],
        ["angle", "angle"],
      ]),
      "MENU"
    );
    this.setOutput(true, "Number");
    this.setColour("#4C97FF");
  },
};

Blockly.Blocks["say_message"] = {
  init: function () {
    this.appendValueInput("MESSAGE")
      .setCheck(["String", "Number", "Boolean"])
      .appendField("say");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["say_message_duration"] = {
  init: function () {
    this.appendValueInput("MESSAGE")
      .setCheck(["String", "Number", "Boolean"])
      .appendField("say");
    this.appendValueInput("DURATION").setCheck("Number").appendField("for");
    this.appendDummyInput().appendField("seconds");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setInputsInline(true);
    this.setColour("#9966FF");
  },
};

Blockly.Blocks["wait_one_frame"] = {
  init: function () {
    this.appendDummyInput().appendField("wait one frame");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFAB19");
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
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#FFAB19");
  },
};

Blockly.Blocks["switch_costume"] = {
  init: function () {
    this.appendValueInput("COSTUME")
      .setCheck("String")
      .appendField("switch costume to");
    this.setPreviousStatement(true);
    this.setNextStatement(true);
    this.setColour("#9966FF");
  },
};

const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."0123456789",
  ...`!"·$%&/()=?¿*-+ªº,._<>|@#`,
];

Blockly.Blocks["key_pressed"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("key")
      .appendField(
        new Blockly.FieldDropdown([
          ["space", " "],
          ["up arrow", "ArrowUp"],
          ["down arrow", "ArrowDown"],
          ["left arrow", "ArrowLeft"],
          ["right arrow", "ArrowRight"],
          ...normalKeys.map((i) => [i, i]),
        ]),
        "KEY"
      )
      .appendField("pressed?");
    this.setOutput(true, "Boolean");
    this.setColour("#5CB1D6");
  },
};

Blockly.Blocks["get_mouse_position"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("mouse")
      .appendField(
        new Blockly.FieldDropdown([
          ["x", "x"],
          ["y", "y"],
        ]),
        "MENU"
      );
    this.setOutput(true, "Number");
    this.setColour("#5CB1D6");
  },
};

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

Blockly.JavaScript.forBlock["when_flag_clicked"] = function (block) {
  const branch = Blockly.JavaScript.statementToCode(block, "DO");
  return `whenFlagClicked(async () => {\n${branch}});\n`;
};

Blockly.JavaScript.forBlock["project_timer"] = function (block) {
  return ["projectTime()", Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript.forBlock["move_steps"] = function (block) {
  const steps =
    Blockly.JavaScript.valueToCode(
      block,
      "STEPS",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || 0;
  return `moveSteps(${steps});\n`;
};

Blockly.JavaScript.forBlock["change_position"] = function (block) {
  const amount =
    Blockly.JavaScript.valueToCode(
      block,
      "AMOUNT",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || 0;
  const menu = block.getFieldValue("MENU");
  return `changePosition("${menu}", ${amount});\n`;
};

Blockly.JavaScript.forBlock["set_position"] = function (block) {
  const amount =
    Blockly.JavaScript.valueToCode(
      block,
      "AMOUNT",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || 0;
  const menu = block.getFieldValue("MENU");
  return `setPosition("${menu}", ${amount});\n`;
};

Blockly.JavaScript.forBlock["get_position"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getPosition("${menu}")`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript.forBlock["say_message"] = function (block) {
  const message =
    Blockly.JavaScript.valueToCode(
      block,
      "MESSAGE",
      Blockly.JavaScript.ORDER_NONE
    ) || "";

  return `sayMessage(${message});\n`;
};

Blockly.JavaScript.forBlock["say_message_duration"] = function (block) {
  const message =
    Blockly.JavaScript.valueToCode(
      block,
      "MESSAGE",
      Blockly.JavaScript.ORDER_NONE
    ) || "";
  const duration =
    Blockly.JavaScript.valueToCode(
      block,
      "DURATION",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || 2;

  return `sayMessage(${message}, ${duration});\n`;
};

Blockly.JavaScript.forBlock["wait_one_frame"] = function (block) {
  return `await waitOneFrame();\n`;
};

Blockly.JavaScript.forBlock["wait_block"] = function (block) {
  const duration =
    Blockly.JavaScript.valueToCode(
      block,
      "AMOUNT",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || 0;
  const menu = block.getFieldValue("MENU") || 0;
  return `await wait(${duration * Number(menu)});\n`;
};

Blockly.JavaScript.forBlock["switch_costume"] = function (block) {
  const costume =
    Blockly.JavaScript.valueToCode(
      block,
      "COSTUME",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || '""';
  return `switchCostume(${costume});\n`;
};

Blockly.JavaScript.forBlock["key_pressed"] = function (block, generator) {
  const key = block.getFieldValue("KEY");
  const safeKey = generator.quote_(key);
  return [`isKeyPressed(${safeKey})`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript.forBlock["get_mouse_position"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getMousePosition("${menu}")`, Blockly.JavaScript.ORDER_NONE];
};
