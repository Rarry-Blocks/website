import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
  "pen_down",
  function () {
    this.appendDummyInput().appendField("pen down");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Put the pen down to draw");
  },
  function () {
    return "setPenStatus(true);\n";
  }
);

quickBlockMaker(
  "pen_up",
  function () {
    this.appendDummyInput().appendField("pen up");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Lift the pen up");
  },
  function () {
    return "setPenStatus(false);\n";
  }
);

quickBlockMaker(
  "set_pen_color",
  function () {
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
  function (block, generator) {
    const r = generator.valueToCode(block, "R", BlocklyJS.Order.ATOMIC) || 0;
    const g = generator.valueToCode(block, "G", BlocklyJS.Order.ATOMIC) || 0;
    const b = generator.valueToCode(block, "B", BlocklyJS.Order.ATOMIC) || 0;
    return `setPenColor(${r}, ${g}, ${b});\n`;
  }
);

quickBlockMaker(
  "set_pen_color_combined",
  function () {
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
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen color to a RGB or HEX value.");
  },
  function (block, generator) {
    const mode = block.getFieldValue("MODE");
    const value = generator.valueToCode(block, "VALUE", BlocklyJS.Order.ATOMIC);
    if (mode === "HEX") return `setPenColorHex(${value});\n`;
    return `setPenColor(${value});\n`;
  }
);

quickBlockMaker(
  "set_pen_size",
  function () {
    this.appendValueInput("SIZE")
      .setCheck("Number")
      .appendField("set pen size to");
    this.appendDummyInput().appendField("px");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Set the pen thickness to a specific value in pixels");
  },
  function (block, generator) {
    const size =
      generator.valueToCode(block, "SIZE", BlocklyJS.Order.ATOMIC) || 1;
    return `setPenSize("${size}");\n`;
  }
);

quickBlockMaker(
  "clear_pen",
  function () {
    this.appendDummyInput().appendField("clear pen");
    this.setPreviousStatement(true, "default");
    this.setNextStatement(true, "default");
    this.setColour("#0fbd8c");
    this.setTooltip("Clear all pen drawings");
  },
  function() {
    return "clearPen();\n"; 
  }
);
