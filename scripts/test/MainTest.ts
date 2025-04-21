import {Block, world} from "@minecraft/server";
import {databaseManager} from "../database";

let testBlock: Block;
world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // // const blockDataBase = databaseManager.getOrCreate('test', block);
  // for (let i = 0; i < 10000; i++) {
  //   databaseManager.setData('test', block, `test:test_id_${i}`, {
  //     typeId: block.typeId, loopTime: i, message: `${block.localizationKey} data saved ${i} times!`
  //   });
  // }
  // console.log(block.typeId)
  // databaseManager.setData('test', block, 'test:test_id', {
  //   typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  // });
  // console.log('data saved');
  testBlock = block;
  const blockDatabase = databaseManager.createIfAbsent('test', testBlock);
  if (blockDatabase.size() <= 0) {
    blockDatabase.set('test:test_id', {
      typeId: testBlock.typeId, message: `${testBlock.typeId} is used!`
    });
  }
});
// console.log('data read: "' + world.getDynamicProperty(`test-${UniqueIdUtils.getBlockUniqueId(block)}-test:test_id`) + '"');

world.beforeEvents.playerBreakBlock.subscribe(({block, player}) => {
  // const blockDataBase = databaseManager.getOrCreate('test', block);
  // const id = `test:test_id_${Math.floor(Math.random() * 10000)}`;
  // console.log(id)
  // console.log('data read: "' + JSON.stringify(databaseManager.getData('test', block, id)) + '"');
  //
  // const list = databaseManager.getDatabaseList('test', DatabaseTypes.Block);
  // console.log(list.length);
  // console.log(JSON.stringify(list.map((d) => d.getGameObject().typeId)));
});

//
// world.afterEvents.playerInteractWithBlock.subscribe(({player, itemStack}) => {
//   const logItemDatabase = databaseManager.getDatabaseList('test', DatabaseTypes.Item)[0];
//   console.log(logItemDatabase?.getGameObject()?.typeId, logItemDatabase?.getGameObject()?.amount);
//
//   const itemDatabase = databaseManager.getOrCreate('test', itemStack!);
//   if (!itemStack) return;
//   if (itemDatabase.size() <= 0) {
//     itemDatabase.set('test:test_id', {
//       typeId: itemStack.typeId, message: `${itemStack.typeId} is used!`
//     });
//   }
//   PlayerUtils.consumeMainHandItem(player, 1);
// });

world.afterEvents.entityHitEntity.subscribe(({damagingEntity, hitEntity}) => {
  const entityDatabase = databaseManager.createIfAbsent('test', hitEntity);
  if (entityDatabase.size() <= 0) {
    entityDatabase.set('test:test_id', {
      typeId: hitEntity.typeId, message: `${hitEntity.typeId} is hit!`
    });
    console.log(hitEntity.typeId);
  } else {
    console.log('entityDatabase size: ', entityDatabase.size())
    console.log(JSON.stringify(entityDatabase.get('test:test_id')));
    console.log(hitEntity.id);
    console.log(entityDatabase.getGameObject()?.id);
    // hitEntity.triggerEvent('minecraft:convert_to_drowned');
  }
});