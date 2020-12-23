export class SymbaroumActor extends Actor {
    prepareData() {
        super.prepareData();
        this._initializeData(this.data);
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
            corruption: { threshold: 0 }
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
        data.data.health.toughness.max = (data.data.attributes.strong.value > 10 ? data.data.attributes.strong.value : 10) + data.data.bonus.toughness.max;
        data.data.health.toughness.threshold = Math.ceil(data.data.attributes.strong.value / 2) + data.data.bonus.toughness.threshold;
        data.data.health.corruption.threshold = Math.ceil(data.data.attributes.resolute.value / 2) + data.data.bonus.corruption.threshold;
        const activeArmor = this._getActiveArmor(data);
        let attributeDef = data.data.defense.attribute.toLowerCase();
        data.data.combat = {
            id: activeArmor._id,
            armor: activeArmor.name,
            protection: activeArmor.data.protection,
            quality: activeArmor.data.quality,
            defense: data.data.attributes[attributeDef].value - activeArmor.data.impeding + data.data.bonus.defense
        };
        let attributeInit = data.data.initiative.attribute.toLowerCase();
        data.data.initiative.value = (data.data.attributes[attributeInit].value * 1000) + (data.data.attributes.vigilant.value * 10);
    }

    _computePower(data, item) {
        if (item.isRitual) {
            item.data.actions = "Ritual"
        } else if (item.isBurden) {
            item.data.actions = "Burden"
        } else if (item.isBoon) {
            item.data.actions = "Boon"
        } else {
            let novice = "-";
            let adept = "-";
            let master = "-";
            if (item.data.novice.isActive) novice = item.data.novice.action;
            if (item.data.adept.isActive) adept = item.data.adept.action;
            if (item.data.master.isActive) master = item.data.master.action;
            item.data.actions = `${novice}/${adept}/${master}`;
        }
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
                threshold: data.data.bonus.corruption.threshold + item.data.bonus.corruption.threshold
            },
        };
    }
}