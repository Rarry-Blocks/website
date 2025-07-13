const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."abcdefghijklmnopqrstuvwxyz0123456789".toUpperCase(),
];

Blockly.Blocks["key_pressed"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("is")
      .appendField(
        new Blockly.FieldDropdown([
          ["any", "any"],
          ["space", " "],
          ["enter", "Enter"],
          ["escape", "Escape"],
          ["up arrow", "ArrowUp"],
          ["down arrow", "ArrowDown"],
          ["left arrow", "ArrowLeft"],
          ["right arrow", "ArrowRight"],
          ...normalKeys.map((i) => [i, i]),
        ]),
        "KEY"
      )
      .appendField("key down?");
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

Blockly.Blocks["mouse_button_pressed"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("is")
      .appendField(
        new Blockly.FieldDropdown([
          ["left", "0"],
          ["middle", "1"],
          ["right", "2"],
          ["back", "3"],
          ["forward", "4"],
          ["any", "any"],
        ]),
        "BUTTON"
      )
      .appendField("mouse button down?");
    this.setOutput(true, "Boolean");
    this.setColour("#5CB1D6");
  },
};

Blockly.Blocks["all_keys_pressed"] = {
  init: function () {
    this.appendDummyInput().appendField("keys currently down");
    this.setOutput(true, "Array");
    this.setColour("#5CB1D6");
  },
};

Blockly.Blocks["mouse_over"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("is cursor over me?");
    this.setOutput(true, "Boolean");
    this.setColour("#5CB1D6");
  },
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

Blockly.JavaScript.forBlock["mouse_button_pressed"] = function (
  block,
  generator
) {
  const button = block.getFieldValue("BUTTON");
  const safeButton = generator.quote_(button);
  return [`isMouseButtonPressed(${safeButton})`, Blockly.JavaScript.ORDER_NONE];
};

Blockly.JavaScript.forBlock["all_keys_pressed"] = () => [
  "Object.keys(keysPressed).filter(k => keysPressed[k])",
  Blockly.JavaScript.ORDER_NONE,
];

Blockly.JavaScript.forBlock["mouse_over"] = () => [
  "isMouseTouchingSprite()",
  Blockly.JavaScript.ORDER_NONE,
];