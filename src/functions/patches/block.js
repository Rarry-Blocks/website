import * as Blockly from "blockly";

export class DuplicateOnDrag {
  constructor(block) {
    this.block = block;
  }

  isMovable() {
    return true;
  }

  startDrag(e) {
    if (!this.block.isShadow()) {
      this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.block);
      this.block.setDragStrategy(this.baseStrat);
      this.baseStrat.startDrag(e);
      return;
    }

    const ws = this.block.workspace;
    const data = this.block.toCopyData();

    if (this.block.saveExtraState)
      data.blockState.extraState = this.block.saveExtraState();

    this.copy = Blockly.clipboard.paste(data, ws);
    this.copy.setShadow(false);

    this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.copy);
    this.copy.setDragStrategy(this.baseStrat);
    this.baseStrat.startDrag(e);
  }

  drag(e) {
    if (!this.copy) {
      this.baseStrat?.drag(e);
      return;
    }
    this.block.workspace.getGesture(e).getCurrentDragger().setDraggable(this.copy);
    this.baseStrat.drag(e);
  }

  endDrag(e) {
    this.baseStrat?.endDrag(e);
  }

  revertDrag() {
    if (!this.copy) {
      this.baseStrat?.revertDrag();
      return;
    }
    this.copy?.dispose();
  }
}

Blockly.Block.prototype.duplicateOnDrag_ = false;

Blockly.Block.prototype.setDuplicateOnDrag = function (value) {
  this.duplicateOnDrag_ = value;
  if (value) {
    this.setDragStrategy(new DuplicateOnDrag(this));
  }
};

Blockly.Block.prototype.canDuplicateOnDrag = function () {
  return this.duplicateOnDrag_ && this.isShadow();
};

const ogJsonInit = Blockly.Block.prototype.jsonInit;
Blockly.Block.prototype.jsonInit = function (json) {
  if (json["duplicateOnDrag"] !== undefined) {
    this.setDuplicateOnDrag(json["duplicateOnDrag"]);
  }
  ogJsonInit.call(this, json);
};
