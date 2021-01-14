import { rollAttribute, baseRoll, damageRollWithDiceParams, getAttributeValue, createModifyTokenChatButton } from './roll.js';

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
                case 'anathema':
                    try{anathemaPrepare(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
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
                case 'holyaura':
                    try{holyAuraPrepare(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;
                case 'inheritwound':
                    try{inheritWound(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                };
                break;
                case 'larvaeboils':
                    try{larvaeBoilsPrepare(ability, actor)} catch(error){
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
                case 'unnoticeable':
                    try{unnoticeablePrepare(ability, actor)} catch(error){
                        ui.notifications.error(error);
                        return;
                    };
                break;
                case 'witchsight':
                    try{witchsight(ability, actor)} catch(error){
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
        hasTarget : true,
        token : targetToken,
        actor : targetActor,
        resistAttributeName: targetAttributeName,
        resistAttributeValue : resistAttributeValue,
        autoParams: ""
    }
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
   * @param {string} abilityResultFunction  The function to call in order to process the results
   * @param {any}   abilityResultFunctionStuff  an object of parameters not used in the dialog function, but useful for abilityResultFunction */
async function modifierDialog(ability, actor, castingAttributeName, targetData, askTargetAttribute, autoParams, modifier, favour, abilityResultFunction, abilityResultFunctionStuff){
    
    let askCastingAttribute = true;
    if(castingAttributeName != null){
        askCastingAttribute = false;
    }
    let isWeaponRoll = false;
    let askBackstab = false;
    let askHuntersInstinct = false;
    let askIronFistMaster = false;
    let askTwoAttacks = false;
    let askThreeAttacks = false;
    let checkMaintain = abilityResultFunctionStuff.checkMaintain;
    if(abilityResultFunctionStuff?.combat)
    {
        askBackstab = abilityResultFunctionStuff.askBackstab;
        askHuntersInstinct= abilityResultFunctionStuff.askHuntersInstinct;
        askIronFistMaster= abilityResultFunctionStuff.dmgData.askIronFistMaster;
        askTwoAttacks = abilityResultFunctionStuff.askTwoAttacks;
        askThreeAttacks = abilityResultFunctionStuff.askThreeAttacks;
        isWeaponRoll = true
    }
    let targetAttributeName = null;
    let hasTarget = false;
    if(targetData != null){
        hasTarget = targetData.hasTarget;
        if(targetData.resistAttributeName){
            targetAttributeName = targetData.resistAttributeName
        }
    }
    const html = await renderTemplate('systems/symbaroum/template/chat/dialog2.html', {
        hasTarget: hasTarget,
        askCastingAttribute: askCastingAttribute,
        askTargetAttribute: askTargetAttribute,
        isWeaponRoll : isWeaponRoll,
        autoparamsText: game.i18n.localize("DIALOG.AUTOPARAMS") + autoParams + targetData.autoParams,
        isArmorRoll : null,
        askBackstab : askBackstab,
        askIronFistMaster: askIronFistMaster,
        askHuntersInstinct: askHuntersInstinct,
        askThreeAttacks: askThreeAttacks,
        askTwoAttacks: askTwoAttacks,
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
                modifier = modifierCustom;
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
                
                //combat roll stuff
                if(isWeaponRoll){
                    abilityResultFunctionStuff.dmgData.ignoreArm = html.find("#ignarm")[0].checked;
                    abilityResultFunctionStuff.poison = Number(html.find("#poison")[0].value);                
                    let damModifier = html.find("#dammodifier")[0].value;
                    if(damModifier!="") {
                        abilityResultFunctionStuff.dmgData.modifier += " + " + damModifier;
                    }
                    // Damage modifier for iron fist master 
                    if(askIronFistMaster){
                        abilityResultFunctionStuff.dmgData.modifier += " + " + html.find("#ironfistmodifier")[0].value;
                    }
                        //advantage situation
                    abilityResultFunctionStuff.dmgData.hasAdvantage = html.find("#advantage")[0].checked;
                    if(abilityResultFunctionStuff.dmgData.hasAdvantage){
                        modifier += 2;
                        autoParams += game.i18n.localize('DIALOG.ADVANTAGE') + ", "
                    }
                    
                    if(askBackstab){
                        abilityResultFunctionStuff.dmgData.useBackstab = html.find("#usebackstab")[0].checked;
                    }
                    if(askTwoAttacks){
                        abilityResultFunctionStuff.dmgData.do2attacks = html.find("#do2attacks")[0].checked;
                    }
                    if(askThreeAttacks){
                        abilityResultFunctionStuff.dmgData.do3attacks = html.find("#do3attacks")[0].checked;
                    }
                    if(askHuntersInstinct){
                        abilityResultFunctionStuff.useHuntersInstinct = html.find("#usehunter")[0].checked;
                        if(!abilityResultFunctionStuff.useHuntersInstinct){
                                combatStuff.dmgData.hunterIDmg = false;
                        }
                    }
                }
                let rollData = [];
                if(hasTarget){
                    rollData.push(await baseRoll(actor, castingAttributeName, targetData.actor, targetAttributeName, finalavour, modifier));
                    if(isWeaponRoll && abilityResultFunctionStuff.dmgData.do3attacks){
                        rollData.push(await baseRoll(actor, castingAttributeName, targetData.actor, targetAttributeName, finalavour, modifier));  
                        rollData.push(await baseRoll(actor, castingAttributeName, targetData.actor, targetAttributeName, finalavour, modifier));                      
                    }
                    else if(isWeaponRoll && abilityResultFunctionStuff.dmgData.do2attacks){
                        rollData.push(await baseRoll(actor, castingAttributeName, targetData.actor, targetAttributeName, finalavour, modifier));                        
                    }
                }
                else{
                    rollData.push(await baseRoll(actor, castingAttributeName, null, null, finalavour, modifier));
                    if(isWeaponRoll && abilityResultFunctionStuff.dmgData.do3attacks){
                        rollData.push(await baseRoll(actor, castingAttributeName, null, null, finalavour, modifier));  
                        rollData.push(await baseRoll(actor, castingAttributeName, null, null, finalavour, modifier));                      
                    }
                    else if(isWeaponRoll && abilityResultFunctionStuff.dmgData.do2attacks){
                        rollData.push(await baseRoll(actor, castingAttributeName, null, null, finalavour, modifier));                        
                    }
                }
                console.log(rollData);
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
function checkResoluteModifiers(actor, autoParams, checkLeader, checkSteadfast){
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

/*function for main combat

****************this function needs damage and armor parameters as dice (ie: weapon.data.data.damage = "1d8")
for the NPC side, it will transform those parameters as NPC fixed values using the formula (dice maximum value)/2
It won't work with NPC fixed values as input

* @param {boolean} attackFromPC true: the actor that does damage is a PC; false : the damage is done by a NPC
* @param {actor object} actor  is the actor that does damage
* @param {item object} weapon is the weapon that is used
* @param {object} rollParams is an object of parameters.
* @param {object} targetData is information on the target that will receive the damage (as returned by the getTarget function)*/

export async function attackRoll(actor, weapon, rollParams, combatStuff){

    //check wether acting token is player controlled
    let attackFromPC = actor.hasPlayerOwner;
    let targetData;
    // get target token, actor and defense value
    try{targetData = getTarget("defense")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let modifier = 0;
    let favour = 0;
    let autoParams = "";
    // is the actor cursed?
    /*const CursedEffect = "icons/svg/sun.svg";
    let cursedEffectCounter = EffectCounter.findCounter(rollData[0].selectedToken, CursedEffect);
    if(cursedEffectCounter != undefined){
        rollData[0].selectedCursed = true;
        favour = favour - 1;
        autoParams += game.i18n.localize('POWER_LABEL.CURSE') + ", "
    }     */ 
    if(combatStuff == undefined){
        combatStuff = {
            combat: true,
            attackFromPC: attackFromPC,
            poison: 0,
            bleed: false,
            askBackstab: false,
            askHuntersInstinct: false,
            useHuntersInstinct: false,
            askTwoAttacks: false,
            askThreeAttacks: false,
            checkMaintain: false,
            dmgData: {
                askIronFistMaster: false,
                isRanged: false,
                hunterIDmg: false,
                modifier: "",
                hasAdvantage: false,
                useBackstab: false,
                leaderTarget: false,
                ignoreArm: false
            }
        }
    }

    // target status effects
    const CursedEffect = "icons/svg/sun.svg";
    let cursedEffectCounter = EffectCounter.findCounter(targetData.token, CursedEffect);
    if(cursedEffectCounter != undefined){
        favour += 1;
        targetData.autoParams += "[" + game.i18n.localize('POWER_LABEL.CURSE') + "], ";
    }
    const LeaderEffect = "icons/svg/eye.svg";
    let leaderEffectCounter = EffectCounter.findCounter(targetData.token, LeaderEffect);
    if(leaderEffectCounter != undefined){
        combatStuff.leaderTarget = true;
        targetData.autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
    };

    //search for special attacks
    let backstabAbil = actor.items.filter(item => item.data.data?.reference === "backstab");
    if(backstabAbil.length != 0){
        combatStuff.askBackstab = true;
    }
    let hunterInstinct = actor.items.filter(item => item.data.data?.reference === "huntersinstinct");
    if(hunterInstinct.length != 0){
        if(hunterInstinct[0].data.data.adept.isActive){
            combatStuff.dmgData.hunterIDmg = true;
        }
    }
    //multiple attacks
    let naturalwarrior = actor.items.filter(item => item.data.data?.reference === "naturalwarrior");
    if(naturalwarrior.length != 0){
        if(naturalwarrior[0].data.data.adept.isActive){
            combatStuff.askTwoAttacks = true;
        }
    }
    let rapidfire = actor.items.filter(item => item.data.data?.reference === "rapidfire");
    if(rapidfire.length != 0){
        if(rapidfire[0].data.data.master.isActive){
            combatStuff.askThreeAttacks = true;
        }
        else{
            combatStuff.askTwoAttacks = true;
        }
    }
    let knifeplay = actor.items.filter(item => item.data.data?.reference === "knifeplay");
    if(knifeplay.length != 0){
        if(knifeplay[0].data.data.adept.isActive){
            combatStuff.askTwoAttacks = true;
        }
    }
    let steelthrow = actor.items.filter(item => item.data.data?.reference === "steelthrow");
    if(steelthrow.length != 0){
        if(steelthrow[0].data.data.adept.isActive){
            combatStuff.askTwoAttacks = true;
        }
        if(steelthrow.data.data.master.isActive){
            combatStuff.askThreeAttacks = true;
        }
    }
    //other modifiers
    if(weapon.data.data.qualities.precise){
        modifier += 1;
        autoParams += game.i18n.localize('COMBAT.PARAMS_PRECISE');
    };

    //iron fist
    let ironFist = actor.items.filter(item => item.data.data?.reference === "ironfist");
    if(ironFist.length > 0){
        let powerLvl = getPowerLevel(ironFist[0]);
        if(powerLvl.level == 2){
            combatStuff.dmgData.modifier += " + 1d4";
            autoParams += game.i18n.localize('ABILITY_LABEL.IRON_FIST') + " (" + game.i18n.localize('ABILITY.ADEPT') + "), ";
        }
        if(powerLvl.level > 2){
            combatStuff.dmgData.askIronFistMaster = true;
            autoParams += game.i18n.localize('ABILITY_LABEL.IRON_FIST') + " (" + game.i18n.localize('ABILITY.MASTER') + "), ";
        }
    }
    const castingAttributeName = weapon.data.data.attribute;

    await modifierDialog(weapon, actor, castingAttributeName, targetData, false, autoParams, modifier, favour, attackResult, combatStuff)
}
  
async function attackResult(rollData, weapon, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){
    
    let damage;
    let hasDamage = false;
    let targetDies = false;
    let pain = false;
    let flagDataArray = [];
    let damageTot = 0;
    let resultText = "";
    let damageText = "";
    let damageFinalText = "";
    let damageRollResult= "";
    let damageTooltip = "";
    let damageRollMod = "";
    let dmgFormulaTooltip="";

    for(let rollDataElement of rollData){

        if(rollDataElement.hasSucceed){
            resultText += actor.data.name + game.i18n.localize('COMBAT.CHAT_SUCCESS') + targetData.actor.data.name + "\n";
            hasDamage = true;
            damage = await damageRollWithDiceParams(functionStuff.attackFromPC, actor, weapon, functionStuff.dmgData, targetData);
            damageTot += damage.roll.total;
            if(damage.roll.total > targetData.actor.data.data.health.toughness.threshold){pain = true}
            damageRollResult += await formatRollResult([damage]) + "\n";
            dmgFormulaTooltip += damage.roll._formula + "    ";
            damageTooltip += damage.roll.result + "    ";
            console.log(damageRollMod);
        }
        else{
            resultText += actor.data.name + game.i18n.localize('COMBAT.CHAT_FAILURE') + " \n";
        }
    }
    
    if (hasDamage) {damageRollMod = damage.autoParams};

    if(damageTot < 0){
        damageTot = 0;
        damageText = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_NUL');
    }
    else if(damageTot > targetData.actor.data.data.health.toughness.value){
        targetDies = true;
        damageText = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
        damageFinalText = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_DYING');
        flagDataArray.push({
            tokenId: targetData.token.data._id,
            toughnessChange: damageTot*-1
        }, {
            tokenId: targetData.token.data._id,
            addEffect: "icons/svg/skull.svg",
            effectDuration: 1
        })
    }
    else{
        damageText = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE') + damageTot.toString();
        flagDataArray.push({
            tokenId: targetData.token.data._id,
            toughnessChange: damageTot*-1
        })
        if(pain){
            damageFinalText = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_DAMAGE_PAIN');
            flagDataArray.push({
                tokenId: targetData.token.data._id,
                addEffect: "icons/svg/falling.svg",
                effectDuration: 1
            })
        }

    }
    let introText = actor.data.name + game.i18n.localize('COMBAT.CHAT_INTRO') + weapon.data.name;
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
    if (targetData.autoParams != ""){targetText += ": " + targetData.autoParams}
    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: targetText,
        subText: weapon.name,
        subImg: weapon.img,
        hasRoll: true,
        hasCorruption: false,
        rollString: await formatRollString(rollData[0], targetData.hasTarget, rollData[0].modifier),
        rollResult : await formatRollResult(rollData),
        resultText: resultText,
        finalText: "",
        hasDamage: hasDamage,
        damageText: damageText,
        damageRollResult: damageRollResult,
        dmgFormulaTooltip: dmgFormulaTooltip,
        damageRollMod: damageRollMod,
        damageTooltip: damageTooltip,
        damageFinalText: damageFinalText,
        printPoison: false,
        poisonRollString: "",
        poisonRollResultString: "",
        poisonChatIntro: "",
        poisonChatResult: ""
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    if(functionStuff.poison > 0 && !targetDies && damageTot > 0){

        templateData.poisonChatIntro = actor.data.name + game.i18n.localize('COMBAT.CHAT_POISON') + targetData.actor.data.name;
        let poisonChatResult;
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
      
        let poisonRoll = await baseRoll(actor, "cunning", targetData.actor, "strong", 0, 0);
            
        if(!poisonRoll.hasSucceed){
            templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_FAILURE');     
        }
        else{
        let PoisonRoundsRoll= new Roll(poisonRounds).evaluate();
        let NewPoisonRounds = PoisonRoundsRoll.total;
        let poisonedEffectCounter = await EffectCounter.findCounter(targetData.token, effect);
        if(poisonedEffectCounter != undefined){
            //target already poisoned
            //get the number of rounds left
            poisonedTimeLeft = await EffectCounter.findCounterValue(targetData.token, effect);  
            if(NewPoisonRounds > poisonedTimeLeft){
                flagDataArray.push({
                    tokenId: targetData.token.data._id,
                    modifyEffectDuration: "icons/svg/poison.svg",
                    effectDuration: NewPoisonRounds
                })
              
                templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_EXTEND');
            }
            else{
                templateData.poisonChatResult = game.i18n.localize('COMBAT.CHAT_POISON_NOTEXTEND');
            }
          }
          else{
            //new poisonning  
            flagDataArray.push({
                tokenId: targetData.token.data._id,
                addEffect: "icons/svg/poison.svg",
                effectDuration: NewPoisonRounds
            });
            templateData.poisonChatResult = targetData.actor.data.name + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS1') + poisonDamage  + game.i18n.localize('COMBAT.CHAT_POISON_SUCCESS2')  + NewPoisonRounds.toString();
     
          }
        }
        templateData.printPoison = true;
        templateData.poisonRollString = await formatRollString(poisonRoll, targetData.hasTarget, 0);
        templateData.poisonRollResultString = await formatRollResult(poisonRoll);
    }
    const html = await renderTemplate("systems/symbaroum/template/chat/combat.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(flagDataArray.length > 0){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function formatRollString(rollDataElement, hasTarget, modifier){
    let rollString = `${rollDataElement.actingAttributeLabel} : (${rollDataElement.actingAttributeValue})`;
    if(hasTarget){
        rollString += `  ⬅  ${rollDataElement.targetAttributeLabel} : (${rollDataElement.resistAttributeValue})`
    }
    if(modifier){
        rollString += "  " + game.i18n.localize('COMBAT.CHAT_MODIFIER') + modifier.toString();
    }
    return(rollString)
}

async function unnoticeablePrepare(ability, actor) {
    let unnoticeableStuff = {
        combat: false,
        powerLvl: 0,
        hasTarget : false,
        targetMandatory: false,
        targetResitAttribute: null,
        checkTargetSteadfast: false,
        checkMaintain: false,
        addCasterEffect: "systems/symbaroum/asset/image/invisible.png"
    }
    await standardPowerActivation(ability, actor, unnoticeableStuff);
}

async function standardPowerActivation(ability, actor, powerStuff) {
    let targetData;
    let favour = 0;
    if(powerStuff.hasTarget){
        try{targetData = getTarget(powerStuff.targetResitAttribute)} catch(error){
            if(powerStuff.targetMandatory){
                ui.notifications.error(error);
                return;
            }
            else powerStuff.hasTarget = false;
        }
    }
    powerStuff.powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "", true, false);
    if (powerStuff.hasTarget){
        let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, powerStuff.checkTargetSteadfast);
        if (powerStuff.targetResitAttribute === "resolute"){
            targetData.resistAttributeName = targetResMod.bestAttributeName;
            targetData.resistAttributeValue = targetResMod.bestAttributeValue;
            targetData.autoParams = targetResMod.autoParams;
        }
        favour += targetResMod.favour*(-1);
    }
    else {targetData = {hasTarget : false}}
    let castingAttributeName = actorResMod.bestAttributeName;
    let autoParams = actorResMod.autoParams;
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, favour, standardPowerResult, powerStuff)
}

async function standardPowerResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){
    let introText = actor.data.name
    if(isMaintained){
        introText += game.i18n.localize('POWER.CHAT_INTRO_M') + ability.name + " \".";
    }
    else{
        introText += game.i18n.localize('POWER.CHAT_INTRO') + ability.name + " \".";
    }
    
    let resultText = actor.data.name + game.i18n.localize('POWER.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = actor.data.name + game.i18n.localize('POWER.CHAT_FAILURE');
    }
    let targetText = "";
    if(targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
        if (targetData.autoParams != ""){targetText += ": " + targetData.autoParams}
    }
    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: targetText,
        subText: ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);

    let flagDataArray = [];
    if(rollData[0].hasSucceed && functionStuff.addTargetEffect){
        let statusEffectCounter = await EffectCounter.findCounter(targetData.token, functionStuff.addTargetEffect);
        if(statusEffectCounter == undefined){
            flagDataArray.push({
                tokenId: targetData.token.data._id,
                addEffect: functionStuff.addTargetEffect,
                effectDuration: 1
            });
        await createModifyTokenChatButton([flagData]);
        }
    }
    if(rollData[0].hasSucceed && functionStuff.addCasterEffect){
        let selectedToken;
        try{selectedToken = getTokenId()} catch(error){      
            ui.notifications.error(error);
            return;
        }    
        let statusEffectCounter = await EffectCounter.findCounter(selectedToken, functionStuff.addCasterEffect);
        if(statusEffectCounter == undefined){
            flagDataArray.push({
                tokenId: selectedToken.data._id,
                addEffect: functionStuff.addCasterEffect,
                effectDuration: 1
            });
        }
    }
    if(flagDataArray.length){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function anathemaPrepare(ability, actor) {
    // get target
    let targetData;
    let favour = 0;
    let hasTarget= true;
    try{targetData = getTarget("resolute")} catch(error){
        hasTarget= false;
    }
    let powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "", true, false);
    if (hasTarget){
        let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, false);
        targetData.resistAttributeName = targetResMod.bestAttributeName;
        targetData.resistAttributeValue = targetResMod.bestAttributeValue;
        targetData.autoParams = targetResMod.autoParams;
        favour += targetResMod.favour*(-1);
    }
    else {targetData = {hasTarget : false}}
    let castingAttributeName = actorResMod.bestAttributeName;
    let autoParams = actorResMod.autoParams;
    let anathemaStuff = {
        combat: false,
        powerLvl: powerLvl,
        hasTarget : hasTarget,
        checkMaintain: true
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, favour, anathemaResult, anathemaStuff)
}

async function anathemaResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){

    let introText = actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_INTRO');
    
    let resultText = actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_SUCCESS');
    if(!rollData[0].hasSucceed){
        resultText = actor.data.name + game.i18n.localize('POWER_ANATHEMA.CHAT_FAILURE');
    }
    let targetText = "";
    if(targetData.hasTarget){
        targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
        if (targetData.autoParams != ""){targetText += ": " + targetData.autoParams}
    }
    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: targetText,
        subText: ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
}

async function bendWillPrepare(ability, actor) {
    let targetData;
    try{targetData = getTarget("resolute")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "", true, false);
    let targetResMod = checkResoluteModifiers(targetData.actor, targetData.autoParams, true, true);
    let favour = -1*targetResMod.favour;
    let castingAttributeName = actorResMod.bestAttributeName;
    targetData.resistAttributeName = targetResMod.bestAttributeName;
    targetData.resistAttributeValue = targetResMod.bestAttributeValue;
    let autoParams = actorResMod.autoParams;
    targetData.autoParams = targetResMod.autoParams;
    let bendWillStuff = {
        combat: false,
        powerLvl: powerLvl,
        checkMaintain: true
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, favour, bendWillResult, bendWillStuff)
}

async function bendWillResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){

    let introText = "";
    if(isMaintained){
        introText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO_M');
    }
    else{
        introText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_INTRO');
    }
    let resultText = actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_SUCCESS') + targetData.actor.data.name;
    if(!rollData[0].hasSucceed){
        resultText = targetData.actor.data.name + game.i18n.localize('POWER_BENDWILL.CHAT_FAILURE');
    }
    let targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
    if (targetData.autoParams != ""){targetText += ": " + targetData.autoParams}

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: targetText,
        subText: ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    let NewMessage = await ChatMessage.create(chatData);
    if(rollData[0].hasSucceed && !isMaintained){
        let flagData = {
            tokenId: targetData.token.data._id,
            addEffect: "systems/symbaroum/asset/image/puppet.png",
            effectDuration: 1
        };
        await createModifyTokenChatButton([flagData]);
    }
    else if(!rollData[0].hasSucceed){   
        let flagData = {
            tokenId: targetData.token.data._id,
            removeEffect: "systems/symbaroum/asset/image/puppet.png"
        };
        await createModifyTokenChatButton([flagData]);
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
    let resMod = checkResoluteModifiers(actor, "", true, false);
    let castingAttributeName = resMod.bestAttributeName;
    let autoParams = resMod.autoParams;
    let curseStuff = {
        combat: false,
        powerLvl: powerLvl,
        checkMaintain: true
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, 0, curseResult, curseStuff)
}

async function curseResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){

    let introText = "";
    let hasRoll;
    if(isMaintained){
        introText = actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO_M');
        hasRoll = true;
    }
    else{
        introText = actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_INTRO');
        hasRoll = false;
        rollData[0].hasSucceed = true;
    }
    let resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_N');
    if(functionStuff.powerLvl == 2){resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_A')}
    else if(functionStuff.powerLvl == 3){resultText = targetData.actor.data.name + game.i18n.localize('POWER_CURSE.CHAT_SUCCESS_M')}

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name,
        subText: ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        hasRoll: hasRoll,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: ""
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    if(!rollData[0].hasSucceed){
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
        await createModifyTokenChatButton([flagData]);
    }
    else if(!rollData[0].hasSucceed){   
        let flagData = {
            tokenId: targetData.token.data._id,
            removeEffect: "icons/svg/sun.svg"
        }
        await createModifyTokenChatButton([flagData]);
    }
}

async function holyAuraPrepare(ability, actor) {

    let selectedToken;
    try{selectedToken = getTokenId()} catch(error){      
        ui.notifications.error(error);
        return;
    }    
    let targetData = {hasTarget : false};
    let powerLvl = getPowerLevel(ability);
    let resMod = checkResoluteModifiers(actor, "", true, false);
    let castingAttributeName = resMod.bestAttributeName;
    let autoParams = resMod.autoParams;
    let fctStuff = {
        combat: false,
        selectedToken: selectedToken,
        powerLvl: powerLvl,
        checkMaintain: true
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, 0, holyAuraResult, fctStuff);
}

async function holyAuraResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, fctStuff){
    
    let templateData = {
        targetData : targetData,
        hasTarget : false,
        introText: actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + fctStuff.powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_SUCCESS'),
        finalText: ""
    };
    if(autoParams != ""){templateData.subText += ", " + autoParams};

    if(rollData[0].hasSucceed){
        let auraDamage = "1d6";
        let auraHeal = "1d4";
        if(fctStuff.powerLvl.level == 2){auraDamage = "1d8"}
        else if(fctStuff.powerLvl.level == 3){auraDamage = "1d10"; auraHeal = "1d6"}
        
        let abTheurgy = actor.items.filter(item => item.data.data?.reference === "theurgy");
        console.log(abTheurgy);
        if(abTheurgy.length > 0){
            if(abTheurgy[0].data.data.master.isActive){
                auraDamage += " + 1d4";
                auraHeal += " + 1d4";
            }
        }
        templateData.finalText  += game.i18n.localize('COMBAT.DAMAGE') + auraDamage;
        if(fctStuff.powerLvl.level > 1){
            templateData.finalText += game.i18n.localize('POWER_HOLYAURA.HEALING') + auraHeal;
        }
    }
    else{
        if(rollData[0].isMaintained){
            templateData.resultText = actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_FAILURE_M')
        }
        else{
            templateData.resultText = actor.data.name + game.i18n.localize('POWER_HOLYAURA.CHAT_FAILURE')
        };
    }
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);

    if(rollData[0].hasSucceed && !isMaintained){
        let flagData = {
            tokenId: fctStuff.selectedToken.data._id,
            addEffect: "icons/svg/aura.svg",
            effectDuration: 1
        }
        await createModifyTokenChatButton([flagData]);
    }
    else if(!rollData[0].hasSucceed && isMaintained){   
        let flagData = {
            tokenId: fctStuff.selectedToken.data._id,
            removeEffect: "icons/svg/aura.svg"
        }
        await createModifyTokenChatButton([flagData]);
    }
}

async function inheritWound(ability, actor){
    let selectedToken;
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

    let rollData = await baseRoll(actor, castingAttributeName, null, null, favour, 0);
    let healDice = "1d6";
    if(powerLvl.level >= 2){
        healDice = "1d8"
    }

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + targetData.actor.data.name,
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_SUCCESS'),
        finalText: ""
    };
    if(actorResMod.autoParams != ""){templateData.subText += ", " + actorResMod.autoParams};
    
    let flagDataArray;
    if(rollData[0].hasSucceed){
        let healRoll = new Roll(healDice).evaluate();
        healRoll.toMessage();
        let healed = Math.min(healRoll.total, targetData.actor.data.data.health.toughness.max - targetData.actor.data.data.health.toughness.value);        
        let inheritDamage = healed;
        if(powerLvl.level >= 2){
            inheritDamage = Math.ceil(healed /2);
        }
        templateData.finalText += targetData.actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_HEALED') + healed.toString() + ";\n" + actor.data.name + game.i18n.localize('POWER_INHERITWOUND.CHAT_DAMAGE') + inheritDamage.toString();
        flagDataArray = [{
            tokenId: selectedToken.data._id,
            toughnessChange: inheritDamage*-1
        }, {
            tokenId: targetData.token.data._id,
            toughnessChange: healed
        }];

        if(powerLvl.level >= 2){
            templateData.finalText += ";  Les poisons et saignements sont également redirigés."
            const pEffect = "icons/svg/poison.svg";
            let poisonedEffectCounter = await EffectCounter.findCounter(targetData.token, pEffect);
            if(poisonedEffectCounter != undefined){
                //target  poisoned
                //get the number of rounds left
                let timeLeft = await EffectCounter.findCounterValue(targetData.token, pEffect);
                //set status to caster
                flagDataArray.push({
                    tokenId: selectedToken.data._id,
                    addEffect: "icons/svg/poison.svg",
                    effectDuration: timeLeft
                }, {
                    tokenId: targetData.token.data._id,
                    removeEffect: "icons/svg/poison.svg"
                })
            }
            const bEffect = "icons/svg/blood.svg";
            let bleedEffectCounter = await EffectCounter.findCounter(targetData.token, bEffect);
            if(bleedEffectCounter != undefined){
                //get the number of rounds left
                let timeLeft = await EffectCounter.findCounterValue(targetData.token, bEffect);
                //set status to caster
                flagDataArray.push({
                    tokenId: selectedToken.data._id,
                    addEffect: "icons/svg/blood.svg",
                    effectDuration: timeLeft
                }, {
                    tokenId: targetData.token.data._id,
                    removeEffect: "icons/svg/blood.svg"
                })
            }


        }
    }
    else{templateData.resultText = game.i18n.localize('POWER_INHERITWOUND.CHAT_FAILURE')}

    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
    if(rollData[0].hasSucceed){
        await createModifyTokenChatButton(flagDataArray);
    }
}

async function larvaeBoilsPrepare(ability, actor) {
 
    let targetData;
    try{targetData = getTarget("strong")} catch(error){      
        ui.notifications.error(error);
        return;
    }
    let powerLvl = getPowerLevel(ability);
    let actorResMod = checkResoluteModifiers(actor, "", true, false);
    let favour = 0;
    let castingAttributeName = actorResMod.bestAttributeName;
    let autoParams = actorResMod.autoParams;
 
    let targetResMod = checkResoluteModifiers(targetData.actor, "", false, true);;
    targetData.autoParams += targetResMod.autoParams;
    favour = favour - targetResMod.favour;
    let fctStuff = {
        combat: false,
        powerLvl: powerLvl,
        checkMaintain: true
    }
    await modifierDialog(ability, actor, castingAttributeName, targetData, false, autoParams, 0, favour, larvaeBoilsResult, fctStuff)
}

async function larvaeBoilsResult(rollData, ability, actor, castingAttributeName, targetData, favour, modifierCustom, isMaintained, autoParams, functionStuff){
    let introText = "";
    let resultText;
    let finalText = "";
    let hasRoll;
    let finalDamage = 0;

    if(isMaintained){
        introText = actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO_M');
        hasRoll = true;
    }
    else{
        introText = actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_INTRO');
        hasRoll = false;
        rollData[0].hasSucceed = true;
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
        if(actor.hasPlayerOwner){
            let damageRoll = new Roll(effectDamage).evaluate();
            damageRoll.toMessage();
            finalDamage = damageRoll.total;
        }
        else{
            finalDamage
            let damageRoll= new Roll(effectDamage).evaluate({maximize: true});
            finalDamage = Math.ceil(damageRoll.total/2);
        }
        resultText = targetData.actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_SUCCESS');
        finalText =  game.i18n.localize('COMBAT.DAMAGE') + finalDamage.toString();
    }
    else{
        resultText = targetData.actor.data.name + game.i18n.localize('POWER_LARVAEBOILS.CHAT_FAILURE');
    }

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: introText,
        introImg: actor.data.img,
        targetText: game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name,
        subText: ability.name + " (" + functionStuff.powerLvl.lvlName + ")",
        subImg: ability.img,
        hasRoll: hasRoll,
        rollString: `${rollData[0].actingAttributeLabel} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: resultText,
        finalText: finalText
    }
    if(autoParams != ""){templateData.subText += ", " + autoParams};
    if(targetData.autoParams != ""){templateData.targetText += ", " + targetData.autoParams};


    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
    let flagDataArray;
    if(!isMaintained){
        flagDataArray = [{
            tokenId: targetData.token.data._id,
            addEffect: "systems/symbaroum/asset/image/bug.png",
            effectDuration: 1
        }, {
            tokenId: targetData.token.data._id,
            toughnessChange: finalDamage*-1
        }];
    }
    else if(!rollData[0].hasSucceed){   
        flagDataArray = [{
            tokenId: targetData.token.data._id,
            removeEffect: "systems/symbaroum/asset/image/bug.png",
        }]
    }else{
        flagDataArray = [{
            tokenId: targetData.token.data._id,
            toughnessChange: finalDamage*-1
        }];
    }
    await createModifyTokenChatButton(flagDataArray);
}

async function loremaster(ability, actor) {
    
    let targetData = {hasTarget : false};
    let powerLvl = getPowerLevel(ability);
    const attribute = actor.data.data.attributes["cunning"];
    let rollData = [];
    rolldata.push(await baseRoll(actor, "cunning", null, null, 0, 0));

    let templateData = {
        targetData : targetData,
        hasTarget : targetData.hasTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${game.i18n.localize(attribute.label)} : (${rollData[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_SUCCESS'),
        finalText: ""
    }; 
    if(!rolldata[0].hasSucceed){templateData.resultText = actor.data.name + game.i18n.localize('ABILITY_LOREMASTER.CHAT_FAILURE')};

    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    ChatMessage.create(chatData);
}

function medicus(ability, actor) {

    let targetData;
    try{targetData = getTarget()} catch(error){
        targetData = {hasTarget : false}
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

    let rollData = [];
    rollData.push(await baseRoll(actor, "cunning", null, null, 0, 0));
    let healed = 0;
    let flagData;
    if(rolldata[0].hasSucceed){

        let healRoll = new Roll(healFormula).evaluate();
        healRoll.toMessage();
        healed = healRoll.total;
        if(targetData.hasTarget){
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
            if(targetData.hasTarget){
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
        hasTarget : targetData.hasTarget,
        introText: actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_INTRO'),
        introImg: actor.data.img,
        targetText: "",
        subText: ability.name + ", " + powerLvl.lvlName,
        subImg: ability.img,
        hasRoll: true,
        rollString: `${game.i18n.localize(rolldata[0].actingAttributeLabel)} : (${rolldata[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('ABILITY_MEDICUS.CHAT_SUCCESS'),
        finalText: game.i18n.localize('ABILITY_MEDICUS.CHAT_FINAL') + healed.toString()
    };
    if(targetData.hasTarget){
        templateData.targetText = game.i18n.localize('ABILITY_MEDICUS.CHAT_TARGET') + targetData.actor.data.name;
    }

    if(herbalCure){templateData.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.HERBALCURE')}
    else{templateData.subText += ", " + game.i18n.localize('ABILITY_MEDICUS.NOHERBALCURE')};
    if(!rolldata[0].hasSucceed){templateData.resultText = game.i18n.localize('ABILITY_MEDICUS.CHAT_FAILURE')}
    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }
    await ChatMessage.create(chatData);
    if(flagData){
        await createModifyTokenChatButton([flagData]);
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
        targetData = {hasTarget: false};
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
        rollString: `${game.i18n.localize(rolldata[0].actingAttributeLabel)} : (${rolldata[0].actingAttributeValue})`,
        rollResult : formatRollResult(rollData),
        resultText: actor.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_SUCCESS'),
        finalText: "",
        haveCorruption: true,
        corruptionText: ""
    };
    if(targetData.hasTarget){
        templateData.targetText = game.i18n.localize('ABILITY.CHAT_TARGET_VICTIM') + targetData.actor.data.name;
        if(rolldata[0].hasSucceed){
            templateData.finalText = game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL1') + targetData.actor.data.name + game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FINAL2') +  targetData.actor.data.data.bio.shadow;
        }
    }
    let corruptionRoll = new Roll("1d4").evaluate();
    corruptionRoll.toMessage();
    templateData.corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruptionRoll.total.toString();

    if(!rolldata[0].hasSucceed){templateData.resultText = game.i18n.localize('ABILITY_WITCHSIGHT.CHAT_FAILURE')}
    
    const html = await renderTemplate("systems/symbaroum/template/chat/ability.html", templateData);
    const chatData = {
        user: game.user._id,
        content: html,
    }

    await ChatMessage.create(chatData);
    let flagData = {
        tokenId: selectedToken.data._id,
        corruptionChange: corruptionRoll.total
    }

    await createModifyTokenChatButton([flagData]);
}