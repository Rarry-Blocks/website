import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { Checkbox } from "../functions/patches/checkbox";

Blockly.Blocks["checkbox"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Checkbox("false"),
      "BOOL"
    );
    this.appendDummyInput().appendField(
      new Checkbox("false"),
      "BOOL2"
    );
    this.setOutput(true, "Boolean");
    this.setStyle("text_blocks");
  },
};


javascriptGenerator.forBlock["checkbox"] = function (block) {
  return [block.getFieldValue("BOOL") === "TRUE" ? "true" : "false", Order.ATOMIC];
};