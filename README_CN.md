# Tendrock-Database

[ 📃 [English](./README.md)  |  ✅ 简体中文 ]

```cmd
npm install @tendrock/database@@latest
```

Tendrock-Database 是 Tendrock 体系下一个为 Minecraft 基岩版 Script API 设计制作的数据管理框架，旨在为基岩版开发者提供方便的数据管理接口，提升脚本性能表现，降低开发心智负担。

## 亮点

- 📦 **开箱即用** - Tendrock-Database 提供了丰富便捷的接口，在原生支持的数据类型基础上提供了 JSON 对象的直存直取，开发者无需自造轮子即可使用完善的数据管理功能。
- 🚀 **全对象支持** - 基于原生动态属性接口，Tendrock-Database 完美覆盖了 `Block`/`Entity`/`ItemStack`/`World` 四大核心游戏对象。
- ⚡ **性能优化** - 基于脏数据缓存、定时自动储存机制与 `runJob` 函数，相比直接使用原生接口，Tendrock-Database 省去了 90% 以上的原生 `setDynamicProperty` 函数调用，将储存操作集中处理并分散到各个 tick ，极大的优化了性能开销，为看门狗拴上了狗链，玩家感知几乎为零。
- ✨ **全链路类型支持** - 基于 TypeScript 的类型系统实现了健壮的类型约束，轻推按键，开始享受智能补全的便捷。
- 🤹 **构造器绑定** - 支持数据与构造器绑定，实现 `数据 <-> 实例` 的自动转换。
- 🪄 **渐进式框架** - 与已有数据完美兼容，开发者可以将其集成至任意已有项目上。
- 🎊 **生产级可靠** - 大型生产级项目（如 Industrial Craft² Bedrock Edition）长期使用验证，稳定可靠有保障。

## 快速开始

我们提供了扁平化的数据存储接口，您可以直接通过 `databaseManager` 实例的 `setData` 与 `getData` 方法操作指定游戏实例的数据。

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // 目标游戏对象: block,
  // 数据标识符: 'test:test_id',
  // 数据值: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  databaseManager.setData(block, 'test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // 目标游戏对象: block,
  // 数据标识符: 'test:test_id',
  const value = databaseManager.getData(block, 'test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

当然，在常规开发过程中，我们更建议您通过 `databaseManager.createIfAbsent` 方法获取指定游戏对象的数据库进行数据管理：

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // 获取该方块的数据库
  const blockDataBase = databaseManager.createIfAbsent(block);
  // 数据标识符: 'test:test_id',
  // 数据值: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  blockDataBase.set('test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // 获取该方块的数据库
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // 数据标识符: 'test:test_id',
  const value = blockDataBase.get('test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

### 实例对象

本数据库提供了直接将对象类型的数据与构造器绑定的功能，允许您以自定义实例的方式来管理对象数据。

```ts
// 该实例持久化存储的数据结构
interface CustomConstructorDataJson extends InstanceDataJson {
  customData: string;
  extraParamLength: number;
  extraParam: string;
}

// 开发者自行定义的选项参数，实例初始化时传入
interface CustomConstructorOptions {
  initialCustomData: string;
  extraParam: string;
}

// 继承自 `InstanceData` 抽象类
export class CustomConstructor extends InstanceData<Block> {
  // 定义成员变量。请勿在此处初始化成员变量的默认值，否则会覆盖后续在钩子回调中初始化的值，最终导致成员变量永远为这里设定的值
  // 可以通过 "!" 或 "?" 来强制显式声明成员变量的类型是否可能为 undefined，否则编译器会报错
  private _customData!: string;
  private _extraParamLength!: number;
  private _extraParam?: string;

  // *[必要] 实现抽象方法，加载实例时调用
  // 描述：当基于此前存储的数据对象初始化实例时，会调用此方法
  // @param dataJson - 此前存储的数据对象
  // @param instanceDataOptions - 实例数据初始化选项参数，提供了初始化对象时的一些运行时参数
  // @param options - 开发者自定义的选项参数
  public onDeserialize(dataJson: CustomConstructorDataJson, instanceDataOptions: InstanceDataOptions, options: CustomConstructorOptions | undefined): void {
    this._customData = dataJson.customData;
    this._extraParamLength = dataJson.extraParamLength;
    this._extraParam = dataJson.extraParam;
  }

  // *[必要] 实现抽象方法，新建实例时调用
  // 描述：当此前存储的数据对象不存在（为 undefined）且存在传入的 options 参数时调用
  // @param options - 开发者自定义的选项参数
  // @param instanceDataOptions - 实例数据初始化选项参数，提供了初始化对象时的一些运行时参数
  public onConstruct(options: CustomConstructorOptions, instanceDataOptions: InstanceDataOptions): void {
    // 如果需要设定默认初始值，请在这里初始化数据
    this._customData = options.initialCustomData ?? 'Initial Data';
    this._extraParam = options.extraParam;
    this._extraParamLength = this._extraParam?.length ?? 0;
  }

  // *[必要] 实现抽象方法，新建实例且 options 和 dataJson 都为 undefined 时调用
  // @param instanceDataOptions - 实例数据初始化选项参数，提供了初始化对象时的一些运行时参数
  public onInitWithNoData(instanceDataOptions: InstanceDataOptions): void {
    throw new Error('CustomConstructor must have "options" parameter when "dataJson" is undefined');
  }

  // *[必要] 序列化数据时调用
  // 这里决定了该实例数据在数据库中的存储格式，通过 serializer 构建，以 JSON 格式保存
  public serialize(serializer: InstanceSerializer) {
    super.serialize(serializer);
    // 传入需要保存的数据键值对即可
    serializer.put('customData', this._customData);
    serializer.put('extraParam', this._extraParam);
    serializer.put('extraParamLength', this._extraParamLength);
  }

  // 自定义方法
  public getCustomData() {
    return this._customData;
  }

  // 自定义方法
  public getExtraParam() {
    return this._extraParam;
  }

  // 自定义方法
  public getComputedCustomData(): string {
    return `custom data: "${this._customData}", extra param: "${this._extraParam}", extra param length: ${this._extraParamLength}`;
  }
}

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // 可通过 databaseManager 中的扁平化函数 `createDataInstanceIfAbsent` 创建自定义实例
  // @param gameObject - 实例绑定的游戏对象，可为 Block | Entity | ItemStack | World | string。这里为 block 对象
  // 其中 string 是方块的位置 ID，储存了该方块的坐标与所在维度，在这里作为方块数据库的唯一标识符，可通过 {@link BlockDatabase#getUid} 函数或是 `@tendrock/location-id` 库中提供的函数获取
  // @param identifier - 数据标识符。这里为 'test:test_id'
  // @param objectConstructor - 实例构造函数，必须继承自 InstanceData。这里为 CustomConstructor
  // @param options - 开发者自定义的选项参数。在您自定义类内类型声明规范的前提下，这里实现了该属性的类型推断与自动补全
  databaseManager.createDataInstanceIfAbsent<CustomConstructor>(block, 'test:test_id', CustomConstructor, {
    initialCustomData: 'This is a custom constructor!',
    extraParam: 'Yes, I got a extra param!'
  });
  console.log('Custom data instance created.');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // 可通过 databaseManager 中的扁平化函数 `getBuiltDataInstance` 获取已构建的自定义实例
  // @param gameObject - 实例绑定的游戏对象，可为 Block | Entity | ItemStack | World | string。这里为 block 对象
  // @param identifier - 数据标识符。这里为 'test:test_id'
  // @returns - 返回已构建的自定义实例，若不存在则返回 undefined
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

如果您希望您的实例数据在数据库初始化时能自动初始化为实例对象，您可以在 Startup 事件中传入其对应的构造函数

```ts
databaseManager.whenStartup(({constructorRegistry}) => {
  // 传入需要在数据库初始化时自动实例化的数据构造器
  constructorRegistry.register(CustomConstructor);
});
```

### 运行机制

所有的数据会先缓存至脚本层，每隔一段时间（默认为三分钟）自动储存至动态属性中。这一过程是全自动的，您无需对其进行任何操作。

当然，您也可以通过 `databaseManager.setFlushInterval` 函数配置自动保存的时间间隔，单位为 `tick`

```ts
// 将自动保存的时间间隔更改为 10 分钟
databaseManager.setFlushInterval(10 * 60 * 20);
```

当玩家退出游戏时，会强制保存所有修改过的数据；如果只是服务器中的玩家退出，则只会触发与该玩家绑定的实体对象数据库（如果有的话）的数据保存操作。

为了优化性能，`tendrock-database` 在进入世界时会遍历处理一遍所有储存在世界对象（world）上的动态属性，并将符合要求的动态属性归档备用。这一过程从数据库层面看在是加载储存在方块（`BlockDatabase`）与世界（`WorldDatabase`）上的数据。因此如果您需要在脚本加载早期初始化任何上述数据库类型，我们提供了 `databaseManager.whenReady` 函数与 `databaseManager.isReady` 函数用于监听与检测数据库系统的初始化状态：

```ts
// 如果此时数据库系统已经初始化完毕，则会立即执行传入的回调函数
// 否则，会记录回调函数并返回一个用于取消事件订阅的函数
const dispose = databaseManager.whenReady(() => {
  // 调用 getOrCreate 函数获取数据库
  // 其他操作...
});
// 调用 dispose 函数后，与之关联的回调函数会被从事件队列中移除
if (dispose) {
  // 取消订阅 Ready 事件
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

## 路线图

- [x] 完善 **README.md**，提供快速上手指南
- [ ] 提供完善的文档
- [x] 以合适的方式开放 `NamespacedDataManager` 
- [x] 实现直接与构造器绑定的功能
- [x] 实现进入世界自动加载世界与方块数据/实例
- [x] 实现去除命名空间的 lite 版本
- [ ] 可视化数据调试功能

## 支持版本

- ✅ Minecraft 基岩版 1.21.90 预览版
- ✅ Minecraft 基岩版 1.21.80 预览版
- ✅ Minecraft 基岩版 1.21.70 稳定版

