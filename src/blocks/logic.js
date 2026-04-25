import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import "blockly/blocks";

Blockly.Blocks["logic_operation_extra"] = {
  init: function () {
    this.appendValueInput("A").setCheck("Boolean");
    this.appendValueInput("B")
      .setCheck("Boolean")
      .appendField(
        new Blockly.FieldDropdown([
          ["and", "and"],
          ["or", "or"],
          ["xor", "xor"],
          ["nand", "nand"],
          ["nor", "nor"],
          ["xnor", "xnor"],
        ]),
        "OP",
      );
    this.setInputsInline(true);
    this.setOutput(true, "Boolean");
    this.setStyle("text_blocks");
  },
};

javascriptGenerator.forBlock["logic_operation_extra"] = function (block, generator) {
  const A = generator.valueToCode(block, "A", Order.LOGICAL_AND) || "false";
  const B = generator.valueToCode(block, "B", Order.LOGICAL_AND) || "false";
  const OP = block.getFieldValue("OP");

  let code;
  switch (OP) {
    case "and":
      code = `${A} && ${B}`;
      break;
    case "or":
      code = `${A} || ${B}`;
      break;
    case "xor":
      code = `(${A} !== ${B})`;
      break;
    case "nand":
      code = `!(${A} && ${B})`;
      break;
    case "nor":
      code = `!(${A} || ${B})`;
      break;
    case "xnor":
      code = `(${A} === ${B})`;
      break;
    default:
      code = "false";
  }

  return [code, Order.LOGICAL_OR];
};

Blockly.Blocks["logic_ternary"] = {
  init: function () {
    this.appendValueInput("IF").setCheck("Boolean").appendField("if");
    this.appendValueInput("THEN").setCheck(null).appendField("then");
    this.appendValueInput("ELSE").setCheck(null).appendField("else");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("text_blocks");
  },
};

javascriptGenerator.forBlock["logic_ternary"] = function (block, generator) {
  const IF = generator.valueToCode(block, "IF", Order.ATOMIC) || "false";
  const THEN = generator.valueToCode(block, "THEN", Order.ATOMIC) || '""';
  const ELSE = generator.valueToCode(block, "ELSE", Order.ATOMIC) || '""';
  return [`(${IF} ? ${THEN} : ${ELSE})`, Order.NONE];
};
