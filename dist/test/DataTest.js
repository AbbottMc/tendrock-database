import { CommandPermissionLevel, system, world } from '@minecraft/server';
export class DataTest {
    static init() {
        system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
            customCommandRegistry.registerCommand({
                name: 'tendrock:clearworlddata',
                description: 'Clear world dynamic properties',
                permissionLevel: CommandPermissionLevel.Any,
            }, (origin, ...args) => {
                world.clearDynamicProperties();
                world.sendMessage('----------------------------------------------------');
                world.sendMessage(`World data cleared!`);
                world.sendMessage(`Current world dynamic properties count is: ${world.getDynamicPropertyIds().length}`);
                return undefined;
            });
            customCommandRegistry.registerCommand({
                name: 'tendrock:datalist',
                description: 'Data query command',
                permissionLevel: CommandPermissionLevel.Any
            }, (origin, ...args) => {
                world.sendMessage('----------------------------------------------------');
                world.sendMessage(`Current world dynamic properties count is: ${world.getDynamicPropertyIds().length}`);
                world.sendMessage('------------------------');
                world.getDynamicPropertyIds().forEach((id) => {
                    world.sendMessage(`id: "${id}" - value: ${JSON.stringify(world.getDynamicProperty(id))}`);
                });
                // if (args.length === 0) {
                //   world.sendMessage(`Current world dynamic properties count is: ${world.getDynamicPropertyIds().length}`);
                // } else if (args[0] === 'world') {
                //   if (args[1] === 'count') {
                //     world.sendMessage(`Current world dynamic properties count is: ${world.getDynamicPropertyIds().length}`);
                //   }
                // }
                return undefined;
            });
        });
    }
}
