import {Vector} from "./vector.js";
import {MyLib} from "./mylib.js";
import {Sprite} from "./sprite.js";
import {Physics} from "./physics.js";
import {Commander} from "./commander.js";


console.log(Vector);
console.log(MyLib);
console.log(Sprite);
console.log(Physics);
console.log(Commander);

export function init (lib) {

  /******* Block Definitions *********/
  Physics.registerBlocks (
    {
      name: "air",
      solid: false,
      alias: " "
    },
    {
      name: "boiler",
      solid: true,
      alias: "B"
    },
    {
      name: "engine",
      solid: true,
      hitbox: {
        offset: new Vector(0, 0.125),
        size: new Vector(1, 0.875)
      },
      alias: "E"
    },
    {
      name: "generator",
      solid: true,
      hitbox: {
        offset: new Vector(0, 0.25),
        size: new Vector(1, 0.875)
      }
    },
    {
      name: "pipe",
      solid: true,
      hitbox: {
        offset: new Vector(0.25, 0.25),
        size: new Vector(0.5, 0.5)
      },
      aliases: ["S", "~", "L", "J", "r", "?", "+"]
    },
    {
      name: "wire",
      solid: false,
      // There are so many combinations that
      // I'll just make wires always connect to
      // other wires, and figure out the texture
      // at render time.
      alias: "="
    },
    {
      name: "valve",
      solid: true,
      hitbox: {
        // A little bit bigger than a pipe
        offset: new Vector(0.2, 0.2),
        size: new Vector(0.6, 0.6)
      },
      aliases: ["V", "A"]
    },
    {
      name: "breaker",
      solid: true,
      alias: "X"
    },
    {
      name: "circuit",
      solid: true,
      alias: "&"
    },
    {
      name: "vent",
      solid: false,
      aliases: ["1", "2", "3", "4"]
    },
    {
      name: "fan",
      solid: true,
      aliases: ["5", "6", "7", "8"]
    },
    {
      name: "lamp",
      solid: true,
      alias: "!"
    }
  )

  /******* Memory Definitions *******/
  let PlayerMemory = new Physics.Memory ();
  PlayerMemory.tick = player => {
    if (lib.keys.a || lib.keys.ArrowLeft)
      player.acc.x -= 1;
    if (lib.keys.d || lib.keys.ArrowRight)
      player.acc.x += 1;
    if (lib.keys.Space || lib.keys.ArrowUp || lib.keys.w)
      player.acc.y -= 4;
  };


  let CameraMemory = new Physics.Memory ();
  CameraMemory.target = null;
  CameraMemory.tick = camera => {
    // This might be a bad idea
    camera.acc.add(camera.target.pos);
    camera.acc.sub(camera.pos);
    camera.acc.sub(Vector.mult(camera.vel, 0.25));
    camera.acc.sub(Vector.mult(camera.acc, 0.125));
  };

  /******** Entity Subclasses *******/

  /**
   * Behavior:
   *   Accelerate with WASD or Arrow Keys, collide with solid blocks, tile entites,
   *   elevator, crates; pushed by steam jet; remove jetpack from monkey on collide
   *   and initiate key toss.
   */
  class Player extends Physics.Entity {
    constructor (x, y) {
      super(x, y);
      this.memory = PlayerMemory;
      this.collisionTable = [

      ];
    }
  }

  /**
   * Behavior:
   *   Navigate randomly (no grav) and avoid player; alter levers & doors nearby;
   *   collide with solid blocks; occasionaly toss key to a nearby monkey with
   *   a jetpack; remains still if chosen as a reciever of key; collide withState solid
   *   blocks, tile entities, elevator, crates; pushed by steam jet.
   */
  class Monkey extends Physics.Entity {}

  /**
   * Behavior:
   *   Free falls until it is close to a monkey, then destroys self;
   */
  class Key extends Physics.Entity {}

  /**
   * Behavior:
   *   Free fall; collides with solid blocks, tile entities, elevator, crates;
   *   pushed by steam jet
   */
  class WoodenCrate extends Physics.Entity {}

  /**
   * Behavior:
   *   Free fall; collides with solid blocks, tile entities, elevator, crates;
   *   pushed by strong steam jet
   */
  class SteelCrate extends Physics.Entity {}

  /**
   * Behavior:
   *   Destroy if source block is not powered (check every 4 ticks)
   */
  class SteamJet extends Physics.BaseEntityClass {}

  /**
   * Behavior:
   *   Expand to fill empty 3-wide column.  If cog is found at top, move
   *   according to cog speed & direction.
   */
  class Elevator extends Physics.Entity {}

  /**
   * Behavior:
   *  Follows the player, and uses collision mechanics to draw everything.
   */
  class Camera extends Physics.Entity {}


  /**
   * Stores:
   *   speed, direction
   * Checks:
   *   neighboring blocks / tiles entities for an update in speed or direction
   */
  class Cog extends Physics.TileEntity {}
  Physics.registerBlock({
    name: "cog",
    solid: false,
    tileEntity: Cog,
    alias: 'o'
  });

  /**
   * Same as Cog
   */
  class SmallCog extends Cog {}
  Physics.registerBlock({
    name: "small_cog",
    solid: false,
    tileEntity: SmallCog,
    alias: '.'
  });

  class LargeCog extends Cog {}
  Physics.registerBlock({
    name: "large_cog",
    solid: false,
    tileEntity: LargeCog,
    alias: "O"
  });

  /**
   * Similar to Cog, also checks shaft, clutch, and engine entities
   * Stores orientation
   */
  class VBevelGear extends Cog {}
  Physics.registerBlock({
    name: "vertical_transfer_gear",
    solid: false,
    aliases: ['^', 'v'],
    tileEntity: VBevelGear
  });

  class HBevelGear extends Cog {}
  Physics.registerBlock({
    name: "horizontal_transfer_gear",
    solid: false,
    aliases: ['<', '>'],
    tileEntity: HBevelGear
  });

  /**
   * Of course, axels were invented after gears.
   *
   * Also stores orientation
   */
  class Shaft extends Cog {}
  Physics.registerBlock({
    name: "shaft",
    solid: false,
    aliases: ["|", "-"],
    tileEntity: Shaft
  });

  /**
   * A clutch is a shaft that can be turned off
   * with a lever, or electrical power
   */
  class Clutch extends Shaft {}
  Physics.registerBlock({
    name: "clutch",
    solid: true,
    aliases: ["C", "c"],
    tileEntity: Clutch
  });

  /**
   * Stores:
   *   Powered, orientation, animation
   * Checks:
   *   Rotational speed & direction (from cog)
   */
  class Piston extends Physics.TileEntity {}
  Physics.registerBlock({
    name: "piston",
    solid: true,
    aliases: ["_", "T", "]", "["],
    tileEntity: Piston
  });
}