# Tendrock-Database

[ ✅ English  |  [📃简体中文](./README_CN.md) ]

```cmd
npm install @tendrock/database@latest
```

**Tendrock-Database** is a data management framework designed for the Minecraft Bedrock Edition Script API under the Tendrock ecosystem. It aims to provide convenient data management interfaces for Bedrock Edition developers, enhance script performance, and reduce cognitive load.

## Highlights

- 📦 **Ready to Use** - Tendrock-Database offers a rich set of convenient APIs covering all aspects of game content. It supports direct storage and retrieval of JSON objects on top of native data types, allowing developers to use robust data management features without reinventing the wheel.
- 🚀 **Full Object Support** - Based on native dynamic property APIs, Tendrock-Database perfectly covers the four core game objects: `Block`/`Entity`/`ItemStack`/`World`.
- ⚡ **Performance Optimization** - With dirty data caching, scheduled auto-save mechanisms, and the `runJob` function, Tendrock-Database reduces over 90% of native `setDynamicProperty` function calls compared to using native interfaces directly. It centralizes and distributes storage operations across ticks, significantly optimizing performance overhead and keeping watchdog impacts virtually imperceptible to players.
- ✨ Full-Chain Type Support - Robust type constraints are implemented based on TypeScript's type system. Just gently press ".", and start enjoying the convenience of intelligent auto-completion.
- ✨ **Low Cognitive Load** - Layered design based on namespaces for "data partitioning and isolation," managing data by game object units, binding data with game content at the interface level.
- 🪄 **Progressive Framework** - Seamlessly integrates with existing data via data ID tagging, enabling developers to integrate it into any existing projects.
- 🎊 **Production-Grade Reliability** - Long-term use in large-scale production-grade projects (e.g., Industrial Craft² Bedrock Edition), stabe and reliable.

## Usage

We provide a flat data storage interface, allowing you to directly manipulate data for a specified game instance using the `setData` and `getData` methods of the `databaseManager` instance.

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // Namespace: 'test',
  // Target game object: block,
  // Data identifier: 'test:test_id',
  // Data value: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  databaseManager.setData('test', block, 'test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // Namespace: 'test',
  // Target game object: block,
  // Data identifier: 'test:test_id',
  const value = databaseManager.getData('test', block, 'test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

Of course, during regular development, we recommend that you use the `databaseManager.getOrCreate` method to retrieve the database for a specified game object for data management:

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // Get the database for this block under the namespace 'test'
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // Data identifier: 'test:test_id',
  // Data value: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  blockDataBase.set('test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // Get the database for this block under the namespace 'test'
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // Data identifier: 'test:test_id',
  const value = blockDataBase.get('test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

### Operating Mechanism

All data is first cached at the script layer and automatically saved to dynamic properties at regular intervals (default is three minutes). This process is fully automated, and you don’t need to perform any manual operations.

Of course, you can configure the auto-save interval using the `databaseManager.setFlushInterval` function, with the unit being `tick`.

```ts
// Change the auto-save interval to 10 minutes
databaseManager.setFlushInterval(10 * 60 * 20);
```

When a player exits the game, all modified data will be forcibly saved. If it's on the multi-player server, only the entity object's data saving operation will be triggered when player leave.

To optimize performance, `tendrock-database` traverses and processes all dynamic properties stored in the world object (`world`) when entering the world, archiving eligible dynamic properties for later use. Essentially, this process loads data stored on blocks (`BlockDatabase`) and the world (`WorldDatabase`). Therefore, if you need to initialize any of the above database types early during script loading, we provide the `databaseManager.whenReady` and `databaseManager.isReady` functions to listen for and check the initialization status of the database system:

```ts
// If the database system has already been initialized, the callback function passed in will execute immediately.
// Otherwise, the callback function will be recorded, and a function to cancel the event subscription will be returned.
const dispose = databaseManager.whenReady(() => {
  // Call the getOrCreate function to retrieve the database
  // Other operations...
});
// After calling the dispose function, the associated callback function will be removed from the event queue.
if (dispose) {
  // Unsubscribe from the Ready event
  dispose();
}

world.afterEvents.worldLoad.subscribe(() => {
  if (databaseManager.isReady()) {
    world.sendMessage('Database system is ready!');
  } else {
    world.sendMessage('Database system is not ready!');
  }
});
```

## Roadmap

- [x] Perfect the **README.md**, providing a quick start guide.
- [ ] Provide comprehensive documentation.
- [x] Expose `NamespacedDataManager` in an appropriate way.
- [ ] Visualization tools for data debugging.

## Supported Versions

- ✅ Minecraft Bedrock Edition 1.21.80 Preview
- ✅ Minecraft Bedrock Edition 1.21.70 Stable