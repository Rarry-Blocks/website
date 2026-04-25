import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
const xmlUtils = Blockly.utils.xml;

function shadow(type, fieldName, value) {
  const element = document.createElement("shadow");
  element.setAttribute("type", type);
  const field = document.createElement("field");
  field.setAttribute("name", fieldName);
  field.textContent = value;
  element.append(field);
  return element;
}

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
    if (this.getInput("ARROWS")) {
      this.removeInput("ARROWS");
    }

    for (let i = 0; i < this.itemCount_; i++) {
      let input = this.getInput("ADD" + i);

      if (!input) {
        input = this.appendValueInput("ADD" + i);
        input.setAlign(Blockly.inputs.Align.RIGHT);
        input.connection.setShadowDom(
          shadow("text", "TEXT", this.messageList[i] || ".."),
        );
      }

      if (i === 0) {
        if (!input.fieldRow.length) {
          input.appendField("join");
        }
      }
    }

    for (let i = this.itemCount_; this.getInput("ADD" + i); i++) {
      this.removeInput("ADD" + i);
    }

    this.appendDummyInput("ARROWS")
      .setAlign(Blockly.inputs.Align.RIGHT)
      .appendField(
        new Blockly.FieldImage(
          "/icons/blocks/caretLeft.svg",
          18,
          25,
          "remove an input",
          this.decrease_.bind(this),
        ),
      )
      .appendField(
        new Blockly.FieldImage(
          "/icons/blocks/caretRight.svg",
          18,
          25,
          "add an input",
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

javascriptGenerator.forBlock["text_join_extendable"] = function (block, generator) {
  const parts = [];

  for (let i = 0; i < block.itemCount_; i++) {
    const value = generator.valueToCode(block, "ADD" + i, Order.NONE) || "''";
    parts.push(value);
  }

  let code;
  if (parts.length === 1) {
    code = `String(${parts[0]})`;
  } else {
    code = `[${parts.join(", ")}].join("")`;
  }

  return [code, Order.NONE];
};

Blockly.Blocks["text_indexOf"] = {
  init: function () {
    this.setStyle("text_blocks");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setTooltip(
      () =>
        `Returns the index of the first/last occurrence of first text in second text. Returns ${
          this.workspace.options.oneBasedIndex ? "0" : "-1"
        } if text is not found.`,
    );

    this.appendDummyInput()
      .appendField("find")
      .appendField(
        new Blockly.FieldDropdown([
          ["first", "FIRST"],
          ["last", "LAST"],
        ]),
        "END",
      )
      .appendField("occurrence of");

    this.appendValueInput("FIND")
      .setCheck("String")
      .connection.setShadowDom(shadow("text", "TEXT", ""));

    this.appendDummyInput().appendField("in");

    this.appendValueInput("VALUE")
      .setCheck("String")
      .connection.setShadowDom(shadow("text", "TEXT", ""));
  },
};

javascriptGenerator.forBlock["text_indexOf"] = function (block, generator) {
  const operator = block.getFieldValue("END") === "FIRST" ? "indexOf" : "lastIndexOf";
  const substring = generator.valueToCode(block, "FIND", Order.NONE) || "''";
  const text = generator.valueToCode(block, "VALUE", Order.MEMBER) || "''";
  const code = `${text}.${operator}(${substring})`;
  if (block.workspace.options.oneBasedIndex) {
    return [`${code} + 1`, Order.ADDITION];
  }
  return [code, Order.MEMBER];
};

Blockly.Blocks["text_charAt"] = {
  isAt_: false,

  init: function () {
    this.setStyle("text_blocks");
    this.setInputsInline(true);
    this.setOutput(true, "String");

    const dropdown = new Blockly.FieldDropdown([
      ["letter #", "FROM_START"],
      ["letter # from end", "FROM_END"],
      ["first letter", "FIRST"],
      ["last letter", "LAST"],
      ["random letter", "RANDOM"],
    ]);

    dropdown.setValidator(value => {
      const newAt = value === "FROM_START" || value === "FROM_END";
      if (newAt !== this.isAt_) this.updateAt_(newAt);
      return undefined;
    });

    this.appendDummyInput("WHERE_INPUT")
      .appendField("letter")
      .appendField(dropdown, "WHERE");

    this.appendValueInput("VALUE")
      .setCheck("String")
      .appendField("in")
      .connection.setShadowDom(shadow("text", "TEXT", ""));

    this.updateAt_(true);

    this.setTooltip(() => {
      const where = this.getFieldValue("WHERE");
      let tooltip = "Returns the letter at the specified position.";
      if (where === "FROM_START" || where === "FROM_END") {
        const index = this.workspace.options.oneBasedIndex ? "#1" : "#0";
        tooltip +=
          where === "FROM_START"
            ? `  # ${index} is the first item.`
            : `  # ${index} is the last item.`;
      }
      return tooltip;
    });
  },

  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
    container.setAttribute("at", `${this.isAt_}`);
    return container;
  },

  domToMutation: function (xmlElement) {
    const isAt = xmlElement.getAttribute("at") !== "false";
    this.updateAt_(isAt);
  },

  updateAt_: function (isAt) {
    this.removeInput("AT", true);

    if (isAt) {
      const atInput = this.appendValueInput("AT").setCheck("Number");
      atInput.connection.setShadowDom(shadow("math_number", "NUM", "1"));
      this.moveInputBefore("AT", "VALUE");
    }

    this.isAt_ = isAt;
  },
};

javascriptGenerator.forBlock["text_charAt"] = function (block, generator) {
  const where = block.getFieldValue("WHERE") || "FROM_START";
  const textOrder = where === "RANDOM" ? Order.NONE : Order.MEMBER;
  const text = generator.valueToCode(block, "VALUE", textOrder) || "''";
  const oneBasedIndex = block.workspace.options.oneBasedIndex;

  switch (where) {
    case "FROM_START": {
      const at = generator.valueToCode(block, "AT", Order.SUBTRACTION) || "1";
      if (oneBasedIndex) {
        if (at === "1") return [`${text}.charAt(0)`, Order.MEMBER];
        return [`${text}.charAt(${at} - 1)`, Order.MEMBER];
      }
      return [`${text}.charAt(${at})`, Order.MEMBER];
    }
    case "FROM_END": {
      const at = generator.valueToCode(block, "AT", Order.SUBTRACTION) || "1";
      if (oneBasedIndex) {
        return [`${text}.slice(-${at}).charAt(0)`, Order.MEMBER];
      }
      return [`${text}.slice(-(${at} + 1)).charAt(0)`, Order.MEMBER];
    }
    case "FIRST":
      return [`${text}.charAt(0)`, Order.MEMBER];
    case "LAST":
      return [`${text}.slice(-1)`, Order.MEMBER];
    case "RANDOM":
      return [`${text}.charAt(Math.floor(Math.random() * ${text}.length))`, Order.NONE];
    default:
      throw new Error(`Unknown WHERE value: ${where}`);
  }
};

Blockly.Blocks["text_getSubstring"] = {
  isAt1_: true,
  isAt2_: true,

  init: function () {
    this.WHERE_OPTIONS_1 = [
      ["letter #", "FROM_START"],
      ["letter # from end", "FROM_END"],
      ["first letter", "FIRST"],
    ];
    this.WHERE_OPTIONS_2 = [
      ["letter #", "FROM_START"],
      ["letter # from end", "FROM_END"],
      ["last letter", "LAST"],
    ];

    this.setStyle("text_blocks");
    this.setInputsInline(true);
    this.setOutput(true, "String");
    this.setTooltip("Returns a specified portion of the text.");

    this.updateShape_();
  },

  getMenu_: function (n) {
    const menu = new Blockly.FieldDropdown(this[`WHERE_OPTIONS_${n}`]);
    menu.setValidator(function (value) {
      const oldValue = this.getValue();
      const oldAt = oldValue === "FROM_START" || oldValue === "FROM_END";
      const newAt = value === "FROM_START" || value === "FROM_END";
      if (newAt !== oldAt) this.getSourceBlock().updateAt_(n, newAt);
      return undefined;
    });
    return menu;
  },

  mutationToDom: function () {
    const container = xmlUtils.createElement("mutation");
    container.setAttribute("at1", `${this.isAt1_}`);
    container.setAttribute("at2", `${this.isAt2_}`);
    return container;
  },

  domToMutation: function (xmlElement) {
    this.isAt1_ = xmlElement.getAttribute("at1") === "true";
    this.isAt2_ = xmlElement.getAttribute("at2") === "true";
    this.updateShape_();
  },

  updateAt_: function (n, isAt) {
    if (n === 1) this.isAt1_ = isAt;
    else this.isAt2_ = isAt;
    this.updateShape_();
  },

  updateShape_: function () {
    const where1 = this.getFieldValue("WHERE1") || "FROM_START";
    const where2 = this.getFieldValue("WHERE2") || "FROM_START";

    const stringConn = this.getInput("STRING")?.connection?.targetConnection || null;
    const at1Conn = this.getInput("AT1")?.connection?.targetConnection || null;
    const at2Conn = this.getInput("AT2")?.connection?.targetConnection || null;

    if (this.getInput("WHERE1_INPUT")) this.removeInput("WHERE1_INPUT");
    if (this.getInput("AT1")) this.removeInput("AT1");
    if (this.getInput("WHERE2_INPUT")) this.removeInput("WHERE2_INPUT");
    if (this.getInput("AT2")) this.removeInput("AT2");
    if (this.getInput("STRING")) this.removeInput("STRING");

    this.appendDummyInput("WHERE1_INPUT")
      .appendField("get letters from")
      .appendField(this.getMenu_(1), "WHERE1");

    if (this.isAt1_) {
      const at1Input = this.appendValueInput("AT1").setCheck("Number");
      at1Input.connection.setShadowDom(shadow("math_number", "NUM", "1"));
    } else {
      this.appendDummyInput("AT1");
    }

    this.appendDummyInput("WHERE2_INPUT")
      .appendField("to")
      .appendField(this.getMenu_(2), "WHERE2");

    if (this.isAt2_) {
      const at2Input = this.appendValueInput("AT2").setCheck("Number");
      at2Input.connection.setShadowDom(shadow("math_number", "NUM", "1"));
    } else {
      this.appendDummyInput("AT2");
    }

    const stringInput = this.appendValueInput("STRING")
      .setCheck("String")
      .appendField("in");
    stringInput.connection.setShadowDom(shadow("text", "TEXT", ""));

    this.setFieldValue(where1, "WHERE1");
    this.setFieldValue(where2, "WHERE2");

    if (at1Conn && this.getInput("AT1")?.connection) {
      this.getInput("AT1").connection.connect(at1Conn);
    }
    if (at2Conn && this.getInput("AT2")?.connection) {
      this.getInput("AT2").connection.connect(at2Conn);
    }
    if (stringConn && this.getInput("STRING")?.connection) {
      this.getInput("STRING").connection.connect(stringConn);
    }
  },
};

javascriptGenerator.forBlock["text_getSubstring"] = function (block, generator) {
  const text = generator.valueToCode(block, "STRING", Order.MEMBER) || "''";
  const where1 = block.getFieldValue("WHERE1");
  const where2 = block.getFieldValue("WHERE2");
  const oneBasedIndex = block.workspace.options.oneBasedIndex;

  function getStart(where, atId) {
    const at = generator.valueToCode(block, atId, Order.SUBTRACTION) || "1";
    if (where === "FROM_START") {
      if (oneBasedIndex) return at === "1" ? "0" : `${at} - 1`;
      return at;
    }
    if (oneBasedIndex) {
      return at === "1" ? `${text}.length - 1` : `${text}.length - ${at}`;
    }
    return `${text}.length - ${at} - 1`;
  }

  function getEnd(where, atId) {
    if (where === "FROM_START") {
      const at = generator.valueToCode(block, atId, Order.ADDITION) || "1";
      return oneBasedIndex ? at : `${at} + 1`;
    }
    const at = generator.valueToCode(block, atId, Order.SUBTRACTION) || "1";
    if (oneBasedIndex) {
      return at === "1" ? `${text}.length` : `${text}.length - ${at} + 1`;
    }
    return `${text}.length - ${at}`;
  }

  let start;
  switch (where1) {
    case "FROM_START":
    case "FROM_END":
      start = getStart(where1, "AT1");
      break;
    case "FIRST":
      start = "0";
      break;
  }

  let end;
  switch (where2) {
    case "FROM_START":
    case "FROM_END":
      end = getEnd(where2, "AT2");
      break;
    case "LAST":
      end = `${text}.length`;
      break;
  }

  return [`${text}.slice(${start}, ${end})`, Order.MEMBER];
};
