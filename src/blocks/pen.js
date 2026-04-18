import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";

Blockly.Blocks["pen_down"] = {
  init: function () {
    this.appendDummyInput().appendField("pen down");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Put the pen down to draw");
  },
};
javascriptGenerator.forBlock["pen_down"] = function () {
  return "setPenStatus(true);\n";
};

Blockly.Blocks["pen_up"] = {
  init: function () {
    this.appendDummyInput().appendField("pen up");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Lift the pen up");
  },
};
javascriptGenerator.forBlock["pen_up"] = function () {
  return "setPenStatus(false);\n";
};

Blockly.Blocks["pen_print"] = {
  init: function () {
    this.appendValueInput("TEXT").setCheck(null).appendField("pen print");
    this.appendValueInput("X").setCheck("Number").appendField("at x");
    this.appendValueInput("Y").setCheck("Number").appendField("y");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Draw text on the stage at a specific position");
  },
};

javascriptGenerator.forBlock["pen_print"] = function (block, generator) {
  const text = generator.valueToCode(block, "TEXT", Order.ATOMIC) || "''";
  const x = generator.valueToCode(block, "X", Order.ATOMIC) || 0;
  const y = generator.valueToCode(block, "Y", Order.ATOMIC) || 0;
  return `penPrint(${text}, ${x}, ${y});\n`;
};

Blockly.Blocks["set_pen_color"] = {
  init: function () {
    this.appendDummyInput().appendField("set pen color");
    this.appendValueInput("R").setCheck("Number").appendField("R");
    this.appendValueInput("G").setCheck("Number").appendField("G");
    this.appendValueInput("B").setCheck("Number").appendField("B");
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen color to a RGB value");
  },
};
javascriptGenerator.forBlock["set_pen_color"] = function (block, generator) {
  const r = generator.valueToCode(block, "R", Order.ATOMIC) || 0;
  const g = generator.valueToCode(block, "G", Order.ATOMIC) || 0;
  const b = generator.valueToCode(block, "B", Order.ATOMIC) || 0;
  return `setPenColor(${r}, ${g}, ${b});\n`;
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
        "MODE",
      );
    this.appendValueInput("VALUE").setCheck(["String", "Number"]);
    this.setInputsInline(true);
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen color to a RGB or HEX value.");
  },
};

javascriptGenerator.forBlock["set_pen_color_combined"] = function (block, generator) {
  const mode = block.getFieldValue("MODE");
  const value = generator.valueToCode(block, "VALUE", Order.ATOMIC);
  if (mode === "HEX") return `setPenColorHex(${value});\n`;
  else return `setPenColor(${value});\n`;
};

Blockly.Blocks["set_pen_size"] = {
  init: function () {
    this.appendValueInput("SIZE").setCheck("Number").appendField("set pen size to");
    this.appendDummyInput().appendField("px");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen thickness to a specific value in pixels");
  },
};

javascriptGenerator.forBlock["set_pen_size"] = function (block, generator) {
  const size = generator.valueToCode(block, "SIZE", Order.ATOMIC) || 1;
  return `setPenSize("${size}");\n`;
};

Blockly.Blocks["set_pen_print_direction"] = {
  init: function () {
    this.appendValueInput("ANGLE")
      .setCheck("Number")
      .appendField("set pen print angle to");
    this.appendDummyInput().appendField("degrees");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the rotation angle for printed text");
  },
};

javascriptGenerator.forBlock["set_pen_print_direction"] = function (block, generator) {
  const angle = generator.valueToCode(block, "ANGLE", Order.ATOMIC) || 0;
  return `setPenPrintDirection(${angle});\n`;
};

Blockly.Blocks["clear_pen"] = {
  init: function () {
    this.appendDummyInput().appendField("clear pen");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Clear all pen drawings");
  },
};

javascriptGenerator.forBlock["clear_pen"] = () => "clearPen();\n";
