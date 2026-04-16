import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";

// this is genuinely just a helper to make block definitions cleaner
export function quickBlockMaker(id, init, code) {
  Blockly.Blocks[id] = { init };
  BlocklyJS.javascriptGenerator.forBlock[id] = code;
}
