import { rollAttribute, baseRoll, getAttributeValue, createModifyTokenChatButton } from './roll.js';

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
                case 'bendwill':
                    try{bendWillPrepare(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;
                case 'curse':
                    try{cursePrepare(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;
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
        {label: game.i18n.localize('ABILITY_LABEL.RAPID_FIRE'), value: "rapidfire "},
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
        {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FORCE'), value: "twohandedforce "},
        {label: game.i18n.localize('ABILITY_LABEL.WITCHCRAFT'), value: "witchcraft"},
        {label: game.i18n.localize('ABILITY_LABEL.WITCHSIGHT'), value: "witchsight"},
        {label: game.i18n.localize('ABILITY_LABEL.WIZARDRY'), value: "wizardry"},
        {label: game.i18n.localize('ABILITY_LABEL.WRESTLING'), value: "wrestling"},
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
        {label: game.i18n.localize('POWER_LABEL.WITCH_HAMMER'), value: "witchhammer"}
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

/*get the target token, its actor, and evaluate which attribute this actor will use for opposition
@Params: {string}   targetAttributeName : the name of the resist attribute. Can be defence, and can be null.
@returns:  {targetData object}*/
function getTarget(targetAttributeName) {
    let targets = Array.from(game.user.targets)
    if(targets.length == 0 || targets.length > 1 ){
      throw game.i18n.localize('ABILITY_ERROR.TARGET');
    }
    let targetToken = targets[0];
    let targetActor = targets[0].actor;

     // get target opposition attribute
    let resistAttributeValue = null;
    if(targetAttributeName != undefined)
    {
        resistAttributeValue = getAttributeValue(targetActor, targetAttributeName);
    }
    else {targetAttributeName = null}
    return{
        haveTarget : true,
        token : targetToken,
        actor : targetActor,
        resistAttributeName: targetAttributeName,
        resistAttributeValue : resistAttributeValue,
        autoParams: ""
    }
}

/* format the string to print the roll result, including the 2 dice if favour was involved
@Params: {object}  rollData the object that the baseRoll function returns 
@returns:  {string} the formated and localized string*/
function formatRollResult(rollData){
    let rollResult = game.i18n.localize('ABILITY.ROLL_RESULT') + rollData.diceResult.toString();
    if(rollData.favour != 0){
        rollResult += "   (" + rollData.dicesResult[0].toString() + "  ,  " + rollData.dicesResult[1].toString() + ")";
    }
    return(rollResult);
}

/*get the max level learned by the actor
@Params: {item}   ability : the ability or mysticalPower item 
@returns:  {{number} level
            {lvlName} the localized label (novice, adpet or master)}*/
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

/*usualy called by any prepareAbility function
will send to screen a windows asking for modifiers for the roll, then roll, then call the abilityResult function (sent as a parameter)
   * @param {item} ability      The base (active or reactive) ability power or trait for the roll.
   * @param {actor} actor       The actor of the roll
   * @param {string} castingAttributeName   The name of the casting attribute. If null, the player will be asked to choose one
   * @param {actor} targetActor Can be null (no target)
   * @param {string} targetAttributeName Can be null (no opposition attribute to roll)
   * @param {string} autoParams Can be null. The list of parameters, passive abilities and such, that are already included (to inform the player he doesn't have to type them in)
   * @param {number} modifier  A modifier for the roll
   * @param {string}  favour: "0", "-1", "1"
   * @param {boolean} checkMaintain: if true, ask the pleyr whether the roll is for casting the ability or maintaining it 
   * @param {string} abilityResultFunction  The function to call in order to process the results
   * @param {any}   abilityResultFunctionStuff  an object of parameters not used in the dialog function, but useful for abilityResultFunction */
async function modifierDialog(ability, actor, castingAttributeName, targetData, askTargetAttribute, autoParams, modifier, favour, checkMaintain, abilityResultFunction, abilityResultFunctionStuff){

    let askCastingAttribute = true;
    if(castingAttributeName != null){
        askCastingAttribute = false;
    }
       
    let targetAttributeName = null;
    let hasTarget = false;
    if(targetData != null){
        hasTarget = true;
        if(targetData.resistAttributeName != null){
            targetAttributeName = targetData.resistAttributeName
        }
    }
    const html = await renderTemplate('systems/symbaroum/template/chat/dialog2.html', {
        hasTarget: hasTarget,
        askCastingAttribute: askCastingAttribute,
        askTargetAttribute: askTargetAttribute,
        isWeaponRoll : null,
        isArmorRoll : null,
        choices: { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
        groupName:"favour",
        defaultFavour: 0,
        defaultModifier: modifier,
        defaultAdvantage: "",
        defaultDamModifier: "",
        checkMaintain: checkMaintain
      });
      let dialog = new Dialog({
        title: ability.name,
        content: html,
        buttons: {
          roll: {
            icon: '<i class="fas fa-check"></i>',
            label: game.i18n.localize('BUTTON.ROLL'),
            callback: async (html) => {
                // acting attribute for d20roll
                if(askCastingAttribute) {
                    castingAttributeName = html.find("#castAt")[0].value;										
                }

                //resist attribute for d20roll
                if(askTargetAttribute){
                    if( html.find("#resistAtt").length > 0) {
                        targetAttributeName = html.find("#resistAtt")[0].value;	
                        targetData.resistAttributeName = targetAttributeName;
                        targetData.resistAttributeValue = getAttributeValue(targetData.actor, targetAttributeName);
                    }
                }

                //custom modifier for d20roll
                const bonus = html.find("#bonus")[0].value;   
                let modifierCustom = parseInt(bonus, 10);
                //Favour (2d20 keep best) or disfavour(2d20 keep worst)      
                let favours = html.find("input[name='favour']");
                let fvalue = 0;
                for ( let f of favours) {						
                    if( f.checked ) fvalue = parseInt(f.value, 10);
                }			
                const finalavour = fvalue + favour;
                console.log(finalavour);


                //Power/Ability has already been started and is maintained or chained
                let isMaintained = false;
                if( html.find("#maintain").length > 0) {
                    let valueM = html.find("#maintain")[0].value;	
                    if(valueM === "M"){isMaintained = true}								
                }
                
                //combat roll stuff - not yet implemented
/*                let hasAdvantage = false;
                let damModifier = null;
                if(isWeaponRoll){
                    // Damage modifier for combat rolls  
                    damModifier = "";               
                    let hasDamModifier = html.find("#dammodifier").length > 0;
                    if(hasDamModifier) {
                        damModifier = html.find("#dammodifier")[0].value;
                    }
                        //advantage situation
                    hasAdvantage = html.find("#advantage").length > 0;
                    if( hasAdvantage ) {
                        // Note that this turns into disadvantage for Defense rolls
                        hasAdvantage = html.find("#advantage")[0].checked;
                    }
                }*/
                let rollData;
                if(hasTarget){
                    rollData = await baseRoll(actor, castingAttributeName, targetData.actor, targetAttributeName, finalavour, modifierCustom);
                }
                else{
                    rollData = await baseRoll(actor, castingAttributeName, null, null, finalavour, modifierCustom);
                }
                
                await abilityResultFunction(rollData, ability, actor, castingAttributeName, targetData, finalavour, modifierCustom, isMaintained, autoParams, abilityResultFunctionStuff);
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
- steadfast adept (favour) or master (counter attack)
* @param {actor} actor       The actor
* @param {string} autoParams    the list of abilities and parameters automaticaly taken care for this actor
returns:{
    bestAttributeName {string} , //final attribute 
    favour {-1, 0, 1}, 
    useLeader {boolean},  (the novice level, if persuasive > resolute)
    useSteadfastAdept {boolean},
    useSteadfastMaster {boolean}
    autoParams {string} detected and used abilities have been appended to autoParams}*/
function checkResoluteModifiers(actor, autoParams){
    let useLeader = false;
    let useSteadfastAdept = false;
    let useSteadfastMaster = false;
    let favour = 0;
    let bestAttributeName = "resolute";
    let bestAttributeValue = actor.data.data.attributes["resolute"].value + actor.data.data.bonus["resolute"];
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
    let steadfastAb = actor.items.filter(item => item.data.data?.reference === "steadfast");
    if(steadfastAb.length > 0){
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
    return{
        useLeader: useLeader,
        bestAttributeName: bestAttributeName,
        bestAttributeValue: bestAttributeValue,
        favour: favour,
        useSteadfastAdept: useSteadfastAdept,
        useSteadfastMaster: useSteadfastMaster,
        autoParams: autoParams
    }
}

async function bendWillPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "");
    let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams);
    let favour = -1*targetResMod.favour;
    let castingAttributeName = actorResMod.bestAttributeName;
    targetData.resistAttributeName = targetResMod.bestAttributeName;
    targetData.resistAttributeValue = targetResMod.bestAttributeValue;
    let autoParams = actorResMod.autoParams;
    targetData.autoParams = targetResMod.autoParams;
    let bendWillStuff = {
        powerLvl: powerLvl
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, favour, true, bendWillResult, bendWillStuff)
}

async function bendWillResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, bendWillStuff){

    let castingAttribute = actor.data.data.attributes[castingAttributeName];
    let introText = "";
    if(isMaintained){
        introText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO_M');
    }
    else{
        introText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO');
    }
    let resultText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_SUCCESS') + targetData.actor.data.name;
    if(!rollData.hasSucceed){
        resultText = targetData.actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_FAILURE');
    }
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
    if (targetData.autoParams != ""){targetText += ": " + targetData.autoParams}

    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: targetText,
        subText: autoParams + ability.name + " (" + bendWillStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        haveRoll: true,
        rollString: `${game.i18n.localize(castingAttribute.label)} : (${rollData.actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(rollData.hasSucceed && !isMaintained){
        let flagData = {
            tokenId: targetData.token.data._id,
            addEffect: "icons/svg/daze.svg",
            effectDuration: 1
        };
        await createModifyTokenChatButton(flagData);
    }
    else if(!rollData.hasSucceed){   
        let flagData = {
            tokenId: targetData.token.data._id,
            removeEffect: "icons/svg/daze.svg"
        };
        await createModifyTokenChatButton(flagData);
    }
}

async function cursePrepare(ability, actor) {
    
    let targetData;
    try{targetData = getTarget()} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let hasTarget = false;
    let powerLvl = getPowerLevel(ability);
    let resMod = checkResoluteModifiers(actor, "");
    let castingAttributeName = resMod.bestAttributeName;
    let autoParams = resMod.autoParams;
    let curseStuff = {
        powerLvl: powerLvl
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, 0, true, curseResult, curseStuff)
}

async function curseResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, curseStuff){

    let castingAttribute = actor.data.data.attributes[castingAttributeName];
    let introText = "";
    let haveRoll;
    if(isMaintained){
        introText = actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO_M');
        haveRoll = true;
    }
    else{
        introText = actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO');
        haveRoll = false;
        rollData.hasSucceed = true;
    }
    let resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_N');
    if(curseStuff.powerLvl == 2){resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_A')}
    else if(curseStuff.powerLvl == 3){resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_M')}

    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name,
        subText: autoParams + ability.name + " (" + curseStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        haveRoll: haveRoll,
        rollString: `${game.i18n.localize(castingAttribute.label)} : (${rollData.actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }

    if(!rollData.hasSucceed){
        templateData.resultText = actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_FAILURE');
        templateData.finalText = game.i18n.localize('POWER_CURSE.CHAT_FAIL_FINAL') + targetData.actor.data.name;
    }

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(!isMaintained){
        let flagData = {
            tokenId: targetData.token.data._id,
            addEffect: "icons/svg/sun.svg",
            effectDuration: 1
        };
        await createModifyTokenChatButton(flagData);
    }
    else if(!rollData.hasSucceed){   
        let flagData = {
            tokenId: targetData.token.data._id,
            removeEffect: "icons/svg/sun.svg"
        }
        await createModifyTokenChatButton(flagData);
    }
}

async function loremaster(ability, actor) {
    
    let targetData = {haveTarget : false};
    let powerLvl = getPowerLevel(ability);
    const attribute = actor.data.data.attributes["cunning"];
    let rollData = await baseRoll(actor, "cunning", null, null, 0, 0);

    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        haveRoll: true,
        rollString: `${game.i18n.localize(attribute.label)} : (${rollData.actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
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
    let rollData = await baseRoll(actor, "cunning", null, null, 0, 0);
    console.log(rollData);
    let healed = 0;
    let flagData;
    if(rollData.hasSucceed){

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        healed = healRoll.total;
        if(targetData.haveTarget){
            healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
            flagData = {
                tokenId: targetData.token.data._id,
                toughnessChange: healed
            }
        }
    }
    else{
        if(powerLvl.level == 3){
            let healRoll = new Roll(healFormulaMasterFailed).evaluate();
            healRoll.toMessage();
            healed = healRoll.total;
            if(targetData.haveTarget){
                healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);
                flagData = {
                    tokenId: targetData.token.data._id,
                    toughnessChange: healed
                }
            }
        }
    }

    let templateData = {
        targetData : targetData,
        haveTarget : targetData.haveTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        haveRoll: true,
        rollString: `${game.i18n.localize(attribute.label)} : (${rollData.actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
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
    await ChatMessage.create(chatData);
    if(flagData){
        await createModifyTokenChatButton(flagData);
    }
}