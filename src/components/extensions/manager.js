import * as Blockly from "blockly/core";
import { javascriptGenerator, Order } from "blockly/javascript";
import { ExtensionBridge } from "../vm/bridge.js";

export const activeExtensions = new Map(); 

export function registerExtension(extId, codeString) {
  if (activeExtensions.has(extId)) {
    console.warn(`Extension "${extId}" is already registered.`);
    return;
  }

  const bridge = new ExtensionBridge(extId, codeString, (blocks) => {
    registerBlocklyBlocks(extId, blocks, bridge);
  });

  activeExtensions.set(extId, bridge);
}

function registerBlocklyBlocks(extId, blocks, bridge) {
  for (const blockDef of blocks) {
    const fullType = `${extId}_${blockDef.opcode}`;

    Blockly.Blocks[fullType] = {
      init: function () {
        this.appendDummyInput().appendField(blockDef.text);
        if (blockDef.blockType === 'command') {
          this.setPreviousStatement(true, null);
          this.setNextStatement(true, null);
        } else if (blockDef.blockType === 'reporter') {
          this.setOutput(true, null);
        }
        this.setColour(blockDef.color || '#888');
      }
    };

    javascriptGenerator.forBlock[fullType] = function (block) {
      const call = `await VM_FUNCTIONS.extensions.get("${extId}").runBlock("${blockDef.opcode}")`;
      
      return block.outputConnection 
        ? [call, Order.NONE] 
        : `${call};\n`;
    };
  }
  
  workspace.updateToolbox(document.getElementById("toolbox"));
}