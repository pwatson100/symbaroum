import { activateAbility, attackRoll } from './item.js';
import { prepareRollAttribute } from "../common/dialog.js";

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
            accurate: 0,
            cunning: 0,
            discreet: 0,
            persuasive: 0,
            quick: 0,
            resolute: 0,
            strong: 0,
            vigilant: 0,
            toughness: { max: 0, threshold: 0 },
            corruption: { max: 0, threshold: 0 },
            experience: { value: 0, cost: 0 }
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
        let strong = data.data.attributes.strong.value + data.data.bonus.strong;
        data.data.health.toughness.max = (strong > 10 ? strong : 10) + data.data.bonus.toughness.max;       
        data.data.health.toughness.threshold = Math.ceil(strong / 2) + data.data.bonus.toughness.threshold;
        
        let resolute = data.data.attributes.resolute.value + data.data.bonus.resolute;        
        data.data.health.corruption.threshold = Math.ceil(resolute / 2) + data.data.bonus.corruption.threshold;
        data.data.health.corruption.max = resolute + data.data.bonus.corruption.max;
        
        const activeArmor = this._getActiveArmor(data);
        let attributeDef = data.data.defense.attribute.toLowerCase();
        data.data.combat = {
            id: activeArmor._id,
            armor: activeArmor.name,
            protection: activeArmor.data.protection,
            quality: activeArmor.data.quality,
            defense: data.data.attributes[attributeDef].value + data.data.bonus[attributeDef] - activeArmor.data.impeding + data.data.bonus.defense
        };
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
                protection: "0",
                quality: "",
                impeding: 0
            }
        };
    }

    _addBonus(data, item) {
        data.data.bonus = {
            defense: data.data.bonus.defense + item.data.bonus.defense,
            accurate: data.data.bonus.accurate + item.data.bonus.accurate,
            cunning: data.data.bonus.cunning + item.data.bonus.cunning,
            discreet: data.data.bonus.discreet + item.data.bonus.discreet,
            persuasive: data.data.bonus.persuasive + item.data.bonus.persuasive,
            quick: data.data.bonus.quick + item.data.bonus.quick,
            resolute: data.data.bonus.resolute + item.data.bonus.resolute,
            strong: data.data.bonus.strong + item.data.bonus.strong,
            vigilant: data.data.bonus.vigilant + item.data.bonus.vigilant,
            toughness: {
              max: data.data.bonus.toughness.max + item.data.bonus.toughness.max,
              threshold: data.data.bonus.toughness.threshold + item.data.bonus.toughness.threshold
            },
            corruption: {
              max: data.data.bonus.corruption.max + item.data.bonus.corruption.max,
              threshold: data.data.bonus.corruption.threshold + item.data.bonus.corruption.threshold
            },
            experience: { 
              cost: data.data.bonus.experience.cost + item.data.bonus.experience.cost,
              value: data.data.bonus.experience.value + item.data.bonus.experience.value
            }
        };
    }

    async usePower(powerItem){
       await activateAbility(powerItem, this);
    }

    async rollArmor() {
        const attributeData = {name: this.data.data.combat.armor, value: this.data.data.combat.defense};
        const armor = { protection: this.data.data.combat.protection, quality: this.data.data.combat.quality }
        await prepareRollAttribute(this, attributeData, armor, null);
    }

    async rollWeapon(weapon){
        const attribute = this.data.data.attributes[weapon.data.data.attribute];
        const bonus = this.data.data.bonus[weapon.data.data.attribute];
        const attributeData = { name: game.i18n.localize(attribute.label), value: attribute.value + bonus };
        const weaponData = { damage: weapon.data.data.damage, quality: weapon.data.data.quality, qualities: weapon.data.data.qualities }
        await attackRoll(this, weapon, null);
    }

    /*async rollWeapon(weapon){
        const attribute = this.data.data.attributes[weapon.data.data.attribute];
        const bonus = this.data.data.bonus[weapon.data.data.attribute];
        const attributeData = { name: game.i18n.localize(attribute.label), value: attribute.value + bonus };
        const weaponData = { damage: weapon.data.data.damage, quality: weapon.data.data.quality, qualities: weapon.data.data.qualities }
        await prepareRollAttribute(this, attributeData, null, weaponData);
    }*/
}
