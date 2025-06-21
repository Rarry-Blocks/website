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
