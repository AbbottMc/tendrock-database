import {world} from "@minecraft/server";
import {databaseManager, DatabaseTypes} from "../database";


world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  // // const blockDataBase = databaseManager.getOrCreate('test', block);
  // for (let i = 0; i < 10000; i++) {
  //   databaseManager.setData('test', block, `test:test_id_${i}`, {
  //     typeId: block.typeId, loopTime: i, message: `${block.localizationKey} data saved ${i} times!`
  //   });
  // }
  // console.log(block.typeId)
  databaseManager.setData('test', block, 'test:test_id', {
    typeId: block.typeId, location: block.location, message: `${block.localizationKey} is placed!`
  });
  console.log('data saved');
});
// console.log('data read: "' + world.getDynamicProperty(`test-${UniqueIdUtils.getBlockUniqueId(block)}-test:test_id`) + '"');

world.beforeEvents.playerBreakBlock.subscribe(({block}) => {
  // const blockDataBase = databaseManager.getOrCreate('test', block);
  // const id = `test:test_id_${Math.floor(Math.random() * 10000)}`;
  // console.log(id)
  // console.log('data read: "' + JSON.stringify(databaseManager.getData('test', block, id)) + '"');

  const list = databaseManager.getDatabaseList('test', DatabaseTypes.Block);
  console.log(list.length);
  console.log(JSON.stringify(list.map((d) => d.getGameObject().typeId)));
});
