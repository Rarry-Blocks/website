(function () {
  const pointerField = {
    kind: Rarry.InputType.VALUE,
    type: ["Pointer"]
  };

  class Pointer {
    constructor(val) {
      this.value = val;
    }
    set(val) {
      this.value = val;
    }
    get() {
      return this.value;
    }
  }

  Rarry.registerExtension({
    id: "pointers",

    category: {
      name: "Pointers",
      color: "#5a49b8"
    },

    blocks: [
      {
        id: "new",
        type: Rarry.BlockType.OUTPUT,
        text: "new pointer",
        tooltip: "Create an empty pointer.",
        outputType: "Pointer"
      },
      {
        id: "from",
        type: Rarry.BlockType.OUTPUT,
        text: "new pointer with data [VALUE]",
        tooltip: "Create a pointer with an initial value.",
        outputType: "Pointer",
        fields: {
          VALUE: {
            kind: Rarry.InputType.VALUE,
            default: "",
            shadow: "String"
          }
        }
      },
      {
        id: "set",
        type: Rarry.BlockType.STATEMENT,
        text: "set [POINTER] to [VALUE]",
        tooltip: "Set the value of a pointer.",
        fields: {
          POINTER: { ...pointerField },
          VALUE: {
            kind: Rarry.InputType.VALUE,
            default: "",
            shadow: "String"
          }
        }
      },
      {
        id: "get",
        type: Rarry.BlockType.OUTPUT,
        text: "data of [POINTER]",
        tooltip: "Get the value of a pointer.",
        fields: {
          POINTER: { ...pointerField }
        }
      }
    ],

    code: {
      new() {
        return new Pointer();
      },
      from({ VALUE }) {
        return new Pointer(VALUE);
      },
      set({ POINTER, VALUE }) {
        safePointer(POINTER).set(VALUE);
      },
      get({ POINTER }) {
        return safePointer(POINTER).get();
      }
    }
  });

  function safePointer(v) {
    if (v instanceof Pointer) return v;
    return new Pointer();
  }
})();
