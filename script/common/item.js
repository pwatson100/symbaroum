import { baseRoll, createRollData, damageRollWithDiceParams, simpleDamageRoll, getAttributeValue, getAttributeLabel, getOwnerPlayer, createModifyTokenChatButton, createResistRollChatButton } from './roll.js';
import { modifyEffectOnToken } from './hooks.js';
import { createLineDisplay } from './dialog.js';

export class SymbaroumItem extends Item {
    static async create(data, options) {
        if (!data.img) {
            if(data.type in game.symbaroum.config.itemImages)
                data.img = game.i18n.format(game.symbaroum.config.imageRef, {"filename":game.symbaroum.config.itemImages[data.type]});
            else
                data.img = game.i18n.format(game.symbaroum.config.imageRef, {"filename":"unknown-item.png"});
        }
        super.create(data, options);
    }


    prepareData() {
        super.prepareData();
        this._initializeData(this.data);
        this._computeCombatData(this.data);
    }

    _initializeData(data) {
        let transl = {
            A:"ACTION.ACTIVE",
            M:"ACTION.MOVEMENT",
            T:"ACTION.FULL_TURN",
            F:"ACTION.FREE",
            P:"ACTION.PASSIVE",
            R:"ACTION.REACTION",
            S:"ACTION.SPECIAL"
        }

        data["type"+data.type.capitalize()] = true;
        data["is"+data.type.capitalize()] = true;
        
        data.isPower = data.isTrait || data.isAbility || data.isMysticalPower || data.isRitual || data.isBurden || data.isBoon;
        data.hasLevels = data.isTrait || data.isAbility || data.isMysticalPower;
        data.isArtifact = data.type === "artifact" || data.data?.isArtifact;
        data.isGear = data.isWeapon || data.isArmor || data.isEquipment || data.isArtifact;

        if(data.isTrait && data.data.reference && data.data.reference !== "") {
            let label = game.symbaroum.config.traitsList[data.data.reference];
            if(label)
                data.itemLabel = game.i18n.localize(label);            
        } else if(data.isAbility) {
            let label = game.symbaroum.config.abilitiesList[data.data.reference];
            if(label)
                data.itemLabel = game.i18n.localize(label);            
        } else if(data.isMysticalPower) {
            let label = game.symbaroum.config.powersList[data.data.reference];
            if(label)
                data.itemLabel = game.i18n.localize(label);            
        }

        if(data.isGear) {
            data.isActive = data.data.state === "active";
            data.isEquipped = data.data.state === "equipped";
        }

        if(data.type === "weapon") {
            data.data.pcDamage = "";
            data.data.npcDamage = 0;
        }
        else if(data.type === "armor")
        {
            data.isStackableArmor = data.data.baseProtection === "0";
            data.isLightArmor = data.data.baseProtection === "1d4";
            data.isMediumArmor = data.data.baseProtection === "1d6";
            data.isHeavyArmor = data.data.baseProtection == "1d8";
            data.isSuperArmor = data.data.baseProtection == "1d10" || data.data.baseProtection == "1d12";
            if(data.isStackableArmor ) {
                data.data.reference = "stackable";                
            } else if(data.isLightArmor) {
                data.data.reference = "lightarmor";
            } else if(data.isMediumArmor) {
                data.data.reference = "mediumarmor";
            } else if(data.isHeavyArmor) { 
                data.data.reference = "heavyarmor";
            } else {
                data.data.reference = "superarmor";
            }
            data.data.pcProtection = "";
            data.data.npcProtection = 0;
        } else if(data.type == "artifact") {
            if( data.data.power1.action !== "-") {
                data.data.power1.actionlabel = transl[data.data.power1.action];
            }
            if( data.data.power2.action !== "-") {
                data.data.power2.actionlabel = transl[data.data.power2.action];
            }
            if( data.data.power3.action !== "-") {
                data.data.power3.actionlabel = transl[data.data.power3.action];
            }
        }
        if(data.isPower )
            this._computeExperienceCost(data);
    }

    _computeExperienceCost(data) {
        let expCost = 0;

        if (data.isRitual) {
            data.data.actions = "Ritual";
        }
        else if (data.isBurden) {
            data.data.actions = "Burden";
            expCost = -5 * data.data.level;
        } else if (data.isBoon) {
            data.data.actions = "Boon";
            expCost = 5 * data.data.level;
        } else if (data.isPower) {
			
            let novice = "-";
            let adept = "-";
            let master = "-";
            if (data.data.novice.isActive) {
                novice = data.data.novice.action;
                expCost += 10;
            }
            if (data.data.adept.isActive) { 
                adept = data.data.adept.action;
                expCost += 20;
            }
            if (data.data.master.isActive) {
                master = data.data.master.action;
                expCost += 30;
            }
            data.data.actions = `${novice}/${adept}/${master}`;
        }
        data.data.bonus.experience.cost = expCost;
    }

    _computeCombatData(data) {
        if(data.type === "weapon"){

            data.data.isMelee = game.symbaroum.config.meleeWeapons.includes(data.data.reference);
            data.data.isDistance = game.symbaroum.config.rangeWeapons.includes(data.data.reference);            
            let baseDamage = data.data.baseDamage;
            // game.symbaroum.log("baseDamage["+baseDamage+"]");
            if( baseDamage === null || baseDamage === undefined || baseDamage === "" ) {
                baseDamage = "1d8";
            }
            let diceSides = baseDamage.match(/[0-9]d([1-9]+)/)[1];
            // game.symbaroum.log("diceSides["+diceSides+"]");
            if(data.data.qualities?.massive) {               
                baseDamage = "2d"+Math.ceil(diceSides)+"kh";
            }
            if(data.data.bonusDamage != "") {
                if(data.data.bonusDamage.charAt(0) !== '+' ) {
                    data.data.bonusDamage = "+"+data.data.bonusDamage;
                }
                baseDamage += data.data.bonusDamage;
            }
            data.data.pcDamage += baseDamage;
            if(data.data.qualities?.deepImpact){
                data.data.pcDamage +=  "+1";
            }
            try {
                let weaponRoll= new Roll(baseDamage).evaluate({maximize: true, async: false});
                data.data.npcDamage = Math.ceil(weaponRoll.total/2);
            } catch(err) {
                data.data.npcDamage = 0;
                ui.notifications?.error("Could not evaulate weapon - check bonus damage fields - "+err);
            }
            if(data.data.qualities?.deepImpact) {
                data.data.npcDamage +=  1;
            }
        }
        else if(data.type === "armor"){
            let protection = data.data.baseProtection;
            let armorRoll = null;
            if( protection === null || protection === undefined || protection === "" ) {
                protection = "1d4";
            }
            if( protection === "0") {
                protection = "";
            } 

            if(data.data.bonusProtection && data.data.bonusProtection != ""){
                let plus = "+";
                if(data.data.bonusProtection.charAt(0) === '+' ) {
                    plus = "";
                }
                protection += plus + data.data.bonusProtection;
            }
            data.data.pcProtection = protection;
            if(data.data.qualities?.reinforced){
                data.data.pcProtection +=  "+1";
            }

            if(protection === "") {
                armorRoll = new Roll("0").evaluate({maximize: true, async:false});
            } else {
                armorRoll = new Roll(protection).evaluate({maximize: true, async:false});
            }
            data.data.npcProtection = Math.ceil(armorRoll.total/2);
            if(data.data.qualities?.reinforced){
                data.data.npcProtection +=  1;
            }
        }
    }

    _getArtifactInfo(field) {
        let data = this.data;
        if(data.type == "artifact") {
            return `${data.data.power1[field]}/${data.data.power2[field]}/${data.data.power3[field]}`;
        } else if(data.isArtifact ) {
            if( data.power === null || data.power === {}) {
                return "";
            }
            let keys = Object.keys(data.data.power);
            let actionStr = "";
            let notfirst = false;
            
            for(let i = 0; i<keys.length; i++) {
                if(notfirst) {
                    actionStr += '/';                    
                } else {
                    notfirst = true;
                }
                actionStr += data.data.power[keys[i]][field];
            }
            return actionStr;            
        } else {
            return "";
        }
    }

    getArtifactActions() {
        return this._getArtifactInfo("action");
    }

    getArtifactCorruptions() {    
        return this._getArtifactInfo("corruption");
    }

    async sendToChat() {
        const itemData = duplicate(this.data);
        if (itemData.img.includes("/unknown")) {
            itemData.img = null;
        }        
        itemData.isTrait = itemData.type === "trait";
        itemData.isAbility = itemData.type === "ability";
        itemData.isMysticalPower = itemData.type === "mysticalPower";
        itemData.isRitual = itemData.type === "ritual";
        itemData.isWeapon = itemData.type === "weapon";
        itemData.isArmor = itemData.type === "armor";
        itemData.isEquipment = itemData.type === "equipment";
        itemData.isArtifact = itemData.type === "artifact";
        const html = await renderTemplate("systems/symbaroum/template/chat/item.html", itemData);
        const chatData = {
            user: game.user.id,
            speaker: ChatMessage.getSpeaker({ 
                alias: this.actor?.name ?? game.user.name,
                actor: this.actor?.id
            }),            
            rollMode: game.settings.get("core", "rollMode"),
            content: html,
        };
        if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
            chatData.whisper = ChatMessage.getWhisperRecipients("GM");
        } else if (chatData.rollMode === "selfroll") {
            chatData.whisper = [game.user];
        }
        ChatMessage.create(chatData);
    }


    /* affect reference on this item */
    async affectReference()
    {
        let list;
        if(this.data.type === "ability"){
            list = game.symbaroum.config.abilitiesList;
        }
        else if(this.data.type === "mysticalPower"){
            list = game.symbaroum.config.powersList;
        }
        else if(this.data.type === "trait"){
            list = game.symbaroum.config.traitsList;
        }
        else{return}
        let referenceOptions = "";
        for (let [key, label] of Object.entries(list))
        {
            referenceOptions += `<option value=${key}>${game.i18n.localize(label)} </option>`
        }
        
        let htmlTemplate = `
        <h1> ${game.i18n.localize('ABILITYREF.DIALOG_TITLE')} </h1>
        <p> ${game.i18n.localize('ABILITYREF.DIALOG')}</p>
        <div style="display:flex">
        <div  style="flex:1"><select id="reference">${referenceOptions}</select></div>
        </div>`;
        new Dialog({
            title: game.i18n.localize('ABILITYREF.DIALOG_TITLE'), 
            content: htmlTemplate,
            buttons: {
                validate: {
                    label: "Validate",
                    callback: (html) => {
                        let selectedRef = html.find("#reference")[0].value;
                        this.update({"data.reference": selectedRef});
                        return(selectedRef)
                    }
                }, 
                close: {
                    label: "Close"
                }
            }
        }).render(true);
    }
    
    getLevel() 
    {
        if(!this.data.hasLevels) 
        {
            return {level:0, lvlName : null};
        }
        let powerLvl = 0;
        let lvlName = game.i18n.localize("ABILITY.NOT_LEARNED");
        if(this.data.data.master.isActive)
        {
            powerLvl = 3;
            lvlName = game.i18n.localize('ABILITY.MASTER');
        }
        else if(this.data.data.adept.isActive)
        {            
            powerLvl = 2;
            lvlName = game.i18n.localize('ABILITY.ADEPT');
        }
        else if(this.data.data.novice.isActive)
        {
            powerLvl = 1;
            lvlName = game.i18n.localize('ABILITY.NOVICE');
        }
        return {level : powerLvl, lvlName : lvlName};
    }

    getItemModifiers(combatMods, armors, weapons, abilities) 
    {
        if( !this.isOwned || this.data.data.reference === undefined || this.data.data.reference === null) {
            return;               
        }
        let ref = this.data.data.reference.capitalize();
        if( typeof this["getItemModifier"+ref] == "function" ) {
            this["getItemModifier"+ref](combatMods, armors, weapons, abilities)
        }
    }
    
    getAbilitiesConfig(){
        let base= {
            id: this.id,
            label: this.data.name,
            reference: this.data.data.reference,
            type: "ability",
            corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
            impeding: game.symbaroum.config.IMPEDING_NOT,
            isScripted: false,
            powerLvl: this.getLevel(),
            attributes: [],
            casting: game.symbaroum.config.CASTING,
            maintain: game.symbaroum.config.MAINTAIN_NOT,
            castingAttributeName: "cunning",
            targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM'),
            package: [],
            autoParams: ""
        };
        if( !this.isOwned || this.data.data.reference === undefined || this.data.data.reference === null) {
            return(base);               
        }
        let ref = this.data.data.reference.capitalize();
        if( typeof this["abilitySetup"+ref] == "function" ) {
            base.isScripted = true;
            return(this["abilitySetup"+ref](base));
        }
        else return(base)
    }
    
    getMysticPowersConfig(){
        let base= {
            id: this.id,
            label: this.data.name,
            reference: this.data.data.reference,
            type: "mysticalPower",
            corruption: game.symbaroum.config.TEMPCORRUPTION_NORMAL,
            impeding: game.symbaroum.config.IMPEDING_MAGIC,
            isScripted: false,
            traditions: [],
            powerLvl: this.getLevel(),
            healingBonus: "",
            attributes: [],
            castingAttributeName: "resolute",
            targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM'),
            package: [],
            autoParams: ""
        };
        if( !this.isOwned || this.data.data.reference === undefined || this.data.data.reference === null) {
            return(base);               
        }
        let ref = this.data.data.reference.capitalize();
        if( typeof this["mysticPowerSetup"+ref] == "function" ) {
            base.isScripted = true;
            return(this["mysticPowerSetup"+ref](base));
        }
        else return(base)
    }
    
    getTraitsConfig(){
        let base= {
            id: this.id,
            label: this.data.name,
            reference: this.data.data.reference,
            type: "trait",
            corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
            impeding: game.symbaroum.config.IMPEDING_NOT,
            casting: game.symbaroum.config.CASTING,
            maintain: game.symbaroum.config.MAINTAIN_NOT,
            isScripted: false,
            powerLvl: this.getLevel(),
            attributes: [],
            castingAttributeName: "quick",
            targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM'),
            package: [],
            autoParams: ""
        };
        if( !this.isOwned || this.data.data.reference === undefined || this.data.data.reference === null) {
            return(base);               
        }
        let ref = this.data.data.reference.capitalize();
        if( typeof this["traitSetup"+ref] == "function" ) {
            base.isScripted = true;
            return(this["traitSetup"+ref](base));
        }
        else return(base)
    }
        
    _getPackageFormat(label) {
        return {
            id: this.id,
            label : label ?? this.data.name,
            type: game.symbaroum.config.PACK_CHECK,
            member: []
        }
    }

    _getBaseFormat() {
        return {
            id: this.id,
            label: this.data.name,
            reference: this.data.data.reference
        };
    }

    // Reference combat modifiers
    // Armors
    _getOwnArmorBonuses(combatMods, armors)
    {
        for(let i = 0; i < armors.length; i++)
        {
            if(this.id == armors[i].id) {
                if(this.data.data.bonusProtection != "") {
                    let base = this._getBaseFormat();
                    let plus = "+";
                    if(this.data.data.bonusProtection.charAt(0) === '+') {
                        plus = "";
                    }                
                    // NPC - cant get away from this
                    let npcProt = 0;
                    try {
                        npcProt = Math.ceil(new Roll(this.data.data.bonusProtection).evaluate({async:false, maximize: true}).total / 2);
                    } catch(err) {
                        ui.notifications?.error(`Could not evaulate armor bonus protection for ${this.data.name} - check bonus damage fields -`+err);
                    }                    

                    base.type = game.symbaroum.config.DAM_FIXED;
                    base.alternatives = [{
                        protectionMod: plus+this.data.data.bonusProtection,
                        protectionModNPC: npcProt,
                        displayMod: plus+this.data.data.bonusProtection
                    }];
                    combatMods.armors[armors[i].id].protectionChoices.push(base);
                }
                if(!this.data.isStackableArmor && this.data.data.qualities.reinforced) {
                    let base = this._getBaseFormat();
                    base.label = game.i18n.localize("QUALITY.REINFORCED");
                    base.type = game.symbaroum.config.DAM_FIXED;
                    base.alternatives = [{
                        protectionMod: "+1d1",
                        protectionModNPC: 1,
                    }];
                    combatMods.armors[armors[i].id].protectionChoices.push(base);
                }
                if(!this.data.isStackableArmor && this.data.data.qualities.flexible) {
                    let base = this._getBaseFormat();
                    base.label = game.i18n.localize("QUALITY.FLEXIBLE");                    
                    base.modifier = Math.min(armors[i].data.data.impeding, 2);
                    combatMods.armors[armors[i].id].impedingModifiers.push(base);
    
                }                
            }
            else if( this.data.isStackableArmor && !armors[i].data.isStackableArmor && this.data.isActive ) 
            {
                if(this.data.data.bonusProtection != "") 
                {
                    let base = this._getBaseFormat();
                    let plus = "+";
                    let npcProt = 0;
                    try {
                        npcProt = Math.ceil(new Roll(this.data.data.bonusProtection).evaluate({async:false, maximize: true}).total / 2);
                    } catch(err) {
                        ui.notifications?.error(`Could not evaluate armor bonus protection for ${this.data.name} - check bonus damage fields -`+err);
                    }                    
                    base.type = game.symbaroum.config.DAM_FIXED;
                    base.alternatives = [{
                        protectionMod: plus+this.data.data.bonusProtection,
                        protectionModNPC: npcProt,
                        displayMod: plus+this.data.data.bonusProtection
                    }];
                    combatMods.armors[armors[i].id].protectionChoices.push(base);
                }
            }
        }
    }

    // All armor types
    getItemModifierStackable(combatMods, armors, weapons, abilities) {
        this._getOwnArmorBonuses(combatMods,armors);
    }
    
    getItemModifierLightarmor(combatMods, armors, weapons, abilities) {
        this._getOwnArmorBonuses(combatMods,armors);
    }

    getItemModifierMediumarmor(combatMods, armors, weapons, abilities) {
        this._getOwnArmorBonuses(combatMods,armors);
    }

    getItemModifierHeavyarmor(combatMods, armors, weapons, abilities) {
        this._getOwnArmorBonuses(combatMods,armors);
    }
    // Higher than d8
    getItemModifierSuperarmor(combatMods, armors, weapons, abilities) {
        this._getOwnArmorBonuses(combatMods,armors);
    }

    // Weapons    
    _getOwnWeaponBonuses(combatMods, armors, weapons, abilities) 
    {       
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].id != this.id) {
                continue;
            }
            if(this.data.data.bonusDamage && this.data.data.bonusDamage !== "") {            
                let base = this._getBaseFormat();
                base.display = game.i18n.localize("WEAPON.BONUS_DAMAGE") + ": ";
                let plus = "+";
                if(this.data.data.bonusDamage.charAt(0) === '+') {
                    plus = "";
                }
                // NPC - cant get away from this
                let npcDam = 0;
                try {
                    npcDam = Math.ceil(new Roll(this.data.data.bonusDamage).evaluate({async:false, maximize: true}).total / 2);
                } catch(err) {
                    ui.notifications?.error(`Could not evaluate weapon bonus for ${this.data.name} - check bonus damage fields - `+err);
                }                                    
                base.type = game.symbaroum.config.DAM_MOD;
                base.alternatives = [{
                    damageMod: plus+this.data.data.bonusDamage,
                    damageModNPC: npcDam,
                    displayMod: plus+this.data.data.bonusDamage
                }];
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if(this.data.data.qualities.deepImpact) {
                // Add 1
                let base = this._getBaseFormat();
                base.label = game.i18n.localize("QUALITY.DEEPIMPACT");
                base.type = game.symbaroum.config.DAM_MOD;
                base.value = "+1";
                base.alternatives = [{
                    damageMod: "+1d1",
                    damageModNPC: 1,
                }];
                combatMods.weapons[weapons[i].id].package[0].member.push(base);           
            }
            if(this.data.data.qualities.precise) {
                // Add 1
                let base = this._getBaseFormat();
                base.label = game.i18n.localize("QUALITY.PRECISE");
                base.type = game.symbaroum.config.TYPE_ROLL_MOD;
                base.modifier = 1;
                base.value = "1";
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if(this.data.data.qualities.flaming){
                let base = this._getBaseFormat();
                base.label = game.i18n.localize("QUALITY.FLAMING");
                base.value = game.i18n.localize("QUALITY.FLAMING");
                base.type = game.symbaroum.config.STATUS_DOT;
                base.damagePerRound= "1d4";
                base.damagePerRoundNPC= 2;
                base.duration= "1d4";
                base.durationNPC= 2;
                base.effectIcon = "icons/svg/fire.svg";
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if(this.data.data.qualities.massive) {
                let base = this._getBaseFormat();
                base.label = game.i18n.localize("QUALITY.MASSIVE");
                base.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
                base.type = game.symbaroum.config.DAM_FAVOUR;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
                combatMods.weapons[weapons[i].id].specialEffects.push(game.symbaroum.config.DAM_FAVOUR);
            }
            if(this.data.data.alternativeDamage !== "none") {
                let base = this._getBaseFormat();
                base.label = game.i18n.localize("ATTRIBUTE.MODIFIER") + " ("+game.i18n.localize("QUALITY.PRECISE")+ "): ";
                base.type = game.symbaroum.config.TYPE_ALTERNATIVE_DAMAGE;
                base.AltDmgAttribute = this.data.data.alternativeDamage;
                base.value = this.data.data.alternativeDamage;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if( this.data.isActive && this.data.data.qualities.balanced)
            {
                for(let i = 0; i < armors.length; i++)
                {
                    if(!this.data.isActive || !armors[i].data.isActive || armors[i].data.isStackableArmor) {
                        continue;
                    }
                    let base = this._getBaseFormat();
                    base.label = `${this.data.name} ${game.i18n.localize("QUALITY.BALANCED")}`;
                    base.modifier = 1;
                    combatMods.armors[armors[i].id].defenseModifiers.push(base);            
                }
            }
        }
    }

    // All melee weapons
    getItemModifierUnarmed(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    getItemModifier1handed(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    getItemModifierShort(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    getItemModifierLong(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    getItemModifierShield(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
        if(!this.data.isActive)
        {
            return;
        }
        /* - to be added later
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].id != this.id) {
                continue;
            }
            for(let i = 0; i < armors.length; i++)
            {
                if(!armors[i].data.isActive || armors[i].data.isStackableArmor) {
                    continue;
                }
                let base = this._getBaseFormat();
                base.modifier = 1;
                combatMods.armors[armors[i].id].defenseModifiers.push(base);            
            }
        }
        */
    }
    getItemModifierHeavy(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    // All ranged
    getItemModifierRanged(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    }
    getItemModifierThrown(combatMods, armors, weapons, abilities) {
        this._getOwnWeaponBonuses(combatMods,armors, weapons, abilities);
    }
    // End weapons

    // Start abilities & traits
    getItemModifierAlternativedamage(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage === "none") {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2 * lvl.level;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }
    getItemModifierArmored(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            let modifier = 0;
            // game.symbaroum.log("getItemModifierArmored", armors[i]); // TODO Remove
            if(armors[i].isNoArmor) {
                modifier = 4; // 1d4 armor
            }
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = modifier + 2 * (lvl.level - 1); // Exclude novice - it is accounted for either in the noArmor check, or by the armor itself
            combatMods.armors[armors[i].id].protectionChoices.push(base);
        }
    }        

    getItemModifierArmoredmystic(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;

        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            if(armors[i].data.isLightArmor || armors[i].data.isMediumArmor || (armors[i].data.isHeavyArmor && lvl.level > 1) )
            {
                let base = this._getBaseFormat();
                base.modifierMagic = armors[i].data.data.impeding; // Reduce with up to current impeding
                combatMods.armors[armors[i].id].impedingModifiers.push(base);
            }
            if(lvl.level > 2) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_FIXED;
                base.alternatives = [{
                    protectionMod: "+1d4",
                    protectionModNPC: 2,
                    displayMod: "+1d4"
                }];
                combatMods.armors[armors[i].id].protectionChoices.push(base);
            }
        }
    }

    getItemModifierBackstab(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level < 1) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.alternativeDamage !== "none") {
                continue;
            }
            let pack = this._getPackageFormat();
            let basedmg = this._getBaseFormat();
            basedmg.type = game.symbaroum.config.DAM_MOD;
            if(lvl.level < 3)
            {
                basedmg.value= "+1d4";
                basedmg.alternatives = [{
                    damageMod: "+1d4",
                    damageModNPC: 2,
                    restrictions: [game.symbaroum.config.DAM_1STATTACK]
                }]
            } else {
                // Only master gives +1d8
                basedmg.value= "+1d8";
                basedmg.alternatives = [{
                    damageMod: "+1d8",
                    damageModNPC: 4
                }]
            }
            pack.member.push(basedmg);

            let baseAtt = this._getBaseFormat();
            baseAtt.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            baseAtt.attribute = "discreet";
            pack.member.push(baseAtt);

            if(lvl.level>1)
            {
                let baseBleed=this._getBaseFormat();
                baseBleed.value= game.i18n.localize("COMBAT.BLEED");
                baseBleed.type = game.symbaroum.config.STATUS_DOT;
                baseBleed.damagePerRound= "1d4";
                baseBleed.damagePerRoundNPC= 2;
                baseBleed.duration= "";
                baseBleed.durationNPC= 0;
                baseBleed.effectIcon= "icons/svg/blood.svg";
                if(lvl.level==2)
                {
                    baseBleed.restrictions= [game.symbaroum.config.DAM_1STATTACK];
                }
                pack.member.push(baseBleed);
            }
            combatMods.weapons[weapons[i].id].package.push(pack);
        }
    }
    
    getItemModifierBeastlore(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level < 2) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.alternativeDamage !== "none") {
                continue;
            }
            let pack = this._getPackageFormat();
            let damageMod = "+1d"+(lvl.level*2).toString();
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value=damageMod;
            base.alternatives = [{
                damageMod: damageMod,
                damageModNPC: (lvl.level)
            }];
            pack.member.push(base);
            combatMods.weapons[weapons[i].id].package.push(pack);
        }
        for(let i = 0; i < abilities.length; i++)
        {
            if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].hasDamage){
                let pack = this._getPackageFormat();
                let damageMod = "+1d"+(lvl.level*2).toString();
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_MOD;
                base.value=damageMod;
                base.alternatives = [{
                    damageMod: damageMod,
                    damageModNPC: (lvl.level)
                }];
                pack.member.push(base);
                combatMods.abilities[abilities[i].id].package.push(pack);
            }
        }
    }

    getItemModifierBerserker(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(!this.actor.getFlag(game.system.id, 'berserker')) {
            return;
        }

        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor)
            {
                continue;
            }
            if(lvl.level > 1) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_FIXED;
                base.alternatives = [{
                    protectionMod: "+1d4",
                    protectionModNPC: 2,
                    displayMod: "+1d4"
                }];
                combatMods.armors[armors[i].id].protectionChoices.push(base);
            }
            if(lvl.level < 3) {
                combatMods.armors[armors[i].id].specialEffects.push(game.symbaroum.config.SPECIAL_MIN_DEFENSE);
            }
        }
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.alternativeDamage !== "none" || !weapons[i].data.data.isMelee) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value = "+1d6";
            base.alternatives = [{
                damageMod: "+1d6",
                damageModNPC: 3,
            }];
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }
    
    getItemModifierBlessings(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++)
            {
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_BLESSINGS)) 
                {
                    combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
                    if(lvl.level > 2){
                        combatMods.abilities[abilities[i].id].healingBonus +="+1d4["+this.name+"]";
                        let pack = this._getPackageFormat();
                        let base = this._getBaseFormat();
                        base.type = game.symbaroum.config.DAM_MOD;
                        base.value="+1d4";
                        base.alternatives = [{
                            damageMod: "+1d4",
                            damageModNPC: 2
                        }];
                        pack.member.push(base);
                        combatMods.abilities[abilities[i].id].package.push(pack);
                    }
                }
            }
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_BLESSINGS;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }

    getItemModifierChanneling(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TEMPCORRUPTION_FAVOUR;
            combatMods.corruption.push(base);
        }
    }

    getItemModifierColossal(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 2) {
            for(let i = 0; i < armors.length; i++)
            {
                if(armors[i].data.isStackableArmor)
                {
                    continue;
                }
                let base = this._getBaseFormat();
                base.normal = 0;
                combatMods.armors[armors[i].id].damageReductions.push(base);            
    
            }
        }
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none") {
                continue;
            }
            let base = this._getBaseFormat();
            base.label = game.i18n.localize("QUALITY.MASSIVE");
            base.type = game.symbaroum.config.DAM_FAVOUR;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            combatMods.weapons[weapons[i].id].specialEffects.push(game.symbaroum.config.DAM_FAVOUR);
            if(lvl.level>1){
                let base2 = this._getBaseFormat();
                base2.type= game.symbaroum.config.TYPE_FAVOUR;
                base2.value= game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
                base2.favourMod= 1;
                combatMods.weapons[weapons[i].id].package[0].member.push(base2);
            }
        }
    }

    getItemModifierCorruptingattack(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.reference !== "unarmed") {
                continue;
            }
            let base = this._getBaseFormat();
            base.label = game.i18n.localize("TRAIT_LABEL.CORRUPTINGATTACK");
            base.type = game.symbaroum.config.CORRUPTION_DAMAGE;
            base.damage = "1d" + ((1+lvl.level)*2).toString();
            base.damageNPC = 1+lvl.level;
            base.value = base.damage;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }

    getItemModifierDancingweapon(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0 || !this.actor.getFlag(game.system.id, 'dancingweapon') ) return;
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor)
            {
                continue;
            }
            let base = this._getBaseFormat();
            base.attribute = "resolute";  
            combatMods.armors[armors[i].id].attributes.push(base);            
        }        
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee || !this.actor.getFlag(game.system.id, "dancingweapon")) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            base.attribute = "resolute";
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }        
    }    

    getItemModifierDominate(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            base.attribute = "persuasive";
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }        
    }

    getItemModifierFeatofstrength(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee) {
                continue;
            }
            if(lvl.level == 3 && this.actor.data.data.health.toughness.value <= (this.actor.data.data.health.toughness.max/2)) 
            {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_MOD;
                base.value="+1d4";
                base.alternatives = [{
                    damageMod: "+1d4",
                    damageModNPC: 2,
                }];
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if(lvl.level > 1 && this.actor.data.data.health.toughness.value <= (this.actor.data.data.health.toughness.max/2)){
                let base2 = this._getBaseFormat();
                base2.type= game.symbaroum.config.TYPE_FAVOUR;
                base2.condition = "conditionFeatofStrength";
                base2.value= game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
                base2.favourMod = 1;
                combatMods.weapons[weapons[i].id].package[0].member.push(base2);
            }
        };
        let base3 = this._getBaseFormat();
        base3.type = game.symbaroum.config.SEC_ATT_BONUS;
        base3.value=5;
        combatMods.toughness.push(base3);
    }

    conditionFeatofStrength(){
        return(weapon.attribute === "strong")
    }

    getItemModifierFeint(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1) {
            for(let i = 0; i < armors.length; i++)
            {
                if(armors[i].data.isStackableArmor)
                {
                    continue;
                }
                let base = this._getBaseFormat();
                base.attribute = "discreet";
                combatMods.armors[armors[i].id].attributes.push(base);
            }
        }
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee || !(weapons[i].data.data.qualities.precise || weapons[i].data.data.qualities.short) ) {
                continue;
            }
            let base = this._getBaseFormat();
            base.attribute = "discreet";
            base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }        
    }

    getItemModifierHuntersinstinct(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level < 1) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isDistance) {
                continue;
            }
            let pack = this._getPackageFormat();
            let baseFav = this._getBaseFormat();
            baseFav.type= game.symbaroum.config.TYPE_FAVOUR;
            baseFav.value= game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
            baseFav.favourMod= 1;
            pack.member.push(baseFav);
            if(lvl.level>1){
                let baseDmg = this._getBaseFormat();
                baseDmg.type= game.symbaroum.config.DAM_MOD;
                baseDmg.value= "+1d4",
                baseDmg.alternatives= [{
                    damageMod: "+1d4",
                    damageModNPC: 2,
                }];
                pack.member.push(baseDmg);
            }
            combatMods.weapons[weapons[i].id].package.push(pack);       
        }
    }

    getItemModifierIronfist(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.alternativeDamage !== "none" || !weapons[i].data.data.isMelee) {
                continue;
            }
            if( lvl.level > 0) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
                base.attribute = "strong";
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if( lvl.level == 2) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_MOD;
                base.value = "+1d4";
                base.alternatives = [{
                    damageMod: "+1d4",
                    damageModNPC: 2,
                }];
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if( lvl.level == 3) {
                let pack = this._getPackageFormat();
                pack.label =game.i18n.localize('ABILITY_LABEL.IRON_FIST');
                pack.type = game.symbaroum.config.PACK_RADIO;
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_RADIO;
                if(this.actor.type === "player") {
                    pack.defaultSelect = "+1d4";
                } else {
                    pack.defaultSelect = 2;
                }
                base.alternatives = [
                    {
                        label: game.i18n.localize('ABILITY_LABEL.IRON_FIST'),
                        damageMod: "+1d8",
                        damageModNPC: 4,
                        restrictions: [game.symbaroum.config.DAM_ACTIVE]    
                    },
                    {
                        label: game.i18n.localize('ABILITY_LABEL.IRON_FIST'),
                        damageMod: "+1d4",
                        damageModNPC: 2,
                        restrictions: [game.symbaroum.config.DAM_NOTACTIVE]
                    }
                ];
                pack.member.push(base);
                combatMods.weapons[weapons[i].id].package.push(pack);  
            }
        }
    }

    getItemModifierKnifeplay(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee || !weapons[i].data.data.qualities.short) {
                continue;
            }
            let base = this._getBaseFormat();
            base.attribute = "quick";
            base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            if(lvl.level > 1) {
                let base2 = this._getBaseFormat();
                base2.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
                base2.modifier = 1;
                combatMods.weapons[weapons[i].id].package[0].member.push(base2);
                combatMods.weapons[weapons[i].id].maxAttackNb += 1;
            }
        }        
    }

    getItemModifierLeader(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < abilities.length; i++){
            if(combatMods.abilities[abilities[i].id].type==="mysticalPower"){
                let base = this._getBaseFormat();
                base.attribute = "persuasive"; 
                base.type = game.symbaroum.config.TYPE_ATTRIBUTE; 
                combatMods.abilities[abilities[i].id].attributes.push(base);
            }
        };
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.lvl = lvl;
            base.type= game.symbaroum.config.TYPE_ALT_RESIST_ATTR_RESOLUTE;
            base.attribute = "persuasive";
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }

    getItemModifierManatarms(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < armors.length; i++)
        {
            if( armors[i].isNoArmor || armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.armors[armors[i].id].protectionChoices.push(base);
            if(lvl.level > 1) {
                base = this._getBaseFormat();
                base.modifier = armors[i].data.data.impeding; // Reduce with up to current impeding
                combatMods.armors[armors[i].id].impedingModifiers.push(base);
            }
        }
    }    

    getItemModifierMarksman(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" || weapons[i].data.data.reference != "ranged") {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }

    getItemModifierNaturalwarrior(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.alternativeDamage !== "none" || weapons[i].data.data.reference !== "unarmed") {
                continue;
            }
            if( lvl.level > 0) {
                let base = this._getBaseFormat();
                base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                base.diceUpgrade = 2;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
            if( lvl.level > 1) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
                base.modifier = 1;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
                combatMods.weapons[weapons[i].id].maxAttackNb += 1;
            }
            if( lvl.level > 2) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_MOD;
                base.value = "+1d6";
                base.alternatives = [{
                    damageMod: "+1d6",
                    damageModNPC: 3
                }];
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
        }
    }

    getItemModifierNaturalweapon(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" ||  weapons[i].data.data.reference !== "unarmed") {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2 * lvl.level;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }

    getItemModifierNopainthreshold(combatMods, armors, weapons, abilities) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.NO_TRESHOLD;
        combatMods.toughness.push(base);
    }

    getItemModifierPoisonresilient(combatMods, armors, weapons, abilities) 
    {
        let boonLevel = this.data.data.level;
        if(boonLevel < 1) return;
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.lvl = boonLevel;
            base.type= game.symbaroum.config.TYPE_ROLL_MOD;
            base.modifier = boonLevel;
            base.value = boonLevel.toString();
            base.powers = ["poisoner", "poisonous"];
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }

    getItemModifierPolearmmastery(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" ||
                !weapons[i].data.data.isMelee || !weapons[i].data.data.qualities.long) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }

    getItemModifierRapidfire(combatMods, armors, weapons, abilities){
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++){
            if(weapons[i].data.data.reference !== "ranged") {
                continue;
            }
            let attackNb = 1;
            if(lvl.level > 2) attackNb=2;
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
            base.modifier = attackNb;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            combatMods.weapons[weapons[i].id].maxAttackNb += attackNb;
        }
    }

    getItemModifierRapidreflexes(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level < 1) return;
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.lvl = lvl;
            base.type= game.symbaroum.config.TYPE_DMG_AVOIDING;
            base.powers = game.symbaroum.config.rapidReflexesResistList;
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }

    getItemModifierRobust(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < armors.length; i++) {
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.alternatives = [{
                protectionMod: "+1d"+(2+lvl.level*2),
                protectionModNPC: (1+lvl.level)
            }];
            combatMods.armors[armors[i].id].protectionChoices.push(base);
            base = this._getBaseFormat();
            base.modifier = -1 * lvl.level - 1; // Reduce with up to current impeding
            combatMods.armors[armors[i].id].defenseModifiers.push(base);
        }
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" || !weapons[i].data.data.isMelee) {
                continue;
            }
            let pack = this._getPackageFormat();
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value="+1d"+(2+lvl.level*2);
            base.alternatives = [{
                damageMod: "+1d"+(2+lvl.level*2),
                damageModNPC: (1+lvl.level),
                restrictions: [game.symbaroum.config.DAM_1STATTACK]
            }];
            pack.member.push(base);
            combatMods.weapons[weapons[i].id].package.push(pack);
        }
    }

    getItemModifierShieldfighter(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;

        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor)
            {
                continue;
            }
            let haveShieldEquipped = this.actor.items.filter(element => element.data.data?.reference === "shield" && element.data.isActive)
            if(haveShieldEquipped.length === 0) {
                continue;
            }                
            let base = this._getBaseFormat();
            base.modifier = 1;
            combatMods.armors[armors[i].id].defenseModifiers.push(base); 
        }
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.isMelee &&
                ["1handed", "short", "unarmed"].includes(weapons[i].data.data.reference) ) 
            {
                let haveShieldEquipped = this.actor.items.filter(element => element.data.data?.reference === "shield" && element.data.isActive)
                if(haveShieldEquipped.length === 0) {
                    continue;
                }
                // Upgrade weapon
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                base.diceUpgrade = 2;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);

            } else if( weapons[i].data.data.reference === "shield" && lvl.level > 2) {
                let base = this._getBaseFormat();
                base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                base.diceUpgrade = 4;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
        }
    }

    getItemModifierSixthsense(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        // Level 2
        if(lvl.level > 1) {
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TYPE_INITIATIVE;
            base.attribute = "vigilant";
            combatMods.initiative.push(base);
        }
        if(lvl.level > 1) {
            for(let i = 0; i < armors.length; i++)
            {
                if(armors[i].data.isStackableArmor)
                {
                    continue;
                }
                let base = this._getBaseFormat();
                base.attribute = "vigilant"; 
                base.type = game.symbaroum.config.TYPE_ATTRIBUTE; 
                combatMods.armors[armors[i].id].attributes.push(base);
            }
        }
        // Level 1
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" || !weapons[i].data.data.isDistance) {
                continue;
            }
            let base = this._getBaseFormat();
            base.attribute = "vigilant";
            base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }
    }
    //TODO sorcery level>1
    getItemModifierSorcery(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++)
            {
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].corruption == game.symbaroum.config.TEMPCORRUPTION_NORMAL) 
                {
                    combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_TESTFORONE;
                }
            };
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_SORCERY;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }

    getItemModifierSpiritform(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < armors.length; i++)
        {            
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.normal = 0.5;
            base.poison = 0;
            base.bleeding = 0;
            if(lvl.level > 1) {
                base.mysticArm = 0.5;
                base.mysticIgnArm= 0.5;
                base.elemental = 0.5;
                base.holy = 0.5;
                base.mysticalWeapon = 0.5;
            }
            if(lvl.level > 2) {
                base.normal = 0;
                base.elemental = 0;
            }
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }    

    getItemModifierStafffighting(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        let haveStaffEquipped = this.actor.items.filter(element => element.data.data.isWeapon && element.data.data.qualities.long && element.data.isActive)
        if(haveStaffEquipped) {
            for(let i = 0; i < armors.length; i++)
            {
                if(armors[i].data.isStackableArmor)
                {
                    continue;
                }
                let base = this._getBaseFormat();
                base.modifier = 1;
                combatMods.armors[armors[i].id].defenseModifiers.push(base); 
            }
        }
    }

    getItemModifierStaffmagic(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.isMelee && ["long"].includes(weapons[i].data.data.reference)) 
            {
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value = "+1d4";
            base.alternatives = [{
                damageMod: "+1d4",
                damageModNPC: 2,
            }];
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
        };
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++)
            {
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_STAFFM)) 
                {
                    combatMods.abilities[abilities[i].id].corruption = lvl.level == 2 ? game.symbaroum.config.TEMPCORRUPTION_FAVOUR : game.symbaroum.config.TEMPCORRUPTION_NONE;
                }
            };
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_STAFFM;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }

    getItemModifierSteadfast(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level < 1) return;
        for(let i = 0; i < armors.length; i++)
        {
            // Do we apply it if they just wear stackable armor?
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.lvl = lvl;
            base.type= game.symbaroum.config.TYPE_FAVOUR;
            base.value= game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
            base.favourMod= -1;
            base.powers = game.symbaroum.config.steadFastNovResistList;
            if(lvl.level > 1){
                base.powers = base.powers.concat(game.symbaroum.config.steadFastAdeptResistList);
            }
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }

    getItemModifierSteelthrow(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if( weapons[i].data.data.alternativeDamage !== "none" || weapons[i].data.data.reference != "thrown") {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            if(lvl.level > 1){
                let attackNb = 1;
                if(lvl.level > 2) attackNb=2;
                let base2 = this._getBaseFormat();
                base2.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
                base2.modifier = attackNb;
                combatMods.weapons[weapons[i].id].package[0].member.push(base2);
                combatMods.weapons[weapons[i].id].maxAttackNb += attackNb;
            }
        }
    }

    getItemModifierStronggift(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level < 2) return;
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.SEC_ATT_MULTIPLIER;
        base.value = 2;
        combatMods.corruption.push(base);
        let base2 = this._getBaseFormat();
        base2.type = game.symbaroum.config.THRESHOLD_MULTIPLIER;
        base2.value = 1;
        combatMods.corruption.push(base2);
    }

    getItemModifierSturdy(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.SEC_ATT_MULTIPLIER;
        if(lvl.level == 1)  base.value = 1.5;
        else base.value = lvl.level;
        combatMods.toughness.push(base);
    }

    getItemModifierSurvivalinstinct(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level < 2) return;
        for(let i = 0; i < armors.length; i++)
        {
            if(armors[i].data.isStackableArmor)
            {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_FIXED;
            base.alternatives = [{
                protectionMod: "+1d4",
                protectionModNPC: 2,
                displayMod: "+1d4"
            }];
            combatMods.armors[armors[i].id].protectionChoices.push(base);
        }
    }

    getItemModifierSwarm(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < armors.length; i++)
        {            
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.normal = 0.5;
            base.mysticArm = 0.5;
            base.mysticIgnArm= 0.5;
            base.elemental = 0.5;
            base.holy = 0.5;
            base.mysticalWeapon = 0.5
            base.poison = 0;
            base.bleeding = 0;
            if(lvl.level > 2) {
                base.normal = 0.25;
                base.mysticArm = 0.25;
                base.mysticIgnArm= 0.25;
                base.elemental = 0.25;
                base.holy = 0.25;
                base.mysticalWeapon = 0.25
            }
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    } 

    getItemModifierTactician(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        let base = this._getBaseFormat();
        base.attribute = "cunning";
        base.type = game.symbaroum.config.TYPE_INITIATIVE;
        combatMods.initiative.push(base);
        if( lvl.level > 1)
        {
            for(let i = 0; i < armors.length; i++)
            {
                // Do we apply it if they just wear stackable armor?
                if(armors[i].data.isStackableArmor) {
                    continue;
                }
                base = this._getBaseFormat();
                base.attribute = "cunning";
                base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
                combatMods.armors[armors[i].id].attributes.push(base);
            }
        }
        if( lvl.level > 2) 
        {
            for(let i = 0; i < weapons.length; i++)
            {
                // Can use cunning for attacks for any attack, except heavy - as example an undead, this includes alternate damage
                if(weapons[i].data.data.reference == "heavy") {
                    continue;
                }
                base = this._getBaseFormat();
                base.attribute = "cunning";
                base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }        
        }
    }
    
    getItemModifierTheurgy(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++)
            {
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_THEURGY)) 
                {
                    combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
                    if(lvl.level > 2){
                        combatMods.abilities[abilities[i].id].healingBonus +="+1d4["+this.name+"]";
                        let pack = this._getPackageFormat();
                        let base = this._getBaseFormat();
                        base.type = game.symbaroum.config.DAM_MOD;
                        base.value="+1d4";
                        base.alternatives = [{
                            damageMod: "+1d4",
                            damageModNPC: 2
                        }];
                        pack.member.push(base);
                        combatMods.abilities[abilities[i].id].package.push(pack);
                    }
                }
            };
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_THEURGY;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }

    getItemModifierThoroughlycorrupt(combatMods, armors, weapons, abilities) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.NO_TRESHOLD;
        combatMods.corruption.push(base);
    }

    getItemModifierTwinattack(combatMods, armors, weapons, abilities) {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        for(let i = 0; i < weapons.length; i++)
        {
            if(!weapons[i].data.data.isMelee || !["1handed", "short"].includes(weapons[i].data.data.reference) ) {
                continue;
            }
            let twoWeapon = this.actor.items.filter(element => ["1handed", "short"].includes(element.data.data?.reference) && element.data.isActive)
            if(twoWeapon.length < 2) {
                return;
            }
            
            let base = this._getBaseFormat();
            base.modifier = 1;
            base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            if(this.actor.type === "monster") combatMods.weapons[weapons[i].id].maxAttackNb += 1;

            if(lvl.level < 3 || this.actor.type === "player" || !game.settings.get('symbaroum', 'showNpcAttacks')) {
                // Continue - do not want to indent further
                continue;
            }

            /* Calculations only for NPCs - can't easily be judged otherwise */
            // Master ability
            // Look at all active weapons of 1handed or short
            // If the current weapon is the first 1d6 or 1d8 base damage one - upgrade
            // If the current weapon is the first (or potentially second) 1d6 base damage one - upgrade
            let foundd8 = 0;
            let foundd6 = 0;
            let spared6weap = null;
            for(let j = 0; j < twoWeapon.length; j++) {
                if( twoWeapon[j].data.data.reference === "short")
                {
                    foundd6++;                    
                    if(foundd6 === 1 && twoWeapon[j].id == weapons[i].id) 
                    {
                        base = this._getBaseFormat();
                        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                        base.diceUpgrade = 2;
                        combatMods.weapons[weapons[i].id].package[0].member.push(base);        
                        // First short, upgrade
                    } else if(foundd6 === 2 && spared6weap === null && twoWeapon[j].id === weapons[i].id) {
                        // Store away this and if there is no d8 found once we are done, upgrade d8
                        spared6weap = twoWeapon[j];
                    }
                }
                else if( twoWeapon[j].data.data.reference === "1handed") 
                {
                    foundd8++;
                    if(foundd8 === 1 && twoWeapon[j].id == weapons[i].id)
                    {
                        base = this._getBaseFormat();
                        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                        base.diceUpgrade = 2;
                        combatMods.weapons[weapons[i].id].package[0].member.push(base);       
                    }
                }
            }
            if(foundd8 === 0 && spared6weap != null) {                
                // Only wielding d6 weapons and this is the last d6 weapon, so upgrade it too
                base.type = game.symbaroum.config.DAM_DICEUPGRADE;
                base.diceUpgrade = 2;
                combatMods.weapons[weapons[i].id].package[0].member.push(base);
            }
        }        
    }

    getItemModifierTwohandedforce(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;

        for(let i = 0; i < weapons.length; i++)
        {
            if(weapons[i].data.data.reference != "heavy") {
                continue;
            }
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
        }        
    }

    getItemModifierUndead(combatMods, armors, weapons, abilities) 
    {
        let lvl = this.getLevel();
        if(lvl.level < 1) return;
        for(let i = 0; i < armors.length; i++)
        {
            // Do we apply it if they just wear stackable armor?
            if(armors[i].data.isStackableArmor) {
                continue;
            }
            let base = this._getBaseFormat();
            base.poison = 0;
            base.bleeding = 0;
            if(lvl.level > 1) {
                base.normal = 0.5;
                base.elemental = 0.5;
                base.mysticArm = 0.5;
            }
            if(lvl.level > 2) {
                base.mysticIgnArm= 0.5;
            }
            combatMods.armors[armors[i].id].damageReductions.push(base);            
        }
    }
    
    getItemModifierWitchcraft(combatMods, armors, weapons, abilities)
    {
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++)
            {
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_WITCHCRAFT)) 
                {
                    combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
                }
            };
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_WITCHCRAFT;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }
    
    getItemModifierWizardry(combatMods, armors, weapons, abilities){
        let lvl = this.getLevel();
        if(lvl.level == 0) return;
        if(lvl.level > 1){
            for(let i = 0; i < abilities.length; i++){
                if(combatMods.abilities[abilities[i].id].type==="mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_WIZARDRY)) 
                {
                    combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
                    if(lvl.level > 2){
                        let pack = this._getPackageFormat();
                        let base = this._getBaseFormat();
                        base.type= game.symbaroum.config.TYPE_FAVOUR;
                        base.value= game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
                        base.favourMod= 1;
                        pack.member.push(base);
                        combatMods.abilities[abilities[i].id].package.push(pack);
                    }
                }
            };
        };
        let base = this._getBaseFormat();
        base.value = game.symbaroum.config.TRAD_WIZARDRY;
        base.level = lvl.level
        combatMods.traditions.push(base);
    }

    //MysticPowers
    mysticPowerSetupAnathema(base) {
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY, game.symbaroum.config.TRAD_STAFFM];
        base.getTarget= true;
        base.targetMandatory= true;
        base.targetResistAttribute= "resolute";
        base.introText= game.i18n.localize('POWER_ANATHEMA.CHAT_INTRO');
        base.resultTextSuccess= game.i18n.localize('POWER_ANATHEMA.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_ANATHEMA.CHAT_FAILURE');
        base.maintain = game.symbaroum.config.MAINTAIN_NOT;
        base.casting = game.symbaroum.config.CASTING_RES;
        
        if(base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
        return(base);
    }

    mysticPowerSetupBrimstonecascade(base) {
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
        base.hasDamage= true;
        base.damageDice = "1d12";
        base.avoidDamageDice = "1d6";
        base.damageType = {
            mysticArm: true
        };
        base.getTarget= true;
        base.targetMandatory= true;
        base.targetResistAttribute="quick";
        base.targetImpeding = true;
        base.introText= game.i18n.localize('POWER_BRIMSTONECASC.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_BRIMSTONECASC.CHAT_INTRO');
        base.resultTextSuccess= game.i18n.localize('POWER_BRIMSTONECASC.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_BRIMSTONECASC.CHAT_FAILURE');
        base.casting = game.symbaroum.config.CASTING_RES;
        if(base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
        base.rollFailedFSmod = {
            damageDice: "1d6",
            avoidDamageDice: "0d0",
        };
        return(base);
    }

    mysticPowerSetupBendwill(base) {
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_WITCHCRAFT];
        base.targetResistAttribute= "resolute";
        base.getTarget= true;
        base.targetMandatory= true;
        base.casting = game.symbaroum.config.CASTING_RES;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "bendwill")];
        base.introText = game.i18n.localize('POWER_BENDWILL.CHAT_INTRO');
        base.introTextMaintain = game.i18n.localize('POWER_BENDWILL.CHAT_INTRO_M');
        base.resultTextSuccess = game.i18n.localize('POWER_BENDWILL.CHAT_SUCCESS');
        base.resultTextFail = game.i18n.localize('POWER_BENDWILL.CHAT_FAILURE');
        base.finalText = "";
        return(base);
    }
    
    mysticPowerSetupBlackbolt(base) {
        base.traditions = [game.symbaroum.config.TRAD_SORCERY];
        base.targetResistAttribute= "quick";
        base.hasDamage= true;
        base.getTarget= true;
        base.targetMandatory= true;
        base.targetImpeding = true;
        base.introText=  game.i18n.localize('POWER_BLACKBOLT.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_BLACKBOLT.CHAT_INTRO');
        base.resultTextSuccessT= game.i18n.localize('POWER_BLACKBOLT.CHAT_SUCCESS');
        base.resultTextFailT= game.i18n.localize('POWER_BLACKBOLT.CHAT_FAILURE');
        base.damageDice= "1d6";
        base.damageType = {
            mystic: true
        };
        base.addTargetEffect= [CONFIG.statusEffects.find(e => e.id === "paralysis")];
        base.ignoreArm=true;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.casting = game.symbaroum.config.CASTING_RES;
        
        if(base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
        return(base);
    }

    mysticPowerSetupBlessedshield(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.traditions = [game.symbaroum.config.TRAD_THEURGY];
        base.addCasterEffect = [CONFIG.statusEffects.find(e => e.id === "holyShield")];
        base.introText = game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_INTRO');
        base.resultTextSuccess = game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_SUCCESS');
        base.resultTextFail = game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_FAILURE');
        if(base.powerLvl.level > 1) {
            base.multipleTargets = true;
            base.multipleTargetsNb = base.powerLvl.level-1;
        }
        return(base);
    }
    
    mysticPowerSetupConfusion(base) {
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_TROLLS];
        base.targetResistAttribute= "resolute";
        base.getTarget= true;
        base.targetMandatory= true;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.casting = game.symbaroum.config.CASTING_RES;
        base.confusion =true;
        base.activelyMaintainedTargetEffect = [CONFIG.statusEffects.find(e => e.id === "confusion")];
        return(base);
    }
    
    mysticPowerSetupCurse(base) {
        base.casting = game.symbaroum.config.CASTING_NOT;
        base.getTarget= true;
        base.targetMandatory= true;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
        base.resultText = game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_N');
        if(base.powerLvl.level == 2){base.resultText = game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_A')}
        else if(base.powerLvl.level == 3){base.resultText = game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_M')};
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.introText= game.i18n.localize('POWER_CURSE.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_CURSE.CHAT_INTRO_M');
        base.resultTextSuccess= base.resultText;
        base.resultTextFail= game.i18n.localize('POWER_CURSE.CHAT_FAILURE');
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "curse")];
        base.rollFailedFSmod = {
            finalText: game.i18n.localize('POWER_CURSE.CHAT_FAIL_FINAL')
        };
        return(base);
    }

    mysticPowerSetupDancingweapon(base) {
        base.casting = game.symbaroum.config.CASTING_NOT;
        base.traditions = [game.symbaroum.config.TRAD_TROLLS, game.symbaroum.config.TRAD_STAFFM];
        base.corruption = false;
        base.gmOnlyChatResultNPC = true;
        base.flagTest = "dancingweapon";
        base.flagPresentFSmod = {
            introText: game.i18n.localize('POWER_DANCINGWEAPON.CHAT_DESACTIVATE'),
            resultTextSuccess: game.i18n.localize('POWER_DANCINGWEAPON.CHAT_RESULT_DESACTIVATE'),
            removeCasterEffect: [CONFIG.statusEffects.find(e => e.id === "dancingweapon")]
        };
        base.flagNotPresentFSmod = {
            flagData: base.powerLvl.level,
            introText: game.i18n.localize('POWER_DANCINGWEAPON.CHAT_ACTIVATE'),
            resultTextSuccess: game.i18n.localize('POWER_DANCINGWEAPON.CHAT_RESULT_ACTIVATE'),
            addCasterEffect: [CONFIG.statusEffects.find(e => e.id === "dancingweapon")]
        }
        return(base);
    }
    
    mysticPowerSetupEntanglingvines(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.casting = game.symbaroum.config.CASTING;
        base.targetResistAttribute= "strong";
        base.hasDamage= base.powerLvl.level === 3;
        base.damageDice= "1d6";
        base.damageType = {
            mysticIgnArm: true
        };
        base.introTextMaintain= game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_INTRO_M');
        base.resultTextSuccess= game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_FAILURE');
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "entanglingvines")];
        base.ignoreArm=true;
        return(base);
    }
    
    mysticPowerSetupFlamewall(base) {
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.casting = game.symbaroum.config.CASTING;
        return(base);
    }
    
    mysticPowerSetupHolyaura(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.traditions = [game.symbaroum.config.TRAD_THEURGY];
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.introText= game.i18n.localize('POWER_HOLYAURA.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_HOLYAURA.CHAT_INTRO');
        base.resultTextSuccess= game.i18n.localize('POWER_HOLYAURA.CHAT_SUCCESS');
        base.resultTextFail=game.i18n.localize('POWER_HOLYAURA.CHAT_FAILURE');
        base.activelyMaintaninedCasterEffect= [CONFIG.statusEffects.find(e => e.id === "holyaura")];
        let auraDamage = "1d6";
        let auraHeal = "1d4";
        if(base.powerLvl.level == 2){auraDamage = "1d8"}
        else if(base.powerLvl.level == 3){auraDamage = "1d10"; auraHeal = "1d6"}
        base.finalTextSucceed = game.i18n.localize('COMBAT.DAMAGE') + auraDamage;
        if(base.powerLvl.level > 1){
            base.finalTextSucceed += game.i18n.localize('POWER_HOLYAURA.HEALING') + auraHeal;
        }
        return(base);
    }
    
    mysticPowerSetupInheritwound(base){
        base.casting = game.symbaroum.config.CASTING;
        base.maintain = game.symbaroum.config.MAINTAIN_NOT;
        base.getTarget= true;
        base.targetMandatory= true;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT, game.symbaroum.config.TRAD_THEURGY];
        base.healedToken= game.symbaroum.config.TARGET_TOKEN;
        base.introText= game.i18n.localize('POWER_INHERITWOUND.CHAT_INTRO');
        base.resultTextSuccess= game.i18n.localize('POWER_INHERITWOUND.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_INHERITWOUND.CHAT_FAILURE');
        base.healFormulaSucceed = (base.powerLvl.level > 2) ? "1d8" : "1d6";
        base.damageType = {
            mysticIgnArm: true
        };
        base.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET');
        return(base);
    }

    mysticPowerSetupLarvaeboils(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.targetResistAttribute= "strong";
        base.casting = game.symbaroum.config.CASTING_NOT;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
        base.hasDamage= true;
        base.damageDice= "1d" + (2*base.powerLvl.level+2).toString();
        base.damageType = {
            mysticIgnArm: true
        }
        base.introText= game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO_M');
        base.resultTextSuccess= game.i18n.localize('POWER_LARVAEBOILS.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_LARVAEBOILS.CHAT_FAILURE');
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "larvaeboils")];
        base.ignoreArm=true;
        return(base);
    }
    
    mysticPowerSetupLayonhands(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.getTarget= true;
        base.targetMandatory= true;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT, game.symbaroum.config.TRAD_THEURGY];
        base.healFormulaSucceed = "1d6";
        if(base.powerLvl.level > 1){
            base.healFormulaSucceed = "1d8";
            base.removeTargetEffect = [CONFIG.statusEffects.find(e => e.id === "poison"), CONFIG.statusEffects.find(e => e.id === "bleeding")]
        }
        base.healedToken= game.symbaroum.config.TARGET_TOKEN;
        base.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET');
        
        if(base.powerLvl.level > 2){
            base.preDialogFunction = preDialogLayonHands;
        }
        return(base);
    }
    
    mysticPowerSetupLevitate(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY];
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.addCasterEffect = [CONFIG.statusEffects.find(e => e.id === "fly")];
        if(base.powerLvl.level > 1){
            base.getTarget= true;
            base.targetResistAttribute= "strong";
            base.casting = game.symbaroum.config.CASTING_RES;
            base.addTargetEffect= [CONFIG.statusEffects.find(e => e.id === "fly")];
        }
        return(base);
    }
    
    mysticPowerSetupMaltransformation(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
        base.casting = game.symbaroum.config.CASTING_RES;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.targetResistAttribute= "resolute";
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "maltransformation")];
        return(base);
    }
    
    mysticPowerSetupMindthrow(base) {
        base.getTarget= true;
        base.targetResistAttribute= "quick";
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
        base.targetPresentFSmod = {
            hasDamage: true,
            casting: game.symbaroum.config.CASTING_RES,
            damageDice: "1d8",
            targetImpeding: true,
            damageType: {
                mysticArm: true
            }
        };
        if(base.powerLvl.level>2){
            base.maintain = game.symbaroum.config.MAINTAIN;
        }
        return(base);
    }
    
    mysticPowerSetupPriosburningglass(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.getTarget= true;
        base.targetMandatory= true;
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.traditions = [game.symbaroum.config.TRAD_THEURGY];
        base.introText= game.i18n.localize('POWER_PRIOSBURNINGGLASS.CHAT_INTRO');
        base.hasDamage= true;
        base.askCorruptedTarget = true;
        if(base.powerLvl.level === 1) {
            base.damageDice = "1d6";
            base.targetFullyCorruptedFSmod = {
                damageDice: "1d8"
            };
        }
        else{
            base.damageDice = "1d8";
            base.targetFullyCorruptedFSmod = {
                damageDice: "1d12"
            };
        }
        base.damageType = {
            holy: true,
            mysticArm: true
        }
        if(base.powerLvl.level === 3) {
            base.targetFullyCorruptedFSmod.finalTextSucceed = game.i18n.localize('POWER_PRIOSBURNINGGLASS.CHAT_EXTRA')
        }
        return(base);
    }
    
    mysticPowerSetupTormentingspirits(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.getTarget= true;
        base.targetMandatory= true;
        base.maintain = game.symbaroum.config.MAINTAIN;
        base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
        base.isAlternativeDamage= true;
        base.alternativeDamageAttribute= "resolute";
        base.introText= game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_INTRO');
        base.introTextMaintain= game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_INTRO_M');
        base.resultTextSuccess= game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_FAILURE');
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "tormentingspirits")];
    
        if(base.powerLvl.level >1){
            base.hasDamage= true;
            base.damageDice= "1d"+(2*base.powerLvl.level).toString();
            base.ignoreArm=true;
            base.damageType = {
                mysticIgnArm: true
            }
        }
        return(base);
    }

    mysticPowerSetupUnnoticeable(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY];
        base.gmOnlyChatResultNPC = true;
        base.addCasterEffect = [CONFIG.statusEffects.find(e => e.id === "unnoticeable")];
        return(base);
    }

    // ********************************************* ABILITIES *****************************************************
    
    abilitySetupAcrobatics(base) {
        base.castingAttributeName = "quick";
        base.impeding = game.symbaroum.config.IMPEDING_MOVE;
        return(base);
    }
    
    abilitySetupArtifactcrafting(base) {
        return(base);
    }
    
    abilitySetupAlchemy(base) {
        return(base);
    }
    
    abilitySetupBeastlore(base) {
        return(base);
    }
    
    abilitySetupBerserker(base) {
        base.casting = game.symbaroum.config.CASTING_NOT;
        base.gmOnlyChatResultNPC = true;
        base.flagTest = "berserker";
        base.flagPresentFSmod = {
            introText: game.i18n.localize('ABILITY_BERSERKER.CHAT_DESACTIVATE'),
            resultTextSuccess: game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_DESACTIVATE'),
            removeCasterEffect: [CONFIG.statusEffects.find(e => e.id === "berserker")]
        };
        base.flagNotPresentFSmod = {
            flagData: base.powerLvl.level,
            introText: game.i18n.localize('ABILITY_BERSERKER.CHAT_ACTIVATE'),
            addCasterEffect: [CONFIG.statusEffects.find(e => e.id === "berserker")]
        }
        if(base.powerLvl.level == 2) base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL2');
        else if(base.powerLvl.level > 2) base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL3');
        else base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL1');
        return(base);
    }
    
    abilitySetupBlacksmith(base) {
        return(base);
    }
    
    abilitySetupDominate(base) {
        if (base.powerLvl.level<2){
            base.isScripted = false;
        }
        else{
            base.getTarget= true;
            base.targetMandatory= true;
            base.casting = game.symbaroum.config.CASTING_RES;
            base.castingAttributeName= "persuasive";
            base.targetResistAttribute= "resolute";
            base.addTargetEffect= [CONFIG.statusEffects.find(e => e.id === "fear")];
        }
        if(base.powerLvl.level == 2){
            base.introText = game.i18n.localize('ABILITY_DOMINATE_ADEPT.CHAT_INTRO');
            base.resultTextSuccess = game.i18n.localize('ABILITY_DOMINATE_ADEPT.CHAT_SUCCESS');
        }
        else{
            base.introText = game.i18n.localize('ABILITY_DOMINATE_MASTER.CHAT_INTRO');
            base.resultTextSuccess = game.i18n.localize('ABILITY_DOMINATE_MASTER.CHAT_SUCCESS');
        }
        return(base);
    }
    
    abilitySetupLeader(base) {
        if (base.powerLvl.level<2){
            base.isScripted = false;
        }
        else{
            base.getTarget= true;
            base.targetMandatory= true;
            base.casting = game.symbaroum.config.CASTING_NOT;
            base.resultTextSuccess = game.i18n.localize('ABILITY_LEADER.CHAT_SUCCESS');
            base.addTargetEffect = [CONFIG.statusEffects.find(e => e.id === "eye")];
        }
        return(base);
    }
    
    abilitySetupLoremaster(base) {
        base.introText = game.i18n.localize('ABILITY_LOREMASTER.CHAT_INTRO');
        base.resultTextSuccess = game.i18n.localize('ABILITY_LOREMASTER.CHAT_SUCCESS');
        base.resultTextFail =  game.i18n.localize('ABILITY_LOREMASTER.CHAT_FAILURE');
        return(base);
    }
    
    abilitySetupMedicus(base){
        base.castingAttributeName= "cunning",
        base.getTarget= true;
        base.healFormulaSucceed = "1d4";
        base.medicusExam = true;
        base.targetPresentFSmod = {
            medicusExam: false,
            healedToken: game.symbaroum.config.TARGET_TOKEN,
            targetText: game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET'),
            subText: base.label + " (" + base.powerLvl.lvlName + ")",
            medicus: true,
        };
        if(base.powerLvl.level == 1){
            base.targetPresentFSmod.healFormulaSucceed = "1d4"
        }
        else if(base.powerLvl.level == 2){
            base.targetPresentFSmod.healFormulaSucceed = "1d6"
        }
        else{
            base.targetPresentFSmod.healFormulaSucceed = "1d8";
            base.targetPresentFSmod.healFormulaFailed = "1d4";
        }
        return(base);
    }

    abilitySetupPoisoner(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.casting = game.symbaroum.config.CASTING_RES;
        base.castingAttributeName= "cunning";
        base.targetResistAttribute= "strong";
        base.usePoison = true;
        base.poisoner = true;
        return(base);
    }
    
    abilitySetupRecovery(base) {
        base.casting = game.symbaroum.config.CASTING;
        base.castingAttributeName = "resolute";
        base.healedToken = game.symbaroum.config.ACTING_TOKEN;
    
        if(base.powerLvl.level == 2) {base.healFormulaSucceed = "1d6"}
        else if(base.powerLvl.level == 3) {base.healFormulaSucceed = "1d8"}
        else {base.healFormulaSucceed = "1d4"};
        return(base);
    }
    
    abilitySetupQuickdraw(base) {
        base.castingAttributeName = "quick";
        base.impeding = game.symbaroum.config.IMPEDING_MOVE;
        return(base);
    }

    abilitySetupStrangler(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.casting = game.symbaroum.config.CASTING_RES;
        base.maintain = game.symbaroum.config.MAINTAIN_RES;
        base.castingAttributeName= "cunning";
        base.targetResistAttribute= "cunning";
        base.askCastingAttribute = true;
        base.impeding = game.symbaroum.config.IMPEDING_MOVE;
        base.introText = game.i18n.localize('ABILITY_STRANGLER.CHAT_INTRO');
        base.introTextMaintain = game.i18n.localize('ABILITY_STRANGLER.CHAT_INTRO_M');
        base.resultTextSuccess= game.i18n.localize('ABILITY_STRANGLER.CHAT_SUCCESS');
        base.resultTextFail = game.i18n.localize('ABILITY_STRANGLER.CHAT_FAILURE');
        base.activelyMaintainedTargetEffect= [CONFIG.statusEffects.find(e => e.id === "strangler")];
        base.hasDamage= true;
        base.damageDice= "1d6";
        base.newStuffIfMaintain = {
            castingAttributeName: "cunning",
            targetResistAttribute: "cunning"
        }
        return(base);
    }

    abilitySetupWitchsight(base) {
        base.castingAttributeName= "vigilant";
        base.targetResistAttribute= "discreet";
        base.getTarget= true;
        base.targetPresentFSmod = {
            casting: game.symbaroum.config.CASTING_RES,
        };
        if(base.powerLvl.level == 2){
            base.corruption = game.symbaroum.config.TEMPCORRUPTION_NORMAL;
        }else if(base.powerLvl.level > 2){
            base.corruption = game.symbaroum.config.TEMPCORRUPTION_D6;
        }
        else base.corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
        base.introText= game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_INTRO');
        baseRoll.resultTextSuccess= game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_SUCCESS');
        base.resultTextFail= game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FAILURE');
        return(base);
    }

    // ********************************************* TRAITS *****************************************************
    
    traitSetupPoisonous(base) {
        base.getTarget= true;
        base.targetMandatory= true;
        base.casting = game.symbaroum.config.CASTING_RES;
        base.castingAttributeName= "cunning";
        base.targetResistAttribute= "strong";
        base.usePoison = true;
        base.poison = base.powerLvl.level;
        return(base);
    }

    traitSetupRegeneration(base){
        base.introText = game.i18n.localize('TRAIT_REGENERATION.CHAT_ACTION');
        base.casting = game.symbaroum.config.CASTING_NOT;
        base.healedToken = game.symbaroum.config.ACTING_TOKEN;
    
        if(base.powerLvl.level == 2) {base.healFormulaSucceed = "1d6"}
        else if(base.powerLvl.level == 3) {base.healFormulaSucceed = "1d8"}
        else {base.healFormulaSucceed = "1d4"};
        let regenDice = 2+ 2*base.powerLvl.level;
        base.healFormulaSucceed = "1d" + regenDice.toString();
        return(base);
    }
    
    traitSetupShapeshifter(base) {
        base.castingAttributeName = "resolute";
        return(base);
    }

    traitSetupWisdomages(base) {
        base.castingAttributeName = "resolute";
        return(base);
    }

    async getFunctionStuffDefault(actor, actingToken) {
        let functionStuff = {
            casting: game.symbaroum.config.CASTING,
            maintain: game.symbaroum.config.MAINTAIN_NOT,
            chain: game.symbaroum.config.CHAIN_NOT,
            ability: this.data,
            actor: actor,
            askTargetAttribute: false,
            askCastingAttribute: false,
            attackFromPC: actor.type !== "monster",
            autoParams: "",
            combat: false,
            corruption: false,
            favour: 0,
            isMaintained: false,
            modifier: 0,
            targetMandatory : false,
            targetData: {hasTarget: false, leaderTarget: false},
            token :actingToken,
            tokenId :actingToken?.id,
            actingCharName :actingToken?.data?.name ?? actor.name,
            actingCharImg: actingToken?.data?.img ?? actor.data.img,
            addCasterEffect: [],
            addTargetEffect: [],
            activelyMaintainedTargetEffect: [],
            activelyMaintaninedCasterEffect: [],
            removeTargetEffect: [],
            removeCasterEffect: [],
            introText: game.i18n.localize('POWER.CHAT_INTRO') + this.name + " \".",
            introTextMaintain: game.i18n.localize('POWER.CHAT_INTRO_M') + this.name + " \".",
            resultTextSuccess: game.i18n.localize('POWER.CHAT_SUCCESS'),
            resultTextFail: game.i18n.localize('POWER.CHAT_FAILURE'),
            resistRollText: "",
            hasDamage: false,
            isAlternativeDamage: false,
            dmgModifier: "",
            hasAdvantage: false,
            ignoreArm: false
        };
        return(functionStuff);
    }
}
  
async function weaponTypeLabel(weapon){
    switch (weapon.reference){
        case "1handed":
            return(game.i18n.localize('WEAPON_CLASS.1HANDED'));
        case "short":
            return(game.i18n.localize('WEAPON_CLASS.SHORT'));
        case "long":
            return(game.i18n.localize('WEAPON_CLASS.LONG'));
        case "unarmed":
            return(game.i18n.localize('WEAPON_CLASS.UNARMED'));
        case "heavy":
            return(game.i18n.localize('WEAPON_CLASS.HEAVY'));
        case "ranged":
            return(game.i18n.localize('WEAPON_CLASS.RANGED'));
        case "thrown":
            return(game.i18n.localize('WEAPON_CLASS.THROWN'));
        case "shield":
            return(game.i18n.localize('WEAPON_CLASS.SHIELD'));
        case "other":
            return(game.i18n.localize('GEAR.OTHER'));
    }
    return(game.i18n.localize('GEAR.OTHER'));
}

/* format the string to print the roll result, including the 2 dice if favour was involved, up to 3 rolls for multi-attacks
@Params: {object}  rollData is the array of objects baseRoll function returns 
@returns:  {string} the formated and localized string*/
export function formatRollResult(rollDataElement){
    let rollResult = game.i18n.localize('ABILITY.ROLL_RESULT') + rollDataElement.diceResult.toString();
    if(rollDataElement.favour != 0){
        rollResult += "  (" + rollDataElement.dicesResult[0].toString() + " , " + rollDataElement.dicesResult[1].toString() + ")";
    }
    if(rollDataElement.secondRollResult){
        rollResult += "<br />" + game.i18n.localize('ABILITY.SECOND_ROLL_RESULT') + rollDataElement.secondRollResult.toString();
    }
    return(rollResult);
}

async function checkCorruptionThreshold(actor, corruptionGained){
    let img ="icons/magic/air/wind-vortex-swirl-purple.webp";
    let introText = actor.data.name + game.i18n.localize('CORRUPTION.CHAT_WARNING');
    let finalText=actor.data.name + game.i18n.localize('CORRUPTION.CHAT_WARNING');
    if(!actor.data.data.health.corruption.threshold) return;
    else if(actor.data.data.health.corruption.value < actor.data.data.health.corruption.threshold){
        if(actor.data.data.health.corruption.value+corruptionGained >= actor.data.data.health.corruption.threshold){
            introText = actor.data.name + game.i18n.localize('CORRUPTION.CHAT_INTRO');
            finalText=actor.data.name + game.i18n.localize('CORRUPTION.CHAT_THRESHOLD');
            img="icons/magic/acid/dissolve-arm-flesh.webp";
        }else if(actor.data.data.health.corruption.value+corruptionGained != actor.data.data.health.corruption.threshold -1){
            return;            
        }
    }
    else if(actor.data.data.health.corruption.value < actor.data.data.health.corruption.max){
        if(actor.data.data.health.corruption.value+corruptionGained >= actor.data.data.health.corruption.max){
            introText = actor.data.name + game.i18n.localize('CORRUPTION.CHAT_INTRO');
            finalText=actor.data.name + game.i18n.localize('CORRUPTION.CHAT_MAX');
            img="icons/creatures/unholy/demon-horned-winged-laughing.webp";
        }else if(actor.data.data.health.corruption.value+corruptionGained != actor.data.data.health.corruption.max -1){
            return;
        }
    }

    let templateData = {
        targetData : false,
        hasTarget : false,
        introText: introText,
        introImg: actor.data.img,
        targetText: "",
        subText: "",
        subImg: img,
        hasRoll: false,
        rollString: "",
        rollResult: "",
        resultText: "",
        finalText: finalText,
        haveCorruption: false,
        corruptionText: ""
    };

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    if(!actor.hasPlayerOwner){
        let gmList =  ChatMessage.getWhisperRecipients('GM');
        if(gmList.length > 0){
            chatData.whisper = gmList
        }
    }
    let NewMessage = await ChatMessage.create(chatData);
}

//check if there is an icon effect on the token
export function getEffect(token, effect){
    let statusCounterMod = false;
    if(game.modules.get("statuscounter")?.active){
        //statusCounterMod = true;  until corrected
    };
    if(statusCounterMod){
        if(EffectCounter.findCounter(token.document, effect.icon)){
            return(true)
        }
        else return(false)
    }
    else{
        if(token.actor.effects.find(e => e.getFlag("core", "statusId") === effect.id)){
            return(true)
        }
        else return(false)
    }
}

// check if pain (damage > toughness treshold)
function checkPainEffect(functionStuff, damageTotal){
    if(!functionStuff.isAlternativeDamage && functionStuff.targetData.actor.data.data.health.toughness.threshold && (damageTotal > functionStuff.targetData.actor.data.data.health.toughness.threshold))
    {
        return(true);
    }
    return(false);
}

/*usualy called by any prepareAbility function, or the combat function
will send to screen a windows asking for modifiers for the roll, then roll, then call the abilityResult function (sent as a parameter)
   * @param {item} ability      The base (active or reactive) ability power or trait for the roll.
   * @param {actor} actor       The actor of the roll
   * @param {string} castingAttributeName   The name of the casting attribute. If null, the player will be asked to choose one
   * @param {actor} targetActor Can be null (no target)
   * @param {string} targetAttributeName Can be null (no opposition attribute to roll)
   * @param {string} autoParams Can be null. The list of parameters, passive abilities and such, that are already included (to inform the player he doesn't have to type them in)
   * @param {number} modifier  A modifier for the roll
   * @param {string}  favour: "0", "-1", "1"
   * @param {boolean} checkMaintain: if true, ask the player whether the roll is for casting the ability or maintaining it 
   * @param {any}   functionStuff  an object of parameters not used in the dialog function, but useful for resultFunction */
export async function modifierDialog(functionStuff){
    let hasTarget = functionStuff.targetData.hasTarget;
    let isWeaponRoll = false;
    let askCorruptedTargetDefaultYes = functionStuff.askCorruptedTarget && functionStuff.targetFullyCorrupted;
    let askCorruptedTargetDefaultNo = functionStuff.askCorruptedTarget && !functionStuff.targetFullyCorrupted;
    let leaderTarget = functionStuff.targetData.leaderTarget ?? false;
    let medicus = functionStuff.medicus ?? false;
    let poisoner = functionStuff.poisoner ?? false;
    let targetImpeding = functionStuff.targetImpeding ?? false;
    let weaponDamage = "";
    let actorWeapons;
    let askImpeding = false;
    let impedingValue = 0;
    let hasRoll = functionStuff.casting !== game.symbaroum.config.CASTING_NOT;
    let d8="(+1d8)";
    let d6="(+1d6)";
    let d4="(+1d4)";
    let checkMaintain = functionStuff.maintain !== game.symbaroum.config.MAINTAIN_NOT || functionStuff.chain === game.symbaroum.config.CHAIN;
    if(functionStuff?.impeding === game.symbaroum.config.IMPEDING_MAGIC){
        impedingValue = functionStuff.actor.data.data.combat.impedingMagic;
        if(impedingValue) askImpeding = true;
    } else if(functionStuff?.impeding === game.symbaroum.config.IMPEDING_MAGIC){
        impedingValue = functionStuff.actor.data.data.combat.impedingMov;
        if(impedingValue) askImpeding = true;
    }
    if(functionStuff.askWeapon){
        actorWeapons = functionStuff.actor.items.filter(item => item.data?.type == "weapon")
        if(actorWeapons.length == 0){
            ui.notifications.error("No weapon in hand.");
            return;
        }
    }
    if(functionStuff.combat){
        isWeaponRoll = true;
        if(functionStuff?.weapon){
            if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){
                weaponDamage = functionStuff.weapon.damage.pc;
            }
            else{
                weaponDamage = functionStuff.weapon.damage.npc.toString();
                d8=" (+4)";
                d6=" (+3)";
                d4=" (+2)";
            }
            if(functionStuff.isAlternativeDamage){
                weaponDamage += " ("+getAttributeLabel(functionStuff.actor, functionStuff.alternativeDamageAttribute)+")";
            }
        }
    }
    let targetAttributeName = null;
    if(functionStuff.targetData.resistAttributeName){
        targetAttributeName = functionStuff.targetData.resistAttributeName
    }
    createLineDisplay(functionStuff, functionStuff.attackFromPC);
    const html = await renderTemplate('systems/symbaroum/template/chat/dialog2.html', {
        hasTarget: hasTarget,
        askCastingAttribute: functionStuff.askCastingAttribute,
        askTargetAttribute: functionStuff.askTargetAttribute,
        isWeaponRoll : isWeaponRoll,
        autoparamsText: game.i18n.localize("DIALOG.AUTOPARAMS") + functionStuff.autoParams + functionStuff.targetData.autoParams,
        isArmorRoll : null,
        ignoreArmor : functionStuff.ignoreArm,
        leaderTarget: leaderTarget,
        packages: functionStuff.package,
        askImpeding: askImpeding,
        askCorruptedTargetDefaultYes: askCorruptedTargetDefaultYes,
        askCorruptedTargetDefaultNo: askCorruptedTargetDefaultNo,
        weaponDamage : weaponDamage,
        contextualDamage: functionStuff.hasDamage,
        d8: d8,
        d4: d4,
        choices: { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
        groupName:"favour",
        defaultFavour: "0",
        defaultModifier: functionStuff.modifier,
        defaultAdvantage: "",
        defaultDamModifier: "",
        checkMaintain: checkMaintain,
        askWeapon: functionStuff.askWeapon,
        targetImpeding: targetImpeding,
        weapons : actorWeapons,
        medicus : medicus,
        poisoner: poisoner,
        hasRoll: hasRoll
    });
    let title;
    if(functionStuff.ability){title = functionStuff.ability.name}
    else{title = functionStuff.weapon.name}
    let dialog = new Dialog({
        title: title,
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('BUTTON.ROLL'),
            callback: async (html) => {
                if(functionStuff.askWeapon){
                    let wepID = html.find("#weapon")[0].value;
                    functionStuff.weapon = functionStuff.actor.items.find(item => item.id == wepID);
                    functionStuff.castingAttributeName = functionStuff.weapon.data.data.attribute;
                    if(functionStuff.weapon.data.data.qualities.precise){
                        functionStuff.modifier += 1;
                        functionStuff.autoParams += game.i18n.localize('COMBAT.PARAMS_PRECISE');
                    };
                }
                // acting attribute for d20roll
                if(functionStuff.askCastingAttribute) {
                    functionStuff.castingAttributeName = html.find("#castAt")[0].value;										
                }

                //resist attribute for d20roll
                if(functionStuff.askTargetAttribute){
                    if( html.find("#resistAtt").length > 0) {
                        targetAttributeName = html.find("#resistAtt")[0].value;	
                        functionStuff.targetData.resistAttributeName = targetAttributeName;
                        functionStuff.targetData.resistAttributeValue = getAttributeValue(functionStuff.targetData.actor, targetAttributeName);
                    }
                }
                if(hasRoll){
                    //custom modifier for d20roll
                    const bonus = html.find("#bonus")[0].value;   
                    let modifierCustom = parseInt(bonus, 10);
                    functionStuff.modifier = modifierCustom;
                    //Favour (2d20 keep best) or disfavour(2d20 keep worst)      
                    let favours = html.find("input[name='favour']");
                    let fvalue = 0;
                    for ( let f of favours) {						
                        if( f.checked ) fvalue = parseInt(f.value, 10);
                    }
                    functionStuff.favour += fvalue;
                }

                //Power/Ability has already been started and is maintained or chained
                if( html.find("#maintain").length > 0) {
                    let valueM = html.find("#maintain")[0].value;	
                    if(valueM === "M"){functionStuff.isMaintained = true}								
                }
                if(askImpeding){
                    if(html.find("#impeding")[0].checked){
                        functionStuff.modifier += -impedingValue;
                        functionStuff.autoParams += game.i18n.localize("ARMOR.IMPEDINGLONG") + ", ";
                    }
                }
                if(targetImpeding){
                    if(html.find("#impTarget")[0].checked){
                        functionStuff.modifier += functionStuff.targetImpeding;
                        functionStuff.autoParams += game.i18n.localize("ARMOR.IMPEDING_TARGET") + ", ";
                    }
                }
                if(askCorruptedTargetDefaultYes || askCorruptedTargetDefaultNo){
                    functionStuff.targetFullyCorrupted = html.find("#targetCorrupt")[0].checked;
                    if(functionStuff.targetFullyCorrupted){
                        functionStuff = Object.assign({}, functionStuff , functionStuff.targetFullyCorruptedFSmod);
                        functionStuff.targetData.autoParams += game.i18n.localize('TOOLTIP.HEALTH.CORRUPTION_NA_TEXT');
                    }
                }
                //combat roll stuff
                if(functionStuff.hasDamage){
                    functionStuff.hasAdvantage = html.find("#advantage")[0].checked;
                    if(functionStuff.hasAdvantage){
                        functionStuff.modifier += 2;
                        functionStuff.autoParams += game.i18n.localize('DIALOG.ADVANTAGE') + ", ";
                    }
                    let hasDamModifier = html.find("#dammodifier").length > 0;
                    let damModifier = "";
                    let damModifierNPC = 0;
                    if(hasDamModifier) {
                      let damString = html.find("#dammodifier")[0].value;            
                      // Save - it is a string
                      damString = damString.trim();
                      
                      if(damString.length) {
                        attri_defaults.additionalModifier = damString; // Regardless if valid or not, set it as attri_defaults
                        let plus = '+';
                        let damSource = "["+game.i18n.localize("DIALOG.DAMAGE_MODIFIER")+"] ";
                        if(damString.charAt(0)=== "+" ) {
                          plus = ""; // If it already has plus, do not add another
                        }
                        if(/\[[^\]]+\]/.test(damString) ) {
                          damSource = ""; // If it has "[damage source]" already in roll string, do not add another one
                        }
                        damModifier = `${plus}${damString}${damSource}`;
          
                        try {
                          // Validate string as valid roll object              
                          let r = new Roll(damModifier,{}).evaluate({async:false});
                        } catch (err) {
                            ui.notifications.error(`The ${game.i18n.localize("DIALOG.DAMAGE_MODIFIER")} can't be used for rolling damage ${err}`);
                            return;
                        }
                        damModifierAttSup = damModifier;
                        if(!attackFromPC && functionStuff.targetData.hasTarget && functionStuff.targetData.actor.type !== "monster"){
                          let parsedMod = parseInt(damString);
                          if (!isNaN(parsedMod)) { 
                            damModifierNPC = parsedMod;
                          }
                        }
                      }
                    }
                    for(let pack of functionStuff.package) {
                        if(pack.type === game.symbaroum.config.PACK_CHECK) {
                        // Find if the box is checked
                            let ticked = html.find(`#${pack.id}`);              
                            if( ticked.length > 0 && ticked[0].checked ){
                                functionStuff.autoParams += ", "+pack.label;
                                for(let member of pack.member) {
                                    if(member.type == game.symbaroum.config.DAM_MOD) {
                                        damModifier += `${member.alternatives[0].damageMod}[${pack.label}]`;
                                        damModifierNPC += member.alternatives[0].damageModNPC;
                                    }
                                }
                            }
                        }
                    }
                    
                    if(damModifier.length > 0) {
                        functionStuff.dmgModifier = damModifier;
                        functionStuff.dmgModifierNPC = damModifierNPC;
                    }
                }
                if(isWeaponRoll){
                    functionStuff.ignoreArm = html.find("#ignarm")[0].checked;
                    if(functionStuff.ignoreArm) functionStuff.autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR') + ", ";
                    functionStuff.poison = Number(html.find("#poison")[0].value);
                }
                if(medicus){
                    if(hasTarget){
                        functionStuff.herbalCure = html.find("#herbalcure")[0].checked;
                        functionStuff.medicusExam = html.find("#exam")[0].checked;
                        let customHealingFormula = html.find("#customhealing")[0].value;
                        if(customHealingFormula.length > 0){
                            functionStuff.healFormulaSucceed = customHealingFormula;
                        }
                        else if(functionStuff.herbalCure){
                            functionStuff.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.HERBALCURE');
                            if(functionStuff.powerLvl.level == 1){
                                functionStuff.healFormulaSucceed = "1d6"
                            }
                            else if(functionStuff.powerLvl.level == 2){
                                functionStuff.healFormulaSucceed = "1d8"
                            }
                            else{
                                functionStuff.healFormulaSucceed = "1d10";
                                functionStuff.healFormulaFailed = "1d6";
                            }
                        }
                        else functionStuff.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.NOHERBALCURE');
                        if(!functionStuff.medicusExam) {
                            functionStuff.removeTargetEffect = ["icons/svg/blood.svg"];
                            functionStuff.introText= game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO');
                            functionStuff.resultTextFail = game.i18n.localize('ABILITY_MEDICUS.CHAT_FAILURE');
                            functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_MEDICUS.CHAT_SUCCESS');
                        }
                    }
                    else functionStuff.medicusExam = true;
                }
                if(poisoner){
                    functionStuff.poison = Number(html.find("#poisoner")[0].value);
                }
                functionStuff.notResisted = functionStuff.notResisted ?? !(((functionStuff.casting === game.symbaroum.config.CASTING_RES) && !functionStuff.isMaintained ) || ((functionStuff.maintain === game.symbaroum.config.MAINTAIN_RES) && functionStuff.isMaintained));
                if(hasTarget && !functionStuff.combat && !functionStuff.notResisted){
                    let targetResMod = checkSpecialResistanceMod(functionStuff.targetData.actor.data.data.combat.damageReductions, functionStuff.targetData.autoParams, functionStuff.ability.data.reference);
                    functionStuff.favour += targetResMod.favour;
                    functionStuff.modifier += -1*targetResMod.modifier;
                    functionStuff.dmgavoiding = targetResMod.dmgavoiding;
                    functionStuff.autoParams += targetResMod.autoParams;
                }
                if(hasTarget && !functionStuff.notResisted){
                    if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){
                        functionStuff.resistRoll = false;
                        buildRolls(functionStuff);
                    }
                    else{
                        functionStuff.resistRoll = true;
                        functionStuff.resistRollText = (isWeaponRoll) ? functionStuff.targetData.name+game.i18n.localize('COMBAT.DEFENSE_ROLL') : functionStuff.targetData.name+game.i18n.localize('ABILITY.RESIST_ROLL');
                        let userArray = await getOwnerPlayer(functionStuff.targetData.actor);
                        if(userArray.length>0 && game.settings.get('symbaroum', 'playerResistButton')){
                            functionStuff.targetUserId=userArray[0].data._id;
                            functionStuff.targetUserName=userArray[0].data.name;
                            createResistRollChatButton(functionStuff);
                        }
                        else{
                            buildRolls(functionStuff);
                        }
                    }
                }
                else{
                    buildRolls(functionStuff)
                }
            },
          },
          cancel: {
              icon: '<i class="fas fa-times"></i>',
              label: game.i18n.localize('BUTTON.CANCEL'),
              callback: () => {},
          },
        },
        default: 'roll',
        close: () => {},
    });
    dialog.render(true);
}

export async function buildRolls(functionStuff){
    if(functionStuff.casting === game.symbaroum.config.CASTING_NOT && !functionStuff.isMaintained){
        standardPowerResult(null, functionStuff);
        return;
    }
    let isWeaponRoll = functionStuff.combat;
    let rollData = [];
    if(isWeaponRoll){
        for(let j = 1; j <= functionStuff.numberofAttacks; j++){
            rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier, functionStuff.resistRoll));
        }
    }
    else if(functionStuff.targetData.hasTarget && !functionStuff.notResisted){
        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier, functionStuff.resistRoll));
    }
    else{
        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier, functionStuff.resistRoll));
    }
    if(isWeaponRoll){
        await attackResult(rollData, functionStuff);
    }
    else{
        await standardPowerResult(rollData, functionStuff);
    }
}

export function checkSpecialResistanceMod(damageReductions, autoParams = "", abilityRef){

    let favour = 0;
    let modifier = 0;
    let dmgavoiding = false;
    for(let i = 0; i < damageReductions.length; i++) {
        if(damageReductions[i].powers){
            if(damageReductions[i].powers.includes(abilityRef)){
                if(damageReductions[i].type === game.symbaroum.config.TYPE_FAVOUR){
                    favour = damageReductions[i].favourMod;
                    autoParams+=damageReductions[i].label + ", ";
                } else if(damageReductions[i].type === game.symbaroum.config.TYPE_ROLL_MOD){
                    autoParams+=damageReductions[i].label + "("+damageReductions[i].value+"), ";
                    modifier += damageReductions[i].modifier;
                } else if(damageReductions[i].type === game.symbaroum.config.TYPE_DMG_AVOIDING){
                    autoParams+=damageReductions[i].label+", ";
                    dmgavoiding = true;
                }
            }
        }
    }
    return{
        favour: favour,
        modifier: modifier,
        dmgavoiding: dmgavoiding,
        autoParams: autoParams
    }
}

/* This function applies damage reduction (Undead trait, swarm...) to the final damage */
async function mathDamageProt(targetActor, damage, damageType = {}){
    async function damageReductionText(value){
        if(value != 1){
            return (" (x" + value + ")")
        }
        else return("")
    }
    let finalDamage = Math.max(0, damage);
    let infoText = "";
    if(damageType.holy){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.holy);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.holy)
    }
    else if(damageType.elemental){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.elemental);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.elemental)
    }
    else if(damageType.mysticArm){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.mysticArm);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.mysticArm)
    }
    else if(damageType.mysticIgnArm){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.mysticIgnArm);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.mysticIgnArm)
    }
    else if(damageType.mysticalWeapon){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.mysticalWeapon);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.mysticalWeapon)
    }
    else if(damageType.bleeding){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.bleeding);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.bleeding)
    }
    else{
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.normal)
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.normal)
    }
    return({damage: finalDamage, text : infoText})
}

async function attackResult(rollData, functionStuff){
    
    let namesForText = {actorname: functionStuff.actingCharName, targetname: functionStuff.targetData?.name ?? ""};
    let damage;
    let hasDamage;
    let targetDies = false;
    let pain = false;
    let flagDataArray = [];
    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollMod = "";
    let hasDmgMod = "false";
    let attackNumber = 1;
    let mysticalWeapon = functionStuff.weapon.qualities.mystical;
    let corruptionDmgFormula = ""
    let printCorruption = false;
    let corruptionChatResult ="";
    let corruptionTooltip="";
    let targetValue = functionStuff.targetData.actor.data.data.health.toughness.value;
    let targetText = game.i18n.format(functionStuff.targetText ?? "", namesForText);
    if(functionStuff.isAlternativeDamage){
        targetValue = getAttributeValue(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute);
    }
    let rolls = [];

    for(let rollDataElement of rollData){
        rolls = rolls.concat(rollDataElement.rolls);

        rollDataElement.finalText="";
        rollDataElement.resultText = functionStuff.actingCharName + game.i18n.localize('COMBAT.CHAT_SUCCESS') + functionStuff.targetData.name;
        if(rollDataElement.critSuccess) {
            if(functionStuff.resistRoll){
                rollDataElement.resultText += " - "+game.i18n.localize('CHAT.CRITICAL_FAILURE');
            }
            else{
                rollDataElement.resultText += " - "+game.i18n.localize('CHAT.CRITICAL_SUCCESS');
            }
        }
        if(functionStuff.weapon.qualities.jointed && !rollDataElement.trueActorSucceeded && rollDataElement.diceResult%2!=0){
            rollDataElement.resultText = game.i18n.localize('COMBAT.CHAT_JOINTED_SECONDARY');
        }
        else if(rollDataElement.trueActorSucceeded){
            hasDamage = true;
            rollDataElement.hasDamage = true;
            damage = await damageRollWithDiceParams(functionStuff, rollDataElement.critSuccess, attackNumber);            
            rolls.push(damage.roll);

            attackNumber += 1;
            rollDataElement.dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
            rollDataElement.damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());
            damageRollMod = game.i18n.localize('COMBAT.CHAT_DMG_PARAMS') + damage.autoParams;
            hasDmgMod = (damage.autoParams.length >0) ? true : false;
            //damage reduction (Undead trait, swarm...)
            let finalDmg = await mathDamageProt(functionStuff.targetData.actor, damage.roll.total, {mysticalWeapon: mysticalWeapon});
            // pain (damage > toughness treshold)
            pain = pain || checkPainEffect(functionStuff, finalDmg.damage);
            rollDataElement.dmg = finalDmg.damage;
            rollDataElement.dmgFormula += finalDmg.text;
            if(functionStuff.corruptingattack != "" && rollDataElement.dmg > 0){
                if(corruptionDmgFormula !="") corruptionDmgFormula += "+";
                corruptionDmgFormula += functionStuff.corruptingattack;
                printCorruption=true;
            }
            rollDataElement.damageText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + rollDataElement.dmg.toString();
            damageTot += rollDataElement.dmg;
            if(functionStuff.isAlternativeDamage){
                rollDataElement.damageText += " ("+getAttributeLabel(functionStuff.actor, functionStuff.alternativeDamageAttribute)+")";
            }
        }
        else{
            rollDataElement.resultText = functionStuff.actingCharName + game.i18n.localize('COMBAT.CHAT_FAILURE');
            if(rollDataElement.critFail) {
                if(functionStuff.resistRoll){
                    rollDataElement.resultText += " - "+game.i18n.localize('CHAT.CRITICAL_SUCCESS') + " : " + game.i18n.localize('CHAT.CRITICAL_FREEATTACK');
                }
                else{
                    rollDataElement.resultText += " - "+game.i18n.localize('CHAT.CRITICAL_FAILURE') + " : " + game.i18n.localize('CHAT.CRITICAL_FAILURE_FREEATTACK');
                }
            }
        }
    }
    if(damageTot <= 0){
        damageTot = 0;
        damageFinalText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
    }
    else{
        if(damageTot >= targetValue){
            targetDies = true;
            if(ui.combat.viewed && ui.combat.viewed.getCombatantByToken(functionStuff.targetData.tokenId)){
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    defeated: true
                });
            }
            else{
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    addEffect: CONFIG.statusEffects.find(e => e.id === "dead"),
                    overlay:true,
                    effectDuration: 1
                });
            }
            damageFinalText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
        }else if(pain){
            damageFinalText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
            flagDataArray.push({
                tokenId: functionStuff.targetData.tokenId,
                addEffect: CONFIG.statusEffects.find(e => e.id === "prone"),
                effectDuration: 1
            })
        }
        if(functionStuff.isAlternativeDamage){
            flagDataArray.push({
                tokenId: functionStuff.targetData.tokenId,
                attributeChange: damageTot*-1,
                attributeName: functionStuff.alternativeDamageAttribute
            });
        }else{
            flagDataArray.push({
                tokenId: functionStuff.targetData.tokenId,
                toughnessChange: damageTot*-1
            });
        }
    }

    if(printCorruption){
        let corruptionRoll= new Roll(corruptionDmgFormula).evaluate({async:false});
        rolls.push(corruptionRoll);
        corruptionChatResult = game.i18n.localize('COMBAT.CHAT_CORRUPTED_ATTACK') + corruptionRoll.total.toString();
        corruptionTooltip = new Handlebars.SafeString(await corruptionRoll.getTooltip());
        checkCorruptionThreshold(functionStuff.targetData.actor, corruptionRoll.total);
        flagDataArray.push({
            tokenId: functionStuff.targetData.tokenId,
            corruptionChange: corruptionRoll.total
        });
    }

    if (functionStuff.targetData.autoParams != ""){functionStuff.targetData.targetText += ": " + functionStuff.targetData.autoParams}
    let templateData = {
        rollData: rollData,
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: functionStuff.introText,
        introImg: functionStuff.actingCharImg,
        targetText: targetText,
        subText: functionStuff.weapon.name + " ("+await weaponTypeLabel(functionStuff.weapon)+")",
        subImg: functionStuff.weapon.img,
        hasRoll: true,
        resistRoll: functionStuff.resistRoll,
        resistRollText: functionStuff.resistRollText,
        hasCorruption: false,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        hasDamage: hasDamage,
        hasDmgMod: hasDmgMod,
        damageRollMod: damageRollMod,
        damageText: damageText,
        damageFinalText: damageFinalText,
        printPoison: false,
        poisonRollString: "",
        poisonRollResultString: "",
        poisonChatIntro: "",
        poisonChatResult: "",
        poisonToolTip: "",
        printBleed: false,
        bleedChat: "",
        printFlaming: false,
        flamingChat: "",
        printCorruption: printCorruption,
        corruptionChatResult: corruptionChatResult,
        corruptionTooltip: corruptionTooltip
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    if(functionStuff.poison > 0 && !targetDies && damageTot > 0 && functionStuff.targetData.actor.data.data.combat.damageProt.poison){
        let targetResMod = checkSpecialResistanceMod(functionStuff.targetData.actor.data.data.combat.damageReductions, functionStuff.targetData.autoParams, "poisoner");
        let poisonFavour = targetResMod.favour;
        functionStuff.targetData.autoParams += targetResMod.autoParams;
        let poisonRoll = await baseRoll(functionStuff.actor, "cunning", functionStuff.targetData.actor, "strong", poisonFavour, -1*targetResMod.modifier, functionStuff.resistRoll);
        let poisonFunctionStuff = Object.assign(functionStuff, {modifier:-1*targetResMod.modifier, favour: poisonFavour});
        let poisonRes= await poisonCalc(poisonFunctionStuff, poisonRoll);
        rolls.push(poisonRes.roll);
        if(poisonRes.flagData) flagDataArray.push(poisonRes.flagData);
        templateData = Object.assign(templateData, poisonRes);
    }
    for(let doTime of functionStuff.damageOverTime){
        if(doTime.effectIcon=== "icons/svg/blood.svg" && !targetDies && damageTot > 0){
            templateData.printBleed = true;
            let bleedDamage = doTime.damagePerRound;
            if(!functionStuff.attackFromPC) bleedDamage = doTime.damagePerRoundNPC.toString();
            templateData.bleedChat = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_BLEED') + bleedDamage;
            let finalbleedDmg = await mathDamageProt(functionStuff.targetData.actor, 2, {bleeding: true});
            templateData.bleedChat += finalbleedDmg.text;
            flagDataArray.push({
                tokenId: functionStuff.targetData.tokenId,
                addEffect: doTime.effectIcon
            });
        }
        else if(doTime.label === game.i18n.localize("QUALITY.FLAMING") && hasDamage){
            let flamingRoundsRoll= 2;
            let flamingRounds = 2;
            let flamingDamage = " 2";
            if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){
                flamingRoundsRoll= new Roll("1d4").evaluate({async:false});
                rolls.push(flamingRoundsRoll);
                flamingRounds = flamingRoundsRoll.total;
                flamingDamage = " 1d4"
            }
            flagDataArray.push({
                tokenId: functionStuff.targetData.tokenId,
                addEffect: "icons/svg/fire.svg",
                effectDuration: flamingRounds
            });
            templateData.printFlaming = true;
            templateData.flamingChat = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_FLAMING_SUCCESS1') + flamingDamage  + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS2')  + flamingRounds.toString();
            let finalburningDmg = await mathDamageProt(functionStuff.targetData.actor, 2, {elemental: true});
            templateData.flamingChat += finalburningDmg.text;
        }
    }
    // Here
    // Maestro support
    let actorid = functionStuff.actor.id;
    if(functionStuff.attackFromPC) {
        templateData.id = functionStuff.weapon.id;
    } else {
        templateData.id = functionStuff.targetData?.actor?.data.data.combat.id;
        actorid = functionStuff.targetData?.actor.id;
    }
    // end Maestro support
    const html = await renderTemplate("systems/symbaroum/template/chat/combat.html", templateData);
    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ 
            alias: game.user.name,
			actor: actorid
        }),
        content: html,
        type: CONST.CHAT_MESSAGE_TYPES.ROLL,
        roll: JSON.stringify(createRollData(rolls)),
        rollMode: game.settings.get('core', 'rollMode')        
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function formatRollString(rollDataElement, hasTarget, modifier){
    let rollString = `${rollDataElement.actingAttributeLabel} : (${rollDataElement.actingAttributeValue})`;
    if(hasTarget && rollDataElement.targetAttributeLabel){
        let attributeMod = 10 - rollDataElement.resistAttributeValue
        rollString += `  ⬅  ${rollDataElement.targetAttributeLabel} : (${attributeMod})`
    }
    if(modifier){
        rollString += "  " + game.i18n.localize('COMBAT.CHAT_MODIFIER') + modifier.toString();
    }
    return(rollString)
}

async function healing(healFormula, targetToken, attackFromPC){
    let healRoll;
    let totalResult = 0;
    let damageTooltip = "";
    if(attackFromPC){
        healRoll = new Roll(healFormula).evaluate({async:false});
        totalResult = healRoll.total,
        damageTooltip= new Handlebars.SafeString(await healRoll.getTooltip())
    }
    else{
        healRoll= new Roll(healFormula).evaluate({maximize: true, async:false});
        totalResult = Math.ceil(healRoll.total/2);
    }
    let healed = Math.min(totalResult, targetToken.actor.data.data.health.toughness.max - targetToken.actor.data.data.health.toughness.value);
    return({
        hasDamage : true,
        roll: healRoll,
        healed: healed,
        dmgFormula : game.i18n.localize('POWER_LAYONHANDS.CHAT_FINAL') + healFormula,
        damageText : game.i18n.localize('POWER_LAYONHANDS.CHAT_FINAL') + healed.toString(),
        damageTooltip: damageTooltip,
        flagData : {
            tokenId: targetToken.data._id,
            toughnessChange: healed
        }
    })
}

async function poisonCalc(functionStuff, poisonRoll){
    let poisonRes ={};
    poisonRes.printPoison = false;
    poisonRes.poisonChatIntro = functionStuff.actingCharName + game.i18n.localize('COMBAT.CHAT_POISON') + functionStuff.targetData.name;
    let poisonDamage = "0";
    let poisonedTimeLeft = 0;
    const effect = CONFIG.statusEffects.find(e => e.id === "poison");
    poisonRes.poisonResistRollText = functionStuff.targetData.name+game.i18n.localize('ABILITY.RESIST_ROLL');
        
    if(!poisonRoll.trueActorSucceeded){
        poisonRes.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_FAILURE');     
    }
    else{
        if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){
            poisonDamage = "1d"+(2*functionStuff.poison +2).toString();
        }
        else{
            poisonDamage = (functionStuff.poison +1).toString();
        }
        let PoisonRoundsRoll= new Roll(poisonDamage).evaluate({async:false});
        poisonRes.roll = PoisonRoundsRoll;

        let NewPoisonRounds = PoisonRoundsRoll.total;
        let poisonedEffectCounter = getEffect(functionStuff.targetData.token, effect);
        if(poisonedEffectCounter){
            //target already poisoned
            //get the number of rounds left
            let statusCounterMod = false;
            if(game.modules.get("statuscounter")?.active){
                //statusCounterMod = true;  until corrected
            };
            if(statusCounterMod){
                poisonedTimeLeft = await EffectCounter.findCounterValue(functionStuff.targetData.token, effect);  
                if(NewPoisonRounds > poisonedTimeLeft){
                    poisonRes.flagData = {
                        tokenId: functionStuff.targetData.tokenId,
                        modifyEffectDuration: effect,
                        effectDuration: NewPoisonRounds
                    };
                    poisonRes.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_EXTEND') + NewPoisonRounds.toString();
                }
                else{
                    poisonRes.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_NOTEXTEND');
                }
            }
            else{poisonRes.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_NOTEXTEND')}
        }
        else{
            //new poisoning  
            poisonRes.flagData ={
                tokenId: functionStuff.targetData.tokenId,
                addEffect: effect,
                effectDuration: NewPoisonRounds
            };
            poisonRes.poisonChatResult = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS1') + poisonDamage  + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS2')  + NewPoisonRounds.toString();
        }
    }
    poisonRes.printPoison = true;
    poisonRes.poisonRollString = await formatRollString(poisonRoll, functionStuff.targetData.hasTarget, functionStuff.modifier);
    poisonRes.poisonRollResultString = await formatRollResult(poisonRoll);
    poisonRes.poisonToolTip = poisonRoll.toolTip;
    return(poisonRes);
}

async function standardPowerResult(rollData, functionStuff){
    let hasRoll = false;
    let trueActorSucceeded = true; //true by default for powers without rolls
    let rolls = [];
    let rollString = "";
    let rollResult="";
    let rollToolTip="";
    if(rollData!=null){
        hasRoll = true;
        trueActorSucceeded = rollData[0].trueActorSucceeded;
        rollString = await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier);
        rollResult=rollData[0].rollResult;
        rollToolTip=rollData[0].toolTip;
        for(let i = 0; i < rollData.length; i++) {            
            rolls = rolls.concat(rollData[i].rolls);
        }
    }

    if(functionStuff.rollFailedFSmod && !trueActorSucceeded){
        functionStuff = Object.assign({}, functionStuff , functionStuff.rollFailedFSmod);
    }

    if(functionStuff.flagTest && trueActorSucceeded){
        let flagData = await functionStuff.actor.getFlag(game.system.id, functionStuff.flagTest);
        if(flagData){
            await functionStuff.actor.unsetFlag(game.system.id, functionStuff.flagTest);
            functionStuff = Object.assign({}, functionStuff , functionStuff.flagPresentFSmod);
        }
        else{
            await functionStuff.actor.setFlag(game.system.id, functionStuff.flagTest, functionStuff.flagNotPresentFSmod.flagData);
            functionStuff = Object.assign({}, functionStuff , functionStuff.flagNotPresentFSmod);
        }
    }
    let flagDataArray = functionStuff.flagDataArray ?? [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let namesForText = {actorname: functionStuff.actingCharName, targetname: functionStuff.targetData?.name ?? ""};
    let targetText = game.i18n.format(functionStuff.targetText ?? "", namesForText);
    if((!functionStuff.isMaintained) && (functionStuff.corruption !== game.symbaroum.config.TEMPCORRUPTION_NONE)){
        haveCorruption = true;
        corruption = await functionStuff.actor.getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        if(corruption.sorceryRoll) corruptionText += " (sorcery roll result:" + corruption.sorceryRoll.diceResult + ")";
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.tokenId,
            actorId: functionStuff.actor.id,
            corruptionChange: corruption.value
        });
    }

    if( functionStuff.resultRolls !== undefined && functionStuff.resultRolls !== null) {
        rolls = rolls.concat(functionStuff.resultRolls);
    }
    let resultText = game.i18n.format(trueActorSucceeded ? functionStuff.resultTextSuccess : functionStuff.resultTextFail, namesForText);
    let finalText = game.i18n.format(functionStuff.finalText ?? "", namesForText);
    let subText = functionStuff.subText ?? functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")";
    let introText = game.i18n.format(functionStuff.isMaintained ? functionStuff.introTextMaintain : functionStuff.introText, namesForText);
    if(functionStuff.finalTextSucceed && trueActorSucceeded) finalText = game.i18n.format(functionStuff.finalTextSucceed, namesForText);
    else 
    if(functionStuff.targetData.hasTarget && functionStuff.targetData.autoParams != ""){
        targetText += ": " + functionStuff.targetData.autoParams;
    }

    let hasDamage = functionStuff.hasDamage;
    let doDamage = hasDamage&&trueActorSucceeded || functionStuff.avoidDamageDice;
    let damageTot = 0;
    let damageText="";
    let damageRollResult="";
    let dmgFormula="";
    let damageTooltip="";
    let damageFinalText="";
    let damageDice = functionStuff.dmgavoiding ? functionStuff.avoidDamageDice : functionStuff.damageDice;
    let targetDies = false;
    
    if(damageDice === "0d0"){
        doDamage=false;
        resultText= game.i18n.format(game.i18n.localize('POWER_BRIMSTONECASC.CHAT_FAILURE_RR'), namesForText);
    }
    if(functionStuff.ability.data.reference === "blessedshield" && trueActorSucceeded){
        let protectionFormula = "1d" + (2 + (2*functionStuff.powerLvl.level));

        flagDataArray.push({
            tokenId: functionStuff.tokenId,
            actorId: functionStuff.actor.id,
            addEffect: CONFIG.statusEffects.find(e => e.id === "holyShield"),
            effectDuration: 1
        },{
            tokenId: functionStuff.tokenId,
            actorId: functionStuff.actor.id,
            addObject: "blessedshield",
            protection: protectionFormula
        })
        finalText = game.i18n.format(game.i18n.localize('POWER_BLESSEDSHIELD.PROTECTED'), namesForText) + " (" + protectionFormula + ")";

        if(functionStuff.targets){
            for(let target of functionStuff.targets){
                flagDataArray.push({
                    tokenId: target.tokenId,
                    addEffect: CONFIG.statusEffects.find(e => e.id === "holyShield"),
                    effectDuration: 1 
                },{
                    tokenId: target.tokenId,
                    addObject: "blessedshield",
                    protection: protectionFormula
                })
                finalText += ", " + game.i18n.format(game.i18n.localize('POWER_BLESSEDSHIELD.PROTECTED'), {actorname: target.name});
            }
        }
    }

    if(functionStuff.confusion && trueActorSucceeded){
        let confusionRoll= new Roll("1d6").evaluate({async:false});
        rolls.push(confusionRoll);

        finalText=confusionRoll.total.toString() + ": ";
        if(confusionRoll.total < 3){
            finalText += game.i18n.format(game.i18n.localize('POWER_CONFUSION.EFFECT12'), namesForText);
        }
        else if(confusionRoll.total < 5){
            finalText += game.i18n.format(game.i18n.localize('POWER_CONFUSION.EFFECT34'), namesForText);
        }
        else{
            finalText += game.i18n.format(game.i18n.localize('POWER_CONFUSION.EFFECT56'), namesForText);
        }
    }

    if(functionStuff.usePoison){
        let poisonRes = await poisonCalc(functionStuff, rollData[0]);
        rolls.push(poisonRes.roll);

        introText = poisonRes.poisonChatIntro;
        resultText = poisonRes.poisonChatResult;
        if(poisonRes.flagData) flagDataArray.push(poisonRes.flagData);
    }

    if(functionStuff.ability.data.reference === "strangler" && trueActorSucceeded){
        functionStuff.hasAdvantage = false; //to prevent +1d4 damage
    }

    if(functionStuff.ability.data.reference === "witchsight" && functionStuff.targetData.hasTarget && trueActorSucceeded){
        finalText = game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL1') + functionStuff.targetData.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL2') +  functionStuff.targetData.actor.data.data.bio.shadow;
    }

    if(doDamage){
        let targetValue = functionStuff.targetData.actor.data.data.health.toughness.value;
        if(functionStuff.isAlternativeDamage){
            targetValue = getAttributeValue(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute);
        }
        let damage = await simpleDamageRoll(functionStuff, damageDice);
        rolls.push(damage.roll);

        damageRollResult += await formatRollResult(damage);
        dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;

        //damage reduction (Undead trait, swarm...)
        let finalDmg = await mathDamageProt(functionStuff.targetData.actor, damage.roll.total, functionStuff.damageType);
        // pain (damage > toughness treshold)
        let pain = checkPainEffect(functionStuff, finalDmg.damage);
        damageTot = finalDmg.damage;
        dmgFormula += finalDmg.text;

        damageText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
        damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());

        if(functionStuff.isAlternativeDamage){
            dmgFormula +=  " ("+getAttributeLabel(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute)+")";
            damageText +=  " ("+getAttributeLabel(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute)+")";
        }
        if(damageTot <= 0){
            damageTot = 0;
            damageText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
        }
        else{
            if(damageTot >= targetValue){
                targetDies = true;
                damageFinalText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
                if(ui.combat.viewed && ui.combat.viewed.getCombatantByToken(functionStuff.targetData.tokenId)){
                    flagDataArray.push({
                        tokenId: functionStuff.targetData.tokenId,
                        defeated: true
                    });
                }
                else{
                    flagDataArray.push({
                        tokenId: functionStuff.targetData.tokenId,
                        addEffect: CONFIG.statusEffects.find(e => e.id === "dead"),
                        overlay:true,
                        effectDuration: 1
                    });
                }
            }
            else if(pain){
                damageFinalText = functionStuff.targetData.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    addEffect: CONFIG.statusEffects.find(e => e.id === "prone"),
                    effectDuration: 1
                })
            }
            if(functionStuff.isAlternativeDamage){
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    attributeChange: damageTot*-1,
                    attributeName: functionStuff.alternativeDamageAttribute
                });
            }else{
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    toughnessChange: damageTot*-1
                });
            }
        }
    }

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actingCharImg,
        targetText: targetText,
        subText: subText,
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        resistRoll: functionStuff.resistRoll,
        resistRollText: functionStuff.resistRollText,
        rollString: rollString,
        rollResult: rollResult,
        rollToolTip: rollToolTip,
        resultText: resultText,
        finalText: finalText,
        hasDamage: doDamage,
        damageText: damageText,
        damageRollResult: damageRollResult,
        dmgFormula: dmgFormula,
        damageRollMod: "",
        damageTooltip: damageTooltip,
        damageFinalText: damageFinalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

/* if the power / ability have healing effects  */
    if(functionStuff.healFormulaSucceed && !functionStuff.medicusExam){
        let healResult;
        let healingBonus = functionStuff.healingBonus ?? "";
        if(functionStuff.healedToken === game.symbaroum.config.TARGET_TOKEN){
            functionStuff.healedToken = functionStuff.targetData.token;
        }else functionStuff.healedToken = functionStuff.token;
        if(trueActorSucceeded){
            healResult = await healing(functionStuff.healFormulaSucceed+healingBonus, functionStuff.healedToken, functionStuff.attackFromPC);
            if(functionStuff.attackFromPC) rolls.push(healResult.roll);
        }
        else if(!trueActorSucceeded && functionStuff.healFormulaFailed){
            healResult = await healing(functionStuff.healFormulaFailed+healingBonus, functionStuff.healedToken, functionStuff.attackFromPC);
            if(functionStuff.attackFromPC) rolls.push(healResult.roll);
        }
        if(healResult){
            // game.symbaroum.log(healResult)
            templateData.hasDamage = healResult.hasDamage;
            templateData.damageText = healResult.damageText;
            if(functionStuff.attackFromPC){
                templateData.dmgFormula = healResult.dmgFormula;
                templateData.damageTooltip = healResult.damageTooltip;
            }
            templateData.damageFinalText = "";
            flagDataArray.push(healResult.flagData);

            if(functionStuff.ability.data.reference === "inheritwound"){
                let inheritDamage = (functionStuff.powerLvl.level > 1) ? Math.ceil(healResult.healed /2) : healResult.healed;
                templateData.finalText += game.i18n.format(game.i18n.localize('POWER_INHERITWOUND.CHAT_HEALED'), namesForText) + healResult.healed.toString() + "; " + game.i18n.format(game.i18n.localize('POWER_INHERITWOUND.CHAT_DAMAGE'), namesForText) + inheritDamage.toString();
                flagDataArray.push({
                    tokenId: functionStuff.tokenId,
                    toughnessChange: inheritDamage*-1
                });
                if(functionStuff.powerLvl.level > 1){
                    templateData.finalText += game.i18n.localize('POWER_INHERITWOUND.CHAT_REDIRECT');
                    const pEffect = CONFIG.statusEffects.find(e => e.id === "poison");
                    let poisonedEffectCounter = await getEffect(functionStuff.targetData.token, pEffect);
                    if(poisonedEffectCounter){
                        //target  poisoned
                        //get the number of rounds left
                        let timeLeft = 1;
                        let statusCounterMod = false;
                        if(game.modules.get("statuscounter")?.active){
                            //statusCounterMod = true;  until corrected
                        };
                        if(statusCounterMod){
                            timeLeft = await EffectCounter.findCounterValue(functionStuff.targetData.token, pEffect);
                        }
                        //set status to caster
                        flagDataArray.push({
                            tokenId: functionStuff.tokenId,
                            addEffect: pEffect,
                            effectDuration: timeLeft
                        }, {
                            tokenId: functionStuff.targetData.tokenId,
                            removeEffect: pEffect
                        })
                    }
                    const bEffect = CONFIG.statusEffects.find(e => e.id === "bleeding");
                    let bleedEffectCounter = await getEffect(functionStuff.targetData.token, bEffect);
                    if(bleedEffectCounter){
                        //get the number of rounds left
                        let timeleft = 1;
                        let statusCounterMod = false;
                        if(game.modules.get("statuscounter")?.active){
                            //statusCounterMod = true;  until corrected
                        };
                        if(statusCounterMod){
                            timeLeft = await EffectCounter.findCounterValue(functionStuff.targetData.token, bEffect);
                        }
                        //set status to caster
                        flagDataArray.push({
                            tokenId: functionStuff.tokenId,
                            addEffect: bEffect,
                            effectDuration: timeLeft
                        }, {
                            tokenId: functionStuff.targetData.tokenId,
                            removeEffect: bEffect
                        })
                    }
                }
            }
        }
    }
    // Maestro
    let actorid = functionStuff.actor.id;
    templateData.id = functionStuff.ability._id;        
    // End Maestro

    // Pick up roll data
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ 
            alias: game.user.name,
			actor: actorid
        }),
        rollMode: game.settings.get('core', 'rollMode'),    
        content: html,
    }
    if(functionStuff.gmOnlyChatResultNPC && !functionStuff.attackFromPC){
        let gmList =  ChatMessage.getWhisperRecipients('GM');
        if(gmList.length > 0){
            chatData.whisper = gmList
        }
    } else if(rolls.length > 0 ) {
        // Only shows rolls if they are displayed to everyone
        chatData.type= CONST.CHAT_MESSAGE_TYPES.ROLL;
        chatData.roll= JSON.stringify(createRollData(rolls));
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(trueActorSucceeded && (functionStuff.addTargetEffect.length >0)){
        for(let effect of functionStuff.addTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(!effectPresent){
                flagDataArray.push({
                        tokenId: functionStuff.targetData.tokenId,
                        addEffect: effect,
                        effectDuration: 1
                });
            }
        }
    }
    if(trueActorSucceeded && (functionStuff.addCasterEffect.length >0) && functionStuff.tokenId){
        for(let effect of functionStuff.addCasterEffect){
            let effectPresent = getEffect(functionStuff.token, effect);
            if(!effectPresent){
                await modifyEffectOnToken(functionStuff.token, effect, 1, 1);
            }
        }
    }
    if(trueActorSucceeded && (functionStuff.removeTargetEffect.length >0)){
        for(let effect of functionStuff.removeTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(effectPresent){
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    removeEffect: effect
                });
            }
        }
    }
    if(trueActorSucceeded && (functionStuff.removeCasterEffect.length >0) && functionStuff.tokenId){ 
        for(let effect of functionStuff.removeCasterEffect){
            let effectPresent = getEffect(functionStuff.token, effect);
            if(effectPresent){
                modifyEffectOnToken(functionStuff.token, effect, 0, 1);
            }
        }
    }
    if(trueActorSucceeded && !functionStuff.isMaintained && (functionStuff.activelyMaintainedTargetEffect.length >0)){ 
        for(let effect of functionStuff.activelyMaintainedTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(!effectPresent){
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    addEffect: effect,
                    effectDuration: 1
                });
            }
        }
    }
    if(!trueActorSucceeded && functionStuff.isMaintained && (functionStuff.activelyMaintainedTargetEffect.length >0)){ 
        for(let effect of functionStuff.activelyMaintainedTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(effectPresent){ 
                flagDataArray.push({
                    tokenId: functionStuff.targetData.tokenId,
                    removeEffect: effect
                });
            }
        }
    }
    if(trueActorSucceeded && !functionStuff.isMaintained && (functionStuff.activelyMaintaninedCasterEffect.length >0) && functionStuff.tokenId){ 
        for(let effect of functionStuff.activelyMaintaninedCasterEffect){
            let effectPresent = getEffect(functionStuff.token, effect);
            if(!effectPresent){
                flagDataArray.push({
                    tokenId: functionStuff.tokenId,
                    addEffect: effect,
                    effectDuration: 1
                });
            }
        }
    }
    if(!trueActorSucceeded && functionStuff.isMaintained && (functionStuff.activelyMaintaninedCasterEffect.length >0) && functionStuff.tokenId){ 
        for(let effect of functionStuff.activelyMaintaninedCasterEffect){
            let effectPresent = getEffect(functionStuff.token, effect);
            if(effectPresent){ 
                flagDataArray.push({
                    tokenId: functionStuff.tokenId,
                    removeEffect: effect
                });
            }
        }
    }

    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function preDialogLayonHands(functionStuff){
    let layHandsDialogTemplate = `
    <h1> ${game.i18n.localize('POWER_LAYONHANDS.DIALOG')} </h1>
    `;
    new Dialog({
        title: game.i18n.localize('POWER_LABEL.LAY_ON_HAND'), 
        content: layHandsDialogTemplate,
        buttons: {
            touch: {
                label: game.i18n.localize('POWER_LAYONHANDS.TOUCH'),
                callback: (html) => {
                    functionStuff.healFormulaSucceed = "1d12";
                    functionStuff.touch=true;
                    modifierDialog(functionStuff);
                }
            }, 

            lineofSight: {
                label: game.i18n.localize('POWER_LAYONHANDS.REMOTE'), 
                callback: (html) => {
                    functionStuff.touch=false;
                    modifierDialog(functionStuff);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
