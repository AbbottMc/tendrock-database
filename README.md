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
- ✨ **Low Cognitive Load** - Layered design based on namespaces for "data partitioning and isolation," managing data by game object units, binding data with game content at the interface level.
- 🪄 **Progressive Framework** - Seamlessly integrates with existing data via data ID tagging, enabling developers to integrate it into any existing projects.
- 🎊 **Production-Grade Reliability** - Long-term use in large-scale production-grade projects (e.g., Industrial Craft² Bedrock Edition), stabe and reliable.

## Roadmap

- [ ] Perfect the **README.md**, providing a quick start guide.
- [ ] Provide comprehensive documentation
- [ ] Visualization tools for data debugging

## Supported Versions

- ✅ Minecraft Bedrock Edition 1.21.80 Preview
- ✅ Minecraft Bedrock Edition 1.21.70 Stable