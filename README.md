# Tendrock-Database

[ 📃 [English](./README.md)  |  ✅ Simplified Chinese ]

```cmd
npm install @tendrock/database@latest
```

Tendrock-Database is a data management framework designed for the Minecraft Bedrock Edition Script API under the Tendrock ecosystem. It aims to provide convenient data management interfaces for Bedrock Edition developers, enhance script performance, and reduce cognitive load during development.

## Highlights

- 📦 **Ready to Use** - Tendrock-Database offers a rich set of convenient APIs, providing direct storage and retrieval of JSON objects on top of natively supported data types. Developers can use robust data management features without reinventing the wheel.
- 🚀 **Full Object Support** - Based on native dynamic property APIs, Tendrock-Database perfectly covers the four core game objects: `Block`/`Entity`/`ItemStack`/`World`.
- ⚡ **Performance Optimization** - With dirty data caching, scheduled auto-save mechanisms, and the `runJob` function, Tendrock-Database reduces over 90% of native `setDynamicProperty` function calls compared to using native interfaces directly. It centralizes and distributes storage operations across ticks, significantly optimizing performance overhead and keeping watchdog impacts virtually imperceptible to players.
- ✨ **Full-Chain Type Support** - Robust type constraints are implemented based on TypeScript's type system. Just gently press button, and start enjoying the convenience of intelligent auto-completion.
- 🤹 **Constructor Binding** - Supports binding data with constructor, enabling automatic conversion between `data <-> instance`.
- 🪄 **Progressive Framework** - Fully compatible with existing data, allowing developers to integrate it into any existing project.
- 🎊 **Production-Grade Reliability** - Long-term use in large-scale production-grade projects (e.g., Industrial Craft² Bedrock Edition), stable and reliable.

## Quick Start

We provided a flat data storage interface, allowing you to directly manipulate data for a specified game instance using the `setData` and `getData` methods of the `databaseManager` instance.

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // Target game object: block,
  // Data identifier: 'test:test_id',
  // Data value: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  databaseManager.setData(block, 'test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // Target game object: block,
  // Data identifier: 'test:test_id',
  const value = databaseManager.getData(block, 'test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

Of course, during regular development, we recommend that you use the `databaseManager.createIfAbsent` method to retrieve the database for a specified game object for data management:

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // Get the database for this block
  const blockDataBase = databaseManager.createIfAbsent(block);
  // Data identifier: 'test:test_id',
  // Data value: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  blockDataBase.set('test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // Get the database for this block
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // Data identifier: 'test:test_id',
  const value = blockDataBase.get('test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

### Instance Objects

This database provides functionality to directly bind object-type data with constructors, allowing you to manage object data using custom instances.

```ts
// The data structure for persistent storage of this instance
interface CustomConstructorDataJson extends InstanceDataJson {
  customData: string;
  extraParamLength: number;
  extraParam: string;
}

// Developer-defined option parameters passed during instance initialization
interface CustomConstructorOptions {
  initialCustomData: string;
  extraParam: string;
}

// Extends the abstract class `InstanceData`
export class CustomConstructor extends InstanceData<Block> {
  // Define member variables. Do not initialize default values for member variables here, as it would override values initialized later in hook callbacks, causing the member variables to always remain at the values set here.
  // Use "!" or "?" to explicitly declare whether the type of a member variable may be undefined; otherwise, the compiler will throw an error.
  private _customData!: string;
  private _extraParamLength!: number;
  private _extraParam?: string;

  // *[Required] Implement the abstract method, called when loading an instance
  // Description: Called when initializing an instance based on previously stored data objects.
  // @param dataJson - Previously stored data object
  // @param instanceDataOptions - Instance data initialization options, providing runtime parameters during object initialization
  // @param options - Developer-defined option parameters
  public onDeserialize(dataJson: CustomConstructorDataJson, instanceDataOptions: InstanceDataOptions, options: CustomConstructorOptions | undefined): void {
    this._customData = dataJson.customData;
    this._extraParamLength = dataJson.extraParamLength;
    this._extraParam = dataJson.extraParam;
  }

  // *[Required] Implement the abstract method, called when creating a new instance
  // Description: Called when the previously stored data object is undefined and there are incoming options parameters.
  // @param options - Developer-defined option parameters
  // @param instanceDataOptions - Instance data initialization options, providing runtime parameters during object initialization
  public onConstruct(options: CustomConstructorOptions, instanceDataOptions: InstanceDataOptions): void {
    // Initialize data here if you need to set default values
    this._customData = options.initialCustomData ?? 'Initial Data';
    this._extraParam = options.extraParam;
    this._extraParamLength = this._extraParam?.length ?? 0;
  }

  // *[Required] Implement the abstract method, called when creating a new instance and both options and dataJson are undefined
  // @param instanceDataOptions - Instance data initialization options, providing runtime parameters during object initialization
  public onInitWithNoData(instanceDataOptions: InstanceDataOptions): void {
    throw new Error('CustomConstructor must have "options" parameter when "dataJson" is undefined');
  }

  // *[Required] Called when serializing data
  // This determines the storage format of this instance data in the database, built via serializer, and saved in JSON format.
  public serialize(serializer: InstanceSerializer) {
    super.serialize(serializer);
    // Pass in key-value pairs of data that need to be saved
    serializer.put('customData', this._customData);
    serializer.put('extraParam', this._extraParam);
    serializer.put('extraParamLength', this._extraParamLength);
  }

  // Custom method
  public getCustomData() {
    return this._customData;
  }

  // Custom method
  public getExtraParam() {
    return this._extraParam;
  }

  // Custom method
  public getComputedCustomData(): string {
    return `custom data: "${this._customData}", extra param: "${this._extraParam}", extra param length: ${this._extraParamLength}`;
  }
}

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // You can create a custom instance via the flattened function `createDataInstanceIfAbsent` in databaseManager
  // @param gameObject - The game object bound to the instance, which can be Block | Entity | ItemStack | World | string. Here, it is the block object.
  // Among them, string is the block's location ID, storing the block's coordinates and dimension info, serving as the unique identifier for the block database. It can be obtained via the BlockDatabase#getUid function or functions provided by the `@tendrock/location-id` library.
  // @param identifier - Data identifier. Here, it is 'test:test_id'.
  // @param objectConstructor - Instance constructor, which must inherit from InstanceData. Here, it is CustomConstructor.
  // @param options - Developer-defined option parameters. With proper type declarations in your custom class, this attribute supports type inference and auto-completion.
  databaseManager.createDataInstanceIfAbsent<CustomConstructor>(block, 'test:test_id', CustomConstructor, {
    initialCustomData: 'This is a custom constructor!',
    extraParam: 'Yes, I got a extra param!'
  });
  console.log('Custom data instance created.');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // You can retrieve a built custom instance via the flattened function `getBuiltDataInstance` in databaseManager
  // @param gameObject - The game object bound to the instance, which can be Block | Entity | ItemStack | World | string. Here, it is the block object.
  // @param identifier - Data identifier. Here, it is 'test:test_id'.
  // @returns - Returns the built custom instance; returns undefined if it does not exist.
  const customDataInstance = databaseManager.getBuiltDataInstance<CustomConstructor>(block, 'test:test_id');
  if (customDataInstance) {
    console.log(`Custom data: "${customDataInstance.getCustomData()}", extra param: "${customDataInstance.getExtraParam()}".`);
    console.log(`Computed custom data: "${customDataInstance.getComputedCustomData()}".`);
    databaseManager.deleteData(block, 'test:test_id');
    console.log('Custom data instance deleted.');
  } else {
    console.log('Custom data instance is not found.');
  }
});
```

If you want your instance data to automatically initialize into instance objects during database initialization, you can pass its corresponding constructor in the Startup event:

```ts
databaseManager.whenStartup(({constructorRegistry}) => {
  // Pass in data constructors that need to be automatically instantiated during database initialization
  constructorRegistry.register(CustomConstructor);
});
```

### Operating Mechanism

All data is first cached at the script layer and automatically saved to dynamic properties at regular intervals (default is three minutes). This process is fully automated, and you don’t need to perform any manual operations.

Of course, you can configure the auto-save interval using the `databaseManager.setFlushInterval` function, with the unit being `tick`.

```ts
// Change the auto-save interval to 10 minutes
databaseManager.setFlushInterval(10 * 60 * 20);
```

When a player exits the game, all modified data will be forcibly saved. If only a player on the multi-player server exits, only the entity object database bound to that player (if database exists) will trigger a save operation.

To optimize performance, `tendrock-database` traverses and processes all dynamic properties stored in the world object (`world`) when entering the world, archiving eligible dynamic properties for later use. From the database perspective, this process loads data stored on blocks (`BlockDatabase`) and the world (`WorldDatabase`). Therefore, if you need to initialize any of the above database types early during script loading, we provide the `databaseManager.whenReady` and `databaseManager.isReady` functions to listen for and check the initialization status of the database system:

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

- [x] Improve **README.md**, providing a quick start guide
- [ ] Provide comprehensive documentation
- [x] Expose `NamespacedDataManager` in an appropriate way
- [x] Implement direct binding with constructors
- [x] Implement automatic loading of world and block data/instances upon entering the world
- [x] Implement a lite version without namespaces
- [ ] Visualization tools for data debugging

## Supported Versions

- ✅ Minecraft Bedrock Edition 1.21.90 Preview
- ✅ Minecraft Bedrock Edition 1.21.80 Preview
- ✅ Minecraft Bedrock Edition 1.21.70 Stable