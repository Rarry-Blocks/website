import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
const xmlUtils = Blockly.utils.xml;

/* Thank you LordCat0 (https://github.com/LordCat0) for this block's code! */

Blockly.Blocks["text_join_extendable"] = {
  init: function () {
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setStyle("text_blocks");

    this.itemCount_ = 2;
    this.messageList = [..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
    this.updateShape_();
  },

  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
    container.setAttribute("items", this.itemCount_);
    return container;
  },

  domToMutation: function (xmlElement) {
    this.itemCount_ = parseInt(xmlElement.getAttribute("items"), 10);
    this.updateShape_();
  },

  updateShape_: function () {
    if (!this.getInput("LABEL")) {
      this.appendDummyInput("LABEL").appendField("join");
    }

    if (this.getInput("DECREASE")) {
      this.removeInput("DECREASE");
    }

    if (this.getInput("INCREASE")) {
      this.removeInput("INCREASE");
    }

    for (let i = 0; i < this.itemCount_; i++) {
      if (!this.getInput("ADD" + i)) {
        const shadow = document.createElement("shadow");
        shadow.setAttribute("type", "text");

        const field = document.createElement("field");
        field.setAttribute("name", "TEXT");
        field.textContent = this.messageList[i] || "..";
        shadow.append(field);

        this.appendValueInput("ADD" + i).connection.setShadowDom(shadow);
      }
    }
    for (let i = this.itemCount_; this.getInput("ADD" + i); i++) {
      this.removeInput("ADD" + i);
    }

    this.appendDummyInput("DECREASE").appendField(
      new Blockly.FieldImage(
        "/icons/caretLeft.svg",
        18,
        25,
        "add an input",
        this.decrease_.bind(this),
      ),
    );

    this.appendDummyInput("INCREASE").appendField(
      new Blockly.FieldImage(
        "/icons/caretRight.svg",
        18,
        25,
        "remove an input",
        this.increase_.bind(this),
      ),
    );
  },

  increase_: function () {
    if (this.itemCount_ > 99) return;
    this.itemCount_++;
    this.updateShape_();
  },

  decrease_: function () {
    if (this.itemCount_ < 2) return;
    this.itemCount_--;
    this.updateShape_();
  },
};

BlocklyJS.javascriptGenerator.forBlock["text_join_extendable"] = function (block, generator) {
  const parts = [];

  for (let i = 0; i < block.itemCount_; i++) {
    const value = generator.valueToCode(block, "ADD" + i, generator.ORDER_NONE) || "''";
    parts.push(value);
  }

  let code;
  if (parts.length === 1) {
    code = `String(${parts[0]})`;
  } else {
    code = `[${parts.join(", ")}].join("")`
  }
  
  return [code, BlocklyJS.Order.NONE];
};
