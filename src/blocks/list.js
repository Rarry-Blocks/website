import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
const xmlUtils = Blockly.utils.xml;

Blockly.Blocks["lists_has"] = {
  init: function () {
    this.appendValueInput("LIST").setCheck("Array").appendField("does list");
    this.appendValueInput("VALUE").setCheck(null).appendField("have");
    this.setOutput(true, "Boolean");
    this.setInputsInline(true);
    this.setStyle("list_blocks");
    this.setTooltip("Returns true if the list contains the value.");
  },
};

javascriptGenerator.forBlock["lists_has"] = function (
  block,
  generator
) {
  const list = generator.valueToCode(block, "LIST", Order.ATOMIC) || "new Array()";
  const value = generator.valueToCode(block, "VALUE", Order.ATOMIC);
  return [`${list}.includes(${value})`, Order.NONE];
};

Blockly.Blocks["lists_extendable"] = {
  init: function () {
    this.setInputsInline(true);
    this.setOutput(true, "Array");
    this.setStyle("list_blocks");

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
    if (this.getInput("ARROWS")) this.removeInput("ARROWS");
    if (this.getInput("EMPTY")) this.removeInput("EMPTY");

    if (this.itemCount_ === 0) {
      this.appendDummyInput("EMPTY").appendField("create empty list");
    } else {
      for (let i = 0; i < this.itemCount_; i++) {
        let input = this.getInput("ADD" + i);

        if (!input) {
          const shadow = document.createElement("shadow");
          shadow.setAttribute("type", "text");

          const field = document.createElement("field");
          field.setAttribute("name", "TEXT");
          field.textContent = this.messageList[i] || "..";
          shadow.append(field);

          input = this.appendValueInput("ADD" + i);
          input.setAlign(Blockly.inputs.Align.RIGHT);
          input.connection.setShadowDom(shadow);
        }

        if (i === 0) {
          if (!input.fieldRow.length) {
            input.appendField("create list with");
          }
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
    if (this.itemCount_ < 1) return;
    this.itemCount_--;
    this.updateShape_();
  },
};

javascriptGenerator.forBlock["lists_extendable"] = function (block, generator) {
  const parts = [];

  for (let i = 0; i < block.itemCount_; i++) {
    const value = generator.valueToCode(block, "ADD" + i, Order.NONE) || "''";
    parts.push(value);
  }

  return [`[${parts.join(", ")}]`, Order.NONE];
};

Blockly.Blocks["lists_filter"] = {
  init: function () {
    this.appendValueInput("list").setCheck("Array").appendField("filter list");
    this.appendValueInput("item").appendField("by");
    this.appendValueInput("method").setCheck("Boolean").appendField("⇒");
    this.setInputsInline(true);
    this.setOutput(true, "Array");
    this.setStyle("list_blocks");
    this.setTooltip(
      "Remove all items in a list which doesn't match the boolean"
    );
  },
};

javascriptGenerator.forBlock["lists_filter"] = function (
  block,
  generator
) {
  const list = generator.valueToCode(block, "list", Order.ATOMIC);
  const method = generator.valueToCode(
    block,
    "method",
    Order.ATOMIC
  );
  const code = `${list}.filter(async (findOrFilterItem) => ${method})`;
  return [code, Order.NONE];
};

Blockly.Blocks["lists_find"] = {
  init: function () {
    this.appendValueInput("list").setCheck("Array").appendField("in list");
    this.appendValueInput("item").appendField("find first");
    this.appendValueInput("method")
      .setCheck("Boolean")
      .appendField("that matches");
    this.setOutput(true, null);
    this.setInputsInline(true);
    this.setStyle("list_blocks");
    this.setTooltip(
      "Returns the first item in a list that matches the boolean"
    );
  },
};

javascriptGenerator.forBlock["lists_find"] = function (
  block,
  generator
) {
  const list = generator.valueToCode(block, "list", Order.ATOMIC);
  const method = generator.valueToCode(
    block,
    "method",
    Order.ATOMIC
  );
  const code = `${list}.find(findOrFilterItem => ${method})`;
  return [code, Order.NONE];
};

Blockly.Blocks["lists_map"] = {
  init: function () {
    this.appendValueInput("list").setCheck("Array").appendField("map list");
    this.appendValueInput("item").appendField("by");
    this.appendValueInput("method").setCheck(null).appendField("⇒");
    this.setOutput(true, "Array");
    this.setInputsInline(true);
    this.setStyle("list_blocks");
  },
};

javascriptGenerator.forBlock["lists_map"] = function (
  block,
  generator
) {
  const list = generator.valueToCode(block, "list", Order.ATOMIC);
  const method = generator.valueToCode(block, "method", Order.ATOMIC);
  const code = `${list}.map(findOrFilterItem => ${method})`;
  return [code, Order.NONE];
};

Blockly.Blocks["lists_filter_item"] = {
  init: function () {
    this.appendDummyInput("name").appendField("item");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setDuplicateOnDrag(true);
    this.setStyle("list_blocks");
  },
};

javascriptGenerator.forBlock["lists_filter_item"] = () => [
  "findOrFilterItem",
  Order.NONE,
];

Blockly.Blocks["lists_merge"] = {
  init: function () {
    this.appendValueInput("list").setCheck("Array").appendField("merge list");
    this.appendValueInput("list2").setCheck("Array").appendField("with");
    this.setInputsInline(true);
    this.setOutput(true, "Array");
    this.setStyle("list_blocks");
  },
};

javascriptGenerator.forBlock["lists_merge"] = function (
  block,
  generator
) {
  const list = generator.valueToCode(block, "list", Order.ATOMIC);
  const list2 = generator.valueToCode(
    block,
    "list2",
    Order.ATOMIC
  );
  const code = `${list}.concat(${list2})`;
  return [code, Order.NONE];
};

Blockly.Blocks["lists_foreach"] = {
  init: function () {
    this.appendValueInput("ITEM").appendField("for each");
    this.appendValueInput("INDEX");
    this.appendValueInput("LIST")
      .setCheck("Array")
      .appendField("in list");
    this.appendStatementInput("DO").appendField("do");
    this.setInputsInline(true);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle("list_blocks");
    this.setTooltip(
      "Loops through every item in a list and runs the code inside for each one."
    );
  },
};

javascriptGenerator.forBlock["lists_foreach"] = function (
  block,
  generator
) {
  const list =
    generator.valueToCode(block, "LIST", Order.NONE) || "[]";
  const branch = generator.statementToCode(block, "DO");
  const code = `${list}.forEach(async (findOrFilterItem, indexForEach) => {\n${branch}});\n`;
  return code;
};

Blockly.Blocks["lists_foreach_index"] = {
  init: function () {
    this.appendDummyInput("name").appendField("index");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setDuplicateOnDrag(true);
    this.setStyle("list_blocks");
  },
};

javascriptGenerator.forBlock["lists_foreach_index"] = () => [
  "indexForEach",
  Order.NONE,
];

Blockly.Blocks["lists_getIndex_modified"] = {
  init: function () {
    const MODE_OPTIONS = [
      [Blockly.Msg.LISTS_GET_INDEX_GET, "GET"],
      [Blockly.Msg.LISTS_GET_INDEX_REMOVE, "REMOVE"],
    ];
    this.WHERE_OPTIONS = [
      [Blockly.Msg.LISTS_GET_INDEX_FROM_START, "FROM_START"],
      [Blockly.Msg.LISTS_GET_INDEX_FROM_END, "FROM_END"],
      [Blockly.Msg.LISTS_GET_INDEX_FIRST, "FIRST"],
      [Blockly.Msg.LISTS_GET_INDEX_LAST, "LAST"],
      [Blockly.Msg.LISTS_GET_INDEX_RANDOM, "RANDOM"],
    ];

    this.setHelpUrl(Blockly.Msg.LISTS_GET_INDEX_HELPURL);
    this.setStyle("list_blocks");

    this.appendValueInput("VALUE")
      .setCheck("Array")
      .appendField(Blockly.Msg.LISTS_GET_INDEX_INPUT_IN_LIST);

    const modeField = new Blockly.FieldDropdown(MODE_OPTIONS, newMode => {
      this.updateMode_(newMode);
      return newMode;
    });
    this.appendDummyInput()
      .appendField(modeField, "MODE")
      .appendField("", "SPACE");

    const whereField = new Blockly.FieldDropdown(
      this.WHERE_OPTIONS,
      newWhere => {
        const cur = this.getFieldValue("WHERE");
        const newNeedsAt = newWhere === "FROM_START" || newWhere === "FROM_END";
        const curNeedsAt = cur === "FROM_START" || cur === "FROM_END";
        if (newNeedsAt !== curNeedsAt) this.updateAt_(newNeedsAt);
      }
    );
    this.appendDummyInput().appendField(whereField, "WHERE");

    this.appendDummyInput("AT");

    this.setInputsInline(true);

    this.updateAt_(true);
    this.updateMode_(this.getFieldValue("MODE") || "GET");

    this.setTooltip(() => {
      const mode = this.getFieldValue("MODE");
      const where = this.getFieldValue("WHERE");
      if (mode === "GET") {
        switch (where) {
          case "FROM_START":
          case "FROM_END":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_GET_FROM;
          case "FIRST":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_GET_FIRST;
          case "LAST":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_GET_LAST;
          case "RANDOM":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_GET_RANDOM;
        }
      } else {
        switch (where) {
          case "FROM_START":
          case "FROM_END":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_REMOVE_FROM;
          case "FIRST":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_REMOVE_FIRST;
          case "LAST":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_REMOVE_LAST;
          case "RANDOM":
            return Blockly.Msg.LISTS_GET_INDEX_TOOLTIP_REMOVE_RANDOM;
        }
      }
      return "";
    });
  },

  mutationToDom: function () {
    const container = document.createElement("mutation");
    const input = this.getInput("AT");
    const isValueInput = !!input && !!input.connection;
    container.setAttribute("at", String(isValueInput));
    container.setAttribute("mode", this.getFieldValue("MODE") || "GET");
    return container;
  },

  domToMutation: function (xmlElement) {
    const at = xmlElement.getAttribute("at") !== "false";
    const mode = xmlElement.getAttribute("mode") || "GET";
    this.updateAt_(at);
    this.updateMode_(mode);
  },

  updateAt_: function (useValueInput) {
    if (this.getInput("AT")) this.removeInput("AT", true);
    if (this.getInput("ORDINAL")) this.removeInput("ORDINAL", true);

    if (useValueInput) {
      this.appendValueInput("AT").setCheck("Number");
      if (Blockly.Msg.ORDINAL_NUMBER_SUFFIX) {
        this.appendDummyInput("ORDINAL").appendField(
          Blockly.Msg.ORDINAL_NUMBER_SUFFIX
        );
      }
    } else {
      this.appendDummyInput("AT");
    }
  },

  updateMode_: function (mode) {
    if (mode === "GET") {
      if (!this.outputConnection) this.setOutput(true);
      this.outputConnection.setCheck(null);
    } else {
      if (!this.outputConnection) this.setOutput(true);
      this.outputConnection.setCheck("Array");
    }
  },
};

javascriptGenerator.forBlock["lists_getIndex_modified"] = function (
  block,
  generator
) {
  const workspaceOneBased =
    block.workspace.options && block.workspace.options.oneBasedIndex;
  const mode = block.getFieldValue("MODE");
  const where = block.getFieldValue("WHERE");

  const listCode =
    generator.valueToCode(block, "VALUE", Order.NONE) || "[]";
  const atCodeRaw =
    generator.valueToCode(block, "AT", Order.NONE) || "0";

  let i;

  switch (where) {
    case "FIRST":
      i = "0";
      break;
    case "LAST":
      i = "-1";
      break;
    case "RANDOM":
      i = `Math.floor(Math.random() * _.length)`;
      break;
    case "FROM_START":
      i = workspaceOneBased ? `${atCodeRaw} - 1` : atCodeRaw;
      break;
    case "FROM_END":
      i = workspaceOneBased ? `-${atCodeRaw}` : `-(${atCodeRaw} + 1)`;
      break;
    default:
      i = "0";
  }

  return [
    mode === "REMOVE"
      ? `${listCode}.toSpliced(${i}, 1)`
      : `${listCode}.at(${i})`,
    Order.FUNCTION_CALL,
  ];
};

Blockly.Blocks["lists_setIndex_modified"] = {
  init: function () {
    const MODE_OPTIONS = [
      [Blockly.Msg.LISTS_SET_INDEX_SET, "SET"],
      [Blockly.Msg.LISTS_SET_INDEX_INSERT, "INSERT"],
    ];
    this.WHERE_OPTIONS = [
      [Blockly.Msg.LISTS_GET_INDEX_FROM_START, "FROM_START"],
      [Blockly.Msg.LISTS_GET_INDEX_FROM_END, "FROM_END"],
      [Blockly.Msg.LISTS_GET_INDEX_FIRST, "FIRST"],
      [Blockly.Msg.LISTS_GET_INDEX_LAST, "LAST"],
      [Blockly.Msg.LISTS_GET_INDEX_RANDOM, "RANDOM"],
    ];

    this.setHelpUrl(Blockly.Msg.LISTS_SET_INDEX_HELPURL);
    this.setStyle("list_blocks");

    this.appendValueInput("LIST")
      .setCheck("Array")
      .appendField(Blockly.Msg.LISTS_SET_INDEX_INPUT_IN_LIST);

    const modeField = new Blockly.FieldDropdown(MODE_OPTIONS);
    this.appendDummyInput()
      .appendField(modeField, "MODE")
      .appendField("", "SPACE");

    const whereField = new Blockly.FieldDropdown(
      this.WHERE_OPTIONS,
      newWhere => {
        this.updateAt_(newWhere === "FROM_START" || newWhere === "FROM_END");
        return newWhere;
      }
    );
    this.appendDummyInput().appendField(whereField, "WHERE");
    this.appendDummyInput("AT");
    this.appendValueInput("TO").appendField(
      Blockly.Msg.LISTS_SET_INDEX_INPUT_TO
    );

    this.setInputsInline(true);
    this.setOutput(true, "Array");
    this.updateAt_(true);
    this.setTooltip(() => {
      const mode = this.getFieldValue("MODE");
      const where = this.getFieldValue("WHERE");
      if (mode === "SET") {
        switch (where) {
          case "FROM_START":
          case "FROM_END":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_SET_FROM;
          case "FIRST":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_SET_FIRST;
          case "LAST":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_SET_LAST;
          case "RANDOM":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_SET_RANDOM;
        }
      } else {
        switch (where) {
          case "FROM_START":
          case "FROM_END":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_INSERT_FROM;
          case "FIRST":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_INSERT_FIRST;
          case "LAST":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_INSERT_LAST;
          case "RANDOM":
            return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP_INSERT_RANDOM;
        }
      }
      return Blockly.Msg.LISTS_SET_INDEX_TOOLTIP;
    });
  },

  mutationToDom: function () {
    const container = document.createElement("mutation");
    const input = this.getInput("AT");
    const isValueInput = !!input && !!input.connection;
    container.setAttribute("at", String(isValueInput));
    return container;
  },

  domToMutation: function (xmlElement) {
    const at = xmlElement.getAttribute("at") !== "false";
    this.updateAt_(at);
  },

  updateAt_: function (useValueInput) {
    if (this.getInput("AT")) this.removeInput("AT", true);
    if (this.getInput("ORDINAL")) this.removeInput("ORDINAL", true);

    if (useValueInput) {
      this.appendValueInput("AT").setCheck("Number");
      if (Blockly.Msg.ORDINAL_NUMBER_SUFFIX) {
        this.appendDummyInput("ORDINAL").appendField(
          Blockly.Msg.ORDINAL_NUMBER_SUFFIX
        );
      }
    } else {
      this.appendDummyInput("AT");
    }
    try {
      this.moveInputBefore("AT", "TO");
      if (this.getInput("ORDINAL")) this.moveInputBefore("ORDINAL", "TO");
    } catch (e) { }
  },
};

javascriptGenerator.forBlock["lists_setIndex_modified"] = function (
  block,
  generator
) {
  const oneBased = block.workspace.options?.oneBasedIndex;
  const mode = block.getFieldValue("MODE");
  const where = block.getFieldValue("WHERE");

  const listCode =
    generator.valueToCode(block, "LIST", Order.NONE) || "[]";
  const valueCode =
    generator.valueToCode(block, "TO", Order.NONE) || "undefined";
  const atCode =
    generator.valueToCode(block, "AT", Order.NONE) || "0";

  let indexExpr;
  switch (where) {
    case "FIRST":
      indexExpr = "0";
      break;
    case "LAST":
      indexExpr = "-1";
      break;
    case "RANDOM":
      indexExpr = "Math.floor(Math.random() * _.length)";
      break;
    case "FROM_START":
      indexExpr = oneBased ? `(${atCode} - 1)` : atCode;
      break;
    case "FROM_END":
      indexExpr = oneBased ? `-${atCode}` : `-(${atCode} + 1)`;
      break;
    default:
      indexExpr = "0";
  }

  const code = `((a) => {
  const _ = [...a];
  let i = ${indexExpr};
  if (i < 0) i += _.length;
  if (i < 0) i = 0;
  if (i > _.length) i = _.length;
  return ${mode === "INSERT"
      ? `_.toSpliced(i, 0, ${valueCode})`
      : `i < _.length ? _.toSpliced(i, 1, ${valueCode}) : _`
    };
})(${listCode})`;

  return [code, Order.FUNCTION_CALL];
};
