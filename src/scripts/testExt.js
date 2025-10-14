class Extension {
  id = "ddeTestExtension";
  registerCategory() {
    return {
      name: "Test Extension",
      color: "#858585",
    };
  }
  registerBlocks() {
    return [
      {
        type: "statement",
        id: "evil",
        text: "evil block",
        color: "#FF0000",
      },
      {
        type: "cap",
        id: "statement",
        fields: { poop: { kind: "statement" } },
        text: "i want statement [poop]",
      },
      {
        type: "statement",
        id: "statementA",
        text: "type statement A",
        statementType: "statementA",
        color: "#85c25c",
      },
      {
        type: "statement",
        id: "onlyStatementA",
        fields: { code: { kind: "statement", accepts: "statementA" } },
        text: "only statement A [code]",
        color: "#69974a",
      },
      {
        type: "statement",
        id: "if",
        fields: {
          bool: { kind: "value", type: "Boolean", default: true },
          code: { kind: "statement" },
        },
        text: "if [bool] then [code]",
      },
      {
        type: "statement",
        id: "ifElse",
        fields: {
          bool: { kind: "value", type: "Boolean", default: true },
          code: { kind: "statement" },
          codeElse: { kind: "statement" },
        },
        text: "if [bool] then [code] else [codeElse]",
      },
      {
        type: "statement",
        id: "menu",
        fields: {
          hi: {
            kind: "menu",
            items: ["normal", { text: "ABC display", value: "abc" }],
            default: "abc",
          },
        },
        text: "menu [hi]",
      },
      {
        type: "output",
        id: "random1",
        text: "random (output shape 1)",
        outputShape: 1,
      },
      {
        type: "output",
        id: "random2",
        text: "random (output shape 2)",
        outputShape: 2,
      },
      {
        type: "output",
        id: "random3",
        text: "random (output shape 3)",
        outputShape: 3,
      },
      {
        type: "output",
        id: "random4",
        text: "random (output shape 4)",
        outputShape: 4,
      },
      {
        type: "output",
        id: "random5",
        text: "random (output shape 5)",
        outputShape: 5,
      },
    ];
  }
  registerCode() {
    return {
      statement: (inputs) => {
        console.log(inputs.poop?.());
      },
      if: (inputs) => {
        console.log(inputs);
        if (inputs.bool) inputs.code?.();
      },
      ifElse: (inputs) => {
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
      menu: (inputs) => window.alert(inputs.hi),
    };
  }
}

registerExtension(Extension);
