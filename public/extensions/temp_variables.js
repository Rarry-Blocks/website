class Extension {
  constructor(api) {
    this.api = api;
    this.id = "temporaryVars";
  }

  registerCategory() {
    return {
      name: "Temp Variables",
      color: "#e4945f",
    };
  }

  registerBlocks() {
    return [
      {
        id: "set",
        type: "statement",
        text: "set [NAME] to [VALUE]",
        tooltip: "Set a temporary variable for this thread.",
        fields: {
          NAME: { kind: "value", type: "String", default: "myVar" },
          VALUE: { kind: "value", type: null, default: "" },
        },
      },
      {
        id: "change",
        type: "statement",
        text: "change [NAME] by [AMOUNT]",
        tooltip: "Add a number to a temporary variable.",
        fields: {
          NAME: { kind: "value", type: "String", default: "myVar" },
          AMOUNT: { kind: "value", type: "Number", default: 1 },
        },
      },
      {
        id: "get",
        type: "output",
        text: "get [NAME]",
        tooltip: "Get the value of a temporary variable.",
        fields: {
          NAME: { kind: "value", type: "String", default: "myVar" },
        },
      },
      {
        id: "exists",
        type: "output",
        outputType: "Boolean",
        text: "does [NAME] exists?",
        tooltip: "Check whether a temporary variable has been set.",
        fields: {
          NAME: { kind: "value", type: "String", default: "myVar" },
        },
      },
      {
        id: "delete",
        type: "statement",
        text: "delete [NAME]",
        tooltip: "Delete a temporary variable from this thread.",
        fields: {
          NAME: { kind: "value", type: "String", default: "myVar" },
        },
      },
      {
        id: "clearAll",
        type: "statement",
        text: "clear all variables",
        tooltip: "Delete every temporary variable on this thread.",
        fields: {},
      },
    ];
  }

  registerCode() {
    return {
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
      },
    };
  }
}
