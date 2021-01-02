import { rollAttribute } from './roll.js';

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
            user: game.user._id,
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
}

export async function activateAbility(ability, actor){
    const powerName = ability.data.data.reference;    
    if(powerName == undefined || powerName === ""){
        /* No reference for a system ability on this item, ask for one */
        if(ability.data.type == "ability"){
            await affectReferenceOnAbility(ability);
        }
        else if(ability.data.type == "mysticalPower"){
            await affectReferenceOnPower(ability);
        }
        else{return}
    }
    else{
        if(actor != null){
            switch (powerName) {
                case 'none':
                    return;
                break;
/*                case 'bend will':
                    try{bendWill(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;*/
                case 'loremaster':
                    try{loremaster(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;
                case 'medicus':
                    try{medicus(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                    };
                break;
                default:
                    ui.notifications.error("Not yet implemented");
            }
        }
    }
}

/* affect reference for a system ability on this item */
async function affectReferenceOnAbility(ability){
    const abilitiesList = [
        {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},
        {label: game.i18n.localize('ABILITY_LABEL.ACROBATICS'), value: "acrobatics"},
        {label: game.i18n.localize('ABILITY_LABEL.ALCHEMY'), value: "alchemy "},
        {label: game.i18n.localize('ABILITY_LABEL.AGILE_COMBAT'), value: "agile combat"},
        {label: game.i18n.localize('ABILITY_LABEL.ARMORED_MYSTIC'), value: "armored mystic"},
        {label: game.i18n.localize('ABILITY_LABEL.ARROW_JAB'), value: "arrow jab"},
        {label: game.i18n.localize('ABILITY_LABEL.ARTIFACT_CRAFTING'), value: "artifact crafting"},
        {label: game.i18n.localize('ABILITY_LABEL.AXE_ARTIST'), value: "axe artist "},
        {label: game.i18n.localize('ABILITY_LABEL.BACKSTAB'), value: "backstab "},
        {label: game.i18n.localize('ABILITY_LABEL.BEAST_LORE'), value: "beast lore "},
        {label: game.i18n.localize('ABILITY_LABEL.BERSERKER'), value: "berserker "},
        {label: game.i18n.localize('ABILITY_LABEL.BLACKSMITH'), value: "blacksmith all"},
        {label: game.i18n.localize('ABILITY_LABEL.BLOOD_COMBAT'), value: "blood combat"},
        {label: game.i18n.localize('ABILITY_LABEL.BODYGUARD'), value: "bodyguard "},
        {label: game.i18n.localize('ABILITY_LABEL.CHANNELING'), value: "channeling "},
        {label: game.i18n.localize('ABILITY_LABEL.CHEAP_SHOT'), value: "cheap shot "},
        {label: game.i18n.localize('ABILITY_LABEL.DOMINATE'), value: "dominate"},
        {label: game.i18n.localize('ABILITY_LABEL.ENSNARE'), value: "ensnare"},
        {label: game.i18n.localize('ABILITY_LABEL.EQUESTRIAN'), value: "equestrian"},
        {label: game.i18n.localize('ABILITY_LABEL.EX_ATTRIBUTE'), value: "exceptional attribute"},
        {label: game.i18n.localize('ABILITY_LABEL.FEAT_STRENGTH'), value: "feat of strength"},
        {label: game.i18n.localize('ABILITY_LABEL.FEINT'), value: "feint "},
        {label: game.i18n.localize('ABILITY_LABEL.FLAILER'), value: "flailer"},
        {label: game.i18n.localize('ABILITY_LABEL.HAMMER_RHYTHM'), value: "hammer rhythm"},
        {label: game.i18n.localize('ABILITY_LABEL.HUNTER_INSTINCT'), value: "hunter’s instinct"},
        {label: game.i18n.localize('ABILITY_LABEL.IRON_FIST'), value: "iron fist "},
        {label: game.i18n.localize('ABILITY_LABEL.KNIFE_PLAY'), value: "knife play "},
        {label: game.i18n.localize('ABILITY_LABEL.LEADER'), value: "leader"},
        {label: game.i18n.localize('ABILITY_LABEL.LOREMASTER'), value: "loremaster "},
        {label: game.i18n.localize('ABILITY_LABEL.MAN-AT-ARMS'), value: "man-at-arms "},
        {label: game.i18n.localize('ABILITY_LABEL.MANTLE_DANCE'), value: "mantle dance"},
        {label: game.i18n.localize('ABILITY_LABEL.MARKSMAN'), value: "marksman"},
        {label: game.i18n.localize('ABILITY_LABEL.MEDICUS'), value: "medicus "},
        {label: game.i18n.localize('ABILITY_LABEL.NATURAL_WARRIOR'), value: "natural warrior"},
        {label: game.i18n.localize('ABILITY_LABEL.OPPORTUNIST'), value: "opportunist"},
        {label: game.i18n.localize('ABILITY_LABEL.POISONER'), value: "poisoner "},
        {label: game.i18n.localize('ABILITY_LABEL.POLEARM_MASTERY'), value: "polearm mastery"},
        {label: game.i18n.localize('ABILITY_LABEL.PYROTECHNICS'), value: "pyrotechnics"},
        {label: game.i18n.localize('ABILITY_LABEL.QUICK_DRAW'), value: "quick draw"},
        {label: game.i18n.localize('ABILITY_LABEL.RAPID_FIRE'), value: "rapid fire "},
        {label: game.i18n.localize('ABILITY_LABEL.RAPID_REFLEXES'), value: "rapid reflexes"},
        {label: game.i18n.localize('ABILITY_LABEL.RECOVERY'), value: "recovery"},
        {label: game.i18n.localize('ABILITY_LABEL.RITUALIST'), value: "ritualist"},
        {label: game.i18n.localize('ABILITY_LABEL.RUNE_TATTOO'), value: "rune tattoo "},
        {label: game.i18n.localize('ABILITY_LABEL.SHIELD_FIGHTER'), value: "shield fighter "},
        {label: game.i18n.localize('ABILITY_LABEL.SIEGE_EXPERT'), value: "siege expert"},
        {label: game.i18n.localize('ABILITY_LABEL.SIXTH_SENSE'), value: "sixth sense"},
        {label: game.i18n.localize('ABILITY_LABEL.SORCERY'), value: "sorcery"},
        {label: game.i18n.localize('ABILITY_LABEL.STAFF_FIGHTING'), value: "staff fighting "},
        {label: game.i18n.localize('ABILITY_LABEL.STAFF_MAGIC'), value: "staff magic"},
        {label: game.i18n.localize('ABILITY_LABEL.STEADFAST'), value: "steadfast"},
        {label: game.i18n.localize('ABILITY_LABEL.STEEL_THROW'), value: "steel throw"},
        {label: game.i18n.localize('ABILITY_LABEL.STRANGLER'), value: "strangler "},
        {label: game.i18n.localize('ABILITY_LABEL.STRONG_GIFT'), value: "strong gift"},
        {label: game.i18n.localize('ABILITY_LABEL.SWORD_SAINT'), value: "sword saint "},
        {label: game.i18n.localize('ABILITY_LABEL.SYMBOLISM'), value: "symbolism"},
        {label: game.i18n.localize('ABILITY_LABEL.TACTICIAN'), value: "tactician "},
        {label: game.i18n.localize('ABILITY_LABEL.THEURGY'), value: "theurgy"},
        {label: game.i18n.localize('ABILITY_LABEL.TRAPPER'), value: "trapper "},
        {label: game.i18n.localize('ABILITY_LABEL.TRICK_ARCHERY'), value: "trick archery"},
        {label: game.i18n.localize('ABILITY_LABEL.TROLL_SINGING'), value: "troll singing"},
        {label: game.i18n.localize('ABILITY_LABEL.TWIN_ATTACK'), value: "twin attack"},
        {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FORCE'), value: "two-handed force "},
        {label: game.i18n.localize('ABILITY_LABEL.WITCHCRAFT'), value: "witchcraft"},
        {label: game.i18n.localize('ABILITY_LABEL.WITCHSIGHT'), value: "witchsight "},
        {label: game.i18n.localize('ABILITY_LABEL.WIZARDRY'), value: "wizardry"},
        {label: game.i18n.localize('ABILITY_LABEL.WRESTLING'), value: "wrestling "},
    ];
    let referenceOptions = "";
    for(let referenceEntry of abilitiesList){
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
                    ability.update({"data.reference": selectedRef});
                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true);
}

/* affect reference for a system ability on this item */
async function affectReferenceOnPower(ability){
    const abilitiesList = [
        {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},        
        {label: game.i18n.localize('POWER_LABEL.ANATHEMA'), value: "anathema"},
        {label: game.i18n.localize('POWER_LABEL.BANISHING_SEAL'), value: "banishing seal"},
        {label: game.i18n.localize('POWER_LABEL.BEND_WILL'), value: "bend will"},
        {label: game.i18n.localize('POWER_LABEL.BLACK_BOLT'), value: "black bolt"},
        {label: game.i18n.localize('POWER_LABEL.BLACK_BREATH'), value: "black breath"},
        {label: game.i18n.localize('POWER_LABEL.BLESSED_SHIELD'), value: "blessed shield"},
        {label: game.i18n.localize('POWER_LABEL.BLINDING_SYMBOL'), value: "blinding symbol"},
        {label: game.i18n.localize('POWER_LABEL.BRIMSTONE_CASCADE'), value: "brimstone cascade"},
        {label: game.i18n.localize('POWER_LABEL.COMBAT_HYMN'), value: "combat hymn"},
        {label: game.i18n.localize('POWER_LABEL.CONFUSION'), value: "confusion"},
        {label: game.i18n.localize('POWER_LABEL.CURSE'), value: "curse"},
        {label: game.i18n.localize('POWER_LABEL.DANCING_WEAPON'), value: "dancing weapon"},
        {label: game.i18n.localize('POWER_LABEL.DRAINING_GLYPH'), value: "draining glyph"},
        {label: game.i18n.localize('POWER_LABEL.ENTANGLING_VINES'), value: "entangling vines"},
        {label: game.i18n.localize('POWER_LABEL.EXORCIZE'), value: "exorcize"},
        {label: game.i18n.localize('POWER_LABEL.FIRE_SOUL'), value: "fire soul"},
        {label: game.i18n.localize('POWER_LABEL.FLAME_WALL'), value: "flame wall"},
        {label: game.i18n.localize('POWER_LABEL.HEROIC_HYMN'), value: "heroic hymn"},
        {label: game.i18n.localize('POWER_LABEL.HOLY_AURA'), value: "holy aura"},
        {label: game.i18n.localize('POWER_LABEL.ILLUSORY_CORRECTION'), value: "illusory correction"},
        {label: game.i18n.localize('POWER_LABEL.INHERIT_WOUND'), value: "inherit wound"},
        {label: game.i18n.localize('POWER_LABEL.LARVAE_BOILS'), value: "larvae boils"},
        {label: game.i18n.localize('POWER_LABEL.LAY_ON_HANDS'), value: "lay on hands"},
        {label: game.i18n.localize('POWER_LABEL.LEVITATE'), value: "levitate"},
        {label: game.i18n.localize('POWER_LABEL.LIFEGIVER'), value: "lifegiver"},
        {label: game.i18n.localize('POWER_LABEL.MALTRANSFORMATION'), value: "maltransformation"},
        {label: game.i18n.localize('POWER_LABEL.MIND-THROW'), value: "mind-throw"},
        {label: game.i18n.localize('POWER_LABEL.MIRRORING'), value: "mirroring"},
        {label: game.i18n.localize('POWER_LABEL.NATURES_EMBRACE'), value: "natures embrace"},
        {label: game.i18n.localize('POWER_LABEL.PRIOS_BURNING_GLASS'), value: "prios burning glass"},
        {label: game.i18n.localize('POWER_LABEL.PROTECTIVE_RUNES'), value: "protective runes"},
        {label: game.i18n.localize('POWER_LABEL.PSYCHIC_THRUST'), value: "psychic thrust"},
        {label: game.i18n.localize('POWER_LABEL.PURGATORY'), value: "purgatory"},
        {label: game.i18n.localize('POWER_LABEL.RETRIBUTION'), value: "retribution"},
        {label: game.i18n.localize('POWER_LABEL.REVENANT_STRIKE'), value: "revenant strike"},
        {label: game.i18n.localize('POWER_LABEL.SHAPESHIFT'), value: "shapeshift"},
        {label: game.i18n.localize('POWER_LABEL.SPHERE'), value: "sphere"},
        {label: game.i18n.localize('POWER_LABEL.SPIRIT_WALK'), value: "spirit walk"},
        {label: game.i18n.localize('POWER_LABEL.STAFF_PROJECTILE'), value: "staff projectile"},
        {label: game.i18n.localize('POWER_LABEL.STORM_ARROW'), value: "storm arrow"},
        {label: game.i18n.localize('POWER_LABEL.TELEPORT'), value: "teleport"},
        {label: game.i18n.localize('POWER_LABEL.THORN_CLOAK'), value: "thorn cloak"},
        {label: game.i18n.localize('POWER_LABEL.TORMENTING_SPIRITS'), value: "tormenting spirits"},
        {label: game.i18n.localize('POWER_LABEL.TRUE_FORM'), value: "true form"},
        {label: game.i18n.localize('POWER_LABEL.UNHOLY_AURA'), value: "unholy aura"},
        {label: game.i18n.localize('POWER_LABEL.UNNOTICEABLE'), value: "unnoticeable"},
        {label: game.i18n.localize('POWER_LABEL.WEAKENING_HYMN'), value: "weakening hymn"},
        {label: game.i18n.localize('POWER_LABEL.WILD_HUNT'), value: "wild hunt"},
        {label: game.i18n.localize('POWER_LABEL.WITCH_HAMMER'), value: "witch hammer"}
    ];
    let referenceOptions = "";
    for(let referenceEntry of abilitiesList){
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
                    ability.update({"data.reference": selectedRef});
                }
            }, 
            close: {
                label: "Close"
            }
        }
    }).render(true);
}


//get the target token, its actor, and evaluate which attribute this actor will use for opposition
function getTarget(targetAttributeName) {
    let targets = Array.from(game.user.targets)
    if(targets.length == 0 || targets.length > 1 ){
      throw game.i18n.localize('ABILITY_ERROR.TARGET');
    }
    let targetToken = targets[0];
    let targetActor = targets[0].actor;

     // get target opposition attribute
    let resistAttribute = null;
    if(targetAttributeName != undefined)
    {
        resistAttribute = targetActor.data.data.attributes[targetAttributeName];
        resistValue = targetActor.data.data.attributes[targetAttributeName].value;
        if(targetAttributeName == "resolute")
        {
            let hasLeader = targetActor.items.filter(item => item.data?.reference === "Leader");
            if(hasLeader.length > 0){
                let persuasiveV = targetActor.data.data.attributes["persuasive"].value;
                if(resistValue < persuasiveV) {
                    resistAttribute = targetActor.data.data.attributes["persuasive"];
                }
            }
        }
    }
    return{
        haveTarget : true,
        token : targetToken,
        actor : targetActor,
        resistAttribute : resistAttribute
    }
}

//get the max level learned by the actor
function getPowerLevel(ability){
    let powerLvl = 1;
    let lvlName = game.i18n.localize('ABILITY.NOVICE');
    if(ability.data.data.master.isActive){
        powerLvl = 3;
        lvlName = game.i18n.localize('ABILITY.MASTER');
    }
    else if(ability.data.data.adept.isActive){
        powerLvl = 2;
        lvlName = game.i18n.localize('ABILITY.ADEPT');
    }
    return{level : powerLvl, lvlName : lvlName}
}

// WIP
function bendWill(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let powerLvl = getPowerLevel(ability);

    let usedAttribute = actor.data.data.attributes["resolute"];
    let bonus = actor.data.data.bonus["resolute"];
    let useLeader = false;
    let attributeValue = usedAttribute.value;
    let hasLeader = actor.items.filter(item => item.data?.reference === "Leader");
    if(hasLeader.length > 0){
        let persuasiveV = actor.data.data.attributes["persuasive"].value + actor.data.data.bonus["persuasive"];
        if(attributeValue + bonus < persuasiveV) {
            usedAttribute = actor.data.data.attributes["persuasive"];
            attributeValue = usedAttribute.value;
            bonus = actor.data.data.bonus["persuasive"];
            useLeader = true;
        }
    }
    /*
    const attributeData = {name: game.i18n.localize(usedAttribute.label), value: attributeValue + bonus};
    const targetAttributeData = { value: 10, name: "custom" }
    let rollData = await rollAttribute(actor, attributeData, 0, { value: 10, name: "custom" }, null, null, null);
    console.log(rollData);
    let healed = 0;
    if(rollData.hasSucceed){
    
    let rolled = rollPwr(selectedActor, Pwr, powerLvl, rollData, targetData);
    rolled.toMessage();
    let effectChatMessage = "";
    // if the actor performing the action is a player
    if (selectedActor.hasPlayerOwner){

        let difficulty = rollData.selectedAttribute.value - targetData.resistValue + 10 + rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${selectedActor.data.name} parvient à imposer sa volonté à ${targetData.actor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${selectedActor.data.name} ne parvient pas à vaincre briser la volonté de ${targetData.actor.data.name}.</p>
                `
        }
    }
    else{
        let difficulty = targetData.resistValue - rollData.selectedAttribute.value + 10 - rollData.modifier;
        effectChatMessage =`
        <p> Difficulté = ${difficulty}</p> 
        `;      
        if(rolled.total <= difficulty){
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} parvient à résister à la tentative de soumission par ${selectedActor.data.name}.</p>
                `
        }
        else{
            effectChatMessage +=`
                <p> ${targetData.actor.data.name} est contrôlé par ${selectedActor.data.name}.</p>
                `
        }
    }
    ChatMessage.create({
        speaker: {
        alias: selectedActor.name
        },
        content: effectChatMessage
    })*/
}

async function loremaster(ability, actor) {
    
    let targetData = {haveTarget : false};
    let powerLvl = getPowerLevel(ability);
    const attribute = actor.data.data.attributes["cunning"];
    const bonus = actor.data.data.bonus["cunning"];
    const attributeData = {name: game.i18n.localize(attribute.label), value: attribute.value + bonus};
    let rollData = await rollAttribute(actor, attributeData, 0, { value: 10, name: "None" }, null, null, null);

    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        rollString: rollData.name,
        rollResult : game.i18n.localize('ABILITY.ROLL_RESULT') + rollData.diceResult.toString(),
        resultText: actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_SUCCESS'),
        finalText: ""
    }; 
    if(!rollData.hasSucceed){templateData.resultText = game.i18n.localize('ABILITY_LOREMASTER.CHAT_FAILURE')};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
}

function medicus(ability, actor) {

    let targetData = {haveTarget : false};
    try{targetData = getTarget()} catch(error){
    };
    let hCureDialogTemplate = `
    <h1> ${game.i18n.localize('ABILITY_MEDICUS.DIALOG')} </h1>
    `;
    let herbalCure = false;
    let healFormula = "1d4";
    let healFormulaMasterFailed = "1d4";
    let powerLvl = getPowerLevel(ability);

    new Dialog({
        title: game.i18n.localize('ABILITY_MEDICUS.HERBALCURE'), 
        content: hCureDialogTemplate,
        buttons: {
            chooseRem: {
                label: game.i18n.localize('ABILITY_MEDICUS.HERBALCURE'),
                callback: (html) => {                 
                    herbalCure = true;

                    if(powerLvl.level == 1){
                        healFormula = "1d6"
                    }
                    else if(powerLvl.level == 2){
                        healFormula = "1d8"
                    }
                    else{
                        healFormula = "1d10";
                        healFormulaMasterFailed = "1d6";
                    }
                    medicusHeal(ability, actor, targetData, powerLvl, herbalCure, healFormula, healFormulaMasterFailed);
                }
            }, 

            chooseNotRem: {
                label: game.i18n.localize('ABILITY_MEDICUS.NOHERBALCURE'), 
                callback: (html) => {             
                    herbalCure = false;
                    if(powerLvl.level == 1){
                        healFormula = "1d4"
                    }
                    else if(powerLvl.level == 2){
                        healFormula = "1d6"
                    }
                    else{
                        healFormula = "1d8";
                        healFormulaMasterFailed = "1d4";
                    }
                    medicusHeal(ability, actor, targetData, powerLvl, herbalCure, healFormula, healFormulaMasterFailed);
                }
            },
            close: {
                label: "Close"
            }
        }
    }).render(true);
}
       
async function medicusHeal(ability, actor, targetData, powerLvl, herbalCure, healFormula, healFormulaMasterFailed) {

    const attribute = actor.data.data.attributes["cunning"];
    const bonus = actor.data.data.bonus["cunning"];
    const attributeData = {name: game.i18n.localize(attribute.label), value: attribute.value + bonus};
    let rollData = await rollAttribute(actor, attributeData, 0, { value: 10, name: "None" }, null, null, null);
    console.log(rollData);
    let healed = 0;
    if(rollData.hasSucceed){

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        healed = healRoll.total;
        if(targetData.haveTarget){
            healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
            //kept for future auto apply option
            //await targetData.actor.update({"data.health.toughness.value" : targetData.actor.data.data.health.toughness.value + healed});
        }
    }
    else{
        if(powerLvl.level == 3){
            let healRoll = new Roll(healFormulaMasterFailed).evaluate();
            healRoll.toMessage();
            healed = healRoll.total;
            if(targetData.haveTarget){
                healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
                //kept for future auto apply option
                //await targetData.actor.update({"data.health.toughness.value" : targetData.actor.data.data.health.toughness.value + healed});
            }
        }
    }
    //kept for future auto apply option
    //await targetData.token.drawBars();
    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        rollString: rollData.name,
        rollResult : game.i18n.localize('ABILITY.ROLL_RESULT') + rollData.diceResult.toString(),
        resultText: actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_SUCCESS'),
        finalText: game.i18n.localize('ABILITY_MEDICUS.CHAT_FINAL') + healed.toString()
    };
    if(targetData.haveTarget){
        templateData.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + targetData.actor.data.name;
    }

    if(herbalCure){templateData.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.HERBALCURE')}
    else{templateData.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.NOHERBALCURE')};
    if(!rollData.hasSucceed){templateData.resultText = game.i18n.localize('ABILITY_MEDICUS.CHAT_FAILURE')}
    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
}