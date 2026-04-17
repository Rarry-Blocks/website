import * as Blockly from "blockly/core";

class TheDragger extends Blockly.dragging.Dragger {
  setDraggable(draggable) {
    this.draggable = draggable;
  }
}

Blockly.registry.register(
  Blockly.registry.Type.BLOCK_DRAGGER,
  Blockly.registry.DEFAULT,
  TheDragger,
  true,
);
