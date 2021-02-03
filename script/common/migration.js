export const migrateWorld = async () => {
    const schemaVersion = 2.21;
    const worldSchemaVersion = Number(game.settings.get("symbaroum", "worldSchemaVersion"));
    if (worldSchemaVersion !== schemaVersion && game.user.isGM) {
        ui.notifications.info("Upgrading the world, please wait...");
        for (let actor of game.actors.entities) {
            try {
                const update = migrateActorData(actor.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await actor.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let item of game.items.entities) {
            try {
                const update = migrateItemData(item.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await item.update(update, {enforceTypes: false});
                }
            } catch (e) {
                console.error(e);
            }
        }
        for (let scene of game.scenes.entities) {
            try {
                const update = migrateSceneData(scene.data, worldSchemaVersion);
                if (!isObjectEmpty(update)) {
                    await scene.update(update, {enforceTypes: false});
                }
            } catch (err) {
                console.error(err);
            }
        }
        for (let pack of game.packs.filter((p) => p.metadata.package === "world" && ["Actor", "Item", "Scene"].includes(p.metadata.entity))) {
            await migrateCompendium(pack, worldSchemaVersion);
        }
        game.settings.set("symbaroum", "worldSchemaVersion", schemaVersion);
        ui.notifications.info("Upgrade complete!");
    }
};

const migrateActorData = (actor, worldSchemaVersion) => {
    const update = {};
    if (worldSchemaVersion < 2.11) {
        update["data.data.initiative"] = {
            attribute: "quick",
            value: 0
        }
    }
    if (worldSchemaVersion < 2.13) {
        update["data.data.defense"] = {
            attribute: "quick"
        }
    }
    if  (worldSchemaVersion < 2.16) { 
		update["data.data.corruption.max"] = 0;
		update["data.data.experience.spent"] = 0;
		update["data.data.experience.available"] = 0;
		update["data.data.experience.artifactrr"] = 0;
		update["data.data.health.corruption.value"] = 0;
		update["data.data.health.corruption.longterm"] = 0;
	}            
		
    let itemsChanged = false;
    const items = actor.items.map((item) => {
        const itemUpdate = migrateItemData(item, worldSchemaVersion);
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

const migrateItemData = (item, worldSchemaVersion) => {
    const update = {};
    if (worldSchemaVersion < 1) {
        const powerType = [ "trait", "ability", "mysticalPower", "ritual", "burden", "boon" ];
        const gearType = [ "weapon", "armor", "equipment", "artifact" ];
        if (powerType.includes(item.type)) {
            update["data.bonus"] = {
                defense: 0,
                accurate: 0,
                cunning: 0,
                discreet: 0,
                persuasive: 0,
                quick: 0,
                resolute: 0,
                strong: 0,
                vigilant: 0,
                toughness: { max: 0, threshold: 0 },
                corruption: { max:0, threshold: 0 },                
            }
        } else if (gearType.includes(item.type)) {
            update["data.bonus.toughness"] = { max:0, threshold: 0 };
            update["data.bonus.corruption"] = { max:0, threshold: 0 };
        }
    }
    if (worldSchemaVersion < 2.12) {
        if (item.type === "weapon") {
                update["data.qualities"] = {
                bastard: false,
                returning: false,
                blunt: false,        
                short: false,
                unwieldy: false,
                wrecking: false,
                concealed: false,
                balanced: false,
                deepImpact: false,
                jointed: false,
                ensnaring: false,
                long: false,
                massive: false,
                precise: false,
                bloodLetting: false,
                areaMeleeRadius: false,
                areaShortRadius: false,
                areaCone: false
            };
        }
    }
    if (worldSchemaVersion < 2.14) {
        if ((item.type === "equipment") || (item.type === "weapon")) {
            update["data.number"] = 1
        }
    }
    if (worldSchemaVersion < 2.14) {
        if (item.type === "artifact") {
            update["data.power1.description"] = "";
            update["data.power1.action"] = "";
            update["data.power1.corruption"] = "0";
            update["data.power2.description"] = "";
            update["data.power2.action"] = "";
            update["data.power2.corruption"] = "0";
            update["data.power3.description"] = "";
            update["data.power3.action"] = "";
            update["data.power3.corruption"] = "0"
        }
    }
    if  (worldSchemaVersion < 2.15) { 
		const boonType = [ "burden", "boon" ];
        update["data.bonus.corruption"] = { max:0, threshold: 0 };
        update["data.bonus.experience"] = {
            "value": 0,
            "cost": 0
        }
		if ( boonType.includes(item.type) ) {
			update["data.level"] = 1;
		}            
    }

        if  (worldSchemaVersion < 2.16) {
            if (typeof item["data.reference"] === 'undefined'){
                update["data.reference"] = "";
            }
        }

    if  (worldSchemaVersion < 2.21) { 
        if (item.type === "weapon") {
            update["data.reference"] = "1handed";
            update["data.baseDamage"] = "0";
            update["data.bonusDamage"] = item.data.damage;
            update["data.qualities.acidcoated"] = false;
            update["data.qualities.bane"] = false;
            update["data.qualities.deathrune"] = false;
            update["data.qualities.desecrated"] = false;
            update["data.qualities.flaming"] = false;
            update["data.qualities.hallowed"] = false;
            update["data.qualities.poison"] = false;
            update["data.qualities.thundering"] = false
        }
        if (item.type === "armor") {
            update["data.baseProtection"] = "0";
            update["data.bonusProtection"] = item.data.protection;
            update["data.qualities"] = {
                flexible: false,
                cumbersome: false,
                concealed: false,
                reinforced: false,
                hallowed: false,
                retributive: false,
                desecrated: false
            };
        }
    }  
		
    if (!isObjectEmpty(update)) {
        update._id = item._id;
    }
    return update;
};

const migrateSceneData = (scene, worldSchemaVersion) => {
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
                const update = migrateActorData(token.data.actorData, worldSchemaVersion);
                console.log("ACTOR CHANGED", token.data.actorData, update);
                tokenData.actorData = mergeObject(token.data.actorData, update);
            }
            return tokenData;
        }),
    };
};

export const migrateCompendium = async function (pack, worldSchemaVersion) {
    const entity = pack.metadata.entity;

    await pack.migrate();
    const content = await pack.getContent();

    for (let ent of content) {
        let updateData = {};
        if (entity === "Item") {
            updateData = migrateItemData(ent.data, worldSchemaVersion);
        } else if (entity === "Actor") {
            updateData = migrateActorData(ent.data, worldSchemaVersion);
        } else if (entity === "Scene") {
            updateData = migrateSceneData(ent.data, worldSchemaVersion);
        }
        if (!isObjectEmpty(updateData)) {
            expandObject(updateData);
            updateData["_id"] = ent._id;
            await pack.updateEntity(updateData);
        }
    }
};
