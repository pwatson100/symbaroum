export const migrateWorld = async () => {
    /* WorldTemplateVersion was used on symbaroum for tracking template changes until foundryVTT 0.8
    After that, we use worldSystemVersion
    Worlds created after 0.8 should have WorldTemplateVersion = 0, so should older worlds that have been properly updated. */
    let worldTemplateVersion;
    try {
        worldTemplateVersion = Number(game.settings.get("symbaroum", "worldTemplateVersion"));
        game.symbaroum.info(`Detected worldTemplateVersion: ${worldTemplateVersion}`);
    }
    catch (e) {
        game.symbaroum.error(e);
        worldTemplateVersion = 1;
        game.symbaroum.info("No template version detected... Default to 1")
    }
    let systemVersion = game.system.version;
    let worldSystemVersion;
    try {
        worldSystemVersion = game.settings.get('symbaroum', 'systemMigrationVersion');
    } catch (e) {
        game.symbaroum.error(e);
        worldSystemVersion = '0';
    }
    game.symbaroum.info(`Last migration on this world: ${worldSystemVersion}`);
    // the NEEDS_MIGRATION_VERSION have to be increased for migration to happen
    const NEEDS_MIGRATION_VERSION = '4.3.1';
    const COMPATIBLE_MIGRATION_VERSION = '3.1.8' || isNaN('NaN');
    let needMigration = foundry.utils.isNewerVersion(NEEDS_MIGRATION_VERSION, worldSystemVersion);
    game.symbaroum.info('needMigration', needMigration, systemVersion);

    if (!needMigration || !game.user.isGM) {
        return;
    }
    // Perform the migration
    if (worldSystemVersion != '0' && foundry.utils.isNewerVersion(COMPATIBLE_MIGRATION_VERSION, worldSystemVersion)) {
        ui.notifications.error(
            `Your Symbaroum system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
            { permanent: true }
        );
    }

    ui.notifications.info("New system version upgrades the world, please wait...");
    for (let actor of game.actors.contents) {
        try {
            const updateData = migrateActorData(actor.toObject(), worldSystemVersion);
            if (!foundry.utils.isEmpty(updateData)) {
                game.symbaroum.info(`Migrating Actor entity ${actor.name}`);
                await actor.update(updateData, { enforceTypes: false });
            }
        } catch (e) {
            e.message = `Failed migration for Actor ${actor.name}: ${e.message}`;
            game.symbaroum.error(e);
        }
    }
    for (let item of game.items.contents) {
        try {
            const updateData = migrateItemData(item.toObject(), worldSystemVersion);
            if (!foundry.utils.isEmpty(updateData)) {
                game.symbaroum.info(`Migrating Item entity ${item.name}`);
                await item.update(updateData, { enforceTypes: false });
            }
        } catch (e) {
            e.message = `Failed migration for Item ${item.name}: ${e.message}`;
            game.symbaroum.error(e);
        }
    }

    // Migrate Scenes
    /*
    for (let scene of game.scenes.contents) {
        try {
            const updateData = migrateSceneData(scene, worldSystemVersion);
            if (!foundry.utils.isEmpty(updateData)) {
                await scene.update(updateData, {enforceTypes: false});                    
            }
        } catch (err) {
            err.message = `Failed migration for Scene ${scene.name}: ${err.message}`;          
            game.symbaroum.error(err);
        }
    }
    */

    // Migrate Compendiums
    // for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
    //     await migrateCompendium(pack, worldSystemVersion);
    // }
    game.settings.set("symbaroum", "systemMigrationVersion", systemVersion);
    ui.notifications.info("Upgrade complete!");
};


const migrateActorData = (actor, worldSystemVersion) => {
    let updateData = {};
    // Migrate actor template
/*   Example
    if (foundry.utils.isNewerVersion("2.21.0", worldSystemVersion)) {
        update = setValueIfNotExists(update, actor, "data.attributes.accurate.total", 0);
    };
    // Migrate Actor items
*/  if (!actor.items) return updateData;
    const items = actor.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = migrateItemData(itemData);
        if (!foundry.utils.isEmpty(itemUpdate)) {
            itemUpdate._id = itemData._id;
            arr.push(expandObject(itemUpdate));
        }
        return arr;
    }, []);
    if (items.length > 0) updateData.items = items;
    return updateData;
}

const migrateItemData = (item, worldSystemVersion) => {
    let update = {};
    if (item.type === 'weapon' && item.system.reference === 'shield') {
        let shieldbonus = parseInt(item.system.bonus.defense) || 0;
        if(shieldbonus > 0) {
            update[`system.bonus.defense`] = (shieldbonus-1);
            console.log(`updating Item ${item.name}[${item._id}]`);
        }
    }
    return update;
};

export const migrateSceneData = function (scene) {
    const tokens = scene.tokens.map(token => {
        const t = duplicate(token.document);
        if (!t.actorId || t.actorLink) {
            t.actorData = {};
        } else if (!game.actors.has(t.actorId)) {
            t.actorId = null;
            t.actorData = {};
        } else if (!t.actorLink) {
            const actorData = duplicate(t.actorData ?? t.delta);
            actorData.type = token.actor?.type;
            const update = migrateActorData(actorData);
            ['items', 'effects'].forEach(embeddedName => {
                if (!update[embeddedName]?.length) return;
                const updates = new Map(update[embeddedName].map(u => [u._id, u]));
                t.actorData[embeddedName].forEach(original => {
                    const update = updates.get(original._id);
                    if (update) mergeObject(original, update);
                });
                delete update[embeddedName];
            });

            mergeObject(t.actorData ?? t.delta, update);
        }
        return t;
    });
    return { tokens };
};

export const migrateCompendium = async function (pack, worldSystemVersion) {
    const entity = pack.metadata.entity;
    if (!["Actor", "Item", "Scene"].includes(entity)) return;
    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({ locked: false });

    await pack.migrate();
    const content = await pack.getDocuments();

    for (let ent of content) {
        let updateData = {};
        try {
            if (entity === "Item") {
                updateData = migrateItemData(ent.toObject(), worldSystemVersion);
            } else if (entity === "Actor") {
                updateData = migrateActorData(ent.toObject(), worldSystemVersion);
            } else if (entity === "Scene") {
                updateData = migrateSceneData(ent, worldSystemVersion);
            }

            // Save the entry, if data was changed
            if (foundry.utils.isObjectEmpty(updateData)) continue;
            await ent.update(updateData);
            game.symbaroum.info(`Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`);
        }
        catch (err) {
            err.message = `Failed system migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
            game.symbaroum.error(err);
        }
    }
};


const setValueIfNotExists = (update, object, property, newValue) => {
    if (typeof (getProperty(object, property)) === 'undefined') {
        update[property] = newValue;
    }
    return update;
}