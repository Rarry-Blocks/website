Blockly.Blocks["pen_down"] = {
  init: function () {
    this.appendDummyInput().appendField("pen down");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Put the pen down to draw");
  },
};
Blockly.JavaScript.forBlock["pen_down"] = function () {
  return "setPenStatus(true);\n";
};

Blockly.Blocks["pen_up"] = {
  init: function () {
    this.appendDummyInput().appendField("pen up");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Lift the pen up");
  },
};
Blockly.JavaScript.forBlock["pen_up"] = function () {
  return "setPenStatus(false);\n";
};

Blockly.Blocks["set_pen_color"] = {
  init: function () {
    this.appendDummyInput().appendField("set pen color");
    this.appendValueInput("R").setCheck("Number").appendField("R");
    this.appendValueInput("G").setCheck("Number").appendField("G");
    this.appendValueInput("B").setCheck("Number").appendField("B");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen color to a RGB value");
  },
};
Blockly.JavaScript.forBlock["set_pen_color"] = function (block) {
  var r =
    Blockly.JavaScript.valueToCode(
      block,
      "R",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || "0";
  var g =
    Blockly.JavaScript.valueToCode(
      block,
      "G",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || "0";
  var b =
    Blockly.JavaScript.valueToCode(
      block,
      "B",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || "0";
  return "setPenColor(" + r + ", " + g + ", " + b + ");\n";
};

Blockly.Blocks["set_pen_color_combined"] = {
  init: function () {
    this.appendDummyInput("MODE")
      .appendField("set pen color to")
      .appendField(
        new Blockly.FieldDropdown([
          ["RGB", "RGB"],
          ["HEX", "HEX"],
        ]),
        "MODE"
      );
    this.appendValueInput("VALUE").setCheck(["String", "Number"]);
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen color to a RGB or HEX value.");
  },
};
Blockly.JavaScript.forBlock["set_pen_color_combined"] = function (block, generator) {
  var mode = block.getFieldValue("MODE");
  var value = Blockly.JavaScript.valueToCode(
    block,
    "VALUE",
    Blockly.JavaScript.ORDER_ATOMIC
  );
  value = generator.quote_(value);

  if (mode === "RGB") {
    return `setPenColor(${value});\n`;
  } else {
    return `setPenColorHex(${value});\n`;
  }
};

Blockly.Blocks["set_pen_size"] = {
  init: function () {
    this.appendValueInput("SIZE")
      .setCheck("Number")
      .appendField("set pen size to");
    this.appendDummyInput().appendField("px");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen thickness to a specific value in pixels");
  },
};
Blockly.JavaScript.forBlock["set_pen_size"] = function (block) {
  var size =
    Blockly.JavaScript.valueToCode(
      block,
      "SIZE",
      Blockly.JavaScript.ORDER_ATOMIC
    ) || "1";
  return "setPenSize(" + size + ");\n";
};

Blockly.Blocks["clear_pen"] = {
  init: function () {
    this.appendDummyInput().appendField("clear pen");
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setColour("#0fbd8c");
    this.setTooltip("Clear all pen drawings");
  },
};
Blockly.JavaScript.forBlock["clear_pen"] = function (block) {
  return "clearPen();\n";
};
