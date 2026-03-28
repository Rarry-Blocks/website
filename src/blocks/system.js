import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { spriteManager } from "../scripts/editor";

const normalKeys = [
  ..."abcdefghijklmnopqrstuvwxyz",
  ..."abcdefghijklmnopqrstuvwxyz0123456789".toUpperCase(),
];

Blockly.Blocks["system_sprites_menu"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown(() => {
        const sprites = spriteManager.getOriginals();
        return sprites.length < 1
          ? [["No sprites.", ""]]
          : sprites.map(i => [i.name, i.id]);
      }),
      "MENU",
    );
    this.setOutput(true, "String");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["system_sprites_menu"] = function (
  block,
  generator,
) {
  return [generator.quote_(block.getFieldValue("MENU")), BlocklyJS.Order.ATOMIC];
};

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
          ...normalKeys.map(i => [i, i]),
        ]),
        "KEY",
      )
      .appendField("key down");
    this.setOutput(true, "Boolean");
    this.setStyle("system_blocks");
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
        "MENU",
      );
    this.setOutput(true, "Number");
    this.setStyle("system_blocks");
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
        "BUTTON",
      )
      .appendField("mouse button down");
    this.setOutput(true, "Boolean");
    this.setStyle("system_blocks");
  },
};

Blockly.Blocks["all_keys_pressed"] = {
  init: function () {
    this.appendDummyInput().appendField("keys currently down");
    this.setOutput(true, "Array");
    this.setStyle("system_blocks");
  },
};

Blockly.Blocks["mouse_over"] = {
  init: function () {
    this.appendDummyInput().appendField("is cursor over me");
    this.setOutput(true, "Boolean");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["key_pressed"] = function (block, generator) {
  const key = block.getFieldValue("KEY");
  const safeKey = generator.quote_(key);
  return [`isKeyPressed(${safeKey})`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["get_mouse_position"] = function (block) {
  const menu = block.getFieldValue("MENU");
  return [`getMousePosition("${menu}")`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["mouse_button_pressed"] = function (
  block,
  generator,
) {
  const button = block.getFieldValue("BUTTON");
  const safeButton = generator.quote_(button);
  return [`isMouseButtonPressed(${safeButton})`, BlocklyJS.Order.NONE];
};

BlocklyJS.javascriptGenerator.forBlock["all_keys_pressed"] = () => [
  "Object.keys(keysPressed).filter(k => keysPressed[k])",
  BlocklyJS.Order.NONE,
];

BlocklyJS.javascriptGenerator.forBlock["mouse_over"] = () => [
  "isMouseTouchingSprite()",
  BlocklyJS.Order.NONE,
];

Blockly.Blocks["window_size"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("window")
      .appendField(
        new Blockly.FieldDropdown([
          ["width", "width"],
          ["height", "height"],
        ]),
        "MENU",
      );
    this.setOutput(true, "Number");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["window_size"] = function (block) {
  return [
    `window.inner${block.getFieldValue("MENU") === "width" ? "Width" : "Height"}`,
    BlocklyJS.Order.NONE,
  ];
};

Blockly.Blocks["system_current_time"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("current")
      .appendField(
        new Blockly.FieldDropdown([
          ["year", "year"],
          ["month", "month"],
          ["date", "date"],
          ["day of week", "day"],
          ["hour", "hour"],
          ["minute", "minute"],
          ["second", "second"],
          ["millisecond", "millisecond"],
          ["timestamp", "timestamp"],
        ]),
        "UNIT",
      );
    this.setOutput(true, "Number");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["system_current_time"] = function (block) {
  const getResult = () => {
    const unit = block.getFieldValue("UNIT");
    switch (unit) {
      case "year":
        return "new Date().getFullYear()";
      case "month":
        return "new Date().getMonth() + 1";
      case "date":
        return "new Date().getDate()";
      case "day":
        return "new Date().getDay()";
      case "hour":
        return "new Date().getHours()";
      case "minute":
        return "new Date().getMinutes()";
      case "second":
        return "new Date().getSeconds()";
      case "millisecond":
        return "new Date().getMilliseconds()";
      case "timestamp":
        return "Date.now()";
      default:
        return "0";
    }
  };
  return [getResult(), BlocklyJS.Order.NONE];
};

Blockly.Blocks["system_distance_direction"] = {
  init: function () {
    this.appendDummyInput().appendField(
      new Blockly.FieldDropdown([
        ["distance", "distance"],
        ["direction", "direction"],
      ]),
      "MODE",
    );
    this.appendValueInput("X1").setCheck("Number").appendField("from");
    this.appendValueInput("Y1").setCheck("Number");
    this.appendValueInput("X2").setCheck("Number").appendField("to");
    this.appendValueInput("Y2").setCheck("Number");
    this.setInputsInline(true);
    this.setOutput(true, "Number");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["system_distance_direction"] = function (
  block,
  generator,
) {
  const mode = block.getFieldValue("MODE");
  const x1 = generator.valueToCode(block, "X1", BlocklyJS.Order.NONE) || "0";
  const y1 = generator.valueToCode(block, "Y1", BlocklyJS.Order.NONE) || "0";
  const x2 = generator.valueToCode(block, "X2", BlocklyJS.Order.NONE) || "0";
  const y2 = generator.valueToCode(block, "Y2", BlocklyJS.Order.NONE) || "0";

  if (mode === "distance") {
    return [
      `Math.sqrt(Math.pow(${x2} - ${x1}, 2) + Math.pow(${y2} - ${y1}, 2))`,
      BlocklyJS.Order.NONE,
    ];
  } else {
    return [
      `((Math.atan2(${x2} - ${x1}, ${y2} - ${y1}) * 180 / Math.PI + 360) % 360)`,
      BlocklyJS.Order.NONE,
    ];
  }
};

// Used to be in controls
Blockly.Blocks["controls_clones_list"] = {
  init: function () {
    this.appendValueInput("ID").setCheck("String").appendField("list clones of");
    this.setOutput(true, "Array");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["controls_clones_list"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.ATOMIC);
  return [`spriteManager.get(${ID})?.getAllClones()`, BlocklyJS.Order.NONE];
};

Blockly.Blocks["system_sprites_list"] = {
  init: function () {
    this.appendDummyInput()
      .appendField("list all")
      .appendField(
        new Blockly.FieldDropdown([
          ["sprites", "SPRITES"],
          ["sprites and clones", "ALL"],
        ]),
        "TYPE",
      );
    this.setOutput(true, "Array");
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["system_sprites_list"] = function (block) {
  const TYPE = block.getFieldValue("TYPE");

  let code = "new Array()";
  if (TYPE === "SPRITES") {
    code = "spriteManager.getOriginals()";
  } else {
    code = "spriteManager.getAll()";
  }

  return [code, BlocklyJS.Order.NONE];
};

Blockly.Blocks["system_sprite_property"] = {
  init: function () {
    this.appendValueInput("ID")
      .setCheck("String")
      .appendField(
        new Blockly.FieldDropdown([
          ["name", "name"],
          ["id", "id"],
          ["x", "pixiSprite.x"],
          ["y", "pixiSprite.y"],
          ["scale", "pixiSprite.scale.x"],
          ["rotation", "pixiSprite.rotation"],
          ["current costume", "currentCostume"],
          ["costumes", "costumes"],
          ["sounds", "sounds"],
          ["code", "code"],
        ]),
        "PROP",
      )
      .appendField("of");
    this.setInputsInline(true);
    this.setOutput(true, null);
    this.setStyle("system_blocks");
  },
};

BlocklyJS.javascriptGenerator.forBlock["system_sprite_property"] = function (
  block,
  generator,
) {
  const ID = generator.valueToCode(block, "ID", BlocklyJS.Order.NONE);
  const PROP = block.getFieldValue("PROP");
  return [`spriteManager.get(${ID})?.${PROP}`, BlocklyJS.Order.NONE];
};
