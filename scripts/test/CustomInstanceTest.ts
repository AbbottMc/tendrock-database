import {databaseManager, InstanceData, InstanceDataJson, InstanceDataOptions, InstanceSerializer} from "../database";
import {Block, world} from "@minecraft/server";
import {DataTest} from "./DataTest";

DataTest.init();

databaseManager.setFlushInterval(6 * 20, false);


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

databaseManager.whenStartup(({constructorRegistry}) => {
  // 传入需要在数据库初始化时自动实例化的数据构造器
  constructorRegistry.register(CustomConstructor);
});
