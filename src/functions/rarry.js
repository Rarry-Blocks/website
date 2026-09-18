export const BlockType = Object.freeze({
  STATEMENT: "statement",
  CAP: "cap",
  OUTPUT: "output"
});

export const BlockShape = Object.freeze({
  NUMBER: 2,
  STRING: 2,
  ARGUMENT: 3,
  OBJECT: 4,
  ARRAY: 5,
  SET: 6
});

export const InputType = Object.freeze({
  VALUE: "value",
  STATEMENT: "statement",
  MENU: "menu"
});

let _pendingDescriptor = null;

export function setPendingDescriptor(desc) {
  _pendingDescriptor = desc;
}

export function consumePendingDescriptor() {
  const desc = _pendingDescriptor;
  _pendingDescriptor = null;
  return desc;
}

export function createRarryGlobal(registerFn) {
  return Object.freeze({
    registerExtension: registerFn,
    BlockType,
    BlockShape,
    InputType
  });
}
