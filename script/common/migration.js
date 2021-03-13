export const migrateWorld = async () => {
    let templateVersion = game.data.system.data.templateVersion;
    let worldTemplateVersion;
    try{
        worldTemplateVersion = Number(game.settings.get("symbaroum", "worldTemplateVersion"))
    }
    catch(e){
        console.error(e);
        worldTemplateVersion = 1;
        console.log("No template version detected... Default to 1")
    }
    if (worldTemplateVersion < templateVersion && game.user.isGM) {
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
        for (let actor of game.actors.entities) {
            try {
                const update = migrateActorData(actor.data, worldTemplateVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let item of game.items.entities) {
            try {
                const update = migrateItemData(item.data, worldTemplateVersion);
                if (!isObjectEmpty(update)) {
                    await item.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let scene of game.scenes.entities) {
            try {
                const update = migrateSceneData(scene.data, worldTemplateVersion);
                if (!isObjectEmpty(update)) {
                    await scene.update(update, {enforceTypes: false});
                }
            } catch (err) {
                console.error(err);
            }
        }
        for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldTemplateVersion);
        }
        game.settings.set("symbaroum", "worldTemplateVersion", templateVersion);
        ui.notifications.info("Upgrade complete!");
    }
};

const migrateActorData = (actor, worldTemplateVersion) => {
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
        const itemUpdate = migrateItemData(item, worldTemplateVersion);
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

const migrateItemData = (item, worldTemplateVersion) => {
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
        update._id = item._id;
    }
    return update;
};

const migrateSceneData = (scene, worldTemplateVersion) => {
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
                const update = migrateActorData(token.data.actorData, worldTemplateVersion);
                console.log("ACTOR CHANGED", token.data.actorData, update);
                tokenData.actorData = mergeObject(token.data.actorData, update);
            }
            return tokenData;
        }),
    };
};

export const migrateCompendium = async function (pack, worldTemplateVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getContent();

    for (let ent of content) {
        let updateData = {};
        if (entity === "Item") {
            updateData = migrateItemData(ent.data, worldTemplateVersion);
        } else if (entity === "Actor") {
            updateData = migrateActorData(ent.data, worldTemplateVersion);
        } else if (entity === "Scene") {
            updateData = migrateSceneData(ent.data, worldTemplateVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent._id;
            await pack.updateEntity(updateData);
        }
    }
};

const setValueIfNotExists = (update, object, property, newValue) => {
    if (typeof(getProperty(object,property)) === 'undefined'){
        update[property] = newValue;
    }
    return(update)
}