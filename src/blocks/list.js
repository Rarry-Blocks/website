import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

Blockly.Blocks['lists_filter'] = {
  init: function () {
    this.appendValueInput('list').setCheck('Array').appendField('filter list');
    this.appendValueInput('method').setCheck('Boolean').appendField('by');
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.setStyle("list_blocks");
    this.setTooltip(
      "Remove all items in a list which doesn't match the boolean"
    );
  },
};

BlocklyJS.javascriptGenerator.forBlock['lists_filter'] = function (block, generator) {
  var val_list = generator.valueToCode(block, 'list', BlocklyJS.Order.ATOMIC);
  var val_method = generator.valueToCode(block, 'method', BlocklyJS.Order.ATOMIC);
  var code = `${val_list}.filter(findOrFilterItem => ${val_method})`;
  return [code, BlocklyJS.Order.NONE];
};

Blockly.Blocks['lists_find'] = {
  init: function () {
    this.appendValueInput('list').setCheck('Array').appendField('in list');
    this.appendValueInput('method').setCheck('Boolean').appendField('find first that matches');
    this.setOutput(true, null);
    this.setInputsInline(true);
    this.setStyle("list_blocks");
    this.setTooltip(
      "Returns the first item in a list that matches the boolean"
    );
  },
};

BlocklyJS.javascriptGenerator.forBlock['lists_find'] = function (block, generator) {
  var val_list = generator.valueToCode(block, 'list', BlocklyJS.Order.ATOMIC);
  var val_method = generator.valueToCode(block, 'method', BlocklyJS.Order.ATOMIC);
  var code = `${val_list}.find(findOrFilterItem => ${val_method})`;
  return [code, BlocklyJS.Order.NONE];
};

Blockly.Blocks['lists_filter_item'] = {
  init: function () {
    this.appendDummyInput('name').appendField('item in loop');
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("list_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock['lists_filter_item'] = () => [
  'findOrFilterItem',
  BlocklyJS.Order.NONE,
];

Blockly.Blocks['lists_merge'] = {
  init: function () {
    this.appendValueInput('list').setCheck('Array').appendField('merge list');
    this.appendValueInput('list2').setCheck('Array').appendField('with');
    this.setInputsInline(true);
    this.setOutput(true, 'Array');
    this.setStyle("list_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock['lists_merge'] = function (block, generator) {
  const val_list = generator.valueToCode(block, 'list', BlocklyJS.Order.ATOMIC);
  const val_list2 = generator.valueToCode(block, 'list2', BlocklyJS.Order.ATOMIC);
  const code = `${val_list}.concat(${val_list2})`;
  return [code, BlocklyJS.Order.NONE];
};

Blockly.Blocks['lists_foreach'] = {
  init: function () {
    this.appendValueInput('LIST')
      .setCheck('Array')
      .appendField('for each item in list');
    this.appendStatementInput('DO')
      .appendField('do');
    this.setInputsInline(false);
    this.setPreviousStatement(true, null);
    this.setNextStatement(true, null);
    this.setStyle("list_blocks");
    this.setTooltip("Loops through every item in a list and runs the code inside for each one");
  },
};

BlocklyJS.javascriptGenerator.forBlock['lists_foreach'] = function (block, generator) {
  const list = generator.valueToCode(block, 'LIST', BlocklyJS.Order.NONE) || '[]';
  const branch = generator.statementToCode(block, 'DO');
  const code = `${list}.forEach(findOrFilterItem => {\n${branch}});\n`;
  return code;
};