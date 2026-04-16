import * as Blockly from "blockly";
import * as BlocklyJS from "blockly/javascript";
import { quickBlockMaker } from "./quickblockmaker";

quickBlockMaker(
	"logic_operation_extra",
	function () {
		this.appendValueInput("A").setCheck("Boolean");
		this.appendValueInput("B")
			.setCheck("Boolean")
			.appendField(
				new Blockly.FieldDropdown([
					["and", "and"],
					["or", "or"],
					["xor", "xor"],
					["nand", "nand"],
					["nor", "nor"],
					["xnor", "xnor"],
				]),
				"OP",
			);
		this.setInputsInline(true);
		this.setOutput(true, "Boolean");
		this.setStyle("text_blocks");
	},
	function (block, generator) {
		const A = generator.valueToCode(block, "A", BlocklyJS.Order.LOGICAL_AND) || "false";
		const B = generator.valueToCode(block, "B", BlocklyJS.Order.LOGICAL_AND) || "false";
		const OP = block.getFieldValue("OP");

		let code;

		switch (OP) {
			case "and":
				code = `${A} && ${B}`;
				break;
			case "or":
				code = `${A} || ${B}`;
				break;
			case "xor":
				code = `(${A} !== ${B})`;
				break;
			case "nand":
				code = `!(${A} && ${B})`;
				break;
			case "nor":
				code = `!(${A} || ${B})`;
				break;
			case "xnor":
				code = `(${A} === ${B})`;
				break;
			default:
				code = "false";
		}

		return [code, BlocklyJS.Order.LOGICAL_OR];
	},
);
