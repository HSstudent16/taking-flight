/**
 * @file Physics.js
 * @module
 * @author HSstudent16
 * @version 3.26.24a
 * @license MIT
 */

import {Vector} from "./vector.js";


/**
 * A physics engine specifically for platformers and other tile-based games.
 */
export const Physics = (root => {

  root = root ?? self;

  function assert (value, message) {
    if (!value) throw message;
  }


  // Level Data
  let level_bytes = new Uint8Array(1024 * 1024 * 2);
  let level = {
    width: 0,
    height: 0,
    bitmap: [''],
    bytes: new Uint16Array(level_bytes.buffer)
  };

  // Block Data & character mappings
  const blockData = [];
  const blockAliases = {};


  // Utilities for level management
  function coordsToIndex (x, y) {
    return x + y * level.width;
  }
  function getBlockData (x, y) {
    let idx = coordsToIndex(x, y) * 2;
    return {id: idx >> 8, variant: idx & 0xff};
  }
  function setBlockData (x, y, id, variant) {
    let idx = coordsToIndex(x, y);
    level.bytes[idx] = (id << 8) | variant;
  }

  // Utilities for registering a block alias / type
  function registerBlock (config) {
    let block = {
      name: config.name ?? "block_" + Date.now().toString(36),
      aliases: config.aliases ?? (config.alias ? [config.alias] : []),
      solid: config.solid ?? true,
      fluid: config.fluid ?? false,
      friction: config.friction ?? 0.77,
      density: config.density ?? 1,
      flow: config.flow ?? new Vector(0),
      tileEntity: config.tileEntity ?? null,
      hitbox: {
        offset: new Vector(config.hitbox?.offset ?? 0),
        size: new Vector(config.hitbox?.size ?? 1)
      }
    };

    let index = blockData.length;

    for (let i = block.aliases.length; i--;) {
      let char = block.aliases[i];
      blockAliases[char] = (index << 8) | i;
    }

    blockData[index] = block;
  }

  function registerBlocks (...args) {
    for (let i = args.length; i--;) {
      registerBlock(args[i]);
    }
  }

  // Collision utilities
  function prioritySort (a, b) {
    return a.priority - b.priority;
  }

  function aabb (pos_a, size_a, pos_b, size_b) {
    return (
      pos_a.x + size_a.x >= pos_b.x &&
      pos_a.y + size_a.y >= pos_b.y &&
      pos_b.x + size_b.x >= pos_a.x &&
      pos_b.y + size_b.y >= pos_b
    );
  }

  class Memory {
    tick (entity) {}
  }

  class Interface {
    tick () {}
  }

  /**
   * A default constructor for all entities
   */
  class BaseEntityClass {
    /**
     * THE FOLLOWING CODE HAS BEEN COPIED from
     * "The Wogglebug's Platformer Tutorial"
     *      [ /cs/i/6490517757280256 ]
     * Because I am lazy =]
     */
    static list = [];

    static spawn (...args) {
      /*
       this.list reffers to the same array, while new this()
       calls the relevatn class.
      */
      this.list.push(new this(...args));
    }

    // Another function to empty the list
    static reset () {
      this.list.length = 0;
    }

    // Akin to Array.prototype.forEach
    static forEach (f) {
      let i = 0, l = this.list.length;
      for(;i < l; i++) {
        f(this.list[i], i, this.list);
      }
    }

    // Loop through each block and draw it
    static manage () {
      let i = 0, l = this.list.length;
      for(;i < l; i++) {
        this.list[i].tick();
        this.list[i].display();
      }
    }

    tick () {}
    display () {}
  }

    /**
     * END COPIED CODE
     */
  class DefaultEntity extends BaseEntityClass {
    constructor(x, y) {
      this.pos = new Vector(x, y); // m
      this.vel = new Vector(); // m / s
      this.acc = new Vector(); // m / s^2

      this.size = new Vector(1, 1);

      this.variations = [
        Math.random(),
        Math.random(),
        Math.random(),
        Math.random()
      ];

      this.id = "unnamedentity";
      this.type = "unnamedentity";

      this.health = 1;
      this.mass = 50; // kg
      this.drag = 1;  // According to libretexts, this is the drag coefficient of a skydiver =P
      this.maxSurfaceFriction = 0;
      this.maxFluidDensity = 0;

      this.rigid = false;
      this.noGravity = false;
      this.onGround = false;

      this.collisionTable = [];

      this.memory = null;
    }
    tick(dt) {
      if (this.memory) {
        assert(this.memory instanceof Memory, "Unsupported Memory object");
        this.memory.tick(this);
      }
      this.moveX(dt);
      this.runXcollision();
      this.moveY(dt);
      this.runYcollision();
    }
    moveX (dt) {
      // Air resistance
      this.acc.x -= 0.5 * this.drag * this.maxFluidDensity * this.size.y * this.vel.x * this.vel.x / this.mass;

      // Kinetic friction
      this.acc.x -= this.maxSurfaceFriction * Math.sign(this.vel.x) * 9.8;

      this.vel.x += this.acc.x * dt;
      this.pos.x += this.vel.x * dt;
      this.acc.x = 0;
    }
    moveY (dt) {
      // Air resistance
      this.acc.y -= 0.5 * this.drag * this.maxFluidDensity * this.size.x * this.vel.y * this.vel.y / this.mass;

      // Kinetic friction (inaccurate)
      this.acc.y -= this.maxSurfaceFriction * Math.sign(this.vel.y) * 9.8;

      if (!this.noGravity) {
        this.acc.y += 9.8;
      }

      this.vel.y += this.acc.y * dt;
      this.pos.y += this.vel.y * dt;
      this.acc.y = 0;
    }
    runXcollision () {
      // Caching
      let min = Math.min, max = Math.max, floor = Math.floor, ceil = Math.ceil;
      // Bitmap collision detection
      let startX = max(0, floor(this.x + min(this.vel.x, 0))),
          startY = max(0, floor(this.y)),
          endX = min(level.width, ceil(this.x + this.width + max(this.vel.x, 0))),
          endY = min(level.height, ceil(this.y + this.height)),
          dx, dy, id, meta, block_tags, block_varient, i;

      let queue = [];

      for (dy = startY; dy < endY; dy++)
      for (dx = startX; dx < endX; dx++) {

        id = getBlockData(dx, dy).id;
        data = blockData[id];

        if (!this.collisionTable.includes(data.name)) continue;

        p.set(dx, dy);
        p.add(data.hitbox.offset);

        if (aabb(p, data.hitbox.size, this.pos, this.size)) {
          queue.push({
            pos: p,
            size: data.hitbox.size,
            priority: this.collisionTable.indexOf(data.name)
          });
        }
      }

      for (let i = 0, l = BaseEntityClass.list.length; i < l; i++) {
        let e = BaseEntityClass.list[i];
        if (!this.collisionTable.includes(e.type)) continue;

        queue.push({
          pos: e.pos,
          size: e.size,
          priority: this.collisionTable.indexOf(e.type)
        });
      }

      queue.sort(prioritySort);

      for (let i = 0, l = queue.length; i < l; i++) {
        this.collideX(queue[i]);
      }
    }
    collideX () {}
    runYcollision () {
      // Caching
      let min = Math.min, max = Math.max, floor = Math.floor, ceil = Math.ceil;
      // Bitmap collision detection
      let startX = max(0, floor(this.x)),
          startY = max(0, floor(this.y + min(this.vel.y))),
          endX = min(level.width, ceil(this.x + this.width)),
          endY = min(level.height, ceil(this.y + this.height + max(this.vel.y, 0))),
          dx, dy, id, data, p = new Vector;

      this.onGround = false;
      this.maxFluidDensity = 0;
      this.maxSurfaceFriction = 0;

      let queue = [];

      for (dy = startY; dy < endY; dy++)
      for (dx = startX; dx < endX; dx++) {

        id = getBlockData(dx, dy).id;
        data = blockData[id];

        if (!this.collisionTable.includes(data.name)) continue;

        p.set(dx, dy);
        p.add(data.hitbox.offset);

        if (aabb(p, data.hitbox.size, this.pos, this.size)) {
          queue.push({
            pos: p,
            size: data.hitbox.size,
            priority: this.collisionTable.indexOf(data.name)
          });
        }
      }

      for (let i = 0, l = BaseEntityClass.list.length; i < l; i++) {
        let e = BaseEntityClass.list[i];
        if (!this.collisionTable.includes(e.type)) continue;

        queue.push({
          pos: e.pos,
          size: e.size,
          priority: this.collisionTable.indexOf(e.type)
        });
      }

      queue.sort(prioritySort);

      for (let i = 0, l = queue.length; i < l; i++) {
        this.collideY(queue[i]);
      }
    }
    collideY () {

    }
  }

  /**
   * A default constructor for entities that do not move,
   * and are assigned a block.
   */
  class TileEntity extends BaseEntityClass {
    constructor (x, y, variant) {
      super();
      x |= 0;
      y |= 0;
      this.variant = variant;
      this.pos = new Vector(x, y);
      this.blockIndex = coordsToIndex(x, y);
      this.updateFrequency = 1;
      this.updateCooldown = 0;
    }
    tick (dt) {
      if (this.updateCooldown <= 0) {
        this.updateCooldown = this.updateFrequency;
        this.update();
      }
    }
    getNeighbors () {
      let px = this.pos.x, py = this.pos.y;
      return [
        getBlockData(px-1, py),
        getBlockData(px+1, py),
        getBlockData(px, py-1),
        getBlockData(px, py+1)
      ];
    }
    update () {}
  }

  function readBitmap (data) {
    assert(data, "Come on, man");

    let w = level.width = data.width ?? 0;
    let h = level.height = data.height ?? 0;

    level.bitmap.length = 0;
    level.bytes.fill(0);

    if (!data.bitmap) return;

    for (let dy = 0; dy < h; dy++) {
      let row = '';
      for (let dx = 0; dx < w; dx++) {
        let char = data.bitmap[dy]?.[dx]; // That looks wrong :(

        if (char) row += char;
        else break;

        if (!(char in blockAliases)) continue;

        let id = blockAliases[char];
        let index = dy * w + dx;
        let block_data = blockData[id >> 8];

        if (block_data.tileEntity) {
          assert(TileEntity.isPrototypeOf(block_data.tileEntity), `Not a tile entity!`);
          block_data.tileEntity.spawn(dx, dy, id & 0xff);
        }

        level.bytes[index] = id;
      }
      level.bitmap.push(row);
    }
  }

  function tick () {
    BaseEntityClass.manage();
  }

  return root.Physics = {
    BaseEntityClass: BaseEntityClass,
    Entity: DefaultEntity,
    TileEntity: TileEntity,
    Memory: Memory,
    Interface: Interface,
    tick: tick,
    readBitmap: readBitmap,
    setBlockData: setBlockData,
    getBlockData: getBlockData,
    registerBlock: registerBlock,
    registerBlocks: registerBlocks,
    toIndex: coordsToIndex,

  };
}) (this);