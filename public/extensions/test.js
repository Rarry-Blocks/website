Rarry.registerExtension({
  id: "ddeTestExtension",

  category: {
    name: "Test Extension",
    color: "#858585"
  },

  shapes: {
    yabadaba: (height, extra, up, right) => {
      const depth = height / 4;
      const half = (height + extra) / 2;
      return (
        `h ${depth * right}` +
        `l ${depth * right} ${half * up}` +
        `l ${-depth * right} ${half * up}` +
        `h ${-depth * right}`
      );
    }
  },

  notches: {
    ddeTestExtension_statementA: {
      pathLeft: (width, height, svgPaths) => {
        return svgPaths.line([
          svgPaths.point(width / 2, height),
          svgPaths.point(width / 2, -height)
        ]);
      },
      pathRight: (width, height, svgPaths) => {
        return svgPaths.line([
          svgPaths.point(-width / 2, height),
          svgPaths.point(-width / 2, -height)
        ]);
      }
    }
  },

  blocks: [
    {
      type: Rarry.BlockType.STATEMENT,
      id: "evil",
      text: "evil block",
      color: "#FF0000"
    },
    {
      type: Rarry.BlockType.CAP,
      id: "statement",
      fields: { poop: { kind: Rarry.InputType.STATEMENT } },
      text: "i want statement [poop]"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "statementA",
      text: "type statement A",
      statementType: "ddeTestExtension_statementA",
      color: "#85c25c"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "onlyStatementA",
      fields: {
        code: { kind: Rarry.InputType.STATEMENT, accepts: "ddeTestExtension_statementA" }
      },
      text: "only statement A [code]",
      color: "#69974a"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "if",
      fields: {
        bool: { kind: Rarry.InputType.VALUE, type: "Boolean", default: true },
        code: { kind: Rarry.InputType.STATEMENT }
      },
      text: "if [bool] then [code]"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "ifElse",
      fields: {
        bool: { kind: Rarry.InputType.VALUE, type: "Boolean", default: true },
        code: { kind: Rarry.InputType.STATEMENT },
        codeElse: { kind: Rarry.InputType.STATEMENT }
      },
      text: "if [bool] then [code] else [codeElse]"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "menu",
      fields: {
        hi: {
          kind: Rarry.InputType.MENU,
          items: ["normal", { text: "ABC display", value: "abc" }],
          default: "abc"
        }
      },
      text: "menu [hi]"
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "random1",
      text: "random (output shape 1)",
      outputShape: Rarry.BlockShape.NUMBER
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "random2",
      text: "random (output shape 2)",
      outputShape: Rarry.BlockShape.STRING
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "random3",
      text: "random (output shape 3)",
      outputShape: Rarry.BlockShape.ARGUMENT
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "random4",
      text: "random (output shape 4)",
      outputShape: Rarry.BlockShape.ARRAY
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "random5",
      text: "random (output shape 5)",
      outputShape: Rarry.BlockShape.OBJECT
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "yabadaba",
      text: "yabadaba (custom shape)",
      outputType: "yabadaba"
    },
    {
      type: Rarry.BlockType.STATEMENT,
      id: "errorStatement",
      text: "throw an error",
      color: "#f54b4b"
    },
    {
      type: Rarry.BlockType.OUTPUT,
      id: "errorOutput",
      text: "throw an error",
      color: "#f54b4b"
    }
  ],

  code: {
    statement: inputs => {
      console.log(inputs.poop?.());
    },
    if: inputs => {
      console.log(inputs);
      if (inputs.bool) inputs.code?.();
    },
    ifElse: inputs => {
      console.log(inputs);
      if (inputs.bool) inputs.code?.();
      else inputs.codeElse?.();
    },
    evil: () => {
      console.warn("evil is near");
    },
    random1: () => Math.random(),
    random2: () => Math.random(),
    random3: () => Math.random(),
    random4: () => Math.random(),
    random5: () => Math.random(),
    actuallyBoolean: () => true,
    menu: inputs => window.alert(inputs.hi),
    yabadaba: () => "yabadaba",
    errorStatement: () => {
      throw new Error("error (statement)");
    },
    errorOutput: () => {
      throw new Error("error (output)");
    }
  }
});
