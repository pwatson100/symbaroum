import { upgradeDice, baseRoll, damageRollWithDiceParams, simpleDamageRoll, getAttributeValue, getAttributeLabel, createModifyTokenChatButton } from './roll.js';
import { modifyEffectOnToken } from './hooks.js';

export class SymbaroumItem extends Item {
    static async create(data, options) {
        if (!data.img) {
            if (data.type === "trait") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "ability") {
                data.img = "systems/symbaroum/asset/image/ability.png";
            } else if (data.type === "mysticalPower") {
                data.img = "systems/symbaroum/asset/image/mysticalPower.png";
            } else if (data.type === "ritual") {
                data.img = "systems/symbaroum/asset/image/ritual.png";
            } else if (data.type === "burden") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "boon") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "weapon") {
                data.img = "systems/symbaroum/asset/image/weapon.png";
            } else if (data.type === "armor") {
                data.img = "systems/symbaroum/asset/image/armor.png";
            } else if (data.type === "equipment") {
                data.img = "systems/symbaroum/asset/image/equipment.png";
            } else if (data.type === "artifact") {
                data.img = "systems/symbaroum/asset/image/artifact.png";
            } else {
                data.img = "systems/symbaroum/asset/image/unknown-item.png";
            }
        }
        super.create(data, options);
    }

    prepareData() {
        super.prepareData();
        this._initializeData(this.data);
        this._computeCombatData(this.data);
        this.data.isGM = game.user.isGM && game.settings.get('symbaroum', 'allowShowReference'); // Show advanced settings
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
        data.isArtifact = data.type === "artifact" || data.data?.isArtifact;
        data.isGear = data.isWeapon || data.isArmor || data.isEquipment || data.isArtifact;

        if(data.isGear) {
            data.isActive = data.data.state === "active";
            data.isEquipped = data.data.state === "equipped";
        }

        if(data.type === "weapon"){
            data.data.pcDamage = "";
            data.data.npcDamage = 0;
        }
        else if(data.type === "armor"){
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
        // console.log("computeExperienceCost "+JSON.stringify(data));

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
            const meleeClass = [
                "1handed",
                "short",
                "long",
                "shield",
                "unarmed",
                "heavy"
            ];
            const distanceClass = [
                "ranged",
                "thrown"
            ];
            if(meleeClass.includes(data.data.reference)){
                data.data.isMelee = true;
                data.data.isDistance = false;
            }
            else if(distanceClass.includes(data.data.reference)){
                data.data.isMelee = false;
                data.data.isDistance = true;
            }
            else{
                data.data.isMelee = false;
                data.data.isDistance = false;
            }
            let baseDamage = data.data.baseDamage;
            // console.log("baseDamage["+baseDamage+"]");
            if( baseDamage === null || baseDamage === undefined || baseDamage === "" ) {
                baseDamage = "1d8";
            }
            if(data.data.qualities?.massive) {
                let diceSides = new Roll(baseDamage).evaluate({maximize: true});                
                baseDamage = "2d"+Math.ceil(diceSides.total)+"kh";
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
            let weaponRoll= new Roll(baseDamage).evaluate({maximize: true});
            data.data.npcDamage = Math.ceil(weaponRoll.total/2);
            if(data.data.qualities?.deepImpact){
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
                protection += "+" + data.data.bonusProtection;
            }
            data.data.pcProtection = protection;
            if(data.data.qualities?.reinforced){
                data.data.pcProtection +=  "+1";
            }

            if(protection === "") {
                armorRoll = new Roll("0").evaluate({maximize: true});
            } else {
                armorRoll = new Roll(protection).evaluate({maximize: true});
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
    async affectReference(){
        const abilitiesList = [
            {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},
            {label: game.i18n.localize('ABILITY_LABEL.ACROBATICS'), value: "acrobatics"},
            {label: game.i18n.localize('ABILITY_LABEL.ALCHEMY'), value: "alchemy"},
            {label: game.i18n.localize('ABILITY_LABEL.AGILE_COMBAT'), value: "agilecombat"},
            {label: game.i18n.localize('ABILITY_LABEL.ARMORED_MYSTIC'), value: "armoredmystic"},
            {label: game.i18n.localize('ABILITY_LABEL.ARROW_JAB'), value: "arrowjab"},
            {label: game.i18n.localize('ABILITY_LABEL.ARTIFACT_CRAFTING'), value: "artifactcrafting"},
            {label: game.i18n.localize('ABILITY_LABEL.AXE_ARTIST'), value: "axeartist"},
            {label: game.i18n.localize('ABILITY_LABEL.BACKSTAB'), value: "backstab"},
            {label: game.i18n.localize('ABILITY_LABEL.BEAST_LORE'), value: "beastlore"},
            {label: game.i18n.localize('ABILITY_LABEL.BERSERKER'), value: "berserker"},
            {label: game.i18n.localize('ABILITY_LABEL.BLACKSMITH'), value: "blacksmith"},
            {label: game.i18n.localize('ABILITY_LABEL.BLOOD_COMBAT'), value: "bloodcombat"},
            {label: game.i18n.localize('ABILITY_LABEL.BODYGUARD'), value: "bodyguard"},
            {label: game.i18n.localize('ABILITY_LABEL.CHANNELING'), value: "channeling"},
            {label: game.i18n.localize('ABILITY_LABEL.CHEAP_SHOT'), value: "cheapshot"},
            {label: game.i18n.localize('ABILITY_LABEL.DOMINATE'), value: "dominate"},
            {label: game.i18n.localize('ABILITY_LABEL.ENSNARE'), value: "ensnare"},
            {label: game.i18n.localize('ABILITY_LABEL.EQUESTRIAN'), value: "equestrian"},
            {label: game.i18n.localize('ABILITY_LABEL.EX_ATTRIBUTE'), value: "exceptionalattribute"},
            {label: game.i18n.localize('ABILITY_LABEL.FEAT_STRENGTH'), value: "featofstrength"},
            {label: game.i18n.localize('ABILITY_LABEL.FEINT'), value: "feint"},
            {label: game.i18n.localize('ABILITY_LABEL.FLAILER'), value: "flailer"},
            {label: game.i18n.localize('ABILITY_LABEL.HAMMER_RHYTHM'), value: "hammerrhythm"},
            {label: game.i18n.localize('ABILITY_LABEL.HUNTER_INSTINCT'), value: "huntersinstinct"},
            {label: game.i18n.localize('ABILITY_LABEL.IRON_FIST'), value: "ironfist"},
            {label: game.i18n.localize('ABILITY_LABEL.KNIFE_PLAY'), value: "knifeplay"},
            {label: game.i18n.localize('ABILITY_LABEL.LEADER'), value: "leader"},
            {label: game.i18n.localize('ABILITY_LABEL.LOREMASTER'), value: "loremaster"},
            {label: game.i18n.localize('ABILITY_LABEL.MAN-AT-ARMS'), value: "manatarms"},
            {label: game.i18n.localize('ABILITY_LABEL.MANTLE_DANCE'), value: "mantledance"},
            {label: game.i18n.localize('ABILITY_LABEL.MARKSMAN'), value: "marksman"},
            {label: game.i18n.localize('ABILITY_LABEL.MEDICUS'), value: "medicus"},
            {label: game.i18n.localize('ABILITY_LABEL.NATURAL_WARRIOR'), value: "naturalwarrior"},
            {label: game.i18n.localize('ABILITY_LABEL.OPPORTUNIST'), value: "opportunist"},
            {label: game.i18n.localize('ABILITY_LABEL.POISONER'), value: "poisoner"},
            {label: game.i18n.localize('ABILITY_LABEL.POLEARM_MASTERY'), value: "polearmmastery"},
            {label: game.i18n.localize('ABILITY_LABEL.PYROTECHNICS'), value: "pyrotechnics"},
            {label: game.i18n.localize('ABILITY_LABEL.QUICK_DRAW'), value: "quickdraw"},
            {label: game.i18n.localize('ABILITY_LABEL.RAPID_FIRE'), value: "rapidfire"},
            {label: game.i18n.localize('ABILITY_LABEL.RAPID_REFLEXES'), value: "rapidreflexes"},
            {label: game.i18n.localize('ABILITY_LABEL.RECOVERY'), value: "recovery"},
            {label: game.i18n.localize('ABILITY_LABEL.RITUALIST'), value: "ritualist"},
            {label: game.i18n.localize('ABILITY_LABEL.RUNE_TATTOO'), value: "runetattoo"},
            {label: game.i18n.localize('ABILITY_LABEL.SHIELD_FIGHTER'), value: "shieldfighter"},
            {label: game.i18n.localize('ABILITY_LABEL.SIEGE_EXPERT'), value: "siegeexpert"},
            {label: game.i18n.localize('ABILITY_LABEL.SIXTH_SENSE'), value: "sixthsense"},
            {label: game.i18n.localize('ABILITY_LABEL.SORCERY'), value: "sorcery"},
            {label: game.i18n.localize('ABILITY_LABEL.STAFF_FIGHTING'), value: "stafffighting"},
            {label: game.i18n.localize('ABILITY_LABEL.STAFF_MAGIC'), value: "staffmagic"},
            {label: game.i18n.localize('ABILITY_LABEL.STEADFAST'), value: "steadfast"},
            {label: game.i18n.localize('ABILITY_LABEL.STEEL_THROW'), value: "steelthrow"},
            {label: game.i18n.localize('ABILITY_LABEL.STRANGLER'), value: "strangler"},
            {label: game.i18n.localize('ABILITY_LABEL.STRONG_GIFT'), value: "stronggift"},
            {label: game.i18n.localize('ABILITY_LABEL.SWORD_SAINT'), value: "swordsaint"},
            {label: game.i18n.localize('ABILITY_LABEL.SYMBOLISM'), value: "symbolism"},
            {label: game.i18n.localize('ABILITY_LABEL.TACTICIAN'), value: "tactician"},
            {label: game.i18n.localize('ABILITY_LABEL.THEURGY'), value: "theurgy"},
            {label: game.i18n.localize('ABILITY_LABEL.TRAPPER'), value: "trapper"},
            {label: game.i18n.localize('ABILITY_LABEL.TRICK_ARCHERY'), value: "trickarchery"},
            {label: game.i18n.localize('ABILITY_LABEL.TROLL_SINGING'), value: "trollsinging"},
            {label: game.i18n.localize('ABILITY_LABEL.TWIN_ATTACK'), value: "twinattack"},
            {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FORCE'), value: "twohandedforce"},
            {label: game.i18n.localize('ABILITY_LABEL.WITCHCRAFT'), value: "witchcraft"},
            {label: game.i18n.localize('ABILITY_LABEL.WITCHSIGHT'), value: "witchsight"},
            {label: game.i18n.localize('ABILITY_LABEL.WIZARDRY'), value: "wizardry"},
            {label: game.i18n.localize('ABILITY_LABEL.WHIPFIGHTER'), value: "whipfighter"},
            {label: game.i18n.localize('ABILITY_LABEL.WRESTLING'), value: "wrestling"},
            {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FINESSE'), value: "twohandedfinesse"},
            {label: game.i18n.localize('ABILITY_LABEL.BLESSINGS'), value: "blessings"}
        ];
        const powersList = [
            {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},        
            {label: game.i18n.localize('POWER_LABEL.ANATHEMA'), value: "anathema"},
            {label: game.i18n.localize('POWER_LABEL.BANISHING_SEAL'), value: "banishingseal"},
            {label: game.i18n.localize('POWER_LABEL.BEND_WILL'), value: "bendwill"},
            {label: game.i18n.localize('POWER_LABEL.BLACK_BOLT'), value: "blackbolt"},
            {label: game.i18n.localize('POWER_LABEL.BLACK_BREATH'), value: "blackbreath"},
            {label: game.i18n.localize('POWER_LABEL.BLESSED_SHIELD'), value: "blessedshield"},
            {label: game.i18n.localize('POWER_LABEL.BLINDING_SYMBOL'), value: "blindingsymbol"},
            {label: game.i18n.localize('POWER_LABEL.BRIMSTONE_CASCADE'), value: "brimstonecascade"},
            {label: game.i18n.localize('POWER_LABEL.COMBAT_HYMN'), value: "combathymn"},
            {label: game.i18n.localize('POWER_LABEL.CONFUSION'), value: "confusion"},
            {label: game.i18n.localize('POWER_LABEL.CURSE'), value: "curse"},
            {label: game.i18n.localize('POWER_LABEL.DANCING_WEAPON'), value: "dancingweapon"},
            {label: game.i18n.localize('POWER_LABEL.DRAINING_GLYPH'), value: "drainingglyph"},
            {label: game.i18n.localize('POWER_LABEL.ENTANGLING_VINES'), value: "entanglingvines"},
            {label: game.i18n.localize('POWER_LABEL.EXORCIZE'), value: "exorcize"},
            {label: game.i18n.localize('POWER_LABEL.FIRE_SOUL'), value: "firesoul"},
            {label: game.i18n.localize('POWER_LABEL.FLAME_WALL'), value: "flamewall"},
            {label: game.i18n.localize('POWER_LABEL.HEROIC_HYMN'), value: "heroichymn"},
            {label: game.i18n.localize('POWER_LABEL.HOLY_AURA'), value: "holyaura"},
            {label: game.i18n.localize('POWER_LABEL.ILLUSORY_CORRECTION'), value: "illusorycorrection"},
            {label: game.i18n.localize('POWER_LABEL.INHERIT_WOUND'), value: "inheritwound"},
            {label: game.i18n.localize('POWER_LABEL.LARVAE_BOILS'), value: "larvaeboils"},
            {label: game.i18n.localize('POWER_LABEL.LAY_ON_HANDS'), value: "layonhands"},
            {label: game.i18n.localize('POWER_LABEL.LEVITATE'), value: "levitate"},
            {label: game.i18n.localize('POWER_LABEL.LIFEGIVER'), value: "lifegiver"},
            {label: game.i18n.localize('POWER_LABEL.MALTRANSFORMATION'), value: "maltransformation"},
            {label: game.i18n.localize('POWER_LABEL.MIND-THROW'), value: "mindthrow"},
            {label: game.i18n.localize('POWER_LABEL.MIRRORING'), value: "mirroring"},
            {label: game.i18n.localize('POWER_LABEL.NATURES_EMBRACE'), value: "naturesembrace"},
            {label: game.i18n.localize('POWER_LABEL.PRIOS_BURNING_GLASS'), value: "priosburningglass"},
            {label: game.i18n.localize('POWER_LABEL.PROTECTIVE_RUNES'), value: "protectiverunes"},
            {label: game.i18n.localize('POWER_LABEL.PSYCHIC_THRUST'), value: "psychicthrust"},
            {label: game.i18n.localize('POWER_LABEL.PURGATORY'), value: "purgatory"},
            {label: game.i18n.localize('POWER_LABEL.RETRIBUTION'), value: "retribution"},
            {label: game.i18n.localize('POWER_LABEL.REVENANT_STRIKE'), value: "revenantstrike"},
            {label: game.i18n.localize('POWER_LABEL.SHAPESHIFT'), value: "shapeshift"},
            {label: game.i18n.localize('POWER_LABEL.SPHERE'), value: "sphere"},
            {label: game.i18n.localize('POWER_LABEL.SPIRIT_WALK'), value: "spiritwalk"},
            {label: game.i18n.localize('POWER_LABEL.STAFF_PROJECTILE'), value: "staffprojectile"},
            {label: game.i18n.localize('POWER_LABEL.STORM_ARROW'), value: "stormarrow"},
            {label: game.i18n.localize('POWER_LABEL.TELEPORT'), value: "teleport"},
            {label: game.i18n.localize('POWER_LABEL.THORN_CLOAK'), value: "thorncloak"},
            {label: game.i18n.localize('POWER_LABEL.TORMENTING_SPIRITS'), value: "tormentingspirits"},
            {label: game.i18n.localize('POWER_LABEL.TRUE_FORM'), value: "trueform"},
            {label: game.i18n.localize('POWER_LABEL.UNHOLY_AURA'), value: "unholyaura"},
            {label: game.i18n.localize('POWER_LABEL.UNNOTICEABLE'), value: "unnoticeable"},
            {label: game.i18n.localize('POWER_LABEL.WEAKENING_HYMN'), value: "weakeninghymn"},
            {label: game.i18n.localize('POWER_LABEL.WILD_HUNT'), value: "wildhunt"},
            {label: game.i18n.localize('POWER_LABEL.BATTLE_SYMBOL'), value: "battlesymbol"},
            {label: game.i18n.localize('POWER_LABEL.EARTH_BINDING'), value: "earthbinding"},
            {label: game.i18n.localize('POWER_LABEL.MARK_OF_TORMENT'), value: "markoftorment"},
            {label: game.i18n.localize('POWER_LABEL.SERENITY'), value: "serenity"},
            {label: game.i18n.localize('POWER_LABEL.EARTH_SHOT'), value: "earthshot"},
            {label: game.i18n.localize('POWER_LABEL.WITCH_HAMMER'), value: "witchhammer"}
        ];
        const traitsList = [
            {label: game.i18n.localize('TRAIT_LABEL.ACIDICATTACK'), value: "acidicattack"},
             {label: game.i18n.localize('TRAIT_LABEL.ACIDICBLOOD'), value: "acidicblood"},
             {label: game.i18n.localize('TRAIT_LABEL.ALTERNATIVEDAMAGE'), value: "alternativedamage"},
             {label: game.i18n.localize('TRAIT_LABEL.AMPHIBIAN'), value: "amphibian"},
             {label: game.i18n.localize('TRAIT_LABEL.ARMORED'), value: "armored"},
             {label: game.i18n.localize('TRAIT_LABEL.AVENGINGSUCCESSOR'), value: "avengingsuccessor"},
             {label: game.i18n.localize('TRAIT_LABEL.BLOODLUST'), value: "bloodlust"},
             {label: game.i18n.localize('TRAIT_LABEL.CARAPACE'), value: "carapace"},
             {label: game.i18n.localize('TRAIT_LABEL.COLLECTIVEPOWER'), value: "collectivepower"},
             {label: game.i18n.localize('TRAIT_LABEL.COLOSSAL'), value: "colossal"},
             {label: game.i18n.localize('TRAIT_LABEL.COMPANIONS'), value: "companions"},
             {label: game.i18n.localize('TRAIT_LABEL.CORRUPTINGATTACK'), value: "corruptingattack"},
             {label: game.i18n.localize('TRAIT_LABEL.CORRUPTIONHOARDER'), value: "corruptionhoarder"},
             {label: game.i18n.localize('TRAIT_LABEL.CORRUPTIONSENSITIVE'), value: "corruptionsensitive"},
             {label: game.i18n.localize('TRAIT_LABEL.CRUSHINGEMBRACE'), value: "crushingembrace"},
             {label: game.i18n.localize('TRAIT_LABEL.DEADLYBREATH'), value: "deadlybreath"},
             {label: game.i18n.localize('TRAIT_LABEL.DEATHSTRUGGLE'), value: "deathstruggle"},
             {label: game.i18n.localize('TRAIT_LABEL.DEVOUR'), value: "devour"},
             {label: game.i18n.localize('TRAIT_LABEL.DIMINUTIVE'), value: "diminutive"},
             {label: game.i18n.localize('TRAIT_LABEL.ENTHRALL'), value: "enthrall"},
             {label: game.i18n.localize('TRAIT_LABEL.EARTHBOUND'), value: "earthbound"},
             {label: game.i18n.localize('TRAIT_LABEL.FREESPIRIT'), value: "freespirit"},
             {label: game.i18n.localize('TRAIT_LABEL.GRAPPLINGTONGUE'), value: "grapplingtongue"},
             {label: game.i18n.localize('TRAIT_LABEL.GRAVELYCOLD'), value: "gravelycold"},
             {label: game.i18n.localize('TRAIT_LABEL.HARMFULAURA'), value: "harmfulaura"},
             {label: game.i18n.localize('TRAIT_LABEL.HAUNTING'), value: "haunting"},
             {label: game.i18n.localize('TRAIT_LABEL.INFECTIOUS'), value: "infectious"},
             {label: game.i18n.localize('TRAIT_LABEL.INFESTATION'), value: "infestation"},
             {label: game.i18n.localize('TRAIT_LABEL.INVISIBILITY'), value: "invisibility"},
             {label: game.i18n.localize('TRAIT_LABEL.LEAP'), value: "leap"},
             {label: game.i18n.localize('TRAIT_LABEL.LIFESENSE'), value: "lifesense"},
             {label: game.i18n.localize('TRAIT_LABEL.MANIFESTATION'), value: "manifestation"},
             {label: game.i18n.localize('TRAIT_LABEL.MANYHEADED'), value: "many-headed"},
             {label: game.i18n.localize('TRAIT_LABEL.METAMORPHOSIS'), value: "metamorphosis"},
             {label: game.i18n.localize('TRAIT_LABEL.MYSTICALRESISTANCE'), value: "mysticalresistance"},
             {label: game.i18n.localize('TRAIT_LABEL.NATURALWEAPON'), value: "naturalweapon"},
             {label: game.i18n.localize('TRAIT_LABEL.NIGHTPERCEPTION'), value: "nightperception"},
             {label: game.i18n.localize('TRAIT_LABEL.OBSERVANT'), value: "observant"},
             {label: game.i18n.localize('TRAIT_LABEL.PARALYZINGVENOM'), value: "paralyzingvenom"},
             {label: game.i18n.localize('TRAIT_LABEL.PIERCINGATTACK'), value: "piercingattack"},
             {label: game.i18n.localize('TRAIT_LABEL.POISONOUS'), value: "poisonous"},
             {label: game.i18n.localize('TRAIT_LABEL.POISONSPIT'), value: "poisonspit"},
             {label: game.i18n.localize('TRAIT_LABEL.PREHENSILECLAWS'), value: "prehensileclaws"},
             {label: game.i18n.localize('TRAIT_LABEL.RAMPAGE'), value: "rampage"},
             {label: game.i18n.localize('TRAIT_LABEL.REGENERATION'), value: "regeneration"},
             {label: game.i18n.localize('TRAIT_LABEL.ROBUST'), value: "robust"},
             {label: game.i18n.localize('TRAIT_LABEL.ROOTWALL'), value: "rootwall"},
             {label: game.i18n.localize('TRAIT_LABEL.SHAPESHIFTER'), value: "shapeshifter"},
             {label: game.i18n.localize('TRAIT_LABEL.SPIRITFORM'), value: "spiritform"},
             {label: game.i18n.localize('TRAIT_LABEL.STURDY'), value: "sturdy"},
             {label: game.i18n.localize('TRAIT_LABEL.SUMMONER'), value: "summoner"},
             {label: game.i18n.localize('TRAIT_LABEL.SURVIVALINSTINCT'), value: "survivalinstinct"},
             {label: game.i18n.localize('TRAIT_LABEL.SWARM'), value: "swarm"},
             {label: game.i18n.localize('TRAIT_LABEL.SWIFT'), value: "swift"},
             {label: game.i18n.localize('TRAIT_LABEL.TERRIFY'), value: "terrify"},
             {label: game.i18n.localize('TRAIT_LABEL.TUNNELER'), value: "tunneler"},
             {label: game.i18n.localize('TRAIT_LABEL.UNDEAD'), value: "undead"},
             {label: game.i18n.localize('TRAIT_LABEL.WEB'), value: "web"},
             {label: game.i18n.localize('TRAIT_LABEL.WINGS'), value: "wings"},
             {label: game.i18n.localize('TRAIT_LABEL.WISDOM_AGES'), value: "wisdomages"},
             {label: game.i18n.localize('TRAIT_LABEL.WRECKER'), value: "wrecker"}  
        ];
        let list;
        if(this.data.type === "ability"){
            list = abilitiesList;
        }
        else if(this.data.type === "mysticalPower"){
            list = powersList;
        }
        else if(this.data.type === "trait"){
            list = traitsList;
        }
        else{return}
        let referenceOptions = "";
        for(let referenceEntry of list){
            referenceOptions += `<option value=${referenceEntry.value}>${referenceEntry.label} </option>`
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
    
    /*async makeAction(actor, level = 1){

        if(this.data.data.reference === ""){
            await this.affectReference();
            return};

        if(actor == undefined || actor == null){
            return;
        }

        let list;
        if(this.data.type === "ability"){
            list = scriptedAbilities;
        }
        else if(this.data.type === "mysticalPower"){
            list = scriptedPowers;
        }
        else if(this.data.type === "trait"){
            list = scriptedTraits;
        }
        else{return}

        const ability = list.find(element => (element.reference === this.data.data.reference && element.level.includes(level)));
        if(ability){
            try{ability.function(this, actor)} catch(error){
                ui.notifications.error(error);
                return;
            }
        }
        else{
            ui.notifications.error("Not yet implemented");
            return;
        }
    }*/
}

export const scriptedAbilities =
[{reference: "alchemy", level: [1, 2, 3], function: simpleRollAbility},
{reference: "acrobatics", level: [1, 2, 3], function: simpleRollAbility},
{reference: "artifactcrafting", level: [1, 2, 3], function: simpleRollAbility},
//{reference: "backstab", level: [1, 2, 3], function: attackRoll},
{reference: "beastlore", level: [1, 2, 3], function: simpleRollAbility},
{reference: "berserker", level: [1, 2, 3], function: berserker},
{reference: "blacksmith", level: [1, 2, 3], function: simpleRollAbility},
{reference: "dominate", level: [1, 2, 3], function: dominatePrepare},
//{reference: "huntersinstinct", level: [1, 2, 3], function: attackRoll},
{reference: "leader", level: [1, 2, 3], function: leaderPrepare},
{reference: "loremaster", level: [1, 2, 3], function: simpleRollAbility},
{reference: "medicus", level: [1, 2, 3], function: medicusPrepare},
{reference: "quickdraw", level: [1, 2, 3], function: simpleRollAbility},
//{reference: "shieldfighter", level: [1, 2, 3], function: attackRoll},
{reference: "recovery", level: [1, 2, 3], function: recoveryPrepare},
{reference: "strangler", level: [1, 2, 3], function: stranglerPrepare},
{reference: "witchsight", level: [1, 2, 3], function: witchsight}];

export const scriptedPowers = 
[{reference: "anathema", level: [1, 2, 3], function: anathemaPrepare},
{reference: "brimstonecascade", level: [1, 2, 3], function: brimstoneCascadePrepare},
{reference: "bendwill", level: [1, 2, 3], function: bendWillPrepare},
{reference: "blackbolt", level: [1, 2, 3], function: blackBoltPrepare},
{reference: "blessedshield", level: [1, 2, 3], function: blessedshieldPrepare},
{reference: "confusion", level: [1, 2, 3], function: confusionPrepare},
{reference: "curse", level: [1, 2, 3], function: cursePrepare},
{reference: "dancingweapon", level: [1, 2, 3], function: dancingweapon},
{reference: "entanglingvines", level: [1, 2, 3], function: entanglingvinesPrepare},
{reference: "holyaura", level: [1, 2, 3], function: holyAuraPrepare},
{reference: "inheritwound", level: [1, 2, 3], function: inheritWound},
{reference: "larvaeboils", level: [1, 2, 3], function: larvaeBoilsPrepare},
{reference: "layonhands", level: [1, 2, 3], function: layonhandsPrepare},
{reference: "levitate", level: [1, 2, 3], function: levitatePrepare},
{reference: "maltransformation", level: [1, 2, 3], function: maltransformationPrepare},
{reference: "mindthrow", level: [1, 2, 3], function: mindthrowPrepare},
{reference: "priosburningglass", level: [1, 2, 3], function: priosburningglassPrepare},
{reference: "tormentingspirits", level: [1, 2, 3], function: tormentingspiritsPrepare},
{reference: "unnoticeable", level: [1, 2, 3], function: unnoticeablePrepare}];

export const scriptedTraits = 
[{reference: "regeneration", level: [1, 2, 3], function: regeneration},
{reference: "shapeshifter", level: [1, 2, 3], function: simpleRollAbility},
{reference: "wisdomages", level: [1, 2, 3], function: simpleRollAbility}];

const weaponReferences = [
    "1handed",
    "short",
    "long",
    "unarmed",
    "heavy",
    "shield",
    "thrown",
    "ranged"
  ]
  
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

export function markScripted(item){
    if(item.data.data.reference){
        let list;
        if(item.data.type === "ability"){
            list = scriptedAbilities;
        }
        else if(item.data.type === "mysticalPower"){
            list = scriptedPowers;
        }
        else if(item.data.type === "trait"){
            list = scriptedTraits;
        }
        const ability = list.find(element => (element.reference === item.data.data.reference));
        if(ability){
            item.data.data.script = ability.function;
            item.data.data.hasScript = true;
        }
        else {
            item.data.data.script = undefined;
            item.data.data.hasScript = false;
        }
    }
    else{
        item.data.data.script = undefined;
        item.data.data.hasScript = false;
    }
}

/*get the target token, its actor, and evaluate which attribute this actor will use for opposition
@Params: {string}   targetAttributeName : the name of the resist attribute. Can be defence, and can be null.
@returns:  {targetData object}*/
function getTarget(targetAttributeName) {
    let targetsData;
    try{targetsData = getTargets(targetAttributeName, 1)} catch(error){      
        throw error;
    }
    return targetsData[0]
}

function getTargets(targetAttributeName, maxTargets = 1) {
    let targets = Array.from(game.user.targets)
    if(targets.length == 0 || targets.length > maxTargets){
      throw game.i18n.localize('ABILITY_ERROR.TARGET');
    }
    let targetsData = [];
    for(let target of targets){
        let targetToken = target;
        let targetActor = target.actor;
        let autoParams = "";
        let leaderTarget = false;

        // get target opposition attribute
        let resistAttributeValue = null;
        if(targetAttributeName != undefined)
        {
            resistAttributeValue = getAttributeValue(targetActor, targetAttributeName);
        }
        else {targetAttributeName = null};
            // check for leader adept ability effect on target
        const LeaderEffect = "icons/svg/eye.svg";
        let leaderEffect = getEffect(targetToken, LeaderEffect);
        if(leaderEffect){
            leaderTarget = true;
            autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
        };
        targetsData.push({
            hasTarget : true,
            token : targetToken,
            actor : targetActor,
            resistAttributeName: targetAttributeName,
            resistAttributeValue : resistAttributeValue,
            leaderTarget: leaderTarget,
            autoParams: autoParams
        })
    }
    return(targetsData)
}

/* get the selected token ID */
function getTokenId(){
    let selected = canvas.tokens.controlled;
    if(selected.length > 1 || selected.length == 0){
        ui.notifications.error(game.i18n.localize('ERROR.NO_TOKEN_SELECTED'))
        return;
    }
    return(selected[0])
}

/* format the string to print the roll result, including the 2 dice if favour was involved, up to 3 rolls for multi-attacks
@Params: {object}  rollData is the array of objects baseRoll function returns 
@returns:  {string} the formated and localized string*/
function formatRollResult(rollData){
    let rollResult = game.i18n.localize('ABILITY.ROLL_RESULT');
    let position = 0;
    for(let rollDataElement of rollData){
        position += 1;
        rollResult += rollDataElement.diceResult.toString();

        if(rollDataElement.favour != 0){
            rollResult += "  (" + rollDataElement.dicesResult[0].toString() + " , " + rollDataElement.dicesResult[1].toString() + ")";
        }
        if(position != rollData.length){
            rollResult += " / "
        }
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

async function buildFunctionStuffDefault(ability, actor) {
    let selectedToken;
    try{selectedToken = getTokenId()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let functionStuff = {
        ability: ability,
        actor: actor,
        askTargetAttribute: false,
        askCastingAttribute: false,
        attackFromPC: actor.hasPlayerOwner,
        autoParams: "",
        beastLoreData: getBeastLoreData(actor),
        checkMaintain: false,
        combat: false,
        contextualDamage: false,
        corruption: false,
        favour: 0,
        gmOnlyChatResult: false,
        isMaintained: false,
        modifier: 0,
        notResistWhenFirstCast : false,
        powerLvl: getPowerLevel(ability),
        targetMandatory : false,
        targetData: {hasTarget: false, leaderTarget: false},
        token :selectedToken,
        addCasterEffect: [],
        addTargetEffect: [],
        activelyMaintaninedTargetEffect: [],
        removeTargetEffect: [],
        removeCasterEffect: [],
        dmgData: {
            modifier: "",
            hasAdvantage: false,
            ignoreArm: false
        },
        resultFunction: standardPowerResult
    };
    if(ability.data.type === "mysticalPower"){
        let actorResMod = checkResoluteModifiers(actor, functionStuff.autoParams, true, false);
        functionStuff.castingAttributeName = actorResMod.bestAttributeName;
        functionStuff.autoParams = actorResMod.autoParams;
        functionStuff.corruption = true;
        functionStuff.impeding = actor.data.data.combat.impeding;
        functionStuff.casterMysticAbilities = await getMysticAbilities(actor);
        if(!actor.data.data.health.corruption.max) functionStuff.corruption = false;
    }
    return(functionStuff)
}

function  getBeastLoreData (actor){
    let askBeastlore = false;
    let beastLoreMaster = false;
let beastlore = actor.items.filter(item => item.data.data?.reference === "beastlore");
    if(beastlore.length != 0){
        let beastLoreLvl = getPowerLevel(beastlore[0]).level;
        if(beastLoreLvl > 1){
            askBeastlore = true;
        }
        if(beastLoreLvl > 2){
            beastLoreMaster = true;
        }
    }
    return({askBeastlore: askBeastlore,beastLoreMaster: beastLoreMaster, useBeastLore: false})
}

/*check the mystic traditions of the actor
@Params: {array}    referenceList : an array of the references of the mystic tradition abilities that are relevant.
                    Sorcery is always relevant and therefore checked. 
@returns: array of  {boolean} has(ability)
                    {number} level
                    {string} levelname the localized label (novice, adpet or master)}*/
async function getMysticAbilities(actor){
    const mysticTraditions = [
        "armoredmystic",
        "blessings",
        "channeling",
        "sorcery",
        "staffmagic",
        "stronggift",
        "symbolism",
        "theurgy",
        "trollsinging",
        "witchcraft",
        "wizardry"
    ]

    let actorMysticAbilities = {
        armoredmystic: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        blessings: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        channeling: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        sorcery: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        staffmagic: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        stronggift: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        symbolism: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        theurgy: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        trollsinging: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        witchcraft: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        },
        wizardry: {
            hasAbility: false,
            level: 0,
            lvlName: ""
        }
    }

    for(let abilityRef of mysticTraditions){
        let ability = actor.items.filter(item => item.data.data.reference === abilityRef);
        if(ability.length != 0){
            actorMysticAbilities[abilityRef].hasAbility = true;
            let powerLevel = getPowerLevel(ability[0]);
            actorMysticAbilities[abilityRef].level = powerLevel.level;
            actorMysticAbilities[abilityRef].lvlName = powerLevel.lvlName;
        }
    }
    return(actorMysticAbilities)
}

/*evaluate the temmporary corruption to be received by the actor
@Params: {functionStuff.array}    traditions : an array of the references of the mystic tradition abilities that may decrease this roll
        {functionStuff.object}    returned by getMysticAbilities()
        {functionStuff.actor}     the actor
        {functionStuff.attackFromPC}  wehther the acting character ic PC (rolls dice) or NPC (fixed result)
        {corruptionFormula}      formula for base corruption roll
@returns: array of  {boolean} has(ability)
                    {number} level
                    {string} levelname the localized label (novice, adpet or master)}*/
async function getCorruption(functionStuff, corruptionFormula = "1d4"){
    let sorceryRoll;
    if(functionStuff?.tradition){
        for(let trad of functionStuff.tradition){
            if(functionStuff.casterMysticAbilities[trad].hasAbility){
                if(functionStuff.casterMysticAbilities[trad].level > 1){
                    return({value: 1, tradition: trad})
                }
            }
        } 
    }
    if(functionStuff.casterMysticAbilities.sorcery.hasAbility){
        let castingAttribute = (checkResoluteModifiers(functionStuff.actor)).bestAttributeName;
        sorceryRoll = await baseRoll(functionStuff.actor, castingAttribute, null, null, 0, 0);
        if(sorceryRoll.hasSucceed){
            return({value: 1, tradition: "sorcery", sorceryRoll: sorceryRoll})
        }
    }
     
    if(functionStuff.attackFromPC){
        let corRoll= new Roll(corruptionFormula).evaluate();
        return({value: corRoll.total, sorceryRoll: sorceryRoll, corruptionRoll: corRoll})
    }
     
    let corRoll= new Roll(corruptionFormula).evaluate({maximize: true});
    let value = Math.ceil(corRoll.total/2);
    return({value: value, sorceryRoll: sorceryRoll, corruptionRoll: corRoll})
}

/*get the max level learned by the actor
@Params: {item}   ability : the ability or mysticalPower item 
@returns:  {{number} level
            {lvlName} the localized label (novice, adpet or master)}*/
export function getPowerLevel(ability){
    let powerLvl = 0;
    let lvlName = "Not learned";
    if(ability.data.data.master.isActive){
        powerLvl = 3;
        lvlName = game.i18n.localize('ABILITY.MASTER');
    }
    else if(ability.data.data.adept.isActive){
        powerLvl = 2;
        lvlName = game.i18n.localize('ABILITY.ADEPT');
    }
    else if(ability.data.data.novice.isActive){
        powerLvl = 1;
        lvlName = game.i18n.localize('ABILITY.NOVICE');
    }
    return{level : powerLvl, lvlName : lvlName}
}

//check if there is an icon effect on the token
function getEffect(token, effect){
    if(game.modules.get("statuscounter")?.active){
        if(EffectCounter.findCounter(token, effect)){
            return(true)
        }
        else return(false)
    }
    else{
        if(token.data.effects.find(e => e === effect)){
            return(true)
        }
        else return(false)
    }
}

function checkPainEffect(functionStuff, damage){
    if(functionStuff.targetData.actor.data.data.health.toughness.threshold && (damage.roll.total > functionStuff.targetData.actor.data.data.health.toughness.threshold))
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
   * @param {string} resultFunction  The function to call in order to process the results
   * @param {any}   functionStuff  an object of parameters not used in the dialog function, but useful for resultFunction */
async function modifierDialog(functionStuff){
    let isWeaponRoll = false;
    let askBackstab = functionStuff.askBackstab ?? false;
    let askHuntersInstinct = functionStuff.askHuntersInstinct ?? false;
    let ironFistDmg = functionStuff.ironFistDmg ?? false;
    let ironFistDmgMaster = functionStuff.ironFistDmgMaster ?? false;
    let askTwoAttacks = functionStuff.askTwoAttacks ?? false;
    let askThreeAttacks = functionStuff.askThreeAttacks ?? false;
    let askBeastlore = functionStuff.beastLoreData.askBeastlore ?? false;
    let askCorruptedTarget = functionStuff.askCorruptedTarget ?? false;
    let robustDmgValue = functionStuff.robustDmgValue ?? "";
    let askRobustDmg = functionStuff.askRobustDmg ?? false;
    let featStFavour = functionStuff.featStFavour ?? false;
    let hunterBonus = functionStuff.hunterBonus ?? false;
    let contextualDamage = functionStuff.contextualDamage ?? false;
    let leaderTarget = functionStuff.targetData.leaderTarget ?? false;
    let medicus = functionStuff.medicus ?? false;
    let weaponDamage = "";
    let actorWeapons;
    let askImpeding = false;
    let d8="(+1d8)";
    let d6="(+1d6)";
    let d4="(+1d4)";
    if(functionStuff?.impeding){
        askImpeding = true;
    }
    if(functionStuff.askWeapon){
        actorWeapons = functionStuff.actor.items.filter(item => item.data?.type == "weapon")
        if(actorWeapons.length == 0){
            ui.notifications.error("No weapon in hand.");
            return;
        }
    }
    if(functionStuff?.combat){
        isWeaponRoll = true;
        if(functionStuff?.weapon){
            if(functionStuff.attackFromPC){
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
    let beastLoreDmg=d4;
    if(functionStuff.beastLoreData?.beastLoreMaster) beastLoreDmg=d6;
    let targetAttributeName = null;
    let hasTarget = functionStuff.targetData.hasTarget;
    if(functionStuff.targetData.resistAttributeName){
        targetAttributeName = functionStuff.targetData.resistAttributeName
    }

    const html = await renderTemplate('systems/symbaroum/template/chat/dialog2.html', {
        hasTarget: hasTarget,
        askCastingAttribute: functionStuff.askCastingAttribute,
        askTargetAttribute: functionStuff.askTargetAttribute,
        isWeaponRoll : isWeaponRoll,
        autoparamsText: game.i18n.localize("DIALOG.AUTOPARAMS") + functionStuff.autoParams + functionStuff.targetData.autoParams,
        isArmorRoll : null,
        askBackstab : askBackstab,
        askRobustDmg : askRobustDmg,
        ignoreArmor : functionStuff.dmgData.ignoreArm,
        robustDmgValue: robustDmgValue,
        ironFistAdept: ironFistDmg && !ironFistDmgMaster,
        askIronFistMaster: ironFistDmg && ironFistDmgMaster,
        featStFavour: featStFavour,
        askHuntersInstinct: askHuntersInstinct,
        leaderTarget: leaderTarget,
        hunterBonus: hunterBonus,
        askThreeAttacks: askThreeAttacks,
        askTwoAttacks: askTwoAttacks,
        askImpeding: askImpeding,
        askCorruptedTarget: askCorruptedTarget,
        weaponDamage : weaponDamage,
        contextualDamage: contextualDamage,
        askBeastlore: askBeastlore,
        beastLoreDmg: beastLoreDmg,
        d8: d8,
        d4: d4,
        choicesIF: { "0": game.i18n.localize("ABILITY_LABEL.IRON_FIST")+" 1d4", "1":game.i18n.localize("ABILITY_LABEL.IRON_FIST")+" 1d8"},
        groupNameIF:"ironFdamage",
        choices: { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
        groupName:"favour",
        defaultFavour: "0",
        defaultModifier: functionStuff.modifier,
        defaultAdvantage: "",
        defaultDamModifier: "",
        checkMaintain: functionStuff.checkMaintain,
        askWeapon: functionStuff.askWeapon,
        weapons : actorWeapons,
        medicus : medicus
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
                let finalFavour = fvalue + functionStuff.favour;


                //Power/Ability has already been started and is maintained or chained
                if( html.find("#maintain").length > 0) {
                    let valueM = html.find("#maintain")[0].value;	
                    if(valueM === "M"){functionStuff.isMaintained = true}								
                }
                if(askImpeding){
                    if(html.find("#impeding")[0].checked){
                        functionStuff.modifier += -functionStuff.impeding;
                        functionStuff.autoParams += game.i18n.localize("ARMOR.IMPEDING") + ", ";
                    }
                }
                if(askCorruptedTarget){
                    functionStuff.targetFullyCorrupted = html.find("#targetCorrupt")[0].checked;
                }
                //combat roll stuff
                if(contextualDamage){
                    functionStuff.dmgData.hasAdvantage = html.find("#advantage")[0].checked;
                    if(functionStuff.dmgData.hasAdvantage){
                        functionStuff.modifier += 2;
                        functionStuff.autoParams += game.i18n.localize('DIALOG.ADVANTAGE') + ", ";
                        if(askBackstab && functionStuff.actor.data.data.attributes.discreet.total > functionStuff.actor.data.data.attributes[functionStuff.castingAttributeName].total){
                            functionStuff.castingAttributeName = "discreet";
                        }
                    }
                    if(askBeastlore){
                        functionStuff.beastLoreData.useBeastlore = html.find("#usebeastlore")[0].checked;
                    }
                    let damModifier = html.find("#dammodifier")[0].value;
                    if(damModifier.length > 0) {
                        functionStuff.dmgData.modifier += " + " + damModifier;
                    }
                }
                if(isWeaponRoll){
                    functionStuff.dmgData.ignoreArm = html.find("#ignarm")[0].checked;
                    if(functionStuff.dmgData.ignoreArm) functionStuff.autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR') + ", ";
                    functionStuff.poison = Number(html.find("#poison")[0].value);
                    // Damage modifier for iron fist master 
                    if(ironFistDmgMaster){
                        let ifResult = html.find("input[name='ironFdamage']");
                        let ifvalue = 0;
                        for ( let f of ifResult) {						
                            if( f.checked ) ifvalue = parseInt(f.value, 10);
                        }		
                        functionStuff.ironFistDmgMaster = ifvalue;
                    }
                    if(functionStuff.askRobustDmg){
                        functionStuff.dmgData.useRobustDmg = html.find("#userobust")[0].checked;
                    }
                    if(askBackstab){
                        functionStuff.dmgData.useBackstab = html.find("#usebackstab")[0].checked;
                        if(functionStuff.dmgData.useBackstab && functionStuff.dmgData.backstabBleed){    
                            functionStuff.bleed = true;
                            functionStuff.dmgData.bleed = "1d4"
                        }
                    }
                    if(askTwoAttacks){
                        functionStuff.dmgData.do2attacks = html.find("#do2attacks")[0].checked;
                    }
                    if(askThreeAttacks){
                        functionStuff.dmgData.do3attacks = html.find("#do3attacks")[0].checked;
                    }
                    if(askHuntersInstinct){
                        functionStuff.useHuntersInstinct = html.find("#usehunter")[0].checked;
                        if(functionStuff.useHuntersInstinct){
                            finalFavour += 1;
                        }
                        else{
                            functionStuff.dmgData.hunterIDmg = false;
                        }
                    }
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
                            functionStuff.introText= functionStuff.actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO');
                            functionStuff.resultTextFail = game.i18n.localize('ABILITY_MEDICUS.CHAT_FAILURE');
                            functionStuff.resultTextSuccess = functionStuff.actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_SUCCESS');
                        }
                    }
                    else functionStuff.medicusExam = true;
                }
                let rollData = [];
                functionStuff.favour = finalFavour;
                /* special case Entangling Vines */
                if(functionStuff.notResistWhenFirstCast && !functionStuff.isMaintained){
                    functionStuff.targetData.resistAttributeName = null;
                    functionStuff.targetData.resistAttributeValue = null;
                }
                if(hasTarget){
                    rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier));
                    if(isWeaponRoll && functionStuff.dmgData.do3attacks){
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier));
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier));
                    }
                    else if(isWeaponRoll && functionStuff.dmgData.do2attacks){
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName, functionStuff.favour, functionStuff.modifier));
                    }
                }
                else{
                    rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier));
                    if(isWeaponRoll && functionStuff.dmgData.do3attacks){
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier));
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier));
                    }
                    else if(isWeaponRoll && functionStuff.dmgData.do2attacks){
                        rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier));
                    }
                }
                await functionStuff.resultFunction(rollData, functionStuff);
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

/*a character that uses resolute, or a target that defend with resolute, mays have ability modifiers
This function checks : 
- leader novice (may use persuasive in place of resolute).
- steadfast
* @param {actor} actor       The actor
* @param {string} autoParams    the list of abilities and parameters automaticaly taken care for this actor
* @checkLeader {boolean}  true to check if actor has leader
* @checkSteadfast {boolean}  true to check if actor has staedfast
returns:{
    bestAttributeName {string} , //final attribute 
    favour {-1, 0, 1}, 
    useLeader {boolean},  (the novice level, if persuasive > resolute)
    hasSteadfast {boolean},
    useSteadfastAdept {boolean},
    useSteadfastMaster {boolean}
    autoParams {string} detected and used abilities have been appended to autoParams}*/
export function checkResoluteModifiers(actor, autoParams = "", checkLeader = false, checkSteadfast = false){
    let useLeader = false;
    let hasSteadfast = false;
    let useSteadfastAdept = false;
    let useSteadfastMaster = false;
    let favour = 0;
    let bestAttributeName = "resolute";
    let bestAttributeValue = actor.data.data.attributes["resolute"].value + actor.data.data.bonus["resolute"];
    if(checkLeader){
        let hasLeader = actor.items.filter(item => item.data.data?.reference === "leader");
        if(hasLeader.length > 0){
            let persuasiveV = actor.data.data.attributes["persuasive"].value + actor.data.data.bonus["persuasive"];
            if(bestAttributeValue < persuasiveV) {
                bestAttributeName = "persuasive";
                bestAttributeValue = persuasiveV;
                useLeader = true;
                autoParams += game.i18n.localize('ABILITY_LABEL.LEADER') + ", ";
            }
        }
    }
    if(checkSteadfast){
        let steadfastAb = actor.items.filter(item => item.data.data?.reference === "steadfast");
        if(steadfastAb.length > 0){
            hasSteadfast = true;
            let powerLvl = getPowerLevel(steadfastAb[0]);
            if(powerLvl.level == 2){
                useSteadfastAdept = true;
                favour = 1;
                autoParams += game.i18n.localize('ABILITY_LABEL.STEADFAST') + " (" + game.i18n.localize('ABILITY.ADEPT') + "), ";
            }
            if(powerLvl.level > 2){
                useSteadfastMaster = true;
                useSteadfastAdept = true;
                favour = 1;
                autoParams += game.i18n.localize('ABILITY_LABEL.STEADFAST') + " (" + game.i18n.localize('ABILITY.MASTER') + "), ";
            }
        }
    }
    return{
        useLeader: useLeader,
        bestAttributeName: bestAttributeName,
        bestAttributeValue: bestAttributeValue,
        favour: favour,
        hasSteadfast: hasSteadfast,
        useSteadfastAdept: useSteadfastAdept,
        useSteadfastMaster: useSteadfastMaster,
        autoParams: autoParams
    }
}

/* This function applies damage reduction (Undead trait, swarm...) to the final damage */
async function mathDamageProt(targetActor, damage, damageType){
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
    else if(damageType.elementary){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.elementary);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.elementary)
    }
    else if(damageType.mystical){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.mystical);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.mystical)
    }
    else if(damageType.mysticalWeapon){
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.mysticalWeapon);
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.mysticalWeapon)
    }
    else{
        finalDamage = Math.round(finalDamage*targetActor.data.data.combat.damageProt.normal)
        infoText = await damageReductionText(targetActor.data.data.combat.damageProt.normal)
    }
    return({damage: finalDamage, text : infoText})
}

/*function for main combat

****************this function needs damage and armor parameters as dice (ie: weapon.data.data.damage = "1d8")
for the NPC side, it will transform those parameters as NPC fixed values using the formula (dice maximum value)/2
It won't work with NPC fixed values as input

* @param {boolean} attackFromPC true: the actor that does damage is a PC; false : the damage is done by a NPC
* @param {actor object} actor  is the actor that does damage
* @param {item object} weapon is the weapon that is used
* @param {object} rollParams is an object of parameters.
* @param {object} targetData is information on the target that will receive the damage (as returned by the getTarget function)*/

export async function attackRoll(weapon, actor){
    // get selected token
    let selected = canvas.tokens.controlled;
    if(selected.length == 0 || selected.length > 1){
        ui.notifications.error(game.i18n.localize('ERROR.NO_TOKEN_SELECTED'));
        return;
    }
    let token = selected[0];
    // get target token, actor and defense value
    let targetData;
    try{targetData = getTarget("defense")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = {
        actor: actor,
        token: token,
        askTargetAttribute: false,
        askCastingAttribute: false,
        askBackstab: false,
        askHuntersInstinct: false,
        askTwoAttacks: false,
        askThreeAttacks: false,
        askRobustDmg: false,
        robustDmgValue:"",
        featStFavour: false,
        ironFistDmg: false,
        ironFistDmgMaster: false,
        attackFromPC: actor.hasPlayerOwner,
        flagBerserk: false,
        autoParams: "",
        bleed: false,
        checkMaintain: false,
        combat: true,
        contextualDamage: true,
        corruption: false,
        favour: 0,
        modifier: 0,
        poison: 0,
        isMystical: false,
        isAlternativeDamage: false,
        alternativeDamageAttribute: "none",
        resultFunction: attackResult,
        targetData: targetData,
        useHuntersInstinct: false,
        hunterBonus: "",
        beastLoreData: getBeastLoreData(actor),
        corruptingattack: "",
        dmgData: {
            isRanged: false,
            hunterIDmg: false,
            modifier: "",
            hasAdvantage: false,
            useBackstab: false,
            useRobustDmg: false,
            ignoreArm: false
        }

    }
    let specificStuff;
    if(weapon){
        specificStuff = {
            askWeapon: false,
            castingAttributeName: weapon.attribute,
            weapon: weapon,
            isMystical: weapon.qualities.mystical,
        }
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff)
    //search for special attacks (if the attacker has abilities that can affect the roll or not, ask the player in the dialog)
    //ranged attacks
    if(weapon&&weapon.doAlternativeDamage){
        functionStuff.isAlternativeDamage = weapon.doAlternativeDamage;
        functionStuff.alternativeDamageAttribute = weapon.damage.alternativeDamageAttribute;
        functionStuff.dmgData.ignoreArm = true;
        functionStuff.isMystical = true;
    }
    if(weapon && weapon.isDistance){
        if(!functionStuff.useHuntersInstinct){
            let hunterInstinct = actor.items.filter(item => item.data.data?.reference === "huntersinstinct");
            if(hunterInstinct.length != 0){
                functionStuff.askHuntersInstinct = true;
                functionStuff.hunterBonus = " (" + game.i18n.localize('DIALOG.FAVOUR_FAVOUR')
                if(hunterInstinct[0].data.data.adept.isActive){
                    functionStuff.dmgData.hunterIDmg = true;
                    functionStuff.hunterBonus += ", "+ game.i18n.localize('WEAPON.DAMAGE');
                    if(functionStuff.attackFromPC) functionStuff.hunterBonus += " +1d4)";
                    else functionStuff.hunterBonus += " +2)";
                }
            }
        }
        let rapidfire = actor.items.filter(item => (item.data.data?.reference === "rapidfire" || item.data.data?.reference === "rapidfire "));
        if(rapidfire.length != 0){
            if(rapidfire[0].data.data.master.isActive){
                functionStuff.askThreeAttacks = true;
            }
            else{
                functionStuff.askTwoAttacks = true;
            }
        }
        if(weapon.reference == "thrown"){
            let steelthrow = actor.items.filter(item => item.data.data?.reference === "steelthrow");
            if(steelthrow.length != 0){
                if(steelthrow[0].data.data.adept.isActive){
                    functionStuff.askTwoAttacks = true;
                }
                if(steelthrow[0].data.data.master.isActive){
                    functionStuff.askThreeAttacks = true;
                }
            }
        }
    }
    //melee weapons
    if(weapon && weapon.isMelee){
        if(weapon.reference == "unarmed"){
            let naturalwarrior = actor.items.filter(item => item.data.data?.reference === "naturalwarrior");
            if(naturalwarrior.length != 0){
                if(naturalwarrior[0].data.data.adept.isActive){
                    functionStuff.askTwoAttacks = true;
                }
            }
            let corruptingattack = actor.items.filter(item => item.data.data?.reference === "corruptingattack");
            if(corruptingattack.length != 0){
                if(corruptingattack[0].data.data.master.isActive){
                    functionStuff.corruptingattack = "1d8";
                } else if(corruptingattack[0].data.data.adept.isActive){
                    functionStuff.corruptingattack = "1d6";
                } else{
                    functionStuff.corruptingattack = "1d4";
                }
            }
        }
        if(weapon.qualities.short){
            let knifeplay = actor.items.filter(item => item.data.data?.reference === "knifeplay");
            if(knifeplay.length != 0){
                if(knifeplay[0].data.data.adept.isActive){
                    functionStuff.askTwoAttacks = true;
                }
            }
        }
        if(!functionStuff.dmgData.useBackstab){
            let backstabAbil = actor.items.filter(item => item.data.data?.reference === "backstab");
            if(backstabAbil.length != 0){
                functionStuff.askBackstab = true;
                if(backstabAbil[0].data.data.adept.isActive){
                    functionStuff.dmgData.backstabBleed = true
                }
            }
        }
        let ironFist = actor.items.filter(item => item.data.data?.reference === "ironfist");
        if(ironFist.length > 0){
            let powerLvl = getPowerLevel(ironFist[0]);
            if(powerLvl.level > 1){
                functionStuff.ironFistDmg = true;
                functionStuff.autoParams += game.i18n.localize('ABILITY_LABEL.IRON_FIST') + ", ";
                if(powerLvl.level > 2){
                    functionStuff.ironFistDmgMaster = true;
                }
            }
        }
        let robust = actor.items.filter(element => element.data.data.reference === "robust");
        if(robust.length > 0){
            functionStuff.askRobustDmg = true;
            let powerLvl = getPowerLevel(robust[0]);
            if(functionStuff.attackFromPC){
                let calc = powerLvl.level*2+2;
                functionStuff.robustDmgValue = " (+1d" + calc.toString()+")";
            }
            else{
                let calc = powerLvl.level+1;
                functionStuff.robustDmgValue = " (+"+calc.toString()+")";
            }
        }
        let featSt = actor.items.filter(item => item.data.data.reference === "featofstrength");
        if((featSt.length != 0) && (actor.data.data.health.toughness.value < (actor.data.data.health.toughness.max/2)) && (weapon.attribute == "strong")){
            let featStLvl = getPowerLevel(featSt[0]).level;
            if(featStLvl > 1) {
                functionStuff.featStFavour = true;
                functionStuff.favour += 1;
            }
        }
        let colossal = actor.items.filter(element => element.data.data?.reference === "colossal");
        if(colossal.length > 0 && colossal[0].data.data.adept.isActive && !functionStuff.isAlternativeDamage){
            functionStuff.favour += 1;
            functionStuff.autoParams += game.i18n.localize('TRAIT_LABEL.COLOSSAL') + ", ";
        }
        functionStuff.flagBerserk = actor.getFlag(game.system.id, 'berserker');
    }
    //all weapons
    if(!functionStuff.askWeapon){
        if(functionStuff.weapon.qualities.precise){
            functionStuff.modifier += 1;
            functionStuff.autoParams += game.i18n.localize('COMBAT.PARAMS_PRECISE')
        }
    };
    await modifierDialog(functionStuff)
}
  
async function attackResult(rollData, functionStuff){
    
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
    let attackNumber = 0;
    let mysticalWeapon = functionStuff.weapon.qualities.mystical;
    let corruptionDmgFormula = ""
    let printCorruption = false;
    let corruptionChatResult ="";
    let corruptionTooltip="";
    let targetValue = functionStuff.targetData.actor.data.data.health.toughness.value;
    if(functionStuff.isAlternativeDamage){
        targetValue = getAttributeValue(functionStuff.actor, functionStuff.alternativeDamageAttribute);
    }

    for(let rollDataElement of rollData){

        rollDataElement.finalText="";
        if(rollDataElement.hasSucceed){
            rollDataElement.resultText = functionStuff.token.data.name + game.i18n.localize('COMBAT.CHAT_SUCCESS') + functionStuff.targetData.token.data.name;
            hasDamage = true;
            rollDataElement.hasDamage = true;
            damage = await damageRollWithDiceParams(functionStuff, rollDataElement.critSuccess, attackNumber);
            pain = pain || checkPainEffect(functionStuff, damage);
            rollDataElement.dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
            rollDataElement.damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());
            damageRollMod = game.i18n.localize('COMBAT.CHAT_DMG_PARAMS') + damage.autoParams;
            hasDmgMod = (damage.autoParams.length >0) ? true : false;
            let finalDmg = await mathDamageProt(functionStuff.targetData.actor, damage.roll.total, {mysticalWeapon: mysticalWeapon});
            rollDataElement.dmg = finalDmg.damage;
            rollDataElement.dmgFormula += finalDmg.text;
            if(functionStuff.corruptingattack != "" && rollDataElement.dmg > 0){
                if(corruptionDmgFormula !="") corruptionDmgFormula += "+";
                corruptionDmgFormula += functionStuff.corruptingattack;
                printCorruption=true;
            }
            rollDataElement.damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + rollDataElement.dmg.toString();
            damageTot += rollDataElement.dmg;
            if(functionStuff.isAlternativeDamage){
                rollDataElement.damageText += " ("+getAttributeLabel(functionStuff.actor, functionStuff.alternativeDamageAttribute)+")";
            }
        }
        else{
            rollDataElement.resultText = functionStuff.token.data.name + game.i18n.localize('COMBAT.CHAT_FAILURE');
        }
        attackNumber =+ 1;
    }
    if(damageTot <= 0){
        damageTot = 0;
    }
    else{
        if(damageTot >= targetValue){
            targetDies = true;
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/skull.svg",
                effectDuration: 1
            });

        }
        if(functionStuff.isAlternativeDamage){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                attributeChange: damageTot*-1,
                attributeName: functionStuff.alternativeDamageAttribute
            });
        }else{
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            });
        }

        if(pain){
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/falling.svg",
                effectDuration: 1
            })
        }
    }

    if(printCorruption){
        let corruptionRoll= new Roll(corruptionDmgFormula).evaluate();
        corruptionChatResult = game.i18n.localize('COMBAT.CHAT_CORRUPTED_ATTACK') + corruptionRoll.total.toString();
        corruptionTooltip = new Handlebars.SafeString(await corruptionRoll.getTooltip());
        checkCorruptionThreshold(functionStuff.targetData.actor, corruptionRoll.total);
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            corruptionChange: corruptionRoll.total
        });
    }

    let introText = functionStuff.token.data.name + game.i18n.localize('COMBAT.CHAT_INTRO') + functionStuff.weapon.name;
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
    if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    let templateData = {
        rollData: rollData,
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.weapon.name + " ("+await weaponTypeLabel(functionStuff.weapon)+")",
        subImg: functionStuff.weapon.img,
        hasRoll: true,
        hasCorruption: false,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : await formatRollResult(rollData),
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
        printBleed: false,
        bleedChat: "",
        printFlaming: false,
        flamingChat: "",
        printCorruption: printCorruption,
        corruptionChatResult: corruptionChatResult,
        corruptionTooltip: corruptionTooltip
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    if(functionStuff.poison > 0 && !targetDies && damageTot > 0){

        templateData.poisonChatIntro = functionStuff.token.data.name + game.i18n.localize('COMBAT.CHAT_POISON') + functionStuff.targetData.token.data.name;
        let poisonDamage = "0";
        let poisonRounds = "0";
        let poisonedTimeLeft = 0;
        const effect = "icons/svg/poison.svg";
        switch (functionStuff.poison){
          case 1:
            if(functionStuff.attackFromPC){
              poisonDamage = "1d4";
              poisonRounds = "1d4";
            }
            else{
              poisonDamage = "2";
              poisonRounds = "2";
            };
            break;
          case 2:
            if(functionStuff.attackFromPC){
              poisonDamage = "1d6";
              poisonRounds = "1d6";
            }
            else{
              poisonDamage = "3";
              poisonRounds = "3";
            };
            break;
          case 3:
            if(functionStuff.attackFromPC){
              poisonDamage = "1d8";
              poisonRounds = "1d8";
            }
            else{
              poisonDamage = "4";
              poisonRounds = "4";
            };
            break;
        }
      
        let poisonRoll = await baseRoll(functionStuff.actor, "cunning", functionStuff.targetData.actor, "strong", 0, 0);
            
        if(!poisonRoll.hasSucceed){
            templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_FAILURE');     
        }
        else{
        let PoisonRoundsRoll= new Roll(poisonRounds).evaluate();
        let NewPoisonRounds = PoisonRoundsRoll.total;
        let poisonedEffectCounter = getEffect(functionStuff.targetData.token, effect);
        if(poisonedEffectCounter){
            //target already poisoned
            //get the number of rounds left
            if(game.modules.get("statuscounter")?.active){
                poisonedTimeLeft = await EffectCounter.findCounterValue(functionStuff.targetData.token, effect);  
                if(NewPoisonRounds > poisonedTimeLeft){
                    flagDataArray.push({
                        tokenId: functionStuff.targetData.token.id,
                        modifyEffectDuration: "icons/svg/poison.svg",
                        effectDuration: NewPoisonRounds
                    })
                
                    templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_EXTEND') + NewPoisonRounds.toString();
                }
                else{
                    templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_NOTEXTEND');
                }
            }
            else{templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_NOTEXTEND')}
          }
          else{
            //new poisonning  
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/poison.svg",
                effectDuration: NewPoisonRounds
            });
            templateData.poisonChatResult = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS1') + poisonDamage  + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS2')  + NewPoisonRounds.toString();
          }
        }
        templateData.printPoison = true;
        templateData.poisonRollString = await formatRollString(poisonRoll, functionStuff.targetData.hasTarget, 0);
        templateData.poisonRollResultString = await formatRollResult([poisonRoll]);
    }
    if(functionStuff.bleed > 0 && !targetDies && damageTot > 0){
        templateData.printBleed = true;
        templateData.bleedChat = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_BLEED') + "1d4";
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "icons/svg/blood.svg"
        });
    }
    if(functionStuff.weapon.qualities.flaming && hasDamage){
        let flamingRoundsRoll= 2;
        let flamingRounds = 2;
        let flamingDamage = " 2";
        if(functionStuff.attackFromPC){
            flamingRoundsRoll= new Roll("1d4").evaluate();
            flamingRounds = flamingRoundsRoll.total;
            flamingDamage = " 1d4"
        }
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "icons/svg/fire.svg",
            effectDuration: flamingRounds
        });
        templateData.printFlaming = true;
        templateData.flamingChat = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_FLAMING_SUCCESS1') + flamingDamage  + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS2')  + flamingRounds.toString();
    }
    const html = await renderTemplate("systems/symbaroum/template/chat/combat.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
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

async function standardPowerActivation(functionStuff) {
    if(functionStuff.targetData.hasTarget){
        try{functionStuff.targetData = getTarget(functionStuff.targetResitAttribute)} catch(error){
            if(functionStuff.targetMandatory){
                ui.notifications.error(error);
                return;
            }
            else {
                functionStuff.targetData = {hasTarget : false};
                await modifierDialog(functionStuff)
            }
        }
        if (functionStuff.targetData.resistAttributeName === "resolute"){
            let targetResMod = checkResoluteModifiers(functionStuff.targetData.actor, functionStuff.targetData.autoParams, true, functionStuff.checkTargetSteadfast);
            functionStuff.targetData.resistAttributeName = targetResMod.bestAttributeName;
            functionStuff.targetData.resistAttributeValue = targetResMod.bestAttributeValue;
            functionStuff.targetData.autoParams = targetResMod.autoParams;
            functionStuff.favour += -1*targetResMod.favour;
        } else if (functionStuff.targetData.resistAttributeName === "strong"){
            let targetResMod = checkResoluteModifiers(functionStuff.targetData.actor, functionStuff.targetData.autoParams, false, functionStuff.checkTargetSteadfast);
            functionStuff.favour += -1*targetResMod.favour;
            functionStuff.targetData.autoParams = targetResMod.autoParams;
        }
    }
    await modifierDialog(functionStuff)
}

async function standardAbilityActivation(functionStuff) {
    if(functionStuff.targetData.hasTarget){
        try{functionStuff.targetData = getTarget(functionStuff.targetResitAttribute)} catch(error){
            if(functionStuff.targetMandatory){
                ui.notifications.error(error);
                return;
            }
            else {
                functionStuff.targetData = {hasTarget : false}
            }
        }
    }

    await modifierDialog(functionStuff)
}

async function healing(healFormula, targetToken){
    let healRoll = new Roll(healFormula).evaluate();
    healRoll.toMessage();
    let healed = Math.min(healRoll.total, targetToken.actor.data.data.health.toughness.max - targetToken.actor.data.data.health.toughness.value);
    return({
        hasDamage : true,
        dmgFormula : game.i18n.localize('POWER_LAYONHANDS.CHAT_FINAL') + healFormula,
        damageText : game.i18n.localize('POWER_LAYONHANDS.CHAT_FINAL') + healed.toString(),
        damageTooltip : healRoll.result,
        flagData : {
            tokenId: targetToken.data._id,
            toughnessChange: healed
        }
    })
}

async function standardPowerResult(rollData, functionStuff){
    let flagDataArray = functionStuff.flagDataArray ?? [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText;
    let finalText = functionStuff.finalText ?? "";
    let subText = functionStuff.subText ?? functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")";
    if(functionStuff.isMaintained){
        introText = functionStuff.introTextMaintain ?? functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO_M') + functionStuff.ability.name + " \".";
    }
    else{
        introText = functionStuff.introText ?? functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO') + functionStuff.ability.name + " \".";
        if(functionStuff.corruption){
            haveCorruption = true;
            corruption = await getCorruption(functionStuff);
            corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
            checkCorruptionThreshold(functionStuff.actor, corruption.value);
            flagDataArray.push({
                tokenId: functionStuff.token.id,
                corruptionChange: corruption.value
            });
        }
    }

    let hasRoll = false;
    let hasSucceed = true;
    let rollString = "";
    let rollResult = "";
    if(rollData!=null){
        hasRoll = true;
        hasSucceed = rollData[0].hasSucceed;
        rollString = await formatRollString(rollData[0], functionStuff.targetData.hasTarget, functionStuff.modifier);
        rollResult = formatRollResult(rollData)
    }
    let resultText = functionStuff.resultTextSuccess ?? functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_SUCCESS');
    if(!hasSucceed){
        resultText = functionStuff.resultTextFail ?? functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_FAILURE');
    }
    let targetText = "";
    if(functionStuff.targetData.hasTarget){
        targetText = functionStuff.targetText ?? game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
        if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    }

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: subText,
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        rollString: rollString,
        rollResult: rollResult,
        resultText: resultText,
        finalText: finalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

/* if the power / ability have healing effects  */
    if(functionStuff.healFormulaSucceed && !functionStuff.medicusExam){
        let healResult;
        if(hasSucceed){
            healResult = await healing(functionStuff.healFormulaSucceed, functionStuff.healedToken); 
        }
        else if(!hasSucceed && functionStuff.healFormulaFailed){
            healResult = await healing(functionStuff.healFormulaFailed, functionStuff.healedToken); 
        }
        
        if(healResult){
            console.log(healResult)
            templateData.hasDamage = healResult.hasDamage;
            templateData.damageText = healResult.damageText;
            templateData.dmgFormula = healResult.dmgFormula;
            templateData.damageTooltip = healResult.damageTooltip;
            templateData.damageFinalText = "";
            flagDataArray.push(healResult.flagData);
        }
    }

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    if(functionStuff?.gmOnlyChatResult){
        let gmList =  ChatMessage.getWhisperRecipients('GM');
        if(gmList.length > 0){
            chatData.whisper = gmList
          }
    }
    let NewMessage = await ChatMessage.create(chatData);

    if(hasSucceed && (functionStuff.addTargetEffect.length >0)){
        for(let effect of functionStuff.addTargetEffect){
        flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: effect,
                effectDuration: 1
            });
        }
    }
    if(hasSucceed && (functionStuff.addCasterEffect.length >0)){
        for(let effect of functionStuff.addCasterEffect){
            modifyEffectOnToken(functionStuff.token, effect, 1, 1);
        }
    }
    if(hasSucceed && (functionStuff.removeTargetEffect.length >0)){
        for(let effect of functionStuff.removeTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(effectPresent){
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    removeEffect: effect
                });
            }
        }
    }
    if(hasSucceed && (functionStuff.removeCasterEffect.length >0)){ 
        for(let effect of functionStuff.removeCasterEffect){
            let effectPresent = getEffect(functionStuff.token, effect);
            if(effectPresent){
                modifyEffectOnToken(functionStuff.token, effect, 0, 1);
            }
        }
    }
    if(hasSucceed && !functionStuff.isMaintained && (functionStuff.activelyMaintaninedTargetEffect.length >0)){ 
        for(let effect of functionStuff.activelyMaintaninedTargetEffect){
        flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: effect,
                effectDuration: 1
            });
        }
    }
    if(!hasSucceed && functionStuff.isMaintained && (functionStuff.activelyMaintaninedTargetEffect.length >0)){ 
        for(let effect of functionStuff.activelyMaintaninedTargetEffect){
            let effectPresent = getEffect(functionStuff.targetData.token, effect);
            if(effectPresent){ 
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    removeEffect: effect
                });
            }
        }
    }

    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

// ********************************************* POWERS *****************************************************

async function anathemaPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        targetResitAttribute: "resolute",
        tradition: ["wizardry", "staffmagic", "theurgy"],
        checkMaintain: true,
        checkTargetSteadfast: true,
        introText: actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_INTRO'),
        resultTextSuccess: actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_SUCCESS'),
        resultTextFail: actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_FAILURE')
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    functionStuff.targetData.hasTarget = true,
    await standardPowerActivation(functionStuff)
}

async function brimstoneCascadePrepare(ability, actor) {
    // get target
    let targetData;
    try{targetData = getTarget("quick")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    //check wether acting token is player controlled
    //check rapid reflexes
    let targetHasRapidReflexes = false;
    let rrAbility = targetData.actor.items.filter(item => item.data.data.reference === "rapidreflexes");
    if(rrAbility.length != 0){
        targetHasRapidReflexes = true;
        targetData.autoParams += "Rapid Reflexes, ";
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        contextualDamage: true,
        tradition: ["wizardry"],
        targetHasRapidReflexes: targetHasRapidReflexes,
        targetData: targetData,
        resultFunction: brimstoneCascadeResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function brimstoneCascadeResult(rollData, functionStuff){

    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let flagDataArray = [];
    let pain = false;
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;

    let introText = functionStuff.actor.data.name + game.i18n.localize('POWER_BRIMSTONECASC.CHAT_INTRO');
    
    let resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_BRIMSTONECASC.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_BRIMSTONECASC.CHAT_FAILURE');
    }
    let targetText = "";
    if(functionStuff.targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
        if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    }
    let damageDice = "";
    if(rollData[0].hasSucceed){
        if(functionStuff.targetHasRapidReflexes){damageDice = "1d6"}
        else{damageDice = "1d12"}
    }
    else{
        if(functionStuff.targetHasRapidReflexes){damageDice = "0"}
        else{damageDice = "1d6"}
    }
    let damage = await simpleDamageRoll(functionStuff, damageDice);
    let damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());
    damageTot = damage.roll.total;
    pain = checkPainEffect(functionStuff, damage);
    damageRollResult += await formatRollResult([damage]);
    let dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;

    if(damageTot <= 0){
        damageTot = 0;
        damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
    }
    else if(damageTot > functionStuff.targetData.actor.data.data.health.toughness.value){
        damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
        damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            toughnessChange: damageTot*-1
        }, {
            tokenId: functionStuff.targetData.token.id,
            addEffect: "icons/svg/skull.svg",
            effectDuration: 1
        })
    }
    else{
        damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            toughnessChange: damageTot*-1
        })
        if(pain){
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/falling.svg",
                effectDuration: 1
            })
        }

    }
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        hasDamage: true,
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

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function bendWillPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, true);
    let favour = -1*targetResMod.favour;
    targetData.resistAttributeName = targetResMod.bestAttributeName;
    targetData.resistAttributeValue = targetResMod.bestAttributeValue;
    targetData.autoParams = targetResMod.autoParams;
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        favour: favour,
        targetMandatory : true,
        targetData: targetData,
        resultFunction: standardPowerResult,
        activelyMaintaninedTargetEffect: ["systems/symbaroum/asset/image/puppet.png"],
        combat: false,
        tradition: ["witchcraft", "wizardry"],
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    functionStuff.introText = functionStuff.actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO');
    functionStuff.introTextMaintain = functionStuff.actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO_M');
    functionStuff.resultTextSuccess = functionStuff.actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_SUCCESS') + functionStuff.targetData.token.data.name;
    functionStuff.resultTextFail = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_FAILURE');
    functionStuff.targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
    functionStuff.finalText = "";
    await modifierDialog(functionStuff)
}

async function blackBoltPrepare(ability, actor) {
    // get target
    let targetData;
    try{targetData = getTarget("quick")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        contextualDamage: true,
        targetData: targetData,
        resultFunction: blackBoltResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    functionStuff.dmgData.ignoreArm=true;
    await modifierDialog(functionStuff)
}

async function blackBoltResult(rollData, functionStuff){

    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let damageTooltip = "";
    let flagDataArray = [];
    let pain = false;
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let targetText = "";
    let dmgFormula = "";

    let introText = functionStuff.actor.data.name + game.i18n.localize('POWER_BLACKBOLT.CHAT_INTRO');
    if(functionStuff.targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
        if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    }
    let resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_BLACKBOLT.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_BLACKBOLT.CHAT_FAILURE');
    }
    else{
        let damageDice = "1d6";
        let damage = await simpleDamageRoll(functionStuff, damageDice);
        damageTot = damage.roll.total;
        pain = checkPainEffect(functionStuff, damage);
        damageRollResult += await formatRollResult([damage]);
        dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
        damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());

        if(damageTot <= 0){
            damageTot = 0;
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
        }
        else if(damageTot > functionStuff.targetData.actor.data.data.health.toughness.value){
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            }, {
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/skull.svg",
                effectDuration: 1
            })
        }
        else{
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            })
            if(pain){
                damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    addEffect: "icons/svg/falling.svg",
                    effectDuration: 1
                })
            }

        }
    }
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        hasDamage: true,
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

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function blessedshieldPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        isMaintained: false,
        combat: false,
        targetMandatory: false,
        checkMaintain: false,
        tradition: ["theurgy"],
        resultFunction: blessedshieldResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);

    if(functionStuff.powerLvl.level > 1){
        try{functionStuff.targets = getTargets(undefined, functionStuff.powerLvl.level-1)} catch(error){
        }
    }
    await modifierDialog(functionStuff)
}

async function blessedshieldResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        let corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : false,
        introText: functionStuff.actor.data.name + game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_INTRO'),
        introImg: functionStuff.actor.data.img,
        targetText: "",
        subText: functionStuff.ability.name + ", " + functionStuff.powerLvl.lvlName,
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: functionStuff.actor.data.name + game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_SUCCESS'),
        finalText: "",
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    };
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    if(rollData[0].hasSucceed){
        let protectionFormula = "1d" + (2 + (2*functionStuff.powerLvl.level));

        flagDataArray.push({
            tokenId: functionStuff.token.id,
            addEffect: "icons/svg/holy-shield.svg",
            effectDuration: 1
        },{
            tokenId: functionStuff.token.id,
            addObject: "blessedshield",
            protection: protectionFormula
        })
        templateData.finalText = functionStuff.actor.data.name + game.i18n.localize('POWER_BLESSEDSHIELD.PROTECTED') + " (" + protectionFormula + ")";

        if(functionStuff.targets){
            for(let target of functionStuff.targets){
                flagDataArray.push({
                    tokenId: target.token.id,
                    addEffect: "icons/svg/holy-shield.svg",
                    effectDuration: 1 
                },{
                    tokenId: target.token.id,
                    addObject: "blessedshield",
                    protection: protectionFormula
                })
                templateData.finalText += ", " + target.actor.data.name + game.i18n.localize('POWER_BLESSEDSHIELD.PROTECTED');
            }
        }
    }
    else{
        templateData.resultText = functionStuff.actor.data.name + game.i18n.localize('POWER_BLESSEDSHIELD.CHAT_FAILURE')
    }
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);

    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function confusionPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, true);
    let favour = -1*targetResMod.favour;
    targetData.resistAttributeName = targetResMod.bestAttributeName;
    targetData.resistAttributeValue = targetResMod.bestAttributeValue;
    targetData.autoParams = targetResMod.autoParams;
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        favour: favour,
        targetMandatory : true,
        targetData: targetData,
        resultFunction: confusionResult,
        combat: false,
        tradition: ["trollsinging", "wizardry"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function confusionResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText = "";
    let finalText = "";
    if(functionStuff.isMaintained)
    {
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO_M') + functionStuff.ability.name + " \".";
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO') + functionStuff.ability.name + " \".";
    }
    let resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_FAILURE');
    }
    else{
        let confusionRoll= new Roll("1d6").evaluate();
        finalText=confusionRoll.total.toString() + ": " + functionStuff.targetData.token.data.name;
        if(confusionRoll.total < 3){
            finalText += game.i18n.localize('POWER_CONFUSION.EFFECT12');
        }
        else if(confusionRoll.total < 5){
            finalText += game.i18n.localize('POWER_CONFUSION.EFFECT34');
        }
        else{
            finalText += game.i18n.localize('POWER_CONFUSION.EFFECT56');
        }
    }
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
    if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(rollData[0].hasSucceed && !functionStuff.isMaintained){
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "systems/symbaroum/asset/image/unknown-item.png",
            effectDuration: 1
        });
    }
    else if(!rollData[0].hasSucceed){   
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            removeEffect: "systems/symbaroum/asset/image/unknown-item.png"
        });
    }
    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function cursePrepare(ability, actor) {
    
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        targetData: targetData,
        resultFunction: curseResult,
        combat: false,
        tradition: ["witchcraft"],
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function curseResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText = "";
    let hasRoll;
    if(functionStuff.isMaintained){
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO_M');
        hasRoll = true;
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO');
        hasRoll = false;
        rollData[0].hasSucceed = true;
        if(functionStuff.corruption){
            haveCorruption = true;
            corruption = await getCorruption(functionStuff);
            corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
            checkCorruptionThreshold(functionStuff.actor, corruption.value);
            flagDataArray.push({
                tokenId: functionStuff.token.id,
                corruptionChange: corruption.value
            });
        }
    }
    let resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_N');
    if(functionStuff.powerLvl == 2){resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_A')}
    else if(functionStuff.powerLvl == 3){resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_M')}

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    if(!rollData[0].hasSucceed){
        templateData.resultText = functionStuff.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_FAILURE');
        templateData.finalText = game.i18n.localize('POWER_CURSE.CHAT_FAIL_FINAL') + functionStuff.targetData.token.data.name;
    }

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(!functionStuff.isMaintained){
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "icons/svg/sun.svg",
            effectDuration: 1
        });
    }
    else if(!rollData[0].hasSucceed){   
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            removeEffect: "icons/svg/sun.svg"
        })
    }
    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function dancingweapon(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        isMaintained: false,
        tradition: ["staffmagic", "trollsinging"],
        corruption: false
    };
    let functionStuff = Object.assign({}, fsDefault , specificStuff);

    if(!functionStuff.attackFromPC){
        functionStuff.gmOnlyChatResult = true
    }
    let flagData = await actor.getFlag(game.system.id, 'dancingweapon');
    if(flagData){
        await actor.unsetFlag(game.system.id, 'dancingweapon');
        functionStuff.introText = actor.name + game.i18n.localize('ABILITY_DANCINGWEAPON.CHAT_DESACTIVATE');
        functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_DANCINGWEAPON.CHAT_RESULT_DESACTIVATE');
        functionStuff.removeCasterEffect= ["systems/symbaroum/asset/image/powers/dancingweapon.svg"]
    }
    else{
        flagData = functionStuff.powerLvl.level;
        functionStuff.introText = actor.name + game.i18n.localize('ABILITY_DANCINGWEAPON.CHAT_ACTIVATE');
        await actor.setFlag(game.system.id, 'dancingweapon', flagData);
        functionStuff.addCasterEffect = ["systems/symbaroum/asset/image/powers/dancingweapon.svg"];
        functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_DANCINGWEAPON.CHAT_RESULT_ACTIVATE');
    }
    await standardPowerResult(null, functionStuff);
}

async function entanglingvinesPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("strong")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        targetMandatory : true,
        targetData: targetData,
        notResistWhenFirstCast: true,
        resultFunction: entanglingvinesResult,
        combat: false,
        tradition: ["witchcraft"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    let targetResMod = checkResoluteModifiers(functionStuff.targetData.actor, functionStuff.targetData.autoParams, false, true);
    functionStuff.favour += -1*targetResMod.favour;  
    await modifierDialog(functionStuff)
}

async function entanglingvinesResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText = "";
    let resultText;
    let finalText = "";
    let hasRoll = true;
    let finalDamage = 0;
    let rollString = "";
    if(functionStuff.isMaintained){
        introText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_INTRO_M');
        rollString = await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier)
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO') + functionStuff.ability.name + " \".";
        rollString = await formatRollString(rollData[0], false, rollData[0].modifier)
        if(functionStuff.corruption){
            haveCorruption = true;
            corruption = await getCorruption(functionStuff);
            corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
            checkCorruptionThreshold(functionStuff.actor, corruption.value);
            flagDataArray.push({
                tokenId: functionStuff.token.id,
                corruptionChange: corruption.value
            });
        }
    }
    if(rollData[0].hasSucceed){
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_SUCCESS');
        if(functionStuff.powerLvl.level == 3){
            //PC roll damage, NPCs do fixed damage = maximumdice/2

            if(functionStuff.attackFromPC){
                let damageRoll = new Roll("1d6").evaluate();
                damageRoll.toMessage();
                finalDamage = damageRoll.total;
            }
            else{
                finalDamage = 3;
            }
            finalText =  game.i18n.localize('COMBAT.DAMAGE') + finalDamage.toString();
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: finalDamage*-1
            });
        }
    }
    else{
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_ENTANGLINGVINES.CHAT_FAILURE');
    }

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        rollString: rollString,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};
    if(functionStuff.targetData.autoParams != ""){templateData.targetText += ", " + functionStuff.targetData.autoParams};


    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(!functionStuff.isMaintained && rollData[0].hasSucceed){
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "systems/symbaroum/asset/image/vines.png",
            effectDuration: 1
        });
    }
    else if(!rollData[0].hasSucceed){   
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            removeEffect: "systems/symbaroum/asset/image/vines.png",
        })
    }
    await createModifyTokenChatButton(flagDataArray);
}

async function holyAuraPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        resultFunction: holyAuraResult,
        tradition: ["theurgy"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff);
}

async function holyAuraResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : false,
        introText: functionStuff.actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_INTRO'),
        introImg: functionStuff.actor.data.img,
        targetText: "",
        subText: functionStuff.ability.name + ", " + functionStuff.powerLvl.lvlName,
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: functionStuff.actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_SUCCESS'),
        finalText: "",
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    };
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};

    if(rollData[0].hasSucceed){
        let auraDamage = "1d6";
        let auraHeal = "1d4";
        if(functionStuff.powerLvl.level == 2){auraDamage = "1d8"}
        else if(functionStuff.powerLvl.level == 3){auraDamage = "1d10"; auraHeal = "1d6"}
        
        let abTheurgy = functionStuff.actor.items.filter(item => item.data.data?.reference === "theurgy");
        if(abTheurgy.length > 0){
            if(abTheurgy[0].data.data.master.isActive){
                auraDamage += " + 1d4";
                auraHeal += " + 1d4";
            }
        }
        templateData.finalText  += game.i18n.localize('COMBAT.DAMAGE') + auraDamage;
        if(functionStuff.powerLvl.level > 1){
            templateData.finalText += game.i18n.localize('POWER_HOLYAURA.HEALING') + auraHeal;
        }
    }
    else{
        if(rollData[0].isMaintained){
            templateData.resultText = functionStuff.actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_FAILURE_M')
        }
        else{
            templateData.resultText = functionStuff.actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_FAILURE')
        };
    }
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);

    if(rollData[0].hasSucceed && !functionStuff.isMaintained){
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            addEffect: "icons/svg/aura.svg",
            effectDuration: 1
        })
    }
    else if(!rollData[0].hasSucceed && functionStuff.isMaintained){   
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            removeEffect: "icons/svg/aura.svg"
        })
    }
    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function inheritWound(ability, actor){
    let flagDataArray = [];
    let haveCorruption = true;
    let corruptionText = "";
    let corruption;
    let selectedToken;
    let attackFromPC = actor.hasPlayerOwner;
    try{selectedToken = getTokenId()} catch(error){      
        ui.notifications.error(error);
        return;
    }    
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "", true, false);
    let favour = 0;
    let castingAttributeName = actorResMod.bestAttributeName;

    let rollData = [];
    rollData.push(await baseRoll(actor, castingAttributeName, null, null, favour, 0));
    let healDice = "1d6";
    if(powerLvl.level >= 2){
        healDice = "1d8"
    }
    let tradition = ["witchcraft", "theurgy"];
    let casterMysticAbilities = await getMysticAbilities(actor);
    if(actor.data.data.health.corruption.max){
        corruption = await getCorruption({tradition: tradition, casterMysticAbilities: casterMysticAbilities, actor: actor, attackFromPC: attackFromPC});
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(actor, corruption.value);
        flagDataArray.push({
            tokenId: selectedToken.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + targetData.token.data.name,
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_SUCCESS'),
        finalText: "",
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    };
    if(actorResMod.autoParams != ""){templateData.subText += ", " + actorResMod.autoParams};
    
    if(rollData[0].hasSucceed){
        let healRoll = new Roll(healDice).evaluate();
        healRoll.toMessage();
        let healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);        
        let inheritDamage = healed;
        if(powerLvl.level >= 2){
            inheritDamage = Math.ceil(healed /2);
        }
        templateData.finalText += targetData.token.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_HEALED') + healed.toString() + ";\n" + actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_DAMAGE') + inheritDamage.toString();
        flagDataArray.push({
            tokenId: selectedToken.id,
            toughnessChange: inheritDamage*-1
        }, {
            tokenId: targetData.token.id,
            toughnessChange: healed
        });

        if(powerLvl.level >= 2){
            templateData.finalText += ";  Les poisons et saignements sont également redirigés."
            const pEffect = "icons/svg/poison.svg";
            let poisonedEffectCounter = await getEffect(targetData.token, pEffect);
            if(poisonedEffectCounter){
                //target  poisoned
                //get the number of rounds left
                let timeLeft = 1;
                if(game.modules.get("statuscounter")?.active){
                    timeLeft = await EffectCounter.findCounterValue(targetData.token, pEffect);
                }
                //set status to caster
                flagDataArray.push({
                    tokenId: selectedToken.id,
                    addEffect: "icons/svg/poison.svg",
                    effectDuration: timeLeft
                }, {
                    tokenId: targetData.token.id,
                    removeEffect: "icons/svg/poison.svg"
                })
            }
            const bEffect = "icons/svg/blood.svg";
            let bleedEffectCounter = await getEffect(targetData.token, bEffect);
            if(bleedEffectCounter){
                //get the number of rounds left
                let timeleft = 1;
                if(game.modules.get("statuscounter")?.active){
                    timeLeft = await EffectCounter.findCounterValue(targetData.token, bEffect);
                }
                //set status to caster
                flagDataArray.push({
                    tokenId: selectedToken.id,
                    addEffect: "icons/svg/blood.svg",
                    effectDuration: timeLeft
                }, {
                    tokenId: targetData.token.id,
                    removeEffect: "icons/svg/blood.svg"
                })
            }


        }
    }
    else{templateData.resultText = game.i18n.localize('POWER_INHERITWOUND.CHAT_FAILURE')}

    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function larvaeBoilsPrepare(ability, actor) {
 
    let targetData;
    try{targetData = getTarget("strong")} catch(error){      
        ui.notifications.error(error);
        return;
    } 
    let targetResMod = checkResoluteModifiers(targetData.actor, "", false, true);
    targetData.autoParams += targetResMod.autoParams;
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        favour: -1*targetResMod.favour,
        checkMaintain: true,
        contextualDamage: true,
        targetData: targetData,
        resultFunction: larvaeBoilsResult,
        tradition: ["witchcraft"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff)
    await modifierDialog(functionStuff)
}

async function larvaeBoilsResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText = "";
    let resultText;
    let finalText = "";
    let hasRoll;
    let finalDamage = 0;

    if(functionStuff.isMaintained){
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO_M');
        hasRoll = true;
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO');
        hasRoll = false;
        rollData[0].hasSucceed = true;
        if(functionStuff.corruption){
            haveCorruption = true;
            corruption = await getCorruption(functionStuff);
            corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
            checkCorruptionThreshold(functionStuff.actor, corruption.value);
            flagDataArray.push({
                tokenId: functionStuff.token.id,
                corruptionChange: corruption.value
            });
        }
    }
    if(rollData[0].hasSucceed){
        //PC roll damage, NPCs do fixed damage = maximumdice/2
        let effectDamage;
        if(functionStuff.powerLvl.level == 1){
            effectDamage = "1d4";
        }
        else if(functionStuff.powerLvl.level == 2){
            effectDamage = "1d6";
        }
        else{
            effectDamage = "1d8";
        }
        if(functionStuff.attackFromPC){
            let damageRoll = new Roll(effectDamage).evaluate();
            damageRoll.toMessage();
            finalDamage = damageRoll.total;
        }
        else{
            finalDamage
            let damageRoll= new Roll(effectDamage).evaluate({maximize: true});
            finalDamage = Math.ceil(damageRoll.total/2);
        }
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_SUCCESS');
        finalText =  game.i18n.localize('COMBAT.DAMAGE') + finalDamage.toString();
    }
    else{
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_FAILURE');
    }

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};
    if(functionStuff.targetData.autoParams != ""){templateData.targetText += ", " + functionStuff.targetData.autoParams};


    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(!functionStuff.isMaintained){
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            addEffect: "systems/symbaroum/asset/image/bug.png",
            effectDuration: 1
        }, {
            tokenId: functionStuff.targetData.token.id,
            toughnessChange: finalDamage*-1
        });
    }
    else if(!rollData[0].hasSucceed){   
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            removeEffect: "systems/symbaroum/asset/image/bug.png",
        })
    }else{
        flagDataArray.push({
            tokenId: functionStuff.targetData.token.id,
            toughnessChange: finalDamage*-1
        });
    }
    await createModifyTokenChatButton(flagDataArray);
}

async function layonhandsPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        combat: false,
        targetMandatory: true,
        checkMaintain: false,
        tradition: ["witchcraft", "theurgy"]
    }
    
    specificStuff.healFormulaSucceed = "1d6";
    if(fsDefault.powerLvl.level > 1){
        specificStuff.healFormulaSucceed = "1d8";
        specificStuff.removeTargetEffect = ["icons/svg/poison.svg", "icons/svg/blood.svg"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    if(functionStuff.casterMysticAbilities.theurgy.level == 3 || functionStuff.casterMysticAbilities.blessings.level == 3 ){
        functionStuff.healFormulaSucceed += " + 1d4";
    }

    try{functionStuff.targetData = getTarget()} catch(error){
        ui.notifications.error(error);
        return;
    }
    functionStuff.healedToken = functionStuff.targetData.token;
    functionStuff.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + functionStuff.targetData.token.data.name;

    if(fsDefault.powerLvl.level > 2){
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
                        if(functionStuff.casterMysticAbilities.theurgy.level == 3 || functionStuff.casterMysticAbilities.blessings.level == 3 ){
                            functionStuff.healFormulaSucceed += " + 1d4";
                        }
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
    else{
        modifierDialog(functionStuff);
    }
}

async function levitatePrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);

    let specificStuff = {
        checkMaintain: true,
        combat: false,
        targetMandatory: false,
        tradition: ["theurgy", "wizardry"],
        resultFunction: standardPowerResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);

    let targetData;
    if(functionStuff.powerLvl.level > 1){
        try{targetData = getTarget("strong")} catch(error){
            targetData = {hasTarget : false, leaderTarget: false}
        }
    }
    else{
        targetData = {hasTarget : false, leaderTarget: false}
    }
    if(targetData.hasTarget){
        functionStuff.addTargetEffect= ["icons/svg/wing.svg"]
    }
    else{
        functionStuff.addCasterEffect= ["icons/svg/wing.svg"]
    }
    functionStuff.targetData = targetData;
    await modifierDialog(functionStuff)
}

async function maltransformationPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, true);
    let favour = -1*targetResMod.favour;
    targetData.resistAttributeName = targetResMod.bestAttributeName;
    targetData.resistAttributeValue = targetResMod.bestAttributeValue;
    targetData.autoParams = targetResMod.autoParams;
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        favour: favour,
        targetMandatory : true,
        targetData: targetData,
        resultFunction: standardPowerResult,
        combat: false,
        activelyMaintaninedTargetEffect: ["systems/symbaroum/asset/image/frog.png"],
        tradition: ["witchcraft"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function mindthrowPrepare(ability, actor) {
    // get target
    let targetData;
    try{targetData = getTarget("quick")} catch(error){
        targetData = {hasTarget : false, leaderTarget: false}
    }

    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        contextualDamage: true,
        tradition: ["wizardry"],
        targetData: targetData,
        resultFunction: mindthrowResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    if(functionStuff.powerLvl.level>2){
        functionStuff.checkMaintain=true
    }
    await modifierDialog(functionStuff)
}

async function mindthrowResult(rollData, functionStuff){

    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let damageTooltip = "";
    let flagDataArray = [];
    let pain = false;
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let dmgFormula = "";
    let introText = "";
    let targetText = "";
    let resultText = "";

    if(functionStuff.isMaintained){
        introText = functionStuff.introTextMaintain ?? functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO_M') + functionStuff.ability.name + " \".";
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_INTRO') + functionStuff.ability.name + " \".";
    }
    if(!rollData[0].hasSucceed){
        resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_FAILURE');
    }
    else{
        resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_SUCCESS');
    }
    if(functionStuff.targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
        if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
        if (rollData[0].hasSucceed){
            let damageDice = "1d8";
            let damage = await simpleDamageRoll(functionStuff, damageDice);
            damageTot = damage.roll.total;
            pain = checkPainEffect(functionStuff, damage);
            damageRollResult += await formatRollResult([damage]);
            dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
            damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());

            if(damageTot <= 0){
                damageTot = 0;
                damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
            }
            else if(damageTot > functionStuff.targetData.actor.data.data.health.toughness.value){
                damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
                damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    toughnessChange: damageTot*-1
                }, {
                    tokenId: functionStuff.targetData.token.id,
                    addEffect: "icons/svg/skull.svg",
                    effectDuration: 1
                })
            }
            else{
                damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    toughnessChange: damageTot*-1
                })
                if(pain){
                    damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
                    flagDataArray.push({
                        tokenId: functionStuff.targetData.token.id,
                        addEffect: "icons/svg/falling.svg",
                        effectDuration: 1
                    })
                }
            }
        }
    }
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        hasDamage: functionStuff.targetData.hasTarget,
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

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function priosburningglassPrepare(ability, actor) {
    // get target
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        checkMaintain: true,
        contextualDamage: true,
        askCorruptedTarget: true,
        targetData: targetData,
        contextualDamage: true,
        resultFunction: priosburningglassResult
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function priosburningglassResult(rollData, functionStuff){

    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let damageTooltip = "";
    let flagDataArray = [];
    let pain = false;
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let hasDamage = false;
    let dmgFormula = "";
    let finalText = "";

    let introText = functionStuff.actor.data.name + game.i18n.localize('POWER_PRIOSBURNINGGLASS.CHAT_INTRO');
    
    let resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = functionStuff.actor.data.name + game.i18n.localize('POWER.CHAT_FAILURE');
    }
    let targetText = "";
    if(functionStuff.targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
        if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    }
    let damageDice = "";
    if(rollData[0].hasSucceed){
        hasDamage = true;
        if(functionStuff.powerLvl.level == 1){
            if(functionStuff.targetFullyCorrupted){damageDice = "1d8"}
            else{damageDice = "1d6"}
        }
        else{
            if(functionStuff.targetFullyCorrupted){damageDice = "1d12"}
            else{damageDice = "1d8"}
        }
        let damage = await simpleDamageRoll(functionStuff, damageDice);
        damageTot = damage.roll.total;
        pain = checkPainEffect(functionStuff, damage);
        damageRollResult += await formatRollResult([damage]);
        dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
        damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());

        if(damageTot <= 0){
            damageTot = 0;
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
        }
        else if(damageTot > functionStuff.targetData.actor.data.data.health.toughness.value){
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            }, {
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/skull.svg",
                effectDuration: 1
            })
        }
        else{
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            })
            if(pain){
                damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    addEffect: "icons/svg/falling.svg",
                    effectDuration: 1
                })
            }
        }
    }
    if(!functionStuff.isMaintained && functionStuff.corruption){
        haveCorruption = true;
        corruption = await getCorruption(functionStuff);
        corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
        checkCorruptionThreshold(functionStuff.actor, corruption.value);
        flagDataArray.push({
            tokenId: functionStuff.token.id,
            corruptionChange: corruption.value
        });
    }
    if((functionStuff.powerLvl.level == 3) && (functionStuff.targetFullyCorrupted)){
        finalText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_PRIOSBURNINGGLASS.CHAT_EXTRA');
    }
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText,
        hasDamage: hasDamage,
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

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function tormentingspiritsPrepare(ability, actor) { 
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let specificStuff = {
        combat: false,
        targetMandatory: true,
        checkMaintain: true,
        targetData: targetData,
        resultFunction: tormentingspiritsResult,
        tradition: ["witchcraft"],
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function tormentingspiritsResult(rollData, functionStuff){
    let flagDataArray = [];
    let haveCorruption = false;
    let corruptionText = "";
    let corruption;
    let introText = "";
    let resultText;
    let finalText = "";
    let hasRoll = true;
    let finalDamage = 0;

    if(functionStuff.isMaintained){
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_INTRO_M');
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_INTRO');
        if(functionStuff.corruption){
            haveCorruption = true;
            corruption = await getCorruption(functionStuff);
            corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
            checkCorruptionThreshold(functionStuff.actor, corruption.value);
            flagDataArray.push({
                tokenId: functionStuff.token.id,
                corruptionChange: corruption.value
            });
        }
    }
    if(rollData[0].hasSucceed){
        if(functionStuff.powerLvl.level > 1){
            //PC roll damage, NPCs do fixed damage = maximumdice/2
            let effectDamage;
            if(functionStuff.powerLvl.level == 2){
                effectDamage = "1d4";
            }
            else {
                effectDamage = "1d6";
            }
            if(functionStuff.attackFromPC){
                let damageRoll = new Roll(effectDamage).evaluate();
                finalDamage = damageRoll.total;
            }
            else{
                let damageRoll= new Roll(effectDamage).evaluate({maximize: true});
                finalDamage = Math.ceil(damageRoll.total/2);
            }
            finalText =  game.i18n.localize('COMBAT.DAMAGE') +" "+effectDamage+" = " + finalDamage.toString()+" ("+game.i18n.localize('ATTRIBUTE.RESOLUTE')+")" ;
        }
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_SUCCESS') + functionStuff.targetData.token.data.name;
    }
    else{
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('POWER_TORMENTINGSPIRITS.CHAT_FAILURE');
    }

    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: hasRoll,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText,
        haveCorruption: haveCorruption,
        corruptionText: corruptionText
    }
    if(functionStuff.autoParams != ""){templateData.subText += ", " + functionStuff.autoParams};
    if(functionStuff.targetData.autoParams != ""){templateData.targetText += ", " + functionStuff.targetData.autoParams};


    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(rollData[0].hasSucceed){
        if(functionStuff.powerLvl.level>1){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                attributeChange: finalDamage*-1,
                attributeName: "resolute"
            });
        }
        if(!functionStuff.isMaintained){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "systems/symbaroum/asset/image/ghost.svg",
                effectDuration: 1
            })
        }
    }
    else{
        if(!functionStuff.isMaintained){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                removeEffect: "systems/symbaroum/asset/image/ghost.svg",
            })
        }
    }
    await createModifyTokenChatButton(flagDataArray);
}

async function unnoticeablePrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        combat: false,
        targetMandatory: false,
        checkMaintain: false,
        tradition: ["wizardry", "theurgy"],
        addCasterEffect: ["systems/symbaroum/asset/image/invisible.png"]
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await standardPowerActivation(functionStuff);
}

// ********************************************* ABILITIES *****************************************************

async function simpleRollAbility(ability, actor) {
    let specificStuff = {
        castingAttributeName: "cunning"
    }
    switch (ability.data.data.reference){
        case "acrobatics":
            specificStuff.castingAttributeName = "quick";
            specificStuff.impeding = actor.data.data.combat.impeding;
        break;
        case "loremaster":
            specificStuff.introText = actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_INTRO');
            specificStuff.resultTextSuccess = actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_SUCCESS');
            specificStuff.resultTextFail = actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_FAILURE');
        break;
        case "quickdraw":
            specificStuff.castingAttributeName = "quick";
            specificStuff.impeding = actor.data.data.combat.impeding;
        break;
        case "shapeshifter":
            specificStuff.castingAttributeName = "resolute";
        break;
        case "wisdomages":
            specificStuff.castingAttributeName = "resolute";
        break;
    }
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await standardAbilityActivation(functionStuff)
}

async function berserker(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        isMaintained: false
    };
    let functionStuff = Object.assign({}, fsDefault , specificStuff);

    if(!functionStuff.attackFromPC){
        functionStuff.gmOnlyChatResult = true
    }
    let flagData = await actor.getFlag(game.system.id, 'berserker');
    if(flagData){
        await actor.unsetFlag(game.system.id, 'berserker');
        functionStuff.introText = actor.name + game.i18n.localize('ABILITY_BERSERKER.CHAT_DESACTIVATE');
        functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_DESACTIVATE');
        functionStuff.removeCasterEffect= ["systems/symbaroum/asset/image/berserker.svg"]
    }
    else{
        flagData = functionStuff.powerLvl.level;
        functionStuff.introText = actor.name + game.i18n.localize('ABILITY_BERSERKER.CHAT_ACTIVATE');
        await actor.setFlag(game.system.id, 'berserker', flagData);
        functionStuff.addCasterEffect = ["systems/symbaroum/asset/image/berserker.svg"];
        if(functionStuff.powerLvl.level == 2) functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL2');
        else if(functionStuff.powerLvl.level > 2) functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL3');
        else functionStuff.resultTextSuccess = game.i18n.localize('ABILITY_BERSERKER.CHAT_RESULT_LVL1');
    }
    await standardPowerResult(null, functionStuff);
}

async function dominatePrepare(ability, actor) {
    let powerLvl = getPowerLevel(ability);
    if (powerLvl.level<2){
        ui.notifications.error("Need dominate Adept level");
        return;
    }
    
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        castingAttributeName: "persuasive",
        targetMandatory: true,
        targetResitAttribute: "resolute",
        checkTargetSteadfast: true,
        checkMaintain: false,
        isMaintained: false,
        addTargetEffect: ["icons/svg/terror.svg"],
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    functionStuff.targetData = {hasTarget : true, leaderTarget: false}
    if(powerLvl.level == 2){
        functionStuff.introText = functionStuff.actor.data.name + game.i18n.localize('ABILITY_DOMINATE_ADEPT.CHAT_INTRO');
        functionStuff.resultTextSuccess = functionStuff.actor.data.name + game.i18n.localize('ABILITY_DOMINATE_ADEPT.CHAT_SUCCESS');
    }
    else{
        functionStuff.introText = functionStuff.actor.data.name + game.i18n.localize('ABILITY_DOMINATE_MASTER.CHAT_INTRO');
        functionStuff.resultTextSuccess = functionStuff.actor.data.name + game.i18n.localize('ABILITY_DOMINATE_MASTER.CHAT_SUCCESS');
    }
    await standardPowerActivation(functionStuff)
}

async function leaderPrepare(ability, actor) {

    let powerLvl = getPowerLevel(ability);
    if (powerLvl.level<2){
        ui.notifications.error("Need Leader Adept level");
        return;
    }
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        targetMandatory: true,
        targetData: targetData,
        checkTargetSteadfast: false,
        checkMaintain: false,
        isMaintained: false,
        addTargetEffect: ["icons/svg/eye.svg"],
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await standardPowerResult(null, functionStuff)
}

async function medicusPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        castingAttributeName: "cunning",
        combat: false,
        checkMaintain: false,
        medicus: true
    }
    specificStuff.healFormulaSucceed = "1d4";

    let functionStuff = Object.assign({}, fsDefault , specificStuff);

    try{functionStuff.targetData = getTarget()} catch(error){
    }
    if(functionStuff.targetData.hasTarget){
        functionStuff.healedToken = functionStuff.targetData.token;
        functionStuff.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + functionStuff.targetData.token.data.name;
        functionStuff.subText = functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")";
        if(functionStuff.powerLvl.level == 1){
            functionStuff.healFormulaSucceed = "1d4"
        }
        else if(functionStuff.powerLvl.level == 2){
            functionStuff.healFormulaSucceed = "1d6"
        }
        else{
            functionStuff.healFormulaSucceed = "1d8";
            functionStuff.healFormulaFailed = "1d4";
        }
    }
    else functionStuff.medicusExam = true;
    modifierDialog(functionStuff);
}

async function recoveryPrepare(ability, actor) {
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        combat: false,
        isMaintained: false,
        castingAttributeName: "resolute"
    }
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    functionStuff.healedToken = functionStuff.token;

    if(functionStuff.powerLvl.level == 2) {functionStuff.healFormulaSucceed = "1d6"}
    else if(functionStuff.powerLvl.level == 3) {functionStuff.healFormulaSucceed = "1d8"}
    else {functionStuff.healFormulaSucceed = "1d4"}
    await standardAbilityActivation(functionStuff)
}

async function stranglerPrepare(ability, actor) {

    let stranglerDialogTemplate = `
    <h1> ${game.i18n.localize('DIALOG.ISMAINTAINED')} </h1>
    `;
    new Dialog({
        title: ability.name, 
        content: stranglerDialogTemplate,
        buttons: {
            firstAttack: {
                label: game.i18n.localize('DIALOG.CASTING'),
                callback: (html) => {                 
                    stranglerPrepared(ability, actor, false);
                }
            }, 

            maintained: {
                label: game.i18n.localize('DIALOG.MAINTAINING'), 
                callback: (html) => {
                    stranglerPrepared(ability, actor, true);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}

async function stranglerPrepared(ability, actor, maintained) {
    // get target
    let targetData;
    let specificStuff = {
        askCastingAttribute: true,
        checkMaintain: false,
        contextualDamage: false,
        castingAttributeName: null,
        isMaintained: maintained,
        resultFunction: stranglerResult
    }
    if(maintained){
        try{targetData = getTarget("cunning")} catch(error){      
            ui.notifications.error(error);
            return;
        }
        specificStuff.askCastingAttribute = false;
        specificStuff.castingAttributeName = "cunning";
    }
    else{
        try{targetData = getTarget("defense")} catch(error){      
            ui.notifications.error(error);
            return;
        }
    }
    specificStuff.targetData = targetData;
    let fsDefault = await buildFunctionStuffDefault(ability, actor)
    let functionStuff = Object.assign({}, fsDefault , specificStuff);
    await modifierDialog(functionStuff)
}

async function stranglerResult(rollData, functionStuff){
    let resultText = "";
    let damage;
    let damageTot = 0;
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let damageTooltip = "";
    let flagDataArray = [];
    let dmgFormula="";
    let pain = false;
    let hasDamage = true;
    
    let introText = "";
    if(!functionStuff.isMaintained){
        introText = functionStuff.actor.data.name + game.i18n.localize('ABILITY_STRANGLER.CHAT_INTRO');
    }
    else{
        introText = functionStuff.actor.data.name + game.i18n.localize('ABILITY_STRANGLER.CHAT_INTRO_M');
    }

    if(rollData[0].hasSucceed){
        resultText = functionStuff.actor.data.name + game.i18n.localize('ABILITY_STRANGLER.CHAT_SUCCESS');
        functionStuff.dmgData.hasAdvantage = false; //to prevent +1d4 damage
        functionStuff.dmgData.ignoreArm=true;
        damage = await simpleDamageRoll(functionStuff, "1d6");
        damageTot = damage.roll.total;
        pain = checkPainEffect(functionStuff, damage);
        damageRollResult += await formatRollResult([damage]);
        dmgFormula = game.i18n.localize('WEAPON.DAMAGE') + ": " + damage.roll._formula;
        damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());
    
        if(damageTot <= 0){
            damageTot = 0;
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
        }
        else if(damageTot > functionStuff.targetData.actor.data.data.health.toughness.value){
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            }, {
                tokenId: functionStuff.targetData.token.id,
                addEffect: "icons/svg/skull.svg",
                effectDuration: 1
            })
        }
        else{
            damageText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                toughnessChange: damageTot*-1
            })
            if(pain){
                damageFinalText = functionStuff.targetData.token.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
                flagDataArray.push({
                    tokenId: functionStuff.targetData.token.id,
                    addEffect: "icons/svg/falling.svg",
                    effectDuration: 1
                })
            }
    
        }
        if(!functionStuff.isMaintained){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                addEffect: "systems/symbaroum/asset/image/lasso.png",
                effectDuration: 1
            })
        }
    }
    else{
        resultText = functionStuff.targetData.token.data.name + game.i18n.localize('ABILITY_STRANGLER.CHAT_FAILURE');
        hasDamage = false;
        if(functionStuff.isMaintained){
            flagDataArray.push({
                tokenId: functionStuff.targetData.token.id,
                removeEffect: "systems/symbaroum/asset/image/lasso.png"
            })
        }
    }
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + functionStuff.targetData.token.data.name;
    if (functionStuff.targetData.autoParams != ""){targetText += ": " + functionStuff.targetData.autoParams}
    let templateData = {
        targetData : functionStuff.targetData,
        hasTarget : functionStuff.targetData.hasTarget,
        introText: introText,
        introImg: functionStuff.actor.data.img,
        targetText: targetText,
        subText: functionStuff.ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: functionStuff.ability.img,
        hasRoll: true,
        rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
        rollResult : await formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        hasDamage: hasDamage,
        damageText: damageText,
        damageRollResult: damageRollResult,
        dmgFormula: dmgFormula,
        damageRollMod: "",
        damageTooltip: damageTooltip,
        damageFinalText: damageFinalText,
        haveCorruption: false
    }

    const chathtml = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: chathtml,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function witchsight(ability, actor) {
    let selectedToken;
    try{selectedToken = getTokenId()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let targets = Array.from(game.user.targets);
    let targetData;
    let isTargeted = false;
    let rollData = [];
    if(targets.length != 0){
      isTargeted = true;
      try{targetData = getTarget("discreet")} catch(error){
        throw error;
        };
        rollData.push(await baseRoll(actor, "vigilant", targetData.actor, "discreet", 0, 0));
    }
    else {
        targetData = {hasTarget: false, leaderTarget: false};
        rollData.push(await baseRoll(actor, "vigilant", null, null, 0, 0))}
        let powerLvl = getPowerLevel(ability);

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${game.i18n.localize(rollData[0].actingAttributeLabel)} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_SUCCESS'),
        finalText: "",
        haveCorruption: true,
        corruptionText: ""
    };
    if(targetData.hasTarget){
        templateData.targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.token.data.name;
        if(rollData[0].hasSucceed){
            templateData.finalText = game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL1') + targetData.token.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL2') +  targetData.actor.data.data.bio.shadow;
        }
    }
    let corruptionFormula = "1d1";
    if(powerLvl.level == 2) corruptionFormula = "1d4";
    if(powerLvl.level > 2) corruptionFormula = "1d6";

    let corruptionRoll = new Roll(corruptionFormula).evaluate();
    corruptionRoll.toMessage();
    templateData.corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruptionRoll.total.toString();

    if(!rollData[0].hasSucceed){templateData.resultText = actor.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FAILURE')}
    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user.id,
        content: html,
    }

    await ChatMessage.create(chatData);
    let flagData = {
        tokenId: selectedToken.data.id,
        corruptionChange: corruptionRoll.total
    }
    checkCorruptionThreshold(actor, corruptionRoll.total);

    await createModifyTokenChatButton([flagData]);
}

// ********************************************* TRAITS *****************************************************

async function regeneration(ability, actor){
    let fsDefault = await buildFunctionStuffDefault(ability, actor);
    let specificStuff = {
        isMaintained: false
    };
    let functionStuff = Object.assign({}, fsDefault , specificStuff);


    functionStuff.introText = actor.name + game.i18n.localize('TRAIT_REGENERATION.CHAT_ACTION');
    
    let regenTotal = 0;

    if(!functionStuff.attackFromPC){
        functionStuff.gmOnlyChatResult = true;
        regenTotal = 1+functionStuff.powerLvl.level;
        functionStuff.introText += "("+regenTotal.toString()+" " + game.i18n.localize('HEALTH.TOUGHNESS') +").";
    }
    else{
        let regenDice = 2+ 2*functionStuff.powerLvl.level;
        let regenFormula = "1d" + regenDice.toString();
        let dmgRoll= new Roll(regenFormula).evaluate();
        functionStuff.introText += "("+regenFormula+" " + game.i18n.localize('HEALTH.TOUGHNESS') +").";
        regenTotal = dmgRoll.total;
    }
    functionStuff.resultTextSuccess = actor.name + game.i18n.localize('TRAIT_REGENERATION.CHAT_ACTION') + regenTotal.toString() + " " + game.i18n.localize('HEALTH.TOUGHNESS') +".";;

    functionStuff.flagDataArray = [{
        tokenId: functionStuff.token.data._id,
        toughnessChange: regenTotal
    }];
    await standardPowerResult(null, functionStuff);
}