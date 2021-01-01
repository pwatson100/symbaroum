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
    console.log("ref");
    console.log(powerName);
    console.log(ability);
    
    if(powerName == undefined || powerName === ""){
        /* No reference for a system ability on this item, ask for one */
        await affectReferenceOnAbility(ability);
    }
    else{
        if(actor != null){
            switch (powerName) {
                case 'none':
                    return;
                break;
                case 'medicus':
                    try{medicus(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                    };
                break;
                case 'bendwill':
                    try{bendWill(ability, actor)} catch(error){
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
        {label: game.i18n.localize('ABILITYREF.DEFAULT'), value: "none"},
        /*{label: game.i18n.localize('ABILITYREF.ACROBATICS'), value: "acrobatics"},
        {label: game.i18n.localize('ABILITYREF.ALCHEMY'), value: "alchemy"},
        {label: game.i18n.localize('ABILITYREF.BACKSTAB'), value: "backstab"},
        {label: game.i18n.localize('ABILITYREF.BEASTLORE'), value: "beastlore"},
        {label: game.i18n.localize('ABILITYREF.BERSERKER'), value: "berserker"},
        {label: game.i18n.localize('ABILITYREF.BODYGUARD'), value: "bodyguard"},
        {label: game.i18n.localize('ABILITYREF.DOMINATE'), value: "dominate"},
        {label: game.i18n.localize('ABILITYREF.EQUESTRIAN'), value: "equestrian"},*/
        {label: game.i18n.localize('ABILITYREF.MEDICUS'), value: "medicus"}
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
    let lvlName = game.i18n.localize('TITLE.NOVICE');
    if(ability.data.data.master.isActive){
        powerLvl = 3;
        lvlName = game.i18n.localize('TITLE.MASTER');
    }
    else if(ability.data.data.adept.isActive){
        powerLvl = 2;
        lvlName = game.i18n.localize('TITLE.ADEPT');
    }
    return{level : powerLvl, levelName : lvlName}
}
function bendWill(ability, actor) {
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
        title: game.i18n.localize('ABILITY_MEDICUS.DIALOG'), 
        content: hCureDialogTemplate,
        buttons: {
            chooseRem: {
                label: game.i18n.localize('ABILITY_MEDICUS.DIALOG_YES'),
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
                label: game.i18n.localize('ABILITY_MEDICUS.DIALOG_NO'), 
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
    let rollData = await rollAttribute(actor, attributeData, 0, { value: 10, name: "custom" }, null, null, null);
    console.log(rollData);
    let effectChatMessage = `<p> ${actor.data.name} ${game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO')} </p>`;
    let targetName = game.i18n.localize('ABILITY_MEDICUS.CHAT_NONAME');
    if(targetData.haveTarget){targetName = targetData.actor.data.name}
    if(rollData.hasSucceed){

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        let healed = healRoll.total;
        if(targetData.haveTarget){
            healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
            //kept for future auto apply option
            //await targetData.actor.update({"data.health.toughness.value" : targetData.actor.data.data.health.toughness.value + healed});
        }
 
        if(herbalCure){
            effectChatMessage +=`
            <p> ${game.i18n.localize('ABILITY_MEDICUS.CHAT_HC_SUCCESS')} </p>
            `
        }
        else{
            effectChatMessage += `
            <p> ${game.i18n.localize('ABILITY_MEDICUS.CHAT_NOHC_SUCCESS')} </p>
            `
        }
    }
    else{
        if(powerLvl.level == 3){
            let healRoll = new Roll(healFormulaMasterFailed).evaluate();
            healRoll.toMessage();
            let healed = healRoll.total;
            if(targetData.haveTarget){
                healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
                //kept for future auto apply option
                //await targetData.actor.update({"data.health.toughness.value" : targetData.actor.data.data.health.toughness.value + healed});
            }
            if(herbalCure){
                effectChatMessage +=`
                <p> ${game.i18n.localize('ABILITY_MEDICUS.CHAT_HC_SUCCESS')} </p>
                `
            }
            else{
                effectChatMessage += `
                <p> ${game.i18n.localize('ABILITY_MEDICUS.CHAT_NOHC_SUCCESS')} </p>
                `
            }
        }
        else{
            effectChatMessage += ` ${game.i18n.localize('ABILITY_MEDICUS.CHAT_FAILURE')}
            `
        }
    }
    //kept for future auto apply option
    //await targetData.token.drawBars();
    ChatMessage.create({
        user: game.user._id,
        content: effectChatMessage
    });
}
