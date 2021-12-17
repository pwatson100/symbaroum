import { getEffect, modifierDialog } from './item.js';
import { prepareRollAttribute } from "../common/dialog.js";
import { baseRoll } from './roll.js';

export class SymbaroumActor extends Actor {

    prepareData() {
        // console.log("In prepareData");
        super.prepareData();
        // this.data.items.forEach(item => item.prepareFinalAttributes());
        // let data = foundry.utils.deepClone(this.data);
        // console.log("Init data");
        this._initializeData(this.data);
        // console.log("Init data - complete");
        this.data.numRituals = 0;
        // console.log("Compute items");
        // game.symbaroum.log("original items",this.data.items);
        let items = this.data.items.contents.sort( (a, b) => {
            if(a.data.type == b.data.type) {
                return a.data.name == b.data.name ? 0 : a.data.name < b.data.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.data.type) - game.symbaroum.config.itemSortOrder.indexOf(b.data.type));
            }
        });
        this._computeItems(items);
        // console.log("Compute items - complete");
        // console.log("Compute _computeSecondaryAttributes");
        this._computeSecondaryAttributes(this.data);
        // console.log("Compute _computeSecondaryAttributes");
        // console.log("Out prepareData");
        this.data.isDataPrepared = true;
    }

    _initializeData(data) {
        let armorData = foundry.utils.deepClone(game.system.model.Item.armor);
        armorData.baseProtection = "0";
        armorData.id = null;
        armorData.name = game.i18n.localize("ITEM.TypeArmor");
        data.data.combat = armorData;

        let bonus = foundry.utils.deepClone(game.system.model.Item.armor.bonus);
        data.data.bonus = bonus;
    }

    _computeItems(items) {
        // for (let item of Object.values(items)) {
        for( const [key, item] of items.entries() ) {
            item.prepareData();
            if((item.data.isAbility||item.data.isMysticalPower||item.data.isTrait) && !item.data.data?.script) markScripted(item);
            if (item.data.isPower) this._computePower(this.data, item.data);
            if (item.data.isGear) this._computeGear(this.data, item.data);
        }
    }

    _createArmorModifiers(data) {

    }

    _createWeaponModifiers(data) {

    }

    _createCombat(data) 
    {

    }

    _computeSecondaryAttributes(data) {
        for (var aKey in data.data.attributes) {
            // If there are corrupt attributes added, ignore this
            if (!!!data.data.attributes[aKey].value || !!!data.data.attributes[aKey].label) continue;

            data.data.attributes[aKey].bonus = data.data.bonus[aKey];
            data.data.attributes[aKey].total = data.data.attributes[aKey].value + data.data.bonus[aKey] + data.data.attributes[aKey].temporaryMod;
            data.data.attributes[aKey].modifier = 10 - data.data.attributes[aKey].total;
            if(data.type === "monster") {
                let modSign = "";
                if(data.data.attributes[aKey].modifier > 0) {
                    modSign = "+";
                }
                data.data.attributes[aKey].msg = game.i18n.localize("TOOLTIP.BONUS_TOTAL")+ ` ${data.data.attributes[aKey].total} (${modSign}${data.data.attributes[aKey].modifier})<br />${game.i18n.localize("ATTRIBUTE.BASE")}(${data.data.attributes[aKey].value.toString()}) ${data.data.bonus[aKey + "_msg"]}`;
            } else {
                data.data.attributes[aKey].msg = game.i18n.localize("TOOLTIP.BONUS_TOTAL")+ ` ${data.data.attributes[aKey].total}`+"<br />"+game.i18n.localize("ATTRIBUTE.BASE")+"("+data.data.attributes[aKey].value.toString()+")"+`${data.data.bonus[aKey + "_msg"]}`;
            }
            if(data.data.attributes[aKey].temporaryMod != 0 ){data.data.attributes[aKey].msg += "<br />"+game.i18n.localize("ATTRIBUTE.MODIFIER")+"("+data.data.attributes[aKey].temporaryMod.toString()+")"};
        }

        data.data.experience.spent = data.data.bonus.experience.cost - data.data.bonus.experience.value;
        data.data.experience.available = data.data.experience.total - data.data.experience.artifactrr - data.data.experience.spent;
        
        const combatMods = {
            initiative : [],
            toughness : [],
            corruption : [],
            mystic :  [],
            traditions : [],
            abilities : {},
            weapons : {},
            armors : {}
        };
        let abilitiesArray = this.data.items.filter(element => element.data.isAbility);
        for(let i = 0; i < abilitiesArray.length; i++) {
            // build it
            let defaultPack = abilitiesArray[i]._getPackageFormat("default");
            defaultPack.type= game.symbaroum.config.PACK_DEFAULT;
            combatMods.abilities[abilitiesArray[i].id] = {
                package: [defaultPack],
                maxAttackNb:1,
                specialEffects: []
            }
        }

        /*
        let extraArmorBonus = this._getExtraArmorBonuses();
        let activeArmor = this._getActiveArmor(data, extraArmorBonus);
        let defense = this._getDefenseValue(data, activeArmor);
        let damageProt = this._getDamageProtection();
        let totDefense = defense.attDefValue - activeArmor.impedingMov + data.data.bonus.defense;        
        */

        let allArmors = this._getArmors();
        // game.symbaroum.log("All armors ",allArmors);

        let primaryArmor = null; // No armor
        // data.data.armors = activeArmors;
        // If we have not got an equipped non-stackable armor
        for(let i = 0; i < allArmors.length; i++) {
            if(allArmors[i].data.isActive && !allArmors[i].data.isStackableArmor) {
                primaryArmor = allArmors[i];                
            }
        }
        if(primaryArmor === null) {
            // Create No Armor and add to data.data.armors
            // Note that this has the structure of Symbaroum Armor Item but is not an item
            primaryArmor = this._getNoArmor();
            allArmors.push(primaryArmor);
        }

        const allWeapons = this._getWeapons();

        for(let i = 0; i < allWeapons.length; i++) {
            // build it
            let defaultPack = allWeapons[i]._getPackageFormat("default");
            defaultPack.type= game.symbaroum.config.PACK_DEFAULT;
            combatMods.weapons[allWeapons[i].id] = {
                package: [defaultPack],
                maxAttackNb:1,
                specialEffects: []
            }
        }
        for(let i = 0; i< allArmors.length; i++) {
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
        const allAbilities = this.data.items.filter(element => element.data.isAbility || element.data.isMysticalPower || element.data.isTrait);

        for(let i = 0; i < allAbilities.length; i++) {
            switch (allAbilities[i].data.type){
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
        for( const [key, item] of this.data.items.entries() ) {
            item.getItemModifiers(combatMods, allArmors, allWeapons, allAbilities);
        }
        
        this._getToughnessValues(combatMods.toughness);
        this._getCorruptionValues(combatMods.corruption);

        // activeArmor is the last active armor in the list of non-stackable armors

        let totDefense = 0;
        let defense = { attribute: "quick", defMsg: "No msg" };
        let damageProt = this._getDamageProtections();

        let activeArmor = {};
        if(allArmors.length > 0) {
            // Should always have an item
            data.data.armors = this._evaluateArmors(allArmors, combatMods);
            // Active Armor - last one
            for(let i = 0; i<data.data.armors.length; i++) {
                if( data.data.armors[i].id == primaryArmor.id) {
                    // Just copy data
                    // missing are:
                    activeArmor = data.data.armors[i];
                }
            }
        }
        // let totDefense = defense.attDefValue - activeArmor.impedingMov + data.data.bonus.defense;        
        data.data.weapons = this._evaluateWeapons(allWeapons, combatMods);

        // game.symbaroum.log("all the active armors",activeArmor);
        data.data.combat = activeArmor;
        // suppleant our combat details for weaponModifiers
        data.data.combat.combatMods = combatMods;
        
        if(!game.settings.get('symbaroum', 'manualInitValue')){
            this._getInitiativeAttribute(combatMods.initiative);
        }

        let attributeInit = data.data.initiative.attribute.toLowerCase();
        data.data.initiative.value = ((data.data.attributes[attributeInit].total) + (data.data.attributes.vigilant.total /100)) ;
        data.data.initiative.label = data.data.attributes[attributeInit].label;

        let rrAbility = this.items.filter(item => item.data.data.reference === "rapidreflexes");
        if(rrAbility.length != 0){
            if(rrAbility[0].data.data.master.isActive) data.data.initiative.value += 20;
        }
    }

    _computePower(data, item) {
        if (item.isRitual) {
            item.data.actions = "Ritual";
            this.data.numRituals = this.data.numRituals + 1;
            if( this.data.numRituals > 6 ) {
                // This needs to check if running with alternative rules for additional rituals, APG p.102                
                item.data.bonus.experience.cost = game.settings.get('symbaroum', 'optionalMoreRituals') ? 10 : 0;
            }
        }
        
        this._addBonus(data, item);
    }

    _computeGear(data, item) {
        if (item.isActive) {
            this._addBonus(data, item);
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
            mystic: 1,
            holy: 1,
            mysticalWeapon: 1
        };
    }

    _evaluateArmors(activeArmors, combatMods) {
        let armorArray = [];
        for(let item of activeArmors)
        {
            // baseDamage = roll formula or "0"
            let baseProtection = item.data.data.baseProtection;
            if( !baseProtection ) {
                baseProtection = "1d4";
            }
            let diceSides = 0;
            if( !item.data.isStackableArmor && !item.isNoArmor )
            {
                diceSides = parseInt(baseProtection.match(/[0-9]d([0-9]+)/)[1]);
            }
            // Start of with full damage from all
            let damageProtection = this._getDamageProtections();
            let defense = {
                defMsg: "",
                attribute: "quick"
            }
            let impeding = item.data.data.impeding;
            let impedingMov = impeding;
            let impedingMagic = impeding;
            let tooltip = "";
            let totDefense = this.data.data.attributes[defense.attribute].total;
            let allDefenseProt = "";
            let allDefenseProtNPC = 0;
            let unfavourPcProt = "";

            let armorModifiers = combatMods.armors[item.id];


            for(let i = 0; i < armorModifiers.attributes.length; i++) {
                // weaponModifers.attribute[i].label
                let replacementAttribute = armorModifiers.attributes[i].attribute;
                if(this.data.data.attributes[defense.attribute].total < this.data.data.attributes[replacementAttribute].total)
                {
                    defense.attribute = replacementAttribute;
                    defense.defMsg = armorModifiers.attributes[i].label;
                    totDefense = this.data.data.attributes[defense.attribute].total;
                }
            }
            if(armorModifiers.specialEffects.includes(game.symbaroum.config.SPECIAL_MIN_DEFENSE)) {
                // Magic drop
                totDefense = 5;
            }

            for(let i = 0; i < armorModifiers.defenseModifiers.length; i++) {
                totDefense = totDefense + armorModifiers.defenseModifiers[i].modifier;
                defense.defMsg += ` ${armorModifiers.defenseModifiers[i].label}(${armorModifiers.defenseModifiers[i].modifier})<br/>`;
            }

            for(let i = 0; i < armorModifiers.protectionChoices.length; i++)
            {
                let protChoice = armorModifiers.protectionChoices[i];
                if(protChoice.type == game.symbaroum.config.DAM_DICEUPGRADE ) {
                    diceSides += protChoice.diceUpgrade;
                    tooltip += `${protChoice.label}</br>`;
                } else {                    
                    let restricted = false;
                    let alternatives = protChoice.alternatives;                    
                    for(let j = 0; j < alternatives.length; j++) 
                    {
                        allDefenseProt += alternatives[j].protectionMod+"["+protChoice.label+"]";
                        allDefenseProtNPC += alternatives[j].protectionModNPC;
                        tooltip += `${protChoice.label}</br>`;
                    } 
                }           
            }

            for(let i = 0; i < armorModifiers.impedingModifiers.length; i++)
            {
                if(armorModifiers.impedingModifiers[i].modifier !== undefined) {
                    impedingMov = Math.max(0, impedingMov - armorModifiers.impedingModifiers[i].modifier);
                    defense.defMsg += ` ${armorModifiers.impedingModifiers[i].label}<br/>`;
                }
                if(armorModifiers.impedingModifiers[i].modifierMagic !== undefined) {
                    impedingMagic = Math.max(0, impedingMagic - armorModifiers.impedingModifiers[i].modifierMagic);
                }
            }
            totDefense -= impedingMov;

            for( let i = 0; i < armorModifiers.damageReductions.length; i++)
            {
                // Multiplciable at the moment? or should we just do lowest? no one knows
                if(armorModifiers.damageReductions[i].normal !== undefined) {
                    damageProtection.normal = damageProtection.normal *armorModifiers.damageReductions[i].normal;
                }
                if(armorModifiers.damageReductions[i].elemental !== undefined) {
                    damageProtection.elemental = damageProtection.elemental *armorModifiers.damageReductions[i].elemental;
                }
                if(armorModifiers.damageReductions[i].mystic !== undefined) {
                    damageProtection.mystic = damageProtection.mystic *armorModifiers.damageReductions[i].mystic;
                }
                if(armorModifiers.damageReductions[i].holy !== undefined) {
                    damageProtection.holy = damageProtection.holy *armorModifiers.damageReductions[i].holy;
                }
                if(armorModifiers.damageReductions[i].mysticalWeapon !== undefined) {
                    damageProtection.mysticalWeapon = damageProtection.mysticalWeapon *armorModifiers.damageReductions[i].mysticalWeapon;
                }
            }
            if(this.data.data.bonus.defense){
                totDefense = totDefense + this.data.data.bonus.defense;
                defense.defMsg += game.i18n.localize("ATTRIBUTE.BONUS")+"("+this.data.data.bonus.defense.toString()+")"+`<br/>`;
            
            }
            // game.symbaroum.log(armorModifiers);
            let diceRoller = "";
            if(item.isNoArmor && diceSides === 0) {
                // allDefenseProtNPC contains a 0 if npc
                diceRoller = (this.type == "player" ? "0":"");
            }
            else if(!item.data.isStackableArmor) 
            {
                diceRoller = this.type == "player" ? `1d${diceSides}` : (diceSides/2);
                unfavourPcProt = `2d${diceSides}kl${allDefenseProt}`;
            }
            let finalProtText = (diceRoller+(this.type == "player" ? allDefenseProt : allDefenseProtNPC)) + "";


            if(isNaN(totDefense))
            {
                game.symbaroum.error("totDefense is NaN - resetting to 0 - investigate logs");
                ui.notifications?.error("totDefense is NaN - resetting to 0 - investigate logs");
                totDefense = 0;
            }            

            armorArray.push(
            {
                _id: item.id,
                id: item.id,
                name: item.data.name,
                base: item.data.data.baseProtection,
                bonus: item.data.data.bonusProtection, 
                displayText: finalProtText.replace(/(d1\[[^\]]+\])/g,''),
                displayTextShort: finalProtText.replace(/(d1\[[^\]]+\])/g,'').replace(/\[[^\]]+\]/g, ''),
                protectionPc: finalProtText,
                protectionNpc: (diceSides/2+allDefenseProtNPC)+"",
                unfavourPcProt: unfavourPcProt,
                tooltip: tooltip,
                impeding: impeding,
                impedingMov: impedingMov,
                impedingMagic: impedingMagic,
                isActive: item.data.isActive,
                isEquipped: item.data.isEquipped,
                isNoArmor: item.isNoArmor,                
                img: item.img,
                tooltipProt: tooltip,
                defense: totDefense,
                defenseAttribute: {
                    attribute: defense.attribute,
                    label: this.data.data.attributes[defense.attribute].label
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
        for(let item of activeWeapons) 
        {
            let attribute = item.data.data.attribute;
            let doAlternativeDamage = item.data.data.alternativeDamage !== "none";
            let tooltip = "";
            let baseDamage = item.data.data.baseDamage;
            if( baseDamage === undefined) {
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
                if(member.type == game.symbaroum.config.TYPE_ATTRIBUTE){
                    // weaponModifers.attribute[i].label
                    let replacementAttribute = member.attribute;
                    if(this.data.data.attributes[attribute].total < this.data.data.attributes[replacementAttribute].total)
                    {
                        attribute = replacementAttribute;
                    }
                }
            });
            
            // Max number of attacks with this weapon (caveat, abilities that uses two different weapons still apply as we can't figure out order)
            numAttacks = weaponModifiers.maxAttackNb;

            for(let i = 0; i < weaponModifiers.attackModifiers?.length; i++) {
                // weaponModifers.attribute[i].label
                attributeMod += weaponModifiers.attackModifiers[i].modifier;
                tooltip += weaponModifiers.attackModifiers[i].label + ", ";
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
                for(let i = 0; i < pack.member.length; i++) 
                {
                    let damChoice = pack.member[i];
                    
                    if(damChoice.type == game.symbaroum.config.DAM_DICEUPGRADE ) {
                        diceSides += damChoice.diceUpgrade;
                    } else if (damChoice.type == game.symbaroum.config.DAM_MOD || damChoice.type == game.symbaroum.config.DAM_RADIO){
                        let restricted = false;
                        let alternatives = damChoice.alternatives;

                        // game.symbaroum.log("Weapon alts", alternatives);

                        for(let j = 0; j < alternatives.length; j++) 
                        {
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
                            if(alternatives[j].restrictions)
                            {
                                if(alternatives[j].restrictions.includes(game.symbaroum.config.DAM_ACTIVE)) {
                                    singleAttack.push(alternatives[j].damageMod+"["+damChoice.label+"]");
                                    singleAttackNPC.push(alternatives[j].damageModNPC);
                                } else if(alternatives[j].restrictions.includes(game.symbaroum.config.DAM_1STATTACK)) {
                                    firstAttack += alternatives[j].damageMod+"["+damChoice.label+"]";
                                    firstAttackNPC += alternatives[j].damageModNPC;
                                } else if(alternatives[j].restrictions.includes(game.symbaroum.config.DAM_NOTACTIVE)) {
                                    plusAttacks += alternatives[j].damageMod+"["+damChoice.label+"]";
                                    plusAttacksNPC += alternatives[j].damageModNPC;
                                } else {
                                    // terminate
                                    allAttacks += alternatives[j].damageMod+"["+damChoice.label+"]";
                                    allAttacksNPC += alternatives[j].damageModNPC;
                                }
                            } else {
                                // terminate
                                allAttacks += alternatives[j].damageMod+"["+damChoice.label+"]";
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
            for(let i = 0; i < numAttacks; i++) {
                let dam = (diceSides / 2 + (i == 0 ? firstAttackNPC:0) + plusAttacksNPC + allAttacksNPC);
                displayText += dam;
                if(!game.settings.get('symbaroum', 'showNpcAttacks')) {
                    break;
                }
                if( i+1 < numAttacks) { // not last element
                    displayText += "/";
                }
            }
            // Prefix with all single attacks, if any
            let singleText = "";
            if(game.settings.get('symbaroum', 'showNpcAttacks')) {
                for(let i = 0; i < singleAttackNPC.length; i++) {
                    let dam = (diceSides / 2 + firstAttackNPC + allAttacksNPC + singleAttackNPC[i]);
                    singleText += dam+" ";
                    if( i+1 < singleAttackNPC.length) { // not last element
                        singleText += "| ";
                    }                
                }
                if(singleText !== "") {
                    singleText += ", ";
                }
            }
            baseDamage = `1d${diceSides}`;
            let baseDamageNPC = diceSides/2;
            if( weaponModifiers.specialEffects.includes(game.symbaroum.config.DAM_FAVOUR) ) {
                baseDamage = `2d${diceSides}kh`;
                damageFavour = 1;
            }
            pcDamage = baseDamage+allAttacks;

            if(this.type == "player")  {
                displayText = baseDamage+firstAttack+allAttacks;
            } else {
                displayText = singleText + displayText;
            }

            let itemID = item.id;
            weaponArray.push({
                id: itemID,
                sort: item.data.sort,
                name : item.data.name,
                img: item.data.img,
                attribute: attribute,
                attributeLabel: this.data.data.attributes[attribute].label, 
                attributeValue: this.data.data.attributes[attribute].total + attributeMod,
                attributeMod: (10 - attributeMod - this.data.data.attributes[attribute].total),
                tooltip : tooltip,
                isActive: item.data.isActive,
                isEquipped: item.data.isEquipped,
                reference: item.data.data.reference, 
                isMelee: item.data.data.isMelee, 
                isDistance: item.data.data.isDistance,
                doAlternativeDamage: doAlternativeDamage,
                qualities: item.data.data.qualities,
                damage: {                    
                    base: baseDamage, 
                    npcBase: baseDamageNPC,
                    bonus: bonusDamage,
                    displayText : displayText,
                    displayTextShort : displayText.replace(/(d1\[[^\]]+\])/g,'').replace(/\[[^\]]+\]/g, ''),
                    pc: pcDamage,
                    npc: npcDamage,
                    damageFavour: damageFavour,
                    alternativeDamageAttribute: item.data.data.alternativeDamage
                }
            })
        }
        return weaponArray;
    }

    _getActiveArmors() {
        // let armorList = this.data.items.filter(element => element.data.isArmor);
        let armorList = Array.from(armorList.values()).sort( (a, b) => {
            if(a.data.type == b.data.type) {
                return a.data.name == b.data.name ? 0 : a.data.name < b.data.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.data.type) - game.symbaroum.config.itemSortOrder.indexOf(b.data.type));
            }
        });
        return armorList;
    }

    _getInitiativeAttribute(initiativeSelection) {
        let attributeInit = "quick";
        for(let i = 0; i < initiativeSelection.length; i++) {
            // game.symbaroum.log("Initiative - compare",initiativeSelection[i].attribute, this.data.data.attributes[attributeInit].total, this.data.data.attributes[initiativeSelection[i].attribute].total)
            if(this.data.data.attributes[attributeInit].total < this.data.data.attributes[initiativeSelection[i].attribute].total) {
                attributeInit = initiativeSelection[i].attribute;
            }
        }
        this.data.data.initiative.attribute = attributeInit;
    }

    _getToughnessValues(toughnessMods) {
        let strong = this.data.data.attributes.strong.total;
        let toughBonus = this.data.data.bonus.toughness.max;
        let noPain = false;
        let toughMax = (strong > 10 ? strong : 10);
        for(let i = 0; i < toughnessMods.length; i++) {
            if(toughnessMods[i].type == game.symbaroum.config.SEC_ATT_MULTIPLIER){
                toughMax = Math.ceil(strong*(toughnessMods[i].value))
            }
            if(toughnessMods[i].type == game.symbaroum.config.SEC_ATT_BONUS){
                toughBonus += toughnessMods[i].value;
            }
            if(toughnessMods[i].type == game.symbaroum.config.NO_TRESHOLD){
                noPain = true;
            }
        }
        this.data.data.health.toughness.max = toughMax + toughBonus;

        this.data.hasNoPainThreshold = noPain;
        if(noPain){            
            this.data.data.health.toughness.threshold = 0;
        } else {
            this.data.data.health.toughness.threshold = Math.ceil(strong / 2) + this.data.data.bonus.toughness.threshold;
        }
    }
     
    _getCorruptionValues(corruptionMods) {
        let resolute = this.data.data.attributes.resolute.total;
        let corruptionBonus = this.data.data.bonus.corruption.max;
        let corruptionThreshold = Math.ceil(resolute / 2);
        let isThoroughlyCorrupt = false;
        let corruptionMax = resolute;
        for(let i = 0; i < corruptionMods.length; i++) {
            if(corruptionMods[i].type == game.symbaroum.config.SEC_ATT_MULTIPLIER){
                corruptionMax = Math.ceil(resolute*(corruptionMods[i].value));
            }
            if(corruptionMods[i].type == game.symbaroum.config.THRESHOLD_MULTIPLIER){
                corruptionThreshold = Math.ceil(resolute*(corruptionMods[i].value));
            }
            if(corruptionMods[i].type == game.symbaroum.config.SEC_ATT_BONUS){
                corruptionBonus += corruptionMods[i].value;
            }
            if(corruptionMods[i].type == game.symbaroum.config.NO_TRESHOLD){
                isThoroughlyCorrupt = true;
            }
        }
        
        
        this.data.isThoroughlyCorrupt = isThoroughlyCorrupt;
        if(isThoroughlyCorrupt){            
            this.data.data.health.corruption.threshold = 0;
            this.data.data.health.corruption.max = 0;
        } else {
            this.data.data.health.corruption.threshold = corruptionThreshold + this.data.data.bonus.toughness.threshold;
            this.data.data.health.corruption.max = corruptionMax + corruptionBonus;
        }
        let corr = this.data.data.health.corruption;
        corr.value = corr.temporary + corr.longterm + corr.permanent;
    }

    _getNoArmor() {
        // create noArmor
        let noArmor = {};
        noArmor.data = {};
        noArmor.data.data = foundry.utils.deepClone(game.system.model.Item.armor);

        noArmor.id = "NoArmorID";
        noArmor.data.name = game.i18n.localize("ARMOR.NOARMOR_NAME");
        noArmor.type = noArmor.data.type = "armor";
        noArmor.img = "icons/equipment/chest/shirt-simple-white.webp";
        noArmor.data.isArmor = true;
        noArmor.data.isActive = true;
        noArmor.data.isStackableArmor = false;
        noArmor.isNoArmor = true;
        return noArmor;
    }

    _getArmors() {
        let armorArray = this.data.items.filter(element => element.data.isArmor);        
        armorArray = Array.from(armorArray.values()).sort( (a, b) => {
            if(a.data.type == b.data.type) {
                return a.data.name == b.data.name ? 0 : a.data.name < b.data.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.data.type) - game.symbaroum.config.itemSortOrder.indexOf(b.data.type));
            }
        });        
        return armorArray;
    }

    _getWeapons() {
        let weaponArray = this.data.items.filter(element => element.data.isWeapon);
        weaponArray = Array.from(weaponArray.values()).sort( (a, b) => {
            if(a.data.type == b.data.type) {
                return a.data.name == b.data.name ? 0 : a.data.name < b.data.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.data.type) - game.symbaroum.config.itemSortOrder.indexOf(b.data.type));
            }
        });
        
        return weaponArray;
    }

    _addBonusData(currentb, item, itemb, bonusType) {
        if(currentb[bonusType+"_msg"] === undefined ) {
            currentb[bonusType+"_msg"] = "";
        }
        if(itemb[bonusType] != 0 ) {
            currentb[bonusType] += itemb[bonusType];
            currentb[bonusType+"_msg"] += "<br />"+item.name+"("+itemb[bonusType]+")";
        }
    }

    _addBonus(data, item) {

        let currentBonus = data.data.bonus;
        let currentBonusToughness = currentBonus.toughness;
        let currentBonusCorruption = currentBonus.corruption;
        let currentBonusExperience = currentBonus.experience;
        let itemBonus = item.data.bonus;
        let itemBonusToughness = itemBonus.toughness;
        let itemtBonusCorruption = itemBonus.corruption;
        let itemBonusExperience = itemBonus.experience;
        
        this._addBonusData(currentBonus, item, itemBonus, "defense");
        this._addBonusData(currentBonus, item, itemBonus, "accurate");
        this._addBonusData(currentBonus, item, itemBonus, "cunning");
        this._addBonusData(currentBonus, item, itemBonus, "discreet");
        this._addBonusData(currentBonus, item, itemBonus, "persuasive");
        this._addBonusData(currentBonus, item, itemBonus, "quick");
        this._addBonusData(currentBonus, item, itemBonus, "resolute");
        this._addBonusData(currentBonus, item, itemBonus, "strong");
        this._addBonusData(currentBonus, item, itemBonus, "vigilant");
        
        this._addBonusData(currentBonusToughness, item, itemBonusToughness, "max");
        this._addBonusData(currentBonusToughness, item, itemBonusToughness, "threshold");
        this._addBonusData(currentBonusCorruption, item, itemtBonusCorruption, "max");
        this._addBonusData(currentBonusCorruption, item, itemtBonusCorruption, "threshold");
        this._addBonusData(currentBonusExperience, item, itemBonusExperience, "cost");
        this._addBonusData(currentBonusExperience, item, itemBonusExperience, "value");

    }

    //evaluate the temmporary corruption to be received by the actor
    async getCorruption(functionStuff){
        if(this.data.isThoroughlyCorrupt || functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_NONE) {return({value: 0})}
        let corruptionFormula = functionStuff.corruptionFormula ?? "1d4";
        let sorceryRoll;
        if(functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_ONE){
            return({value: 1})
        } else if (functionStuff.corruption === game.symbaroum.config.TEMPCORRUPTION_TESTFORONE){
            sorceryRoll = await baseRoll(this, "resolute", null, null, 0, 0, false);
            if(sorceryRoll.trueActorSucceeded){
                return({value: 1, tradition: "sorcery", sorceryRoll: sorceryRoll})
            }
        } else{
            for(let i = 0; i < this.data.data.combat.combatMods.corruption.length; i++) {
                if(this.data.data.combat.combatMods.corruption[i].type === game.symbaroum.config.TEMPCORRUPTION_FAVOUR){
                    corruptionFormula = "2d4kl";
                }
            }
        }
        let corRoll= new Roll(corruptionFormula).evaluate({async:false});
        return({value: corRoll.total, sorceryRoll: sorceryRoll, corruptionRoll: corRoll})
    }

    async usePower(ability){
        if( !ability.isOwned || ability.data.data.reference === undefined || ability.data.data.reference === null) {
        return;               
        }
        if(this.data.data.combat.combatMods.abilities[ability.data._id]){
            let specificStuff = foundry.utils.deepClone(this.data.data.combat.combatMods.abilities[ability.data._id]);
            if (!specificStuff.isScripted) return;
            //casting attribute
            if(specificStuff.attributes.length > 0){
                let castingAttribute = specificStuff.castingAttributeName;
                let castingAttributeValue = this.data.data.attributes[castingAttribute].total;
                let autoParams="";
                for(let base of specificStuff.attributes) {
                    let alternateValue = this.data.data.attributes[base.attribute].total;
                    if (castingAttributeValue < alternateValue) {
                        castingAttribute = base.attribute;
                        castingAttributeValue = alternateValue;
                        autoParams = base.label+ ", ";
                    }
                }
                specificStuff.castingAttributeName = castingAttribute;
                specificStuff.autoParams += autoParams;
            }
            //resist attribute
            if(specificStuff.multipleTargets){
                try{specificStuff.targets = getTargets(specificStuff.targetResistAttribute, specificStuff.multipleTargetsNb)} catch(error){}
                specificStuff.targetData = {hasTarget : false};
            } else if(specificStuff.getTarget){
                try{specificStuff.targetData = getTarget(specificStuff.targetResistAttribute)} catch(error){
                    if(specificStuff.targetMandatory){
                        ui.notifications.error(error);
                        return;
                    } else {
                        specificStuff.targetData = {hasTarget : false};
                    }
                }
            } else {
                specificStuff.targetData = {hasTarget : false};
            }
            
            if(specificStuff.targetPresentFSmod && specificStuff.targetData.hasTarget){
                specificStuff = Object.assign({}, specificStuff , specificStuff.targetPresentFSmod);
            }

            specificStuff.targetFullyCorrupted = specificStuff.targetFullyCorruptedFSmod && specificStuff.targetData.hasTarget && specificStuff.targetData.isCorrupted;

            if(specificStuff.targetImpeding && specificStuff.targetData.hasTarget) specificStuff.targetImpeding=specificStuff.targetData.actor.data.data.combat.impedingMov;
            
            if(specificStuff.targetData.hasTarget && specificStuff.targetData.actor.data.data.combat.damageReductions.length && specificStuff.targetResistAttribute === "resolute"){
                for(let i = 0; i < specificStuff.targetData.actor.data.data.combat.damageReductions.length; i++) {
                    if(specificStuff.targetData.actor.data.data.combat.damageReductions[i].type === game.symbaroum.config.TYPE_ALT_RESIST_ATTR_RESOLUTE){
                        let resistributeValue = specificStuff.targetData.actor.data.data.attributes["resolute"].total;
                        let alternateValue = specificStuff.targetData.actor.data.data.attributes[specificStuff.targetData.actor.data.data.combat.damageReductions[i].attribute].total;
                        if (resistributeValue < alternateValue) {
                            specificStuff.targetData.resistAttributeName = specificStuff.targetData.actor.data.data.combat.damageReductions[i].attribute;
                            specificStuff.targetData.autoParams += specificStuff.targetData.actor.data.data.combat.damageReductions[i].label + ", ";
                        }
                    }
                }
            }
            let fsDefault;
            try{fsDefault = await ability.getFunctionStuffDefault(this)} catch(error){      
                ui.notifications.error(error);
                return;
            }
            let functionStuff = Object.assign({}, fsDefault , specificStuff);
            if(functionStuff.preDialogFunction){
                await functionStuff.preDialogFunction(functionStuff)
            }else {
                await modifierDialog(functionStuff);
            }
        }
        //if(ability.data.data?.script) ability.data.data?.script(ability, this);
    }

    async rollArmor() {
        if(!game.settings.get('symbaroum', 'combatAutomation')){
            const armor = this.data.data.combat;
            await prepareRollAttribute(this, "defense", armor, null)
        }
    }

    async rollWeapon(weapon){
        if(game.settings.get('symbaroum', 'combatAutomation')){
            await this.enhancedAttackRoll(weapon);
        }
        else{
            await prepareRollAttribute(this, weapon.attribute, null, weapon)
        }
    }

    async rollAttribute(attributeName) {
        await prepareRollAttribute(this, attributeName, null, null);
    }

    async enhancedAttackRoll(weapon){
        // get selected token
        let token;
        try{token = await this.getTokenId()} catch(error){
            ui.notifications.error(error);
            return;
        }
        // get target token, actor and defense value
        let targetData;
        try{targetData = getTarget("defense")} catch(error){
            ui.notifications.error(error);
            return;
        }
        
        let functionStuff = {
            actor: this,
            token: token,
            tokenId : token.id,
            askIgnoreArmor: true,
            askTargetAttribute: false,
            askCastingAttribute: false,
            askPoison: false,
            numberofAttacks: 1,
            attackFromPC: this.type !== "monster",
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
            introText: token.data.name + game.i18n.localize('COMBAT.CHAT_INTRO') + weapon.name,
            targetData: targetData,
            targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM'),
            resistRollText: "",
            corruptingattack: "",
            ignoreArm: false,
            castingAttributeName: weapon.attribute,
            weapon: weapon,
            damageOverTime: []
        }
        let poisoner = this.items.filter(item => (item.data.data?.reference === "poisoner" || item.data.data?.reference === "poisonous"));
        functionStuff.askPoison = poisoner.length != 0;
        prepareRollAttribute(this, weapon.attribute, null, weapon, functionStuff); 
    }

    /* get the selected token ID of the actor */
    async getTokenId(){
        let selected = canvas.tokens.controlled;
        if(selected.length > 1 || selected.length == 0){
            throw game.i18n.localize('ERROR.NO_TOKEN_SELECTED');
        }
        if(selected[0].actor.data._id !== this.data._id){
            throw game.i18n.localize('ERROR.NO_TOKEN_SELECTED');
        }
        return(selected[0])
    }
}

/*get the target token, its actor, and evaluate which attribute this actor will use for opposition
@Params: {string}   targetAttributeName : the name of the resist attribute. Can be defense, and can be null.
@returns:  {targetData object}*/
export function getTarget(targetAttributeName) {
    let targetsData;
    try{targetsData = getTargets(targetAttributeName, 1)} catch(error){      
        throw error;
    }
    return targetsData[0]
}

export function getTargets(targetAttributeName, maxTargets = 1) {
    let targets = Array.from(game.user.targets)
    if(targets.length == 0 || targets.length > maxTargets)
    {
        throw game.i18n.localize('ABILITY_ERROR.TARGET');
    }
    let targetsData = [];
    for(let target of targets){
        let targetToken = target;
        let targetActor = target.actor;
        let autoParams = "";
        let leaderTarget = false;
            // check for leader adept ability effect on target
        const LeaderEffect = "icons/svg/eye.svg";
        let leaderEffect = getEffect(targetToken, LeaderEffect);
        if(leaderEffect){
            leaderTarget = true;
            autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
        };
        targetsData.push({
            hasTarget: true,
            token: targetToken,
            actor: targetActor,
            name: targetToken.data.name,
            tokenId: targetToken.id,
            resistAttributeName: targetAttributeName,
            leaderTarget: leaderTarget,
            autoParams: autoParams,
            isCorrupted: target.actor.data.isThoroughlyCorrupt
        })
    }
    return(targetsData)
}

export function markScripted(item){
    item.data.data.hasScript = false;
    if(game.symbaroum.config.scriptedAbilities.includes(item.data.data.reference)){
        item.data.data.hasScript = true;
        item.data.data.script = true;
    }
    return;
}