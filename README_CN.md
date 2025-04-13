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
- ✨ 低心智负担 - 分层式设计，基于命名空间实现“数据分盘与隔离”，以游戏对象为单位进行数据管理，接口层面实现数据与游戏内容的绑定。
- 🪄 渐进式框架 - 基于数据 ID 标识实现与现有数据完美兼容，开发者可以将其集成至任意已有项目上。
- 🎊 生产级可靠 - 大型生产级项目（如 Industrial Craft² Bedrock Edition）长期使用验证，稳定可靠有保障。

## 路线图

- [ ] 完善 **README.md**，提供快速上手指南
- [ ] 提供完善的文档
- [ ] 可视化数据调试功能

## 支持版本

- ✅ Minecraft 基岩版 1.21.80 预览版
- ✅ Minecraft 基岩版 1.21.70 稳定版

