# Tendrock-Database

[ 📃 [English](./README.md)  |  ✅ 简体中文 ]

```cmd
npm install @tendrock/database@@latest
```

Tendrock-Database 是 Tendrock 体系下一个为 Minecraft 基岩版 Script API 设计制作的数据管理框架，旨在为基岩版开发者提供方便的数据管理接口，提升脚本性能表现，降低开发心智负担。

## 亮点

- 📦 开箱即用 - Tendrock-Database 提供了丰富便捷的接口，覆盖游戏内容方方面面。在原生支持的数据类型基础上提供了 JSON 对象的直存直取，开发者无需自造轮子即可使用完善的数据管理功能。
- 🚀 全对象支持 - 基于原生动态属性接口，Tendrock-Database 完美覆盖了 `Block`/`Entity`/`ItemStack`/`World` 四大核心游戏对象。
- ⚡ 性能优化 - 基于脏数据缓存、定时自动储存机制与 `runJob` 函数，相比直接使用原生接口，Tendrock-Database 省去了 90% 以上的原生 `setDynamicProperty` 函数调用，将储存操作集中处理并分散到各个 tick ，极大的优化了性能开销，为看门狗拴上了狗链，玩家感知几乎为 0。
- ✨ 全链路类型支持 - 基于 TypeScript 的类型系统实现了健壮的类型约束，轻推 “.”，开始享受智能补全的便捷。
- 🤹 低心智负担 - 分层式设计，基于命名空间实现“数据分盘与隔离”，以游戏对象为单位进行数据管理，接口层面实现数据与游戏内容的绑定。
- 🪄 渐进式框架 - 基于数据 ID 标识实现与现有数据完美兼容，开发者可以将其集成至任意已有项目上。
- 🎊 生产级可靠 - 大型生产级项目（如 Industrial Craft² Bedrock Edition）长期使用验证，稳定可靠有保障。

## 使用

我们提供了扁平化的数据存储接口，您可以直接通过 `databaseManager` 实例的 `setData` 与 `getData` 方法操作指定游戏实例的数据。

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // 命名空间: 'test',
  // 目标游戏对象: block,
  // 数据标识符: 'test:test_id',
  // 数据值: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  databaseManager.setData('test', block, 'test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // 命名空间: 'test',
  // 目标游戏对象: block,
  // 数据标识符: 'test:test_id',
  const value = databaseManager.getData('test', block, 'test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

当然，在常规开发过程中，我们更建议您通过 `databaseManager.getOrCreate` 方法获取指定游戏对象的数据库进行数据管理：

```ts
import {world} from "@minecraft/server";
import {databaseManager} from "@tendrock/database";

world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // 获取该方块在命名空间 'test' 下的数据库
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // 数据标识符: 'test:test_id',
  // 数据值: {typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`}
  blockDataBase.set('test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});

world.afterEvents.playerBreakBlock.subscribe(({block}) => {
  // 获取该方块在命名空间 'test' 下的数据库
  const blockDataBase = databaseManager.getOrCreate('test', block);
  // 数据标识符: 'test:test_id',
  const value = blockDataBase.get('test:test_id');
  console.log('data read: "' + JSON.stringify(value) + '"');
});
```

### 运行机制

所有的数据会先缓存至脚本层，每隔一段时间（默认为三分钟）自动储存至动态属性中。这一过程是全自动的，您无需对其进行任何操作。

当然，您也可以通过 `databaseManager.setFlushInterval` 函数配置自动保存的时间间隔，单位为 `tick`

```ts
// 将自动保存的时间间隔更改为 10 分钟
databaseManager.setFlushInterval(10 * 60 * 20);
```

当玩家退出游戏时，会强制保存所有修改过的数据；如果只是服务器中的玩家退出，则只会触发实体对象的数据保存操作。

为了优化性能，`tendrock-database` 在进入世界时会遍历处理一遍所有储存在世界对象（world）上的动态属性，并将符合要求的动态属性归档备用。这一过程的本质是加载储存在方块（`BlockDatabase`）与世界（`WorldDatabase`）上的数据。因此如果您需要在脚本加载早期初始化任何上述数据库类型，我们提供了 `databaseManager.whenReady` 函数与 `databaseManager.isReady` 函数用于监听与检测数据库系统的初始化状态：

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
- [ ] 可视化数据调试功能

## 支持版本

- ✅ Minecraft 基岩版 1.21.80 预览版
- ✅ Minecraft 基岩版 1.21.70 稳定版

