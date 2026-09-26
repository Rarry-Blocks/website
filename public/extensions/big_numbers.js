(function () {
  const bigNumberField = {
    kind: Rarry.InputType.VALUE,
    type: ["Number", "BigInt"],
    default: "10",
    shadow: "Number"
  };

  Rarry.registerExtension({
    id: "bigNumbers",

    category: {
      name: "Big Numbers",
      color: "#3cb97b"
    },

    shapes: {
      BigInt: (height, extra, up, right) => {
        const depth = height / 4;
        const stewie = (height + extra) / 4;
        return (
          `h ${depth * right}` +
          `q ${depth * right} 0 ${depth * right} ${stewie * up}` +
          `t ${-depth * right} ${stewie * up}` +
          `q ${depth * right} 0 ${depth * right} ${stewie * up}` +
          `t ${-depth * right} ${stewie * up}` +
          `h ${-depth * right}`
        );
      }
    },

    blocks: [
      {
        id: "new",
        type: Rarry.BlockType.OUTPUT,
        text: "[VALUE]",
        tooltip: "Create a big number from a normal number.",
        outputType: "BigInt",
        fields: {
          VALUE: { ...bigNumberField }
        }
      },
      {
        id: "operator",
        type: Rarry.BlockType.OUTPUT,
        text: "[A] [OPERATOR] [B]",
        tooltip: "Perform a math operation on two big numbers.",
        outputType: "BigInt",
        fields: {
          A: { ...bigNumberField },
          OPERATOR: {
            kind: Rarry.InputType.MENU,
            items: ["+", "-", "*", "/", "%", "^"]
          },
          B: { ...bigNumberField }
        }
      },
      {
        id: "compare",
        type: Rarry.BlockType.OUTPUT,
        text: "[A] [OPERATOR] [B]",
        tooltip: "Compare two big numbers.",
        outputType: "Boolean",
        outputShape: 1,
        fields: {
          A: { ...bigNumberField },
          OPERATOR: {
            kind: Rarry.InputType.MENU,
            items: ["=", "≠", "<", ">", "≤", "≥"]
          },
          B: { ...bigNumberField }
        }
      },
      {
        id: "toString",
        type: Rarry.BlockType.OUTPUT,
        text: "[VALUE] as text",
        tooltip: "Convert a big number to a regular string.",
        outputType: "String",
        fields: {
          VALUE: { ...bigNumberField }
        }
      },
      {
        id: "abs",
        type: Rarry.BlockType.OUTPUT,
        text: "absolute of [VALUE]",
        tooltip: "Get the absolute value of a big number.",
        outputType: "BigInt",
        fields: {
          VALUE: { ...bigNumberField }
        }
      },
      {
        id: "negate",
        type: Rarry.BlockType.OUTPUT,
        text: "-[VALUE]",
        tooltip: "Flip the sign of a big number.",
        outputType: "BigInt",
        fields: {
          VALUE: { ...bigNumberField }
        }
      },
      {
        id: "minmax",
        type: Rarry.BlockType.OUTPUT,
        text: "[OPERATOR] of [A] and [B]",
        tooltip: "Get the smaller/larger of two big numbers.",
        outputType: "BigInt",
        fields: {
          OPERATOR: {
            kind: Rarry.InputType.MENU,
            items: ["min", "max"]
          },
          A: { ...bigNumberField },
          B: { ...bigNumberField }
        }
      },
      {
        id: "isEven",
        type: Rarry.BlockType.OUTPUT,
        text: "[VALUE] is even",
        tooltip: "Check whether a big number is even.",
        outputType: "Boolean",
        outputShape: 1,
        fields: {
          VALUE: { ...bigNumberField }
        }
      }
    ],

    code: {
      new({ VALUE }) {
        return safeBigInt(VALUE);
      },

      operator({ A, OPERATOR, B }) {
        A = safeBigInt(A);
        B = safeBigInt(B);
        switch (OPERATOR) {
          case "+":
            return A + B;
          case "-":
            return A - B;
          case "*":
            return A * B;
          case "/":
            return B === 0n ? 0n : A / B;
          case "%":
            return B === 0n ? 0n : A % B;
          case "^":
            return B < 0n ? 0n : A ** B;
          default:
            return 0n;
        }
      },

      compare({ A, OPERATOR, B }) {
        A = safeBigInt(A);
        B = safeBigInt(B);
        switch (OPERATOR) {
          case "=":
            return A === B;
          case "≠":
            return A !== B;
          case "<":
            return A < B;
          case ">":
            return A > B;
          case "≤":
            return A <= B;
          case "≥":
            return A >= B;
          default:
            return false;
        }
      },

      toString({ VALUE }) {
        return safeBigInt(VALUE).toString();
      },

      abs({ VALUE }) {
        const v = safeBigInt(VALUE);
        return v < 0n ? -v : v;
      },

      negate({ VALUE }) {
        return -safeBigInt(VALUE);
      },

      minmax({ OPERATOR, A, B }) {
        A = safeBigInt(A);
        B = safeBigInt(B);
        return OPERATOR === "min" ? (A < B ? A : B) : A > B ? A : B;
      },

      isEven({ VALUE }) {
        return safeBigInt(VALUE) % 2n === 0n;
      }
    }
  });

  function safeBigInt(v) {
    if (v == null || v === "") return 0n;
    try {
      return BigInt(v);
    } catch {
      return 0n;
    }
  }
})();
