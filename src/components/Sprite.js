import { Sprite as PixiSprite, Texture } from "pixi.js-legacy";
import { spriteManager, vm } from "../scripts/editor";
import { triggerCloneEvents } from "../functions/runCode";
import md5 from "js-md5";

export class Costume {
  constructor({ id, name, texture }) {
    if (!(texture instanceof Texture)) {
      throw new Error(`Costume "${name}" created with invalid texture`);
    }

    const sourceData = texture.baseTexture.resource.url || "";
    this.id = id ?? md5(sourceData);
    this.name = name;
    this.texture = texture;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      texture: this.texture?.baseTexture?.resource?.url ?? null,
    };
  }

  static fromJSON(json) {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid costume JSON");
    }

    const source = json.texture ?? json.data;

    if (typeof source !== "string") {
      throw new Error(`Costume "${json.name}" is missing texture source`);
    }

    return new Costume({
      id: json.id ?? `costume-${crypto.randomUUID()}`,
      name: json.name,
      texture: Texture.from(source),
    });
  }
}

export class Sound {
  constructor({ id, name, dataURL }) {
    this.id = id ?? md5(dataURL || "");
    this.name = name;
    this.dataURL = dataURL;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      dataURL: this.dataURL,
    };
  }

  static fromJSON(json) {
    if (!json || typeof json !== "object") {
      throw new Error("Invalid sound JSON");
    }

    const source = json.dataURL ?? json.data ?? json.path;

    if (typeof source !== "string") {
      throw new Error(`Sound "${json.name}" is missing source`);
    }

    return new Sound({
      id: json.id ?? `sound-${crypto.randomUUID()}`,
      name: json.name,
      dataURL: source,
    });
  }
}

function assertValidSprite(sprite, index) {
  if (!sprite || typeof sprite !== "object") {
    throw new Error(`Sprite #${index} is not an object`);
  }

  if (typeof sprite.id !== "string") {
    throw new Error(`Sprite #${index} is missing a valid id`);
  }

  if (!Array.isArray(sprite.costumes)) {
    throw new Error(`Sprite ${sprite.id} has no costumes array`);
  }

  if (!Array.isArray(sprite.sounds)) {
    throw new Error(`Sprite ${sprite.id} has no sounds array`);
  }

  if (sprite.x != null && typeof sprite.x !== "number") {
    throw new Error(`Sprite ${sprite.id} has invalid x`);
  }
  if (sprite.y != null && typeof sprite.y !== "number") {
    throw new Error(`Sprite ${sprite.id} has invalid y`);
  }
}

export class Sprite {
  constructor({
    id,
    name = "Sprite",
    costumes = [],
    sounds = [],
    code = "",
    clone = false,
    root = null,
    x = 0,
    y = 0,
    scale = 1,
    rotation = 0,
    currentCostumeId = null,
  }) {
    this.id = id ?? `sprite-${crypto.randomUUID()}`;
    this.name = name;
    this.clone = clone;
    this.root = root;
    this.clones = [];
    this.code = code;

    this.costumes = costumes.map(c => (c instanceof Costume ? c : new Costume(c)));
    this.sounds = sounds.map(s => (s instanceof Sound ? s : new Sound(s)));

    this.currentCostumeId = currentCostumeId ?? this.costumes[0]?.id ?? null;

    this.pixiSprite = new PixiSprite(Texture.EMPTY);
    this.pixiSprite.anchor.set(0.5);
    this.pixiSprite.position.set(x, y);
    this.pixiSprite.scale.set(scale);
    this.pixiSprite.rotation = rotation;
    
    this.applyCurrentCostume();
  }

  applyCurrentCostume() {
    const costume = this.costumes.find(c => c.id === this.currentCostumeId) || this.costumes[0];
    if (costume) {
      this.pixiSprite.texture = costume.texture;
      this.currentCostumeId = costume.id;
    }
  }

  createClone() {
    const root = this.clone ? this.root : this;
    
    const limit = spriteManager?.cloneLimit || 200; 
    if (root.clones.length >= limit) return null; 

    const clone = new Sprite({
      id: `clone-${crypto.randomUUID()}`,
      name: this.name.slice(),
      costumes: this.costumes.slice(),
      sounds: this.sounds.slice(),
      code: this.code,
      clone: true,
      root,
      x: this.pixiSprite.x,
      y: this.pixiSprite.y,
      scale: this.pixiSprite.scale.x,
      rotation: this.pixiSprite.rotation,
      currentCostumeId: this.currentCostumeId,
    });
    root.clones.push(clone);
    return clone;
  }

  getAllClones() {
    return this.clone ? this.root.clones : this.clones;
  }

  toJSON() {
    const costumes = this.costumes.map(c => c?.toJSON());
    const sounds = this.sounds.map(s => s?.toJSON());

    return {
      id: this.id,
      name: this.name,
      code: this.code,
      x: this.pixiSprite.x,
      y: this.pixiSprite.y,
      scale: this.pixiSprite.scale.x,
      rotation: this.pixiSprite.rotation,
      currentCostumeId: this.currentCostumeId,
      costumes,
      sounds,
    };
  }

  static fromJSON(json) {
    const costumes = (json.costumes || []).map(Costume.fromJSON);
    const sounds = (json.sounds || []).map(Sound.fromJSON);

    let costumeId = json.currentCostumeId;
    if (costumeId === undefined || costumeId === null) {
      const index = json.currentCostume ?? 0;
      costumeId = costumes[index]?.id;
    }

    return new Sprite({
      ...json,
      currentCostumeId: costumeId,
      costumes,
      sounds,
    });
  }

  static assertValidSprite(sprite, index) {
    assertValidSprite(sprite, index);
  }
}

export class SpriteManager {
  constructor(app) {
    this.app = app;
    this.sprites = new Map();
  }

  add(sprite) {
    this.sprites.set(sprite.id, sprite);
    this.app.stage.addChild(sprite.pixiSprite);
    return sprite;
  }

  create(data) {
    return this.add(new Sprite(data));
  }

  clone(sprite) {
    const clone = sprite.createClone();
    this.add(clone);
    triggerCloneEvents(clone);
    return clone;
  }

  remove(sprite) {
    vm.stopForTarget(sprite);

    this.app.stage.removeChild(sprite.pixiSprite);
    this.sprites.delete(sprite.id);

    if (sprite.clone && sprite.root) {
      sprite.root.clones = sprite.root.clones.filter(c => c.id !== sprite.id);
    }

    if (!sprite.clone) {
      this.removeClones(sprite);
    }

    if (sprite.currentBubble) {
      sprite.currentBubble.destroy({ children: true });
      sprite.currentBubble = null;
    }
  }

  removeClones(sprite) {
    sprite.clones.forEach(c => this.remove(c));
  }

  get(value) {
    if (value instanceof Sprite) return value;
    return this.sprites.get(value);
  }

  getAll() {
    return [...this.sprites.values()];
  }

  getOriginals() {
    return this.getAll().filter(s => !s.clone);
  }

  toJSON() {
    return this.getOriginals()
      .map(s => s.toJSON())
      .filter(Boolean);
  }

  fromJSON(array) {
    array.forEach(Sprite.assertValidSprite);
    this.clear();
    array.forEach(data => this.add(Sprite.fromJSON(data)));
  }

  clear() {
    for (const sprite of this.getAll()) {
      this.remove(sprite);
    }
    this.sprites.clear();
  }
}
