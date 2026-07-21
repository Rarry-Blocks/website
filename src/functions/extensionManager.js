import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { activeExtensions, workspace } from "../scripts/editor";
import { DuplicateOnDrag } from "./patches/block";
import { customShapeRegistry, customNotchRegistry } from "./render";
import { ExtensionBridge } from "../components/extensions/bridge";
import {
  setPendingDescriptor,
  consumePendingDescriptor,
  createRarryGlobal
} from "./rarry";

export const extensions = {};
export const extensionBridges = new Map();

function rarryRegisterExtension(descriptor) {
  if (!descriptor || typeof descriptor !== "object") {
    throw new Error("Rarry.registerExtension expects an extension descriptor object");
  }
  if (!descriptor.id) {
    throw new Error("Extension descriptor must have an id");
  }
  setPendingDescriptor(descriptor);
}

window.Rarry = createRarryGlobal(rarryRegisterExtension);

/**
 * Parse a text template and append the
 * appropriate inputs or fields onto the block.
 */
function textToBlock(block, text, fields = {}) {
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text))) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) block.appendDummyInput().appendField(before);

    const inputName = match[1].trim();
    const spec = fields[inputName];

    if (spec?.kind === "statement") {
      block.appendStatementInput(inputName).setCheck(spec.accepts ?? "default");
    } else if (spec?.kind === "value") {
      block.appendValueInput(inputName).setCheck(spec.type ?? null);
    } else if (spec?.kind === "menu") {
      const items = spec.items.map(item =>
        typeof item === "string" ? [item, item] : [item.text, item.value]
      );
      block.appendDummyInput().appendField(new Blockly.FieldDropdown(items), inputName);
    } else {
      block.appendDummyInput().appendField(`[${inputName}]`);
    }

    lastIndex = regex.lastIndex;
  }

  const trailing = text.slice(lastIndex).trim();
  if (trailing) block.appendDummyInput().appendField(trailing);
}

/** Builds a shadow element with a default value. */
function buildShadowElement(type, defaultValue) {
  const SHADOW_CONFIG = {
    Number: { type: "math_number", field: "NUM", value: defaultValue },
    String: { type: "text", field: "TEXT", value: defaultValue },
    Boolean: {
      type: "checkbox",
      field: "BOOL",
      value: defaultValue ? "TRUE" : "FALSE"
    }
  };

  const config = SHADOW_CONFIG[type] ?? SHADOW_CONFIG[null];
  if (!config) return null;

  const shadow = document.createElement("shadow");
  shadow.setAttribute("type", config.type);

  const field = document.createElement("field");
  field.setAttribute("name", config.field);
  field.textContent = config.value;
  shadow.appendChild(field);

  return shadow;
}

/** Builds a block element for the toolbox, including values with defaults. */
function buildBlockElement(blockType, fields = {}) {
  const blockEl = document.createElement("block");
  blockEl.setAttribute("type", blockType);

  for (const [name, spec] of Object.entries(fields)) {
    if (spec?.kind === "menu" || spec?.kind === "statement") continue;
    if (spec?.default === undefined) continue;

    const valueEl = document.createElement("value");
    valueEl.setAttribute("name", name.trim());
    const shadow = buildShadowElement(spec.type ?? null, spec.default);
    if (shadow) valueEl.appendChild(shadow);
    blockEl.appendChild(valueEl);
  }

  return blockEl;
}

function buildCategoryElement(category) {
  if (!category) return null;

  const el = document.createElement("category");
  el.setAttribute("name", category.name ?? "Extension");
  el.setAttribute("colour", category.color ?? "#888");
  if (category.iconURI) el.setAttribute("iconURI", category.iconURI);
  return el;
}

function registerBlocks(id, blocks, categoryColor, categoryEl) {
  const blockDefs = {};

  for (const blockDef of blocks) {
    if (!blockDef?.id) {
      console.warn("Skipped block with no ID:", blockDef);
      continue;
    }

    const blockType = `${id}_${blockDef.id}`;
    blockDefs[blockType] = blockDef;

    Blockly.Blocks[blockType] = {
      init() {
        textToBlock(this, blockDef.text, blockDef.fields);

        switch (blockDef.type) {
          case "statement":
            this.setPreviousStatement(true, blockDef.statementType ?? "default");
            this.setNextStatement(true, blockDef.statementType ?? "default");
            break;
          case "cap":
            this.setPreviousStatement(true, blockDef.statementType ?? "default");
            break;
          case "output":
            this.setOutput(true, blockDef.outputType ?? null);
            if (blockDef.outputShape) this.setOutputShape(blockDef.outputShape);
            break;
          default:
            console.warn(
              `Unknown block type "${blockDef.type}" for ${blockType}; defaulting to statement`
            );
            this.setPreviousStatement(true, blockDef.statementType ?? "default");
            this.setNextStatement(true, blockDef.statementType ?? "default");
        }

        if (blockDef.tooltip) this.setTooltip(String(blockDef.tooltip));
        if (blockDef.duplicateOnDrag) this.setDragStrategy(new DuplicateOnDrag(this));

        this.setColour(String(blockDef.color ?? categoryColor ?? "#888"));
        this.setInputsInline(blockDef.inlineInputs ?? true);
      }
    };

    categoryEl?.appendChild(buildBlockElement(blockType, blockDef.fields));
  }

  return blockDefs;
}

function collectInputs(block, fields) {
  const inputs = {};

  for (const input of block.inputList) {
    const name = input.name;

    if (
      input.type === Blockly.inputs.ValueInput ||
      input.type === Blockly.inputs.DummyInput
    ) {
      const code = javascriptGenerator.valueToCode(block, name, Order.ATOMIC);
      if (code) inputs[name] = code;
    } else if (input.type === Blockly.inputs.StatementInput) {
      const code = javascriptGenerator.statementToCode(block, name);
      if (code) inputs[name] = `async () => { ${code} }`;
    }
  }

  for (const [name, spec] of Object.entries(fields ?? {})) {
    if (spec?.kind !== "menu") continue;
    const val = block.getFieldValue(name);
    if (val !== undefined) inputs[name] = JSON.stringify(val);
  }

  return inputs;
}

function registerCodeGenerators(id, codeGen, blockDefs, isTrusted) {
  for (const blockId of Object.keys(codeGen)) {
    const fullType = `${id}_${blockId}`;

    if (isTrusted) {
      extensions[fullType] = codeGen[blockId];
    }

    const def = blockDefs[fullType] ?? {};

    javascriptGenerator.forBlock[fullType] = function (block) {
      const inputs = collectInputs(block, def.fields);
      const argsLiteral = `{${Object.entries(inputs)
        .map(([k, v]) => `${JSON.stringify(k)}:${v}`)
        .join(",")}}`;

      let call, expr;
      if (isTrusted) {
        call = `extensions[${JSON.stringify(fullType)}](${argsLiteral}, thread)`;
        expr = def.promise ? `(yield* waitForPromise(${call}))` : call;
      } else {
        call = `extensionBridges.get(${JSON.stringify(id)}).runBlock(${JSON.stringify(blockId)}, ${argsLiteral})`;
        expr = `(yield* waitForPromise(${call}))`;
      }

      return block.outputConnection ? [expr, Order.NONE] : `${expr};\n`;
    };
  }
}

function registerExtensionFromDescriptor(descriptor, codeString, isTrusted) {
  const id = descriptor.id;

  if (activeExtensions.some(i => (i?.id ?? i) === id)) {
    console.warn(`Extension "${id}" is already registered; skipping`);
    return;
  }

  const shapes = descriptor.shapes ?? {};
  for (const [typeName, factory] of Object.entries(shapes)) {
    if (customShapeRegistry.has(typeName)) {
      console.warn(`Shape type "${typeName}" already registered; overwriting`);
    }
    customShapeRegistry.set(typeName, factory);
    const provider = workspace?.getRenderer()?.getConstants();
    provider?._customShapeCache?.delete(typeName);
  }

  const notches = descriptor.notches ?? {};
  for (const [blockType, factory] of Object.entries(notches)) {
    if (customNotchRegistry.has(blockType)) {
      console.warn(`Notch type "${blockType}" already registered; overwriting`);
    }
    customNotchRegistry.set(blockType, factory);
    const provider = workspace?.getRenderer()?.getConstants();
    provider?._customNotchCache?.delete(blockType);
  }

  const categoryEl = buildCategoryElement(descriptor.category);
  const categoryColor = descriptor.category?.color ?? "#888";
  const blocks = descriptor.blocks ?? [];
  const blockDefs = registerBlocks(id, blocks, categoryColor, categoryEl);

  if (categoryEl) {
    const toolbox = document.getElementById("toolbox");
    if (toolbox) {
      toolbox.appendChild(categoryEl);
      workspace.updateToolbox(toolbox);
    }
  }

  const codeGen = descriptor.code ?? {};
  registerCodeGenerators(id, codeGen, blockDefs, isTrusted);

  activeExtensions.push({ id, code: codeString, trusted: isTrusted });
}

export async function registerExtension(codeString, trusted = false) {
  if (trusted) {
    try {
      setPendingDescriptor(null);
      eval(codeString);
      const descriptor = consumePendingDescriptor();

      if (descriptor) {
        registerExtensionFromDescriptor(descriptor, codeString, true);
        return Promise.resolve();
      }

      const ExtensionClass = eval(`(${codeString})`);
      if (typeof ExtensionClass === "function") {
        console.warn(
          "Class-based extensions are deprecated. Use Rarry.registerExtension() instead."
        );
        const ext = new ExtensionClass();
        const id = ext.id ?? ext.constructor.name;
        const descriptor = {
          id,
          category: ext.registerCategory?.(),
          shapes: ext.registerShapes?.(),
          notches: ext.registerNotches?.(),
          blocks: ext.registerBlocks?.(),
          code: ext.registerCode?.()
        };
        registerExtensionFromDescriptor(descriptor, codeString, true);
        return Promise.resolve();
      }

      throw new Error(
        "Extension must call Rarry.registerExtension() with a descriptor object"
      );
    } catch (err) {
      console.error("Failed to register trusted extension:", err);
      return Promise.reject(err);
    }
  } else {
    return new Promise((resolve, reject) => {
      const bridge = new ExtensionBridge("temp_id", codeString, extInfo => {
        const id = extInfo.id;
        if (activeExtensions.some(i => (i?.id ?? i) === id)) {
          console.warn(`Extension "${id}" is already registered; skipping`);
          bridge.terminate();
          resolve();
          return;
        }

        bridge.extId = id;
        extensionBridges.set(id, bridge);

        const categoryEl = buildCategoryElement(extInfo.category);
        const categoryColor = extInfo.category?.color ?? "#888";
        const blockDefs = registerBlocks(id, extInfo.blocks, categoryColor, categoryEl);

        if (categoryEl) {
          const toolbox = document.getElementById("toolbox");
          if (toolbox) {
            toolbox.appendChild(categoryEl);
            workspace.updateToolbox(toolbox);
          }
        }

        const mockCodeGen = {};
        for (const blockId of extInfo.codeGen) {
          mockCodeGen[blockId] = true;
        }

        registerCodeGenerators(id, mockCodeGen, blockDefs, false);
        activeExtensions.push({ id, code: codeString, trusted: false });
        resolve();
      });

      bridge.worker.addEventListener("error", err => {
        reject(err);
      });
    });
  }
}
