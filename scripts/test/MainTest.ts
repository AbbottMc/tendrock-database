import {world} from "@minecraft/server";
import {databaseManager} from "../database/manager/DatabaseManager";


world.afterEvents.playerPlaceBlock.subscribe(({block}) => {
  const blockDataBase = databaseManager.getOrCreate('test', block);
  blockDataBase.set('test:test_id', 'Test Message!!');
  console.log('data read: "' + blockDataBase.get('test:test_id') + '"');
  world.getDynamicPropertyIds().forEach((id) => {
    console.log(id);
    console.log(world.getDynamicProperty(id));
  })
});