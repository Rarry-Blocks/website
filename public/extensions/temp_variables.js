Rarry.registerExtension({
  id: "temporaryVars",

  category: {
    name: "Temp Variables",
    color: "#e4945f"
  },

  blocks: [
    {
      id: "set",
      type: Rarry.BlockType.STATEMENT,
      text: "set [NAME] to [VALUE]",
      tooltip: "Set a temporary variable for this thread.",
      fields: {
        NAME: { kind: Rarry.InputType.VALUE, type: "String", default: "myVar" },
        VALUE: { kind: Rarry.InputType.VALUE, type: null, default: "" }
      }
    },
    {
      id: "change",
      type: Rarry.BlockType.STATEMENT,
      text: "change [NAME] by [AMOUNT]",
      tooltip: "Add a number to a temporary variable.",
      fields: {
        NAME: { kind: Rarry.InputType.VALUE, type: "String", default: "myVar" },
        AMOUNT: { kind: Rarry.InputType.VALUE, type: "Number", default: 1 }
      }
    },
    {
      id: "get",
      type: Rarry.BlockType.OUTPUT,
      text: "get [NAME]",
      tooltip: "Get the value of a temporary variable.",
      fields: {
        NAME: { kind: Rarry.InputType.VALUE, type: "String", default: "myVar" }
      }
    },
    {
      id: "exists",
      type: Rarry.BlockType.OUTPUT,
      outputType: "Boolean",
      text: "does [NAME] exists?",
      tooltip: "Check whether a temporary variable has been set.",
      fields: {
        NAME: { kind: Rarry.InputType.VALUE, type: "String", default: "myVar" }
      }
    },
    {
      id: "delete",
      type: Rarry.BlockType.STATEMENT,
      text: "delete [NAME]",
      tooltip: "Delete a temporary variable from this thread.",
      fields: {
        NAME: { kind: Rarry.InputType.VALUE, type: "String", default: "myVar" }
      }
    },
    {
      id: "clearAll",
      type: Rarry.BlockType.STATEMENT,
      text: "clear all variables",
      tooltip: "Delete every temporary variable on this thread.",
      fields: {}
    }
  ],

  code: {
    set({ NAME, VALUE }, currentThread) {
      if (NAME == null) return;
      currentThread?.setVar(NAME, VALUE ?? "");
    },

    change({ NAME, AMOUNT }, currentThread) {
      if (NAME == null) return;
      const current = Number(currentThread?.getVar(NAME)) || 0;
      currentThread?.setVar(NAME, current + (Number(AMOUNT) || 0));
    },

    get({ NAME }, currentThread) {
      return currentThread?.getVar(NAME) ?? "";
    },

    delete({ NAME }, currentThread) {
      if (NAME == null) return;
      currentThread?.deleteVar(NAME);
    },

    exists({ NAME }, currentThread) {
      return currentThread?.hasVar(NAME) ?? false;
    },

    clearAll({}, currentThread) {
      currentThread?.clearVars();
    }
  }
});
