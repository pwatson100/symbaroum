import { isNewerVersion } from '/common/utils/helpers.mjs';

export const migrateWorld = async () => {
    /* WorldTemplateVersion was used on symbaroum for tracking template changes until foundryVTT 0.8
    After that, we use worldSystemVersion
    Worlds created after 0.8 should have WorldTemplateVersion = 0, so should older worlds that have been properly updated. */
    let worldTemplateVersion;
    try{
        worldTemplateVersion = Number(game.settings.get("symbaroum", "worldTemplateVersion"));
        console.log("worldTemplateVersion:");
        console.log(worldTemplateVersion)
    }
    catch(e){
        console.error(e);
        worldTemplateVersion = 1;
        console.log("No template version detected... Default to 1")
    }
    if(worldTemplateVersion && game.user.isGM){ //the world hasn't been properly migrated since foundryVTT0.8
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
    console.log("worldSystemVersion:");
    console.log(worldSystemVersion)
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
        for (let actor of game.actors.contents) {
            try {
                const update = migrateActorData(actor.data, worldSystemVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let item of game.items.contents) {
            try {
                const update = migrateItemData(item.data, worldSystemVersion);
                if (!isObjectEmpty(update)) {
                    await item.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let scene of game.scenes.contents) {
            try {
                const update = migrateSceneData(scene.data, worldSystemVersion);
                if (!isObjectEmpty(update)) {
                    await scene.update(update, {enforceTypes: false});
                }
            } catch (err) {
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
    if (worldTemplateVersion < 3) {
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
    for (let actor of game.actors.contents) {
        try {
            const update = migrateOldActorData(actor.data, worldTemplateVersion);
            if (!isObjectEmpty(update)) {
                await actor.update(update, {enforceTypes: false});
            }
        } catch (e) {
            console.error(e);
        }
    }
    for (let item of game.items.contents) {
        try {
            const update = migrateOldItemData(item.data, worldTemplateVersion);
            if (!isObjectEmpty(update)) {
                await item.update(update, {enforceTypes: false});
            }
        } catch (e) {
            console.error(e);
        }
    }/*
    for (let scene of game.scenes.contents) {
        try {
            const update = migrateOldSceneData(scene.data, worldTemplateVersion);
            if (!isObjectEmpty(update)) {
                await scene.update(update, {enforceTypes: false});
            }
        } catch (err) {
            console.error(err);
        }
    }
    for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
        await migrateOldCompendium(pack, worldTemplateVersion);
    }*/
    game.settings.set("symbaroum", "worldTemplateVersion", 4);
    ui.notifications.info("Upgrade complete!");
};
      
const migrateActorData = (actor, worldSystemVersion) => {
    let update = {};
/*    this is an example
    if (isNewerVersion("2.21.0", worldSystemVersion)) {
        update = setValueIfNotExists(update, actor, "data.attributes.accurate.total", 0);
    };
*/        
    let itemsChanged = false;
    const items = actor.items.map((item) => {
        const itemUpdate = migrateItemData(item.data, worldSystemVersion);
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

const migrateItemData = (item, worldSystemVersion) => {
    let update = {};
    if (isNewerVersion("3.0.6", worldSystemVersion)) {
        const gearType = [ "weapon", "armor", "equipment" ];
        if (gearType.includes(item.type)) {
            update = setValueIfNotExists(update, item, "data.isArtifact", false);
            update = setValueIfNotExists(update, item, "data.power", [
                {"name": "test", "description": "test", "action": "", "corruption": ""},
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

const migrateSceneData = (scene, worldSystemVersion) => {
    const tokens = duplicate(scene.tokens);
    return {
        tokens: tokens.map((tokenData) => {
            if (!tokenData.actorId || tokenData.actorLink || !tokenData.actorData.data) {
                tokenData.actorData = {};
                return tokenData;
            }
            const token = new Token(tokenData);
            if (!token.actor) {
                tokenData.actorId = null;
                tokenData.actorData = {};
            } else if (!tokenData.actorLink && token.data.actorData.items) {
                const update = migrateActorData(token.data.actorData, worldSystemVersion);
                console.log("ACTOR CHANGED", token.data.actorData, update);
                tokenData.actorData = mergeObject(token.data.actorData, update);
            }
            return tokenData;
        }),
    };
};

export const migrateCompendium = async function (pack, worldSystemVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getDocuments();

    for (let ent of content) {
        let updateData = {};
        if (entity === "Item") {
            updateData = migrateItemData(ent.data, worldSystemVersion);
        } else if (entity === "Actor") {
            updateData = migrateActorData(ent.data, worldSystemVersion);
        } else if (entity === "Scene") {
            updateData = migrateSceneData(ent.data, worldSystemVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent.data._id;
            await ent.update(updateData);
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
    const tokens = duplicate(scene.tokens);
    return {
        tokens: tokens.map((tokenData) => {
            if (!tokenData.actorId || tokenData.actorLink || !tokenData.actorData.data) {
                tokenData.actorData = {};
                return tokenData;
            }
            const token = new Token(tokenData);
            //const token = tokenData.toObject();

//            const token = canvas.scene.createEmbeddedDocuments("Token", tokenData)
            if (!token.actor) {
                tokenData.actorId = null;
                tokenData.actorData = {};
            } else if (!tokenData.actorLink && token.data.actorData.items) {
                const update = migrateOldActorData(token.data.actorData, worldTemplateVersion);
                console.log("ACTOR CHANGED", token.data.actorData, update);
                tokenData.actorData = mergeObject(token.data.actorData, update);
            }
            return tokenData;
        }),
    };
};

export const migrateOldCompendium = async function (pack, worldTemplateVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getDocuments();

    for (let ent of content) {
        //let updateData = {};
        if (entity === "Item") {
            let updateData = migrateOldItemData(ent.data, worldTemplateVersion);
            if (!isObjectEmpty(updateData)) {
                expandObject(updateData);
                updateData["_id"] = ent.data.id;
                const updated = await Item.updateDocuments(updateData, pack);
            }
        } else if (entity === "Actor") {
            let updateData = migrateOldActorData(ent.data, worldTemplateVersion);
            if (!isObjectEmpty(updateData)) {
                expandObject(updateData);
                updateData["_id"] = ent.data.id;
                const updated = await Actor.updateDocuments(updateData, pack);
            }
        } else if (entity === "Scene") {
            let updateData = migrateOldSceneData(ent.data, worldTemplateVersion);
            if (!isObjectEmpty(updateData)) {
                expandObject(updateData);
                updateData["_id"] = ent.data.id;
                const updated = await Scene.updateDocuments(updateData, pack);
            }
        }
        /*if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent.data.id;
           await pack.updateEntity(updateData);
        }*/
    }
};

const setValueIfNotExists = (update, object, property, newValue) => {
    if (typeof(getProperty(object,property)) === 'undefined'){
        update[property] = newValue;
    }
    return(update)
}