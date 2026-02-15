import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { activeExtensions } from "../scripts/editor";

export const extensions = {};

class DuplicateOnDrag {
  constructor(block) {
    this.block = block;
  }

  isMovable() {
    return true;
  }

  startDrag(e) {
    if (!this.block.isShadow()) return;

    const ws = this.block.workspace;
    const data = this.block.toCopyData();

    data.blockState = {
      ...(data.blockState ?? {}),
      type: this.block.type,
    };

    if (this.block.saveExtraState) {
      data.blockState.extraState = this.block.saveExtraState();
    }

    this.copy = Blockly.clipboard.paste(data, ws);
    this.copy.setShadow(false);
    this.baseStrat = new Blockly.dragging.BlockDragStrategy(this.copy);
    this.copy.setDragStrategy(this.baseStrat);
    this.baseStrat.startDrag(e);
  }

  drag(e) {
    this.block.workspace
      .getGesture(e)
      .getCurrentDragger()
      .setDraggable(this.copy);
    this.baseStrat.drag(e);
  }

  endDrag(e) {
    this.baseStrat?.endDrag(e);
  }

  revertDrag(e) {
    this.copy?.dispose();
  }
}

function textToBlock(block, text, fields) {
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text))) {
    const before = text.slice(lastIndex, match.index);
    if (before) {
      block.appendDummyInput().appendField(before.trim());
    }

    const inputName = match[1].trim();
    const spec = fields?.[inputName];

    if (spec?.kind === "statement") {
      block
        .appendStatementInput(inputName)
        .setCheck(spec?.accepts || "default");
    } else if (spec?.kind === "value") {
      block.appendValueInput(inputName).setCheck(spec?.type);
    } else if (spec?.kind === "menu") {
      const menuItems = spec.items.map((item) =>
        typeof item === "string" ? [item, item] : [item.text, item.value]
      );
      const field = new Blockly.FieldDropdown(menuItems);
      block.appendDummyInput().appendField(field, inputName);
    } else {
      block.appendDummyInput().appendField("[" + inputName + "]");
    }

    lastIndex = regex.lastIndex;
  }

  const after = text.slice(lastIndex);
  if (after) {
    block.appendDummyInput().appendField(after.trim());
  }
}

export async function registerExtension(extClass) {
  const ext = new extClass();
  const id = ext.id || ext.constructor.name;

  if (activeExtensions.some((i) => (i?.id || i) === id)) {
    console.warn(`Extension ${id} already registered`);
    return;
  }

  const coreDom = document.getElementById("toolbox");

  const category = ext.registerCategory?.();
  let categoryEl = null;
  if (category) {
    categoryEl = document.createElement("category");
    categoryEl.setAttribute("name", category.name || "Extension");
    if (!category.color) category.color = "#888";
    categoryEl.setAttribute("colour", category.color);
    if (category.iconURI) categoryEl.setAttribute("iconURI", category.iconURI);
  }

  const blocks = ext.registerBlocks?.() || [];
  const blockDefs = {};
  blocks.forEach((blockDef) => {
    if (!blockDef.id) {
      console.warn("Skipped registration of block with no ID");
      return;
    }

    const blockType = `${id}_${blockDef.id}`;
    blockDefs[blockType] = blockDef;
    Blockly.Blocks[blockType] = {
      init: function () {
        textToBlock(this, blockDef.text, blockDef.fields);

        if (blockDef.type === "statement") {
          this.setPreviousStatement(true, blockDef.statementType || "default");
          this.setNextStatement(true, blockDef.statementType || "default");
        } else if (blockDef.type === "cap") {
          this.setPreviousStatement(true, blockDef.statementType || "default");
        } else if (blockDef.type === "output") {
          this.setOutput(true, blockDef.outputType);
          if (blockDef.outputShape) this.setOutputShape(blockDef.outputShape);
        } else {
          console.warn(
            `Invalid block type for ${blockDef}, using statement instead`
          );
          this.setPreviousStatement(true, blockDef.statementType || "default");
          this.setNextStatement(true, blockDef.statementType || "default");
        }

        if (blockDef.tooltip) this.setTooltip(blockDef.tooltip);

        if (blockDef.cloneOnDrag === true)
          this.setDragStrategy(new DuplicateOnDrag(this));

        this.setColour(blockDef?.color || category.color);

        this.setInputsInline(true);
      },
    };

    if (categoryEl) {
      const blockEl = document.createElement("block");
      blockEl.setAttribute("type", blockType);

      for (const [name, spec] of Object.entries(blockDef.fields || {})) {
        if (spec?.kind === "menu") continue;

        if (spec.default !== undefined && spec?.kind !== "statement") {
          const valueEl = document.createElement("value");
          valueEl.setAttribute("name", name.trim());

          let shadowEl = null;

          if (spec.type === "Number") {
            shadowEl = document.createElement("shadow");
            shadowEl.setAttribute("type", "math_number");

            const fieldEl = document.createElement("field");
            fieldEl.setAttribute("name", "NUM");
            fieldEl.textContent = spec.default;
            shadowEl.appendChild(fieldEl);
          } else if (spec.type === "String") {
            shadowEl = document.createElement("shadow");
            shadowEl.setAttribute("type", "text");

            const fieldEl = document.createElement("field");
            fieldEl.setAttribute("name", "TEXT");
            fieldEl.textContent = spec.default;
            shadowEl.appendChild(fieldEl);
          } else if (spec.type === "Boolean") {
            shadowEl = document.createElement("shadow");
            shadowEl.setAttribute("type", "logic_boolean");

            const fieldEl = document.createElement("field");
            fieldEl.setAttribute("name", "BOOL");
            fieldEl.textContent = spec.default ? "TRUE" : "FALSE";
            shadowEl.appendChild(fieldEl);
          }

          if (shadowEl) {
            valueEl.appendChild(shadowEl);
          }

          blockEl.appendChild(valueEl);
        }
      }

      categoryEl.appendChild(blockEl);
    }
  });

  if (categoryEl) {
    coreDom.appendChild(categoryEl);
    Blockly.getMainWorkspace().updateToolbox(coreDom);
  }

  const codeGen = ext.registerCode?.() || {};
  Object.entries(codeGen).forEach(([blockType, fn]) => {
    const fullType = `${id}_${blockType}`;

    extensions[fullType] = fn;
    const def = blockDefs[fullType] || {};
    BlocklyJS.javascriptGenerator.forBlock[fullType] = function (block) {
      const inputs = {};

      for (const input of block.inputList) {
        const name = input.name;
        let codeExpr;

        if (input.type === 1 || input.type === 2) {
          codeExpr =
            BlocklyJS.javascriptGenerator.valueToCode(
              block,
              name,
              BlocklyJS.Order.ATOMIC
            ) || undefined;
          if (codeExpr !== undefined) inputs[name] = codeExpr;
        } else if (input.type === 3) {
          codeExpr =
            BlocklyJS.javascriptGenerator.statementToCode(block, name) ||
            undefined;
          if (codeExpr !== undefined)
            inputs[name] = `async () => { ${codeExpr} }`;
        }
      }

      for (const [name, spec] of Object.entries(def.fields || {})) {
        if (spec.kind === "menu") {
          const fieldVal = block.getFieldValue(name);
          if (fieldVal !== undefined) inputs[name] = JSON.stringify(fieldVal);
        }
      }

      const argsParts = Object.entries(inputs).map(
        ([k, v]) => `${JSON.stringify(k)}:${v}`
      );
      const args = `{${argsParts.join(",")}}`;
      const callCode = `extensions["${fullType}"](${args})`;

      const finalCode = def.promise ? `await ${callCode}` : callCode;

      if (block.outputConnection) return [finalCode, BlocklyJS.Order.NONE];
      else return finalCode + ";\n";
    };
  });

  activeExtensions.push({ id, code: extClass.toString() });
}
