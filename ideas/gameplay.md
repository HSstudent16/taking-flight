# Premise

Complete each level by finding all the monkeys and removing their jetpacks.  A random monkey holds a key, which must be collected to progress to the next level.  The monkeys will fly about avoiding the player, and occasionally interact with the various components (e.g. levers, buttons, doors) throughout the map.  When a monkey is captured by the player, it will throw the key (if it has the key) to another monkey nearby that still has a jetpack, until all the monkeys have been grounded.

Monkeys are bound to the physics of a level's components, save the ability to fly with a jetpack.  The player cannot ever fly, since the jetpacks are apparently monkey-sized and will not support the player's weight.  The key, when thrown, can phase through solid blocks to reach another monkey, thus requiring the player to navigate the level's obstacles.

Monkeys can appear in an isolated part of the level map, with a specific challenge to enter and ground the monkey.

# Mechanics

There are many interactive & functional components which allow the player to alter & navigate the level.  Such components include:

 - \[TileEntity\] Small cog (1 x 1) - Transfers rotational power to other cogs, piston, and elevator.
 - \[TileEntity\] Medium cog (2 x 2)
 - \[TileEntity\] Large cog (4 x 4)
 - \[TileEntity\] Vertical Transfer Gear - Adapts rotational power from shaft to cogs, and vice versa
 - \[TileEntity\] Horizontal Transfer Gear
 - \[TileEntity\] Shaft - Transfers rotational power to other shafts, transfer gears, and clutch
 - \[TileEntity\] Clutch - Interacts with lever to engage or disengage a rotational power from shaft
 - \[TileEntity\] Piston - Pushes or pulls a block (No tile entities) depending on direction of rotational power supplied
 - \[Block\] Boiler - Generates steam power
 - \[Block\] Engine - Converts steam power to rotational power
 - \[Block\] Generator - Converts rotational power to electrical power
 - \[Block\] Wire - Transfers elecctrical power
 - \[Block\] Pipe - Transfers steam power
 - \[Block\] Vent - Uses steam power to push entities; low power
 - \[Block\] Valve - Interacts with lever to stop and unstop the transfer of steam power
 - \[Block\] Powerbox - Interacts with lever to turn on/off electrical power

 - \[Block\] Door - Simple interaction
 - \[Block\] Powered door - Requires electrical power to open
 - \[Block\] Lamp - Turns on with electrical power
 - \[Block\] Fan - Uses steam power to push entites; high power
 - \[Block\] Stair - No interaction
 - \[Block\] Ladder - No Interaction
 - \[Block\] Lever - Used to switch on & off power sources
 - \[Entity\] Elevator - Uses rotational power from cog to move entites up or down; cog should be above the elevator, with no obstructions. (3x3)
 - \[Entity\] Steel Crate - Pushable by fan, elevator, piston
 - \[Entity\] Wooden Crate - Pushable, breaks if dropped from a great height
 - \[Entity\] Steam Jet - Summoned by vent & fan