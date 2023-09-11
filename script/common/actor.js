import { modifierDialog } from './item.js';
import { prepareRollAttribute } from "../common/dialog.js";
import { baseRoll } from './roll.js';

export class SymbaroumActor extends Actor {

    prepareData() {
        // console.log("In prepareData");
        super.prepareData();
        // console.log("Init data");
        this._initializeData(this.system);
        // console.log("Init data - complete");
        this.system.numRituals = 0;
        this.system["is"+this.type.capitalize()] = true;

        // console.log("Compute items");
        // game.symbaroum.log("original items",this.items);
        let items = this.items.contents.sort((a, b) => {
            if (a.type == b.type) {
                return a.name.toLowerCase() == b.name.toLowerCase() ? 0 : a.name.toLowerCase() < b.name.toLowerCase() ? -1 : 1;
            } else {
                return (game.symbaroum.config.itemSortOrder.indexOf(a.type) - game.symbaroum.config.itemSortOrder.indexOf(b.type));
            }
        });
        this._computeItems(items);
        // console.log("Compute items - complete");
        // console.log("Compute _computeSecondaryAttributes");
        this._computeSecondaryAttributes(this.system);
        // console.log("Compute _computeSecondaryAttributes");
        // console.log("Out prepareData");
        this.system.isDataPrepared = true;
    }

    _initializeData(system) {
        let armorData = foundry.utils.deepClone(game.system.model.Item.armor);
        armorData.baseProtection = "0";
        armorData.id = null;
        armorData.name = game.i18n.localize("ITEM.TypeArmor");
        system.combat = armorData;

        let bonus = foundry.utils.deepClone(game.system.model.Item.armor.bonus);
        system.bonus = bonus;
    }

    _computeItems(items) {
        // for (let item of Object.values(items)) {
        for (const [key, item] of items.entries()) {
            item.prepareData();
            if ((item.system.isAbility || item.system.isMysticalPower || item.system.isTrait) && !item.system?.script) markScripted(item);
            if (item.system.isPower) this._computePower(this.system, item);
            if (item.system.isGear) this._computeGear(this.system, item);
        }
    }

    _createArmorModifiers(system) {

    }

    _createWeaponModifiers(system) {

    }

    _createCombat(system) {

    }

    _computeSecondaryAttributes(system) {
        for (var aKey in system.attributes) {
            // If there are corrupt attributes added, ignore this
            if (!!!system.attributes[aKey].value || !!!system.attributes[aKey].label) continue;

            system.attributes[aKey].bonus = system.bonus[aKey] ?? 0;

            system.attributes[aKey].total = system.attributes[aKey].value + system.attributes[aKey].bonus + system.attributes[aKey].temporaryMod;
            system.attributes[aKey].modifier = 10 - system.attributes[aKey].total;
            if (this.system.isMonster) {
                let modSign = "";
                if (system.attributes[aKey].modifier > 0) {
                    modSign = "+";
                }
                system.attributes[aKey].msg = game.i18n.localize("TOOLTIP.BONUS_TOTAL") + ` ${system.attributes[aKey].total} (${modSign}${system.attributes[aKey].modifier})<br />${game.i18n.localize("ATTRIBUTE.BASE")}(${system.attributes[aKey].value.toString()}) ${system.bonus[aKey + "_msg"] ?? ""}`;
            } else {
                system.attributes[aKey].msg = game.i18n.localize("TOOLTIP.BONUS_TOTAL") + ` ${system.attributes[aKey].total}` + "<br />" + game.i18n.localize("ATTRIBUTE.BASE") + "(" + system.attributes[aKey].value.toString() + ")" + `${system.bonus[aKey + "_msg"]  ?? ""}`;
            }
            if (system.attributes[aKey].temporaryMod != 0) { system.attributes[aKey].msg += "<br />" + game.i18n.localize("ATTRIBUTE.MODIFIER") + "(" + system.attributes[aKey].temporaryMod.toString() + ")" };
        }

        system.experience.spent = system.bonus.experience.cost - system.bonus.experience.value;
        system.experience.available = system.experience.total - system.experience.artifactrr - system.experience.spent;

        const combatMods = {
            initiative: [],
            toughness: [],
            corruption: [],
            mystic: [],
            traditions: [],
            abilities: {},
            weapons: {},
            armors: {}
        };
        let abilitiesArray = this.items.filter(element => element.system.isAbility);
        for (let i = 0; i < abilitiesArray.length; i++) {
            // build it
            let defaultPack = abilitiesArray[i]._getPackageFormat("default");
            defaultPack.type = game.symbaroum.config.PACK_DEFAULT;
            combatMods.abilities[abilitiesArray[i].id] = {
                package: [defaultPack],
                maxAttackNb: 1,
                specialEffects: []
            }
        }

        /*
        let extraArmorBonus = this._getExtraArmorBonuses();
        let activeArmor = this._getActiveArmor(data, extraArmorBonus);
        let defense = this._getDefenseValue(data, activeArmor);
        let damageProt = this._getDamageProtection();
        let totDefense = defense.attDefValue - activeArmor.impedingMov + system.bonus.defense;        
        */

        let allArmors = this._getArmors();
        // game.symbaroum.log("All armors ",allArmors);

        let primaryArmor = null; // No armor
        // system.armors = activeArmors;
        // If we have not got an equipped non-stackable armor
        for (let i = 0; i < allArmors.length; i++) {
            if (allArmors[i].system.isActive && !allArmors[i].system.isStackableArmor) {
                primaryArmor = allArmors[i];
            }
        }
        if (primaryArmor === null) {
            // Create No Armor and add to system.armors
            // Note that this has the structure of Symbaroum Armor Item but is not an item
            primaryArmor = this._getNoArmor();
            allArmors.push(primaryArmor);
        }

        const allWeapons = this._getWeapons();

        for (let i = 0; i < allWeapons.length; i++) {
            // build it
            let defaultPack = allWeapons[i]._getPackageFormat("default");
            defaultPack.type = game.symbaroum.config.PACK_DEFAULT;
            combatMods.weapons[allWeapons[i].id] = {
                package: [defaultPack],
                maxAttackNb: 1,
                specialEffects: []
            }
        }
        for (let i = 0; i < allArmors.length; i++) {
            combatMods.armors[allArmors[i].id] = {
                specialEffects: [],
                attributes: [],
                defenseModifiers: [],
                impedingModifiers: [],
                damageReductions: [],
                protectionChoices: [],
                PowerResistances: []
            }
        }

        //add scripted abilities / Mystic powers / traits
        const allAbilities = this.items.filter(element => element.system.isAbility || element.system.isMysticalPower || element.system.isTrait);

        for (let i = 0; i < allAbilities.length; i++) {
            switch (allAbilities[i].type) {
                case "ability":
                    combatMods.abilities[allAbilities[i].id] = allAbilities[i].getAbilitiesConfig();
                    break;
                case "mysticalPower":
                    combatMods.abilities[allAbilities[i].id] = allAbilities[i].getMysticPowersConfig();
                    break;
                case "trait":
                    combatMods.abilities[allAbilities[i].id] = allAbilities[i].getTraitsConfig();
                    break;
            }
        }
        // get modifiers 
        for (const [key, item] of this.items.entries()) {
            item.getItemModifiers(combatMods, allArmors, allWeapons, allAbilities);
        }
        // Hook - itemModifiers retrieved
        game.symbaroum.api.symbaroumItemModifiersSetup(this, combatMods, allArmors, allWeapons, allAbilities);

        this._getToughnessValues(combatMods.toughness);
        this._getCorruptionValues(combatMods.corruption);

        // activeArmor is the last active armor in the list of non-stackable armors

        let totDefense = 0;
        let defense = { attribute: "quick", defMsg: "No msg" };
        let damageProt = this._getDamageProtections();

        let activeArmor = {};
        if (allArmors.length > 0) {
            // Should always have an item
            system.armors = this._evaluateArmors(allArmors, combatMods);
            // Active Armor - last one
            for (let i = 0; i < system.armors.length; i++) {
                if (system.armors[i].id == primaryArmor.id) {
                    // Just copy data
                    // missing are:
                    activeArmor = system.armors[i];
                }
            }
        }
        // let totDefense = defense.attDefValue - activeArmor.impedingMov + system.bonus.defense;        
        system.weapons = this._evaluateWeapons(allWeapons, combatMods);

        // game.symbaroum.log("all the active armors",activeArmor);
        system.combat = activeArmor;
        // suppleant our combat details for weaponModifiers
        system.combat.combatMods = combatMods;

        if (!game.settings.get('symbaroum', 'manualInitValue')) {
            this._getInitiativeAttribute(combatMods.initiative);
        }

        let attributeInit = system.initiative.attribute.toLowerCase();
        system.initiative.value = ((system.attributes[attributeInit].total) + (system.attributes.vigilant.total / 100));
        system.initiative.label = system.attributes[attributeInit].label;

        let rrAbility = this.items.filter(item => item.system.reference === "rapidreflexes");
        if (rrAbility.length != 0) {
            if (rrAbility[0].system.master.isActive) system.initiative.value +=  game.symbaroum.config.RAPIREFLEXINIBONUS;
        }
        // Hook - symbaroumSecondary
    }

    _computePower(system, item) {
        if (item.system.isRitual) {
            item.system.actions = "Ritual";
            this.system.numRituals = this.system.numRituals + 1;
            if ( this.system.numRituals > game.symbaroum.config.expCosts.ritual['free']) {
                // This needs to check if running with alternative rules for additional rituals, APG p.102                
                item.system.bonus.experience.cost = game.settings.get('symbaroum', 'optionalMoreRituals') ? game.symbaroum.config.expCosts.ritual['cost'] : 0;
            }
        }

        this._addBonus(system, item);
    }

    _computeGear(system, item) {
        if (item.system.isActive) {
            this._addBonus(system, item);
        }
    }

    _addbits(npcDamString) {
        var total = 0,
            s = npcDamString.match(/[+\-]*(\.\d+|\d+(\.\d+)?)/g) || [];
        while (s.length) {
            total += parseFloat(s.shift());
        }
        return total;
    }

    _getDamageProtections() {
        return {
            normal: 1,
            elemental: 1,
            mysticArm: 1,
            mysticIgnArm: 1,
            holy: 1,
            mysticalWeapon: 1,
            poison: 1,
            bleeding: 1
        };
    }

    _evaluateArmors(activeArmors, combatMods) {
        let armorArray = [];
        for (let item of activeArmors) {
            // baseDamage = roll formula or "0"
            let baseProtection = item.system.baseProtection;
            if (!baseProtection) {
                baseProtection = "1d4";
            }
            let diceSides = 0;
            if (!item.system.isStackableArmor && !item.isNoArmor && !item.system.isSkin) {
                diceSides = parseInt(baseProtection.match(/[0-9]d([0-9]+)/)[1]);
            }
            // Start of with full damage from all
            let damageProtection = this._getDamageProtections();
            let defense = {
                defMsg: "",
                attribute: "quick"
            }
            let impeding = item.system.impeding;
            let impedingMov = impeding;
            let impedingMagic = impeding;
            let tooltip = "";
            let totDefense = this.system.attributes[defense.attribute].total;
            let allDefenseProt = "";
            let allDefenseProtNPC = 0;
            let unfavourPcProt = "";

            let armorModifiers = combatMods.armors[item.id];


            for (let i = 0; i < armorModifiers.attributes.length; i++) {
                // weaponModifers.attribute[i].label
                let replacementAttribute = armorModifiers.attributes[i].attribute;
                if (this.system.attributes[defense.attribute].total < this.system.attributes[replacementAttribute].total) {
                    defense.attribute = replacementAttribute;
                    defense.defMsg = armorModifiers.attributes[i].label;
                    totDefense = this.system.attributes[defense.attribute].total;
                }
            }
            if (armorModifiers.specialEffects.includes(game.symbaroum.config.SPECIAL_MIN_DEFENSE)) {
                // Magic drop
                totDefense = 5;
            }

            for (let i = 0; i < armorModifiers.defenseModifiers.length; i++) {
                totDefense = totDefense + armorModifiers.defenseModifiers[i].modifier;
                defense.defMsg += ` ${armorModifiers.defenseModifiers[i].label}(${armorModifiers.defenseModifiers[i].modifier})<br/>`;
            }

            for (let i = 0; i < armorModifiers.protectionChoices.length; i++) {
                let protChoice = armorModifiers.protectionChoices[i];
                if (protChoice.type == game.symbaroum.config.DAM_DICEUPGRADE) {
                    diceSides += protChoice.diceUpgrade;
                    tooltip += `${game.symbaroum.htmlEscape(protChoice.label)}</br>`;
                } else {
                    let restricted = false;
                    let alternatives = protChoice.alternatives;
                    for (let j = 0; j < alternatives.length; j++) {
                        allDefenseProt += alternatives[j].protectionMod + "[" +game.symbaroum.htmlEscape( protChoice.label ) + "]";
                        allDefenseProtNPC += alternatives[j].protectionModNPC;
                        tooltip += `${game.symbaroum.htmlEscape(protChoice.label)}</br>`;
                    }
                }
            }

            for (let i = 0; i < armorModifiers.impedingModifiers.length; i++) {
                if (armorModifiers.impedingModifiers[i].modifier !== undefined) {
                    impedingMov = Math.max(0, impedingMov - armorModifiers.impedingModifiers[i].modifier);
                    defense.defMsg += ` ${armorModifiers.impedingModifiers[i].label}<br/>`;
                }
                if (armorModifiers.impedingModifiers[i].modifierMagic !== undefined) {
                    impedingMagic = Math.max(0, impedingMagic - armorModifiers.impedingModifiers[i].modifierMagic);
                }
            }
            totDefense -= impedingMov;

            for (let i = 0; i < armorModifiers.damageReductions.length; i++) {
                // Multiplciable at the moment? or should we just do lowest? no one knows
                if (armorModifiers.damageReductions[i].normal !== undefined) {
                    damageProtection.normal = damageProtection.normal * armorModifiers.damageReductions[i].normal;
                }
                if (armorModifiers.damageReductions[i].elemental !== undefined) {
                    damageProtection.elemental = damageProtection.elemental * armorModifiers.damageReductions[i].elemental;
                }
                if (armorModifiers.damageReductions[i].mysticArm !== undefined) {
                    damageProtection.mysticArm = damageProtection.mysticArm * armorModifiers.damageReductions[i].mysticArm;
                }
                if (armorModifiers.damageReductions[i].mysticIgnArm !== undefined) {
                    damageProtection.mysticIgnArm = damageProtection.mysticIgnArm * armorModifiers.damageReductions[i].mysticIgnArm;
                }
                if (armorModifiers.damageReductions[i].holy !== undefined) {
                    damageProtection.holy = damageProtection.holy * armorModifiers.damageReductions[i].holy;
                }
                if (armorModifiers.damageReductions[i].mysticalWeapon !== undefined) {
                    damageProtection.mysticalWeapon = damageProtection.mysticalWeapon * armorModifiers.damageReductions[i].mysticalWeapon;
                }
                if (armorModifiers.damageReductions[i].poison !== undefined) {
                    damageProtection.poison = damageProtection.poison * armorModifiers.damageReductions[i].poison;
                }
                if (armorModifiers.damageReductions[i].bleeding !== undefined) {
                    damageProtection.bleeding = damageProtection.bleeding * armorModifiers.damageReductions[i].bleeding;
                }
            }
            if (this.system.bonus.defense) {
                totDefense = totDefense + this.system.bonus.defense;
                defense.defMsg += game.i18n.localize("ATTRIBUTE.BONUS") + "(" + this.system.bonus.defense.toString() + ")" + `<br/>`;

            }
            // game.symbaroum.log(armorModifiers);
            let diceRoller = "";
            if ((item.isNoArmor || item.system.isSkin) && diceSides === 0) {
                // allDefenseProtNPC contains a 0 if npc
                diceRoller = (this.system.isPlayer ? "0" : "");
            }
            else if (!item.system.isStackableArmor) {
                diceRoller = this.system.isPlayer ? `1d${diceSides}` : (diceSides / 2);
                unfavourPcProt = `2d${diceSides}kl${allDefenseProt}`;
            }
            let finalProtText = (diceRoller + (this.system.isPlayer ? allDefenseProt : allDefenseProtNPC)) + "";


            if (isNaN(totDefense)) {
                game.symbaroum.error("totDefense is NaN - resetting to 0 - investigate logs");
                ui.notifications?.error("totDefense is NaN - resetting to 0 - investigate logs");
                totDefense = 0;
            }

            armorArray.push(
                {
                    _id: item.id,
                    id: item.id,
                    name: item.name,
                    base: item.system.baseProtection,
                    bonus: item.system.bonusProtection,
                    displayText: finalProtText.replace(/(d1\[[^\]]+\])/g, ''),
                    displayTextShort: finalProtText.replace(/(d1\[[^\]]+\])/g, '').replace(/\[[^\]]+\]/g, ''),
                    protectionPc: finalProtText,
                    protectionNpc: (diceSides / 2 + allDefenseProtNPC) + "",
                    unfavourPcProt: unfavourPcProt,
                    tooltip: tooltip,
                    impeding: impeding,
                    impedingMov: impedingMov,
                    impedingMagic: impedingMagic,
                    isActive: item.system.isActive,
                    isEquipped: item.system.isEquipped,
                    isNoArmor: item.isNoArmor,
                    img: item.img,
                    tooltipProt: tooltip,
                    defense: totDefense,
                    defenseAttribute: {
                        attribute: defense.attribute,
                        label: this.system.attributes[defense.attribute].label
                    },
                    defmod: (10 - totDefense),
                    msg: defense.defMsg,
                    damageProt: damageProtection,
                    damageReductions: armorModifiers.damageReductions
                });
        }
        return armorArray;
    }

    _evaluateWeapons(activeWeapons, combatMods) {
        let weaponArray = [];
        for (let item of activeWeapons) {
            let attribute = item.system.attribute;
            let doAlternativeDamage = item.system.alternativeDamage !== "none";
            let tooltip = "";
            let baseDamage = item.system.baseDamage;
            if (baseDamage === undefined) {
                baseDamage = "1d8";
            }
            let bonusDamage = "";
            let damageFavour = 0;
            let pcDamage = "";
            let npcDamage = 0;
            let attributeMod = 0;
            let numAttacks = 1;
            let weaponModifiers = combatMods.weapons[item.id];
            // game.symbaroum.log("weaponModifiers",weaponModifiers)
            // Loop through attribute selection - pick highest
            weaponModifiers.package[0].member.forEach((member) => {
                if (member.type == game.symbaroum.config.TYPE_ATTRIBUTE) {
                    // weaponModifers.attribute[i].label
                    let replacementAttribute = member.attribute;
                    if (this.system.attributes[attribute].total < this.system.attributes[replacementAttribute].total) {
                        attribute = replacementAttribute;
                    }
                }
            });

            // Max number of attacks with this weapon (caveat, abilities that uses two different weapons still apply as we can't figure out order)
            numAttacks = weaponModifiers.maxAttackNb;

            for (let i = 0; i < weaponModifiers.attackModifiers?.length; i++) {
                // weaponModifers.attribute[i].label
                attributeMod += weaponModifiers.attackModifiers[i].modifier;
                tooltip += game.symbaroum.htmlEscape(weaponModifiers.attackModifiers[i].label) + ", ";
            }

            let displayText = "";
            let firstAttack = "";
            let plusAttacks = ""; // bonus for non-first attacks
            let allAttacks = "";  // bonus for all attacks (including first & single)
            let singleAttack = [];


            let firstAttackNPC = 0;
            let plusAttacksNPC = 0;
            let allAttacksNPC = 0;  // bonus for all attacks (including first & single)
            let singleAttackNPC = [];

            let diceSides = parseInt(baseDamage.match(/[0-9]d([0-9]+)/)[1]); // NEEDS CHANGING - assumes base damage is always a dice (might be true)
            weaponModifiers.package.forEach((pack) => {
                let isDefaultPackage = pack.type === game.symbaroum.config.PACK_DEFAULT;
                for (let i = 0; i < pack.member.length; i++) {
                    let damChoice = pack.member[i];

                    if (damChoice.type == game.symbaroum.config.DAM_DICEUPGRADE) {
                        diceSides += damChoice.diceUpgrade;
                    } else if (damChoice.type == game.symbaroum.config.DAM_MOD || damChoice.type == game.symbaroum.config.DAM_RADIO) {
                        let restricted = false;
                        let alternatives = damChoice.alternatives;

                        // game.symbaroum.log("Weapon alts", alternatives);

                        for (let j = 0; j < alternatives.length; j++) {
                            /*if(ecDamage) {
                                if(!ecOptional) {
                                    pcDamage += alternatives[j].damageMod+"["+damChoice.label+"]";
                                    npcDamage += parseInt(alternatives[j].damageModNPC);
                                    tooltip += damChoice.label +", ";
                                } else {
                                    tooltip += damChoice.label +", ";
                                }
                                ecDamage = false;
                            }*/
                            if (alternatives[j].restrictions) {
                                if (alternatives[j].restrictions.includes(game.symbaroum.config.DAM_ACTIVE)) {
                                    singleAttack.push(alternatives[j].damageMod + "[" + damChoice.label + "]");
                                    singleAttackNPC.push(alternatives[j].damageModNPC);
                                } else if (alternatives[j].restrictions.includes(game.symbaroum.config.DAM_1STATTACK)) {
                                    firstAttack += alternatives[j].damageMod + "[" + damChoice.label + "]";
                                    firstAttackNPC += alternatives[j].damageModNPC;
                                } else if (alternatives[j].restrictions.includes(game.symbaroum.config.DAM_NOTACTIVE)) {
                                    plusAttacks += alternatives[j].damageMod + "[" + damChoice.label + "]";
                                    plusAttacksNPC += alternatives[j].damageModNPC;
                                } else {
                                    // terminate
                                    allAttacks += alternatives[j].damageMod + "[" + damChoice.label + "]";
                                    allAttacksNPC += alternatives[j].damageModNPC;
                                }
                            } else {
                                // terminate
                                allAttacks += alternatives[j].damageMod + "[" + damChoice.label + "]";
                                allAttacksNPC += alternatives[j].damageModNPC;
                            }
                        }

                    }
                }
            });
            // game.symbaroum.log("Weapon stats", item.name,"attacks", numAttacks, "1d"+diceSides,"plus ",plusAttacksNPC, "single", singleAttackNPC, "first", firstAttackNPC, "Allattacks", allAttacksNPC, "npcDamage", npcDamage);
            // game.symbaroum.log("Weapon stats", item.name,"attacks", numAttacks, "1d"+diceSides,"plus ",plusAttacks, "single", singleAttack, "first", firstAttack, "Allattacks", allAttacks);
            npcDamage = diceSides / 2 + npcDamage; // TODO max dice sides == 12

            // Display Npc damage is:
            for (let i = 0; i < numAttacks; i++) {
                let dam = (diceSides / 2 + (i == 0 ? firstAttackNPC : 0) + plusAttacksNPC + allAttacksNPC);
                displayText += dam;
                if (!game.settings.get('symbaroum', 'showNpcAttacks')) {
                    break;
                }
                if (i + 1 < numAttacks) { // not last element
                    displayText += "/";
                }
            }
            // Prefix with all single attacks, if any
            let singleText = "";
            if (game.settings.get('symbaroum', 'showNpcAttacks')) {
                for (let i = 0; i < singleAttackNPC.length; i++) {
                    let dam = (diceSides / 2 + firstAttackNPC + allAttacksNPC + singleAttackNPC[i]);
                    singleText += dam + " ";
                    if (i + 1 < singleAttackNPC.length) { // not last element
                        singleText += "| ";
                    }
                }
                if (singleText !== "") {
                    singleText += ", ";
                }
            }
            baseDamage = `1d${diceSides}`;
            let baseDamageNPC = diceSides / 2;
            if (weaponModifiers.specialEffects.includes(game.symbaroum.config.DAM_FAVOUR)) {
                baseDamage = `2d${diceSides}kh`;
                damageFavour = 1;
            }
            pcDamage = baseDamage + allAttacks;

            if (this.system.isPlayer) {
                displayText = baseDamage + firstAttack + allAttacks;
            } else {
                displayText = singleText + displayText;
            }

            let itemID = item.id;
            weaponArray.push({
                id: itemID,
                sort: item.sort,
                name: item.name,
                img: item.img,
                attribute: attribute,
                attributeLabel: this.system.attributes[attribute].label,
                attributeValue: this.system.attributes[attribute].total + attributeMod,
                attributeMod: (10 - attributeMod - this.system.attributes[attribute].total),
                tooltip: tooltip,
                isActive: item.system.isActive,
                isEquipped: item.system.isEquipped,
                reference: item.system.reference,
                isMelee: item.system.isMelee,
                isDistance: item.system.isDistance,
                doAlternativeDamage: doAlternativeDamage,
                qualities: item.system.qualities,
                damage: {
                    base: baseDamage,
                    npcBase: baseDamageNPC,
                    bonus: bonusDamage,
                    displayText: displayText,
                    displayTextShort: displayText.replace(/(d1\[[^\]]+\])/g, '').replace(/\[[^\]]+\]/g, ''),
                    pc: pcDamage,
                    npc: npcDamage,
                    damageFavour: damageFavour,
                    alternativeDamageAttribute: item.system.alternativeDamage
                }
            })
        }
        return weaponArray;
    }

    _getActiveArmors() {
        // let armorList = this.system.items.filter(element => element.system.isArmor);
        let armorList = Array.from(armorList.values()).sort((a, b) => {
            if (a.type == b.type) {
                return a.name == b.name ? 0 : a.name < b.name ? -1 : 1;
            } else {
                return (game.symbaroum.config.itemSortOrder.indexOf(a.type) - game.symbaroum.config.itemSortOrder.indexOf(b.type));
            }
        });
        return armorList;
    }

    _getInitiativeAttribute(initiativeSelection) {
        let attributeInit = "quick";
        for (let i = 0; i < initiativeSelection.length; i++) {
            // game.symbaroum.log("Initiative - compare",initiativeSelection[i].attribute, this.system.attributes[attributeInit].total, this.system.attributes[initiativeSelection[i].attribute].total)
            if (this.system.attributes[attributeInit].total < this.system.attributes[initiativeSelection[i].attribute].total) {
                attributeInit = initiativeSelection[i].attribute;
            }
        }
        this.system.initiative.attribute = attributeInit;
    }

    _getToughnessValues(toughnessMods) {
        let strong = this.system.attributes.strong.total;
        let toughBonus = this.system.bonus.toughness.max;
        let noPain = false;
        let toughMax = (strong > 10 ? strong : 10);
        for (let i = 0; i < toughnessMods.length; i++) {
            if (toughnessMods[i].type == game.symbaroum.config.SEC_ATT_MULTIPLIER) {
                toughMax = Math.ceil(strong * (toughnessMods[i].value))
            }
            if (toughnessMods[i].type == game.symbaroum.config.SEC_ATT_BONUS) {
                toughBonus += toughnessMods[i].value;
            }
            if (toughnessMods[i].type == game.symbaroum.config.NO_TRESHOLD) {
                noPain = true;
            }
        }
        this.system.health.toughness.max = toughMax + toughBonus;

        this.system.hasNoPainThreshold = noPain;
        if (noPain) {
            this.system.health.toughness.threshold = 0;
        } else {
            this.system.health.toughness.threshold = Math.ceil(strong / 2) + this.system.bonus.toughness.threshold;
        }
    }

    _getCorruptionValues(corruptionMods) {
        let resolute = this.system.attributes.resolute.total;
        let corruptionBonus = this.system.bonus.corruption.max;
        let corruptionThreshold = Math.ceil(resolute / 2);
        let isThoroughlyCorrupt = false;
        let corruptionMax = resolute;
        for (let i = 0; i < corruptionMods.length; i++) {
            if (corruptionMods[i].type == game.symbaroum.config.SEC_ATT_MULTIPLIER) {
                corruptionMax = Math.ceil(resolute * (corruptionMods[i].value));
            }
            if (corruptionMods[i].type == game.symbaroum.config.THRESHOLD_MULTIPLIER) {
                corruptionThreshold = Math.ceil(resolute * (corruptionMods[i].value));
            }
            if (corruptionMods[i].type == game.symbaroum.config.SEC_ATT_BONUS) {
                corruptionBonus += corruptionMods[i].value;
            }
            if (corruptionMods[i].type == game.symbaroum.config.NO_TRESHOLD) {
                isThoroughlyCorrupt = true;
            }
        }


        this.system.isThoroughlyCorrupt = isThoroughlyCorrupt;
        if (isThoroughlyCorrupt) {
            this.system.health.corruption.threshold = 0;
            this.system.health.corruption.max = 0;
        } else {
            this.system.health.corruption.threshold = corruptionThreshold + this.system.bonus.toughness.threshold;
            this.system.health.corruption.max = corruptionMax + corruptionBonus;
        }
        let corr = this.system.health.corruption;
        corr.value = corr.temporary + corr.longterm + corr.permanent;
    }

    _getNoArmor() {
        // create noArmor
        let noArmor = {};
        noArmor.system = {};
        noArmor.system = foundry.utils.deepClone(game.system.model.Item.armor);

        noArmor.id = game.symbaroum.config.noArmorID;
        noArmor.name = game.i18n.localize("ARMOR.NOARMOR_NAME");
        noArmor.type = noArmor.type = "armor";
        noArmor.img = "icons/equipment/chest/shirt-simple-white.webp";
        noArmor.system.isArmor = true;
        noArmor.system.isActive = true;
        noArmor.system.isStackableArmor = false;
        noArmor.isNoArmor = true;
        return noArmor;
    }

    _getArmors() {
        let armorArray = this.items.filter(element => element.system.isArmor);
        armorArray = Array.from(armorArray.values()).sort((a, b) => {
            if (a.type == b.type) {
                return a.name == b.name ? 0 : a.name < b.name ? -1 : 1;
            } else {
                return (game.symbaroum.config.itemSortOrder.indexOf(a.type) - game.symbaroum.config.itemSortOrder.indexOf(b.type));
            }
        });
        return armorArray;
    }

    _getWeapons() {
        let weaponArray = this.items.filter(element => element.system.isWeapon);
        weaponArray = Array.from(weaponArray.values()).sort((a, b) => {
            if (a.type == b.type) {
                return a.name == b.name ? 0 : a.name < b.name ? -1 : 1;
            } else {
                return (game.symbaroum.config.itemSortOrder.indexOf(a.type) - game.symbaroum.config.itemSortOrder.indexOf(b.type));
            }
        });

        return weaponArray;
    }

    _addBonusData(currentb, item, itemb, bonusType) {
        if (currentb[bonusType + "_msg"] === undefined) {
            currentb[bonusType + "_msg"] = "";
        }
        if (itemb[bonusType] != 0) {
            currentb[bonusType] += itemb[bonusType];
            currentb[bonusType + "_msg"] += "<br />" + item.name + "(" + itemb[bonusType] + ")";
        }
    }

    _addBonus(system, item) {

        let currentBonus = system.bonus;
        let currentBonusToughness = currentBonus.toughness;
        let currentBonusCorruption = currentBonus.corruption;
        let currentBonusExperience = currentBonus.experience;
        let itemBonus = item.system.bonus;
        let itemBonusToughness = itemBonus.toughness;
        let itemtBonusCorruption = itemBonus.corruption;
        let itemBonusExperience = itemBonus.experience;

        this._addBonusData(currentBonus, item, itemBonus, "defense");
        game.symbaroum.config.attributes.forEach( (value, index, arr) => { 
            this._addBonusData(currentBonus, item, itemBonus, value);
        });
        this._addBonusData(currentBonusToughness, item, itemBonusToughness, "max");
        this._addBonusData(currentBonusToughness, item, itemBonusToughness, "threshold");
        this._addBonusData(currentBonusCorruption, item, itemtBonusCorruption, "max");
        this._addBonusData(currentBonusCorruption, item, itemtBonusCorruption, "threshold");
        this._addBonusData(currentBonusExperience, item, itemBonusExperience, "cost");
        this._addBonusData(currentBonusExperience, item, itemBonusExperience, "value");

    }

    //evaluate the temmporary corruption to be received by the actor
    async getCorruption(functionStuff) {
        if (this.system.isThoroughlyCorrupt || functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_NONE) { return ({ value: 0 }) }
        let corruptionFormula = functionStuff.corruptionFormula ?? "1d4";
        let sorceryRoll;
        if (functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_ONE) {
            return ({ value: 1 })
        } else if (functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_TESTFORONE) {
            sorceryRoll = await baseRoll(this, "resolute", null, null, 0, 0, false);
            if (sorceryRoll.trueActorSucceeded) {
                return ({ value: 1, tradition: "sorcery", sorceryRoll: sorceryRoll })
            }
        } else if (functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_FAVOUR) {
            corruptionFormula = "2d4kl";            
        } else {
            // Is this actually used anywhere?  If it is, should we extend this to allow for all the other options too?
            for (let i = 0; i < this.system.combat.combatMods.corruption.length; i++) {
                if (this.system.combat.combatMods.corruption[i].type === game.symbaroum.config.TEMPCORRUPTION_FAVOUR) {
                    corruptionFormula = "2d4kl";
                }
            }
        }
        game.symbaroum.log('getCorruption', corruptionFormula, functionStuff);
        let corRoll = new Roll(corruptionFormula).evaluate({ async: false });
        return ({ value: corRoll.total, sorceryRoll: sorceryRoll, corruptionRoll: corRoll })
    }

    async usePower(ability) {
        if (!ability.isOwned || ability.system.reference === undefined || ability.system.reference === null) {
            return;
        }
        // get acting token
        let tokenList = this.getActiveTokens();
        let actingToken = tokenList[0];
        if (this.system.combat.combatMods.abilities[ability.id]) {
            let specificStuff = foundry.utils.deepClone(this.system.combat.combatMods.abilities[ability.id]);
            if (!specificStuff.isScripted) return;
            //need token?
            if (specificStuff.needToken && !actingToken) {
                ui.notifications.error(game.i18n.localize('ERROR.NO_TOKEN_SELECTED'));
                return;
            }
            //casting attribute
            if (specificStuff.attributes.length > 0) {
                let castingAttribute = specificStuff.castingAttributeName;
                let castingAttributeValue = this.system.attributes[castingAttribute].total;
                let autoParams = "";
                for (let base of specificStuff.attributes) {
                    let alternateValue = this.system.attributes[base.attribute].total;
                    if (castingAttributeValue < alternateValue) {
                        castingAttribute = base.attribute;
                        castingAttributeValue = alternateValue;
                        autoParams = base.label + ", ";
                    }
                }
                specificStuff.castingAttributeName = castingAttribute;
                specificStuff.autoParams += autoParams;
            }
            //resist attribute
            if (specificStuff.multipleTargets) {
                try { specificStuff.targets = getTargets(specificStuff.targetResistAttribute, specificStuff.multipleTargetsNb) } catch (error) { }
                specificStuff.targetData = { hasTarget: false };
            } else if (specificStuff.getTarget) {
                try { specificStuff.targetData = getTarget(specificStuff.targetResistAttribute) } catch (error) {
                    if (specificStuff.targetMandatory) {
                        ui.notifications.error(error);
                        return;
                    } else {
                        specificStuff.targetData = { hasTarget: false };
                    }
                }
            } else {
                specificStuff.targetData = { hasTarget: false };
            }

            if (specificStuff.targetPresentFSmod && specificStuff.targetData.hasTarget) {
                specificStuff = Object.assign({}, specificStuff, specificStuff.targetPresentFSmod);
            }

            specificStuff.targetFullyCorrupted = specificStuff.targetFullyCorruptedFSmod && specificStuff.targetData.hasTarget && specificStuff.targetData.isCorrupted;

            if (specificStuff.targetImpeding && specificStuff.targetData.hasTarget) specificStuff.targetImpeding = specificStuff.targetData.actor.system.combat.impedingMov;

            if (specificStuff.targetData.hasTarget && specificStuff.targetData.actor.system.combat.damageReductions.length && specificStuff.targetResistAttribute === "resolute") {
                for (let i = 0; i < specificStuff.targetData.actor.system.combat.damageReductions.length; i++) {
                    if (specificStuff.targetData.actor.system.combat.damageReductions[i].type === game.symbaroum.config.TYPE_ALT_RESIST_ATTR_RESOLUTE) {
                        let resistributeValue = specificStuff.targetData.actor.system.attributes["resolute"].total;
                        let alternateValue = specificStuff.targetData.actor.system.attributes[specificStuff.targetData.actor.system.combat.damageReductions[i].attribute].total;
                        if (resistributeValue < alternateValue) {
                            specificStuff.targetData.resistAttributeName = specificStuff.targetData.actor.system.combat.damageReductions[i].attribute;
                            specificStuff.targetData.autoParams += specificStuff.targetData.actor.system.combat.damageReductions[i].label + ", ";
                        }
                    }
                }
            }
            let fsDefault;
            try { fsDefault = await ability.getFunctionStuffDefault(this, actingToken) } catch (error) {
                ui.notifications.error(error);
                return;
            }
            let functionStuff = Object.assign({}, fsDefault, specificStuff);
            if (functionStuff.preDialogFunction) {
                await functionStuff.preDialogFunction(functionStuff)
            } else {
                await modifierDialog(functionStuff);
            }
        }
        //if(ability.system?.script) ability.system?.script(ability, this);
    }

    async rollArmor() {
        const armor = this.system.combat;
        return prepareRollAttribute(this, "defense", armor, null)
    }

    async rollWeapon(weapon) {
        if (game.settings.get('symbaroum', 'combatAutomation')) {
            return this.enhancedAttackRoll(weapon);
        }
        else {
            return prepareRollAttribute(this, weapon.attribute, null, weapon)
        }
    }

    async rollAttribute(attributeName) {
        return prepareRollAttribute(this, attributeName, null, null);
    }

    async enhancedAttackRoll(weapon) {
        let tokenList = this.getActiveTokens();
        let actingToken = tokenList[0];
        // get target token, actor and defense value
        let targetData;
        try { targetData = getTarget("defense") } catch (error) {
            ui.notifications.error(error);
            return;
        }
        let actingCharName = actingToken?.name ?? this.name;
        let functionStuff = {
            actor: this,
            token: actingToken,
            tokenId: actingToken?.id,
            actingCharName: actingCharName,
            actingCharImg: actingToken?.img ?? this.img,
            askIgnoreArmor: true,
            askTargetAttribute: false,
            askCastingAttribute: false,
            askPoison: false,
            numberofAttacks: 1,
            attackFromPC: this.system.isPlayer,
            autoParams: "",
            checkMaintain: false,
            combat: true,
            corruption: false,
            dmgModifier: "",
            dmgModifierNPC: 0,
            dmgModifierAttackSupp: "",
            dmgModifierAttackSuppNPC: 0,
            favour: 0,
            modifier: 0,
            poison: 0,
            isMystical: weapon.qualities.mystical,
            isAlternativeDamage: false,
            alternativeDamageAttribute: "none",
            introText: actingCharName + game.i18n.localize('COMBAT.CHAT_INTRO') + weapon.name,
            targetData: targetData,
            targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM'),
            resistRollText: "",
            corruptingattack: "",
            ignoreArm: false,
            castingAttributeName: weapon.attribute,
            weapon: weapon,
            damageOverTime: []
        }
        let poisoner = this.items.filter(item => (item.system?.reference === "poisoner" || item.system?.reference === "poisonous"));
        functionStuff.askPoison = poisoner.length != 0;
        return prepareRollAttribute(this, weapon.attribute, null, weapon, functionStuff);
    }
}

/*get the target token, its actor, and evaluate which attribute this actor will use for opposition
@Params: {string}   targetAttributeName : the name of the resist attribute. Can be defense, and can be null.
@returns:  {targetData object}*/
export function getTarget(targetAttributeName) {
    let targetsData;
    try { targetsData = getTargets(targetAttributeName, 1) } catch (error) {
        throw error;
    }
    return targetsData[0]
}

export function getTargets(targetAttributeName, maxTargets = 1) {
    let targets = Array.from(game.user.targets)
    if (targets.length == 0 || targets.length > maxTargets) {
        throw game.i18n.localize('ABILITY_ERROR.TARGET');
    }
    let targetsData = [];
    for (let target of targets) {
        let targetToken = target;
        let targetActor = target.actor;
        let autoParams = "";
        let leaderTarget = false;
        // check for leader adept ability effect on target
        const LeaderEffect = CONFIG.statusEffects.find(e => e.id === "eye");
        let leaderEffect = game.symbaroum.api.getEffect(targetToken, LeaderEffect);
        if (leaderEffect) {
            leaderTarget = true;
            autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
        };
        targetsData.push({
            hasTarget: true,
            token: targetToken,
            actor: targetActor,
            name: targetToken.name,
            tokenId: targetToken.id,
            resistAttributeName: targetAttributeName,
            leaderTarget: leaderTarget,
            autoParams: autoParams,
            isCorrupted: target.actor.system.isThoroughlyCorrupt
        })
    }
    return (targetsData)
}

export function markScripted(item) {
    item.system.hasScript = false;
    if (game.symbaroum.config.scriptedAbilities.includes(item.system.reference)) {
        item.system.hasScript = true;
        item.system.script = true;
    }
    return;
}