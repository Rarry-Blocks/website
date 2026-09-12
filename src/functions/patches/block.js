import * as Blockly from "blockly/core";

export class DuplicateOnDrag {
  constructor(block) {
    /** @type {Blockly.BlockSvg} */
    this.block = block;
  }

  isMovable() {
    return true;
  }

  startDrag(e) {
    if (!this.block.isShadow()) {
      this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.block);
      this.block.setDragStrategy(this.baseStrat);
      return this.baseStrat.startDrag(e);
    }

    const ws = this.block.workspace;
    const data = this.block.toCopyData();

    if (this.block.saveExtraState)
      data.blockState.extraState = this.block.saveExtraState();

    // Special case for function statement argument.
    if (
      this.block.type === "functions_argument_block" &&
      this.block.argType_ === "statement"
    ) {
      data.blockState.type = "functions_statement_argument_block";
    }

    this.copy = Blockly.clipboard.paste(data, ws);
    this.copy.setShadow(false);

    this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.copy);
    this.copy.setDragStrategy(this.baseStrat);
    return this.baseStrat.startDrag(e);
  }

  drag(newLoc, e) {
    if (!this.copy) {
      this.baseStrat?.drag(newLoc, e);
      return;
    }
    this.baseStrat.drag(newLoc, e);
  }

  endDrag(e, disposition) {
    this.baseStrat?.endDrag(e, disposition);
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
  if (!this.setDragStrategy) return;

  this.duplicateOnDrag_ = value;
  if (value === true) {
    this.setDragStrategy(new DuplicateOnDrag(this));
  } else {
    this.setDragStrategy(new Blockly.dragging.BlockDragStrategy(this));
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

Blockly.Block.prototype.isOnlyField = function (field) {
  for (var i = 0; i < this.inputList.length; i++) {
    var input = this.inputList[i];
    if (!(input instanceof Blockly.inputs.DummyInput)) {
      return false;
    }
    for (var j = 0; j < input.fieldRow.length; j++) {
      if (input.fieldRow[j] !== field) {
        return false;
      }
    }
  }
  return true;
};
