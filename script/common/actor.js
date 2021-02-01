import { attackRoll, getPowerLevel } from './item.js';
import { prepareRollAttribute } from "../common/dialog.js";
import { upgradeDice } from './roll.js';

export class SymbaroumActor extends Actor {
  
    prepareData() {
        super.prepareData();
        this._initializeData(this.data);
        this.data.data.numRituals = 0;
        this._computeItems(this.data);
        this._computeSecondaryAttributes(this.data);
    }

    _initializeData(data) {
        data.data.combat = {
            id: null,
            name: "Armor",
            data: {
                protection: "0",
                quality: "",
                impeding: 0
            }
        };
        data.data.bonus = {
            defense: 0,
            defense_msg: "",
            accurate: 0,
            accurate_msg: "",
            cunning: 0,
            cunning_msg: "",
            discreet: 0,
            discreet_msg: "",
            persuasive: 0,
            persuasive_msg: "",
            quick: 0,
            quick_msg: "",
            resolute: 0,
            resolute_msg: "",
            strong: 0,
            strong_msg: "",
            vigilant: 0,
            vigilant_msg: "",
            toughness: { 
              max: 0, 
              max_msg: "",
              threshold: 0,
              threshold_msg: "" 
            },
            corruption: { 
              max: 0, 
              max_msg: "",
              threshold: 0,
              threshold_msg: ""
            },
            experience: { 
              value: 0,
              value_msg: "",
              cost: 0,
              cost_msg: ""
            }
        };
    }

    _computeItems(data) {
        for (let item of Object.values(data.items)) {
            item.isTrait = item.type === "trait";
            item.isAbility = item.type === "ability";
            item.isMysticalPower = item.type === "mysticalPower";
            item.isRitual = item.type === "ritual";
            item.isBurden = item.type === "burden";
            item.isBoon = item.type === "boon";
            item.isPower = item.isTrait || item.isAbility || item.isMysticalPower || item.isRitual || item.isBurden || item.isBoon;
            if (item.isPower) this._computePower(data, item);
            item.isWeapon = item.type === "weapon";
            item.isArmor = item.type === "armor";
            item.isEquipment = item.type === "equipment";
            item.isArtifact = item.type === "artifact";
            item.isGear = item.isWeapon || item.isArmor || item.isEquipment || item.isArtifact
            if (item.isGear) this._computeGear(data, item);
        }
    }

    _computeSecondaryAttributes(data) {
        for (var aKey in data.data.attributes) {
          data.data.attributes[aKey].total = data.data.attributes[aKey].value + data.data.bonus[aKey];
          data.data.attributes[aKey].msg = `${game.i18n.localize("TOOLTIP.BONUS_TOTAL")} ${data.data.attributes[aKey].total} ${data.data.bonus[aKey + "_msg"]}`;
        }
        
        let strong = data.data.attributes.strong.total;
        let sturdy = this.items.filter(item => item.data.data.reference === "sturdy");
        if(sturdy.length != 0){
            let sturdyLvl = getPowerLevel(sturdy[0]).level;
            if(sturdyLvl == 1) data.data.health.toughness.max = Math.ceil(strong*(1.5));
            else data.data.health.toughness.max = strong*(sturdyLvl)
        }
        else data.data.health.toughness.max = (strong > 10 ? strong : 10) + data.data.bonus.toughness.max;       
        data.data.health.toughness.threshold = Math.ceil(strong / 2) + data.data.bonus.toughness.threshold;
        
        let resolute = data.data.attributes.resolute.total;        
        data.data.health.corruption.threshold = Math.ceil(resolute / 2) + data.data.bonus.corruption.threshold;
        data.data.health.corruption.max = resolute + data.data.bonus.corruption.max;
        
        let corr = data.data.health.corruption;
        corr.value = corr.temporary + corr.longterm + corr.permanent;
        
        const activeArmor = this._getActiveArmor(data);
        let attributeDef = data.data.defense.attribute.toLowerCase();
        let protection = this._evaluateProtection(activeArmor);
        data.data.combat = {
            id: activeArmor._id,
            armor: activeArmor.name,
            protection: protection.pc,
            protectionData: protection,
            quality: activeArmor.data.quality,
            qualities: activeArmor.data.qualities,
            impeding: activeArmor.data.impeding,
            defense: data.data.attributes[attributeDef].total - activeArmor.data.impeding + data.data.bonus.defense,
            msg: `${game.i18n.localize(data.data.attributes[attributeDef].label)} ${data.data.attributes[attributeDef].total}<br/>${game.i18n.localize("ARMOR.IMPEDING")}(${-1 * activeArmor.data.impeding})${data.data.bonus.defense_msg}`
        };

        const activeWeapons = this._getActiveWeapons(data);
        if(activeWeapons.length > 0){
            for(let weaponData of activeWeapons){
                let damageFormulas = this.evaluateWeapon(weaponData);
                weaponData.data.actorDamage = damageFormulas;
            }
        }
        let attributeInit = data.data.initiative.attribute.toLowerCase();
        data.data.initiative.value = (data.data.attributes[attributeInit].value * 1000) + (data.data.attributes.vigilant.value * 10);
        
        data.data.experience.spent = data.data.bonus.experience.cost - data.data.bonus.experience.value;
        data.data.experience.available = data.data.experience.total - data.data.experience.artifactrr - data.data.experience.spent;
    }

    _computePower(data, item) {
        let expCost = 0;
        if (item.isRitual) {
            item.data.actions = "Ritual";
            this.data.data.numRituals = this.data.data.numRituals + 1;
            if( this.data.data.numRituals > 6 ) {
            // This needs to check if running with alternative rules for additional rituals, APG p.102                
              expCost = game.settings.get('symbaroum', 'optionalMoreRituals') ? 10 : 0;
            }
        } else if (item.isBurden) {
            item.data.actions = "Burden";
            expCost = -5 * item.data.level;
        } else if (item.isBoon) {
            item.data.actions = "Boon";            
            expCost = 5 * item.data.level;
        } else {
			
            let novice = "-";
            let adept = "-";
            let master = "-";
            if (item.data.novice.isActive) {
              novice = item.data.novice.action;
              expCost += 10;
            }
            if (item.data.adept.isActive) { 
              adept = item.data.adept.action;
              expCost += 20;
            }
            if (item.data.master.isActive) {
              master = item.data.master.action;
              expCost += 30;
            }
            item.data.actions = `${novice}/${adept}/${master}`;
        }
        item.data.bonus.experience.cost = expCost;
        
        this._addBonus(data, item);
    }

    _computeGear(data, item) {
        item.isActive = item.data.state === "active";
        item.isEquipped = item.data.state === "equipped";
        if (item.isActive) {
            this._addBonus(data, item);
        }
    }

    evaluateWeapon(item) {
        const meleeClass = [
            "1handed",
            "short",
            "long",
            "unarmed",
            "heavy"
        ];
        if(meleeClass.includes(item.data.reference)){
            item.data.isMelee = true;
            item.data.isDistance = false;
        }
        else{
            item.data.isMelee = false;
            item.data.isDistance = true;
        }
        let baseDamage = item.data.baseDamage ?? "";
        let bonusDamage = "+" + item.data.bonusDamage;
        if(item.data.isMelee){
            let ironFist = this.items.filter(element => element.data.data?.reference === "ironfist");
            if(ironFist.length > 0){
                let powerLvl = getPowerLevel(ironFist[0]);
                if(powerLvl.level == 2){
                    bonusDamage += "+1d4";
                }
                else if(powerLvl.level > 2){
                    bonusDamage += "+1d8";
                }
            }
            let robust = this.items.filter(element => element.data.data?.reference === "robust");
            if(robust.length > 0){
                let powerLvl = getPowerLevel(robust[0]);
                if(powerLvl.level == 2){
                    bonusDamage += "+1d6";
                }
                else if(powerLvl.level > 2){
                    bonusDamage += "+1d8";
                }
                else{
                    bonusDamage += "+1d4";
                }
            }
        }
        if(item.data.reference === "unarmed"){
            let naturalweapon = this.items.filter(element => element.data.data?.reference === "naturalweapon");
            if(naturalweapon.length > 0){
                let powerLvl = getPowerLevel(naturalweapon[0]);
                let newdamage = upgradeDice(baseDamage, powerLvl.level);
                baseDamage = newdamage;
            }
            let naturalwarrior = this.items.filter(element => element.data.data?.reference === "naturalwarrior");
            if(naturalwarrior.length > 0){
                let newdamage = upgradeDice(baseDamage, 1);
                baseDamage = newdamage;
            }
        }
        let pcDamage = baseDamage + bonusDamage;
        let DmgRoll= new Roll(pcDamage).evaluate({maximize: true});
        let npcDamage = Math.ceil(DmgRoll.total/2);
        
        if(item.data?.qualities.deepImpact){
            pcDamage += "+1";
            npcDamage+= 1;
        }
        return({base: baseDamage, bonus: bonusDamage, pc: pcDamage, npc: npcDamage})
    }

    _evaluateProtection(item) {
        let protection = item.data.baseProtection;
        let bonusProtection = item.data.bonusProtection ?? "";
        let manatarms = this.items.filter(element => element.data.data?.reference === "manatarms");
        if(manatarms.length > 0){
            let newprot = upgradeDice(protection, 1);
            protection = newprot;
        }
        let naturalarmor = this.items.filter(element => element.data.data?.reference === "armored");
        if(naturalarmor.length > 0){
            let powerLvl = getPowerLevel(naturalarmor[0]);
            let newprot = upgradeDice(protection, powerLvl.level -1);
            protection = newprot;
        }
        let robust = this.items.filter(element => element.data.data?.reference === "robust");
        if(robust.length > 0){
            let powerLvl = getPowerLevel(robust[0]);
            if(powerLvl.level == 2){
                bonusProtection += "+1d6";
            }
            else if(powerLvl.level > 2){
                bonusProtection += "+1d8";
            }
            else{
                bonusProtection += "+1d4";
            }
        }
        let pcProt = protection + bonusProtection;
        let armorRoll= new Roll(pcProt).evaluate({maximize: true});
        let npcProt = Math.ceil(armorRoll.total/2);
        
        if(item.data?.qualities?.reinforced){
            pcProt += "+1";
            npcProt+= 1;
        }
        return({base: protection,
            bonus: bonusProtection, pc: pcProt, npc: npcProt})
    }

    _getActiveArmor(data) {
        for (let item of Object.values(data.items)) {
            if (item.isArmor && item.isActive) {
                return item;
            }
        }
        return {
            id: null,
            name: "Armor",
            data: {
                baseProtection: "0",
                bonusProtection: "",
                impeding: 0,
                qualities: {
                    flexible: false,
                    cumbersome: false,
                    concealed: false,
                    reinforced: false,
                    hallowed: false,
                    retributive: false,
                    desecrated: false
                }
            }
        };
    }

    _getActiveWeapons(data) {
        let weaponArray = [];
        for (let item of Object.values(data.items)) {
            if (item.isWeapon && item.isActive) {
                weaponArray.push(item);
            }
        }
        return(weaponArray)
    }

    _addBonusData(currentb, item, itemb, bonusType) {
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
    


    async usePower(powerItem){
       await powerItem.makeAction(this);
    }

    async rollArmor() {
        if(!game.settings.get('symbaroum', 'combatAutomation')){
            const armor = this.data.data.combat;
            await prepareRollAttribute(this, "defense", armor, null)
        }
    }

    async rollWeapon(weapon){
        if(game.settings.get('symbaroum', 'combatAutomation')){
            const attribute = this.data.data.attributes[weapon.data.data.attribute];
            const bonus = this.data.data.bonus[weapon.data.data.attribute];
            const attributeData = { name: game.i18n.localize(attribute.label), value: attribute.value + bonus };
            const weaponData = { damage: weapon.data.data.damage, quality: weapon.data.data.quality, qualities: weapon.data.data.qualities }
            await attackRoll(weapon, this);
        }
        else{
            await prepareRollAttribute(this, weapon.data.data.attribute, null, weapon)
        }
    }

    async rollAttribute(attributeName) {
        await prepareRollAttribute(this, attributeName, null, null);
    }
}
