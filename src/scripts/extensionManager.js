import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { activeExtensions } from "./editor";
import { Thread } from "./threads";

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
    const validTypes = ["String", "Number", "Boolean", "Array", "Object", null];

    const inputType = fields?.[inputName]?.type;
    const checkType = validTypes.includes(inputType) ? inputType : null;

    block.appendValueInput(inputName).setCheck(checkType);

    lastIndex = regex.lastIndex;
  }

  const after = text.slice(lastIndex);
  if (after) {
    block.appendDummyInput().appendField(after.trim());
  }
}

export function registerExtension(extClass) {
  const ext = new extClass();
  const id = ext.id || ext.constructor.name;

  if (activeExtensions.includes(id)) {
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
  blocks.forEach((blockDef) => {
    if (!blockDef.id) {
      console.warn("Skipped registration of block with no ID");
      return;
    }

    const blockType = `${id}_${blockDef.id}`;

    Blockly.Blocks[blockType] = {
      init: function () {
        textToBlock(this, blockDef.text, blockDef.fields);

        if (blockDef.type === "statement") {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        } else if (blockDef.type === "output") {
          this.setOutput(true, null);
        }
        if (blockDef.tooltip) this.setTooltip(blockDef.tooltip);
        this.setInputsInline(true);
        this.setColour(blockDef?.color || category.color);
      },
    };

    if (categoryEl) {
      const blockEl = document.createElement("block");
      blockEl.setAttribute("type", blockType);

      for (const [name, spec] of Object.entries(blockDef.fields || {})) {
        if (spec.default !== undefined) {
          const valueEl = document.createElement("value");
          valueEl.setAttribute("name", name.trim());

          const shadowEl = document.createElement("shadow");
          shadowEl.setAttribute(
            "type",
            spec.type === "Number" ? "math_number" : "text"
          );

          const fieldEl = document.createElement("field");
          fieldEl.setAttribute("name", spec.type === "Number" ? "NUM" : "TEXT");
          fieldEl.textContent = spec.default;

          shadowEl.appendChild(fieldEl);
          valueEl.appendChild(shadowEl);
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
  window.extensions = window.extensions || [];
  window.extensions[id] = {};

  Object.entries(codeGen).forEach(([blockType, fn]) => {
    const fullType = `${id}_${blockType}`;

    window.extensions[fullType] = fn;
    BlocklyJS.javascriptGenerator.forBlock[fullType] = function (block) {
      const inputs = {};
      for (const input of block.inputList) {
        const name = input.name;
        const codeExpr =
          BlocklyJS.javascriptGenerator.valueToCode(
            block,
            name,
            BlocklyJS.Order.ATOMIC
          ) || "null";
        inputs[name] = codeExpr;
      }

      const argsParts = Object.entries(inputs).map(
        ([k, v]) => `${JSON.stringify(k)}: ${v}`
      );
      const args = `{ ${argsParts.join(", ")} }`;
      const callCode = `extensions["${fullType}"](${args}, Thread.getCurrentContext())`;

      if (block.outputConnection) return [callCode, BlocklyJS.Order.NONE];
      else return callCode + ";\n";
    };
  });

  activeExtensions.push(id);
}
