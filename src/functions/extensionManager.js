import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { activeExtensions, workspace } from "../scripts/editor";
import { DuplicateOnDrag } from "./patches/block";
import { customShapeRegistry } from "./render";

export const extensions = {};

const INPUT_TYPE = {
  VALUE: 1,
  DUMMY: 2,
  STATEMENT: 3,
};

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
        typeof item === "string" ? [item, item] : [item.text, item.value],
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
      type: "logic_boolean",
      field: "BOOL",
      value: defaultValue ? "TRUE" : "FALSE",
    },
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
              `Unknown block type "${blockDef.type}" for ${blockType}; defaulting to statement`,
            );
            this.setPreviousStatement(true, blockDef.statementType ?? "default");
            this.setNextStatement(true, blockDef.statementType ?? "default");
        }

        if (blockDef.tooltip) this.setTooltip(String(blockDef.tooltip));
        if (blockDef.duplicateOnDrag) this.setDragStrategy(new DuplicateOnDrag(this));

        this.setColour(String(blockDef.color ?? categoryColor ?? "#888"));
        this.setInputsInline(blockDef.inlineInputs ?? true);
      },
    };

    categoryEl?.appendChild(buildBlockElement(blockType, blockDef.fields));
  }

  return blockDefs;
}

function collectInputs(block, fields) {
  const inputs = {};

  for (const input of block.inputList) {
    const name = input.name;

    if (input.type === INPUT_TYPE.VALUE || input.type === INPUT_TYPE.DUMMY) {
      const code = BlocklyJS.javascriptGenerator.valueToCode(
        block,
        name,
        BlocklyJS.Order.ATOMIC,
      );
      if (code) inputs[name] = code;
    } else if (input.type === INPUT_TYPE.STATEMENT) {
      const code = BlocklyJS.javascriptGenerator.statementToCode(block, name);
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

function registerCodeGenerators(id, codeGen, blockDefs) {
  for (const [blockId, handler] of Object.entries(codeGen)) {
    const fullType = `${id}_${blockId}`;
    extensions[fullType] = handler;

    const def = blockDefs[fullType] ?? {};

    BlocklyJS.javascriptGenerator.forBlock[fullType] = function (block) {
      const inputs = collectInputs(block, def.fields);
      const argsLiteral = `{${Object.entries(inputs)
        .map(([k, v]) => `${JSON.stringify(k)}:${v}`)
        .join(",")}}`;

      const call = `extensions[${JSON.stringify(fullType)}](${argsLiteral}, thread)`;
      const expr = def.promise ? `await ${call}` : call;

      return block.outputConnection ? [expr, BlocklyJS.Order.NONE] : `${expr};\n`;
    };
  }
}

export async function registerExtension(ExtClass) {
  const ext = new ExtClass();
  const id = ext.id ?? ext.constructor.name;

  if (activeExtensions.some(i => (i?.id ?? i) === id)) {
    console.warn(`Extension "${id}" is already registered; skipping`);
    return;
  }

  const shapes = ext.registerShapes?.() ?? {};
  for (const [typeName, factory] of Object.entries(shapes)) {
    if (customShapeRegistry.has(typeName)) {
      console.warn(`Shape type "${typeName}" already registered; overwriting`);
    }
    customShapeRegistry.set(typeName, factory);
    const provider = workspace?.getRenderer()?.getConstants();
    provider?._customShapeCache?.delete(typeName);
  }

  const categoryDescriptor = ext.registerCategory?.();
  const categoryEl = buildCategoryElement(categoryDescriptor);
  const categoryColor = categoryDescriptor?.color ?? "#888";
  const blocks = ext.registerBlocks?.() ?? [];
  const blockDefs = registerBlocks(id, blocks, categoryColor, categoryEl);

  if (categoryEl) {
    const toolbox = document.getElementById("toolbox")
    if (!toolbox) {
      console.warn("Toolbox is missing; cannot add extension blocks to toolbox");
      return;
    }
    toolbox.appendChild(categoryEl);
    workspace.updateToolbox(toolbox);
  }

  const codeGen = ext.registerCode?.() ?? {};
  registerCodeGenerators(id, codeGen, blockDefs);

  activeExtensions.push({ id, code: ExtClass.toString() });
}
