import { isNewerVersion } from '/common/utils/helpers.mjs';

export const migrateWorld = async () => {
    /* WorldTemplateVersion was used on symbaroum for tracking template changes until foundryVTT 0.8
    After that, we use worldSystemVersion
    Worlds created after 0.8 should have WorldTemplateVersion = 0, so should older worlds that have been properly updated. */
    let worldTemplateVersion;
    try{
        worldTemplateVersion = Number(game.settings.get("symbaroum", "worldTemplateVersion"));
        console.log(`Detected worldTemplateVersion: ${worldTemplateVersion}`);
    }
    catch(e){
        console.error(e);
        worldTemplateVersion = 1;
        console.log("No template version detected... Default to 1")
    }
    if(worldTemplateVersion && (worldTemplateVersion < 3.3) && game.user.isGM){ //the world hasn't been properly migrated since foundryVTT0.8
//    if((worldTemplateVersion < 3.3) && game.user.isGM){ //the world hasn't been properly migrated since foundryVTT0.8
        migrateOldWorld(worldTemplateVersion)
    }
    let systemVersion = game.system.data.version;
    let worldSystemVersion;
    try{
        worldSystemVersion = game.settings.get('symbaroum', 'systemMigrationVersion')
    }catch (e) {
        console.error(e);
        worldSystemVersion = '0';
    }
    console.log(`Last migration on this world: ${worldSystemVersion}`);
    // the NEEDS_MIGRATION_VERSION have to be increased for migration to happen
    const NEEDS_MIGRATION_VERSION = '3.0.6';
    const COMPATIBLE_MIGRATION_VERSION = '0' || isNaN('NaN');
    let needMigration = isNewerVersion(NEEDS_MIGRATION_VERSION, worldSystemVersion);
    console.warn('needMigration', needMigration, systemVersion);

    if(needMigration && game.user.isGM){
    // Perform the migration
        if (worldSystemVersion && worldSystemVersion < COMPATIBLE_MIGRATION_VERSION) {
            ui.notifications.error(
                `Your Symbaroum system data is from too old a Foundry version and cannot be reliably migrated to the latest version. The process will be attempted, but errors may occur.`,
                { permanent: true }
            );
        }

        ui.notifications.info("New system version upgrades the world, please wait...");
        for (let actor of game.actors) {
            try {
                const updateData = migrateActorData(actor.toObject(), worldSystemVersion);
                if (!foundry.utils.isObjectEmpty(updateData)) {
                    console.log(`Migrating Actor entity ${actor.name}`);            
                    await actor.update(updateData, {enforceTypes: false});
                }
            } catch (e) {
                e.message = `Failed migration for Actor ${actor.name}: ${e.message}`;
                console.error(e);
            }
        }
        for (let item of game.items) {
            try {
                const updateData = migrateItemData(item.toObject(), worldSystemVersion);
                if (!foundry.utils.isObjectEmpty(updateData)) {
                    console.log(`Migrating Item entity ${item.name}`);  
                    await item.update(updateData, {enforceTypes: false});
                }
            } catch (e) {
                e.message = `Failed migration for Item ${item.name}: ${e.message}`;
                console.error(e);
            }
        }
        for (let scene of game.scenes) {
            try {
                const updateData = migrateSceneData(scene.data, worldSystemVersion);
                if (!foundry.utils.isObjectEmpty(updateData)) {
                    await scene.update(updateData, {enforceTypes: false});
                    scene.tokens.forEach(t => t._actor = null);

                }
            } catch (err) {
                err.message = `Failed migration for Scene ${scene.name}: ${err.message}`;          
                console.error(err);
            }
        }
        for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldSystemVersion);
        }
        game.settings.set("symbaroum", "systemMigrationVersion", systemVersion);
        ui.notifications.info("Upgrade complete!");
    }
};


const migrateOldWorld = async (worldTemplateVersion) => {
    ui.notifications.info("New template detected; Upgrading the world, please wait...");
    if (worldTemplateVersion && (worldTemplateVersion < 3)) {
        const htmlTemplate = await renderTemplate("systems/symbaroum/template/migration-warning.html");
        new Dialog({
            title: "WARNING", 
            content: htmlTemplate,
            buttons: {
                close: {
                    label: "Close"
                }
            }
        }).render(true);
    }
    for (let actor of game.actors) {
        try {
            const updateData = migrateOldActorData(actor.toObject(), worldTemplateVersion);
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Actor entity ${actor.name}`);            
                await actor.update(updateData, {enforceTypes: false});
            }
        } catch (e) {
            e.message = `Failed migration for Actor ${actor.name}: ${e.message}`;
            console.error(e);
        }
    }
    for (let item of game.items) {
        try {
            const updateData = migrateOldItemData(item.toObject(), worldTemplateVersion);
            if (!foundry.utils.isObjectEmpty(updateData)) {
                console.log(`Migrating Item entity ${item.name}`);  
                await item.update(updateData, {enforceTypes: false});
            }
        } catch (e) {
            e.message = `Failed migration for Item ${item.name}: ${e.message}`;
            console.error(e);
        }
    }
    for (let scene of game.scenes) {
        try {
            const updateData = migrateOldSceneData(scene.data, worldTemplateVersion);
            if (!foundry.utils.isObjectEmpty(updateData)) {
                await scene.update(updateData, {enforceTypes: false});
                scene.tokens.forEach(t => t._actor = null);

            }
        } catch (err) {
            err.message = `Failed migration for Scene ${scene.name}: ${err.message}`;          
            console.error(err);
        }
    }
    game.settings.set("symbaroum", "worldTemplateVersion", 4);
    ui.notifications.info("Upgrade complete!");
};
      
const migrateActorData = (actor, worldSystemVersion) => {
    let updateData = {};
    // Migrate actor template
/*   Example
    if (isNewerVersion("2.21.0", worldSystemVersion)) {
        update = setValueIfNotExists(update, actor, "data.attributes.accurate.total", 0);
    };
    // Migrate Actor items
*/  if (!actor.items) return updateData;
    const items = actor.items.reduce((arr, i) => {
        // Migrate the Owned Item
        const itemData = i instanceof CONFIG.Item.documentClass ? i.toObject() : i;
        let itemUpdate = migrateItemData(itemData);
        if ( !isObjectEmpty(itemUpdate) ) {
            itemUpdate._id = itemData._id;
            arr.push(expandObject(itemUpdate));
        }
        return arr;
    }, []);
    if ( items.length > 0 ) updateData.items = items;
    return updateData;
}

const migrateItemData = (item, worldSystemVersion) => {
    let update = {};
    if (isNewerVersion("3.0.6", worldSystemVersion)) {
        const gearType = [ "weapon", "armor", "equipment" ];
        if (gearType.includes(item.type)) {
            update = setValueIfNotExists(update, item, "data.isArtifact", false);
            update = setValueIfNotExists(update, item, "data.power", [
                {"name": "", "description": "", "action": "", "corruption": ""},
                {"name": "", "description": "", "action": "", "corruption": ""},
                {"name": "", "description": "", "action": "", "corruption": ""},
                {"name": "", "description": "", "action": "", "corruption": ""},
                {"name": "", "description": "", "action": "", "corruption": ""}
              ])
        }
    }
    if (!isObjectEmpty(update)) {
        update._id = item.data.id;
    }
    return update;
};

export const migrateSceneData = function(scene) {
    const tokens = scene.tokens.map(token => {
        const t = token.toJSON(); 
        if (!t.actorId || t.actorLink) {
            t.actorData = {};
        }
        else if (!game.actors.has(t.actorId)){
        t.actorId = null;
        t.actorData = {};
        }
        else if (!t.actorLink) {
        const actorData = duplicate(t.actorData);
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
  
        mergeObject(t.actorData, update);
      }
      return t;
    });
    return {tokens};
  };

export const migrateCompendium = async function (pack, worldSystemVersion) {
    const entity = pack.metadata.entity;
    if ( !["Actor", "Item", "Scene"].includes(entity) ) return;
    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

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
                updateData = migrateSceneData(ent.data, worldSystemVersion);
            }

                // Save the entry, if data was changed
            if ( foundry.utils.isObjectEmpty(updateData) ) continue;
            await ent.update(updateData);
            console.log(`Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`);
        }
        catch(err) {
            err.message = `Failed system migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }
};

const migrateOldActorData = (actor, worldTemplateVersion) => {
    let update = {};
    if (worldTemplateVersion < 3) {
        update = setValueIfNotExists(update, actor, "data.data.initiative.attribute", "quick");
        update = setValueIfNotExists(update, actor, "data.data.initiative.value", 0);
        update = setValueIfNotExists(update, actor, "data.data.defense.attribute", "quick");
        update = setValueIfNotExists(update, actor, "data.data.corruption.max", 0);
        update = setValueIfNotExists(update, actor, "data.data.experience.spent", 0);
        update = setValueIfNotExists(update, actor, "data.data.experience.available", 0);
        update = setValueIfNotExists(update, actor, "data.data.experience.artifactrr", 0);
        update = setValueIfNotExists(update, actor, "data.data.health.corruption.value", 0);
        update = setValueIfNotExists(update, actor, "data.data.health.corruption.longterm", 0)
    };
    if (worldTemplateVersion < 3.2) {
        update = setValueIfNotExists(update, actor, "data.attributes.accurate.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.cunning.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.discreet.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.quick.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.persuasive.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.resolute.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.strong.temporaryMod", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.vigilant.temporaryMod", 0)
    };
    if (worldTemplateVersion < 3.3) {
        update = setValueIfNotExists(update, actor, "data.attributes.accurate.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.cunning.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.discreet.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.quick.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.persuasive.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.resolute.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.strong.total", 0);
        update = setValueIfNotExists(update, actor, "data.attributes.vigilant.total", 0)
    };
        
    let itemsChanged = false;
    console.log(actor);
    const items = actor.items.map((item) => {
        const itemUpdate = migrateOldItemData(item, worldTemplateVersion);
        if (!isObjectEmpty(itemUpdate)) {
            itemsChanged = true;
            return mergeObject(item, itemUpdate, {enforceTypes: false, inplace: false});
        }
        return item;
    });
    if (itemsChanged) {
        update.items = items;
    }
    return update;
};

const migrateOldItemData = (item, worldTemplateVersion) => {
    let update = {};
    if (worldTemplateVersion < 3) {
        const powerType = [ "trait", "ability", "mysticalPower", "ritual", "burden", "boon" ];
        const gearType = [ "weapon", "armor", "equipment", "artifact" ];
        if (powerType.includes(item.type)) {
            update = setValueIfNotExists(update, item, "data.bonus.defense", 0);
            update = setValueIfNotExists(update, item, "data.bonus.accurate", 0);
            update = setValueIfNotExists(update, item, "data.bonus.cunning", 0);
            update = setValueIfNotExists(update, item, "data.bonus.discreet", 0);
            update = setValueIfNotExists(update, item, "data.bonus.persuasive", 0);
            update = setValueIfNotExists(update, item, "data.bonus.quick", 0);
            update = setValueIfNotExists(update, item, "data.bonus.resolute", 0);
            update = setValueIfNotExists(update, item, "data.bonus.strong", 0);
            update = setValueIfNotExists(update, item, "data.bonus.vigilant", 0);
            update = setValueIfNotExists(update, item, "data.bonus.toughness.max", 0);
            update = setValueIfNotExists(update, item, "data.bonus.toughness.threshold", 0);
            update = setValueIfNotExists(update, item, "data.bonus.corruption.max", 0);
            update = setValueIfNotExists(update, item, "data.bonus.corruption.threshold", 0);           
        }
        else if (gearType.includes(item.type)) {
            update = setValueIfNotExists(update, item, "data.bonus.toughness.max", 0);
            update = setValueIfNotExists(update, item, "data.bonus.toughness.threshold", 0);
            update = setValueIfNotExists(update, item, "data.bonus.corruption.max", 0);
            update = setValueIfNotExists(update, item, "data.bonus.corruption.threshold", 0)  
        }
            update = setValueIfNotExists(update, item, "data.reference", "");


        if (item.type === "weapon") {
            update = setValueIfNotExists(update, item, "data.qualities.bastard", false);
            update = setValueIfNotExists(update, item, "data.qualities.returning", false);
            update = setValueIfNotExists(update, item, "data.qualities.blunt", false);
            update = setValueIfNotExists(update, item, "data.qualities.short", false);
            update = setValueIfNotExists(update, item, "data.qualities.unwieldy", false);
            update = setValueIfNotExists(update, item, "data.qualities.wrecking", false);
            update = setValueIfNotExists(update, item, "data.qualities.concealed", false);
            update = setValueIfNotExists(update, item, "data.qualities.balanced", false);
            update = setValueIfNotExists(update, item, "data.qualities.deepImpact", false);
            update = setValueIfNotExists(update, item, "data.qualities.jointed", false);
            update = setValueIfNotExists(update, item, "data.qualities.ensnaring", false);
            update = setValueIfNotExists(update, item, "data.qualities.long", false);
            update = setValueIfNotExists(update, item, "data.qualities.massive", false);
            update = setValueIfNotExists(update, item, "data.qualities.precise", false);
            update = setValueIfNotExists(update, item, "data.qualities.bloodLetting", false);
            update = setValueIfNotExists(update, item, "data.qualities.areaMeleeRadius", false);
            update = setValueIfNotExists(update, item, "data.qualities.areaShortRadius", false);
            update = setValueIfNotExists(update, item, "data.qualities.areaCone", false);
            update = setValueIfNotExists(update, item, "data.qualities.acidcoated", false);
            update = setValueIfNotExists(update, item, "data.qualities.bane", false);
            update = setValueIfNotExists(update, item, "data.qualities.deathrune", false);
            update = setValueIfNotExists(update, item, "data.qualities.flaming", false);
            update = setValueIfNotExists(update, item, "data.qualities.hallowed", false);
            update = setValueIfNotExists(update, item, "data.qualities.desecrated", false);
            update = setValueIfNotExists(update, item, "data.qualities.poison", false);
            update = setValueIfNotExists(update, item, "data.qualities.thundering", false);
            update = setValueIfNotExists(update, item, "data.qualities.mystical", false);
        }
        if ((item.type === "equipment") || (item.type === "weapon")) {
            update = setValueIfNotExists(update, item, "data.number", 1)
        }
        if (item.type === "artifact") {
            update = setValueIfNotExists(update, item, "data.power1.description", "");
            update = setValueIfNotExists(update, item, "data.power1.action", "");
            update = setValueIfNotExists(update, item, "data.power1.corruption", "0");
            update = setValueIfNotExists(update, item, "data.power2.description", "");
            update = setValueIfNotExists(update, item, "data.power2.action", "");
            update = setValueIfNotExists(update, item, "data.power2.corruption", "0");
            update = setValueIfNotExists(update, item, "data.power3.description", "");
            update = setValueIfNotExists(update, item, "data.power3.action", "");
            update = setValueIfNotExists(update, item, "data.power3.corruption", "0");
        }
        const boonType = [ "burden", "boon" ];
        update = setValueIfNotExists(update, item, "data.bonus.corruption.max", 0);
        update = setValueIfNotExists(update, item, "data.bonus.corruption.threshold", 0);
        update = setValueIfNotExists(update, item, "data.bonus.experience.value", 0);
        update = setValueIfNotExists(update, item, "data.bonus.experience.cost", 0);
        if ( boonType.includes(item.type) ) {
            update = setValueIfNotExists(update, item, "data.level", 1)
        }
        
        if (item.type === "weapon") {
            update["data.reference"] = "1handed";
            update["data.baseDamage"] = "1d8";
            update["data.bonusDamage"] = ""
        }
        if (item.type === "armor") {
            update = setValueIfNotExists(update, item, "data.baseProtection", "1d4");
            update = setValueIfNotExists(update, item, "data.bonusProtection", "");
            update = setValueIfNotExists(update, item, "data.qualities.cumbersome", false);
            update = setValueIfNotExists(update, item, "data.qualities.flexible", false);
            update = setValueIfNotExists(update, item, "data.qualities.cumbersome", false);
            update = setValueIfNotExists(update, item, "data.qualities.concealed", false);
            update = setValueIfNotExists(update, item, "data.qualities.reinforced", false);
            update = setValueIfNotExists(update, item, "data.qualities.hallowed", false);
            update = setValueIfNotExists(update, item, "data.qualities.retributive", false);
            update = setValueIfNotExists(update, item, "data.qualities.desecrated", false)
        }
    }
    if (worldTemplateVersion < 3.1) {
        if (item.type === "weapon") {
            update = setValueIfNotExists(update, item, "data.qualities.mystical", false)
        }	
    }

    if (!isObjectEmpty(update)) {
        update._id = item.data.id;
    }
    return update;
};

const migrateOldSceneData = (scene, worldTemplateVersion) => {
    const tokens = scene.tokens.map(token => {
        const t = token.toJSON();
        if (!t.actorId || t.actorLink) {
            t.actorData = {};
        }
        else if (!game.actors.has(t.actorId)){
        t.actorId = null;
        t.actorData = {};
        }
        else if (!t.actorLink) { 
        const actorData = duplicate(t.actorData);
        actorData.type = token.actor?.type;
        const update = migrateOldActorData(actorData);
        ['items', 'effects'].forEach(embeddedName => {
          if (!update[embeddedName]?.length) return;
          const updates = new Map(update[embeddedName].map(u => [u._id, u]));
          t.actorData[embeddedName].forEach(original => {
            const update = updates.get(original._id);
            if (update) mergeObject(original, update);
          });
          delete update[embeddedName];
        });
  
        mergeObject(t.actorData, update);
      }
      return t;
    });
    return {tokens};
};

export const migrateOldCompendium = async function (pack, worldTemplateVersion) {
    const entity = pack.metadata.entity;
    if ( !["Actor", "Item", "Scene"].includes(entity) ) return;
    // Unlock the pack for editing
    const wasLocked = pack.locked;
    await pack.configure({locked: false});

    await pack.migrate();
    const content = await pack.getDocuments();

    for (let ent of content) {
        let updateData = {};
        try {
            if (entity === "Item") {
                updateData = migrateOldItemData(ent.toObject(), worldTemplateVersion);
            } else if (entity === "Actor") {
                updateData = migrateOldActorData(ent.toObject(), worldTemplateVersion);
            } else if (entity === "Scene") {
                updateData = migrateOldSceneData(ent.data, worldTemplateVersion);
            }

                // Save the entry, if data was changed
            if ( foundry.utils.isObjectEmpty(updateData) ) continue;
            await ent.update(updateData);
            console.log(`Migrated ${entity} entity ${ent.name} in Compendium ${pack.collection}`);
        }
        catch(err) {
            err.message = `Failed system migration for entity ${ent.name} in pack ${pack.collection}: ${err.message}`;
            console.error(err);
        }
    }
};

const setValueIfNotExists = (update, object, property, newValue) => {
    if (typeof(getProperty(object,property)) === 'undefined'){
        update[property] = newValue;
    }
    return(update)
}