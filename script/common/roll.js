import { getPowerLevel } from './item.js';

export async function rollAttribute(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier, armor, weapon, advantage, damModifier) {
  let dam = "";	

  let hasWeapon = weapon != null;
  let weaponResults = {
    value:0,
    name: "",
    message: "",
    diceBreakdown: "",
    img: ""

  };
  let hasArmor = armor != null;
  let armorResults = {
    value: 0,
    name: "",
    message: "",
    diceBreakdown: ""
  };

	if(hasWeapon && advantage ) { modifier +=2 }
  else if (hasArmor && advantage) { modifier -=2; }
  
	if(hasWeapon && weapon.qualities.precise) {		
		modifier++;
  }
  
  let rollResults = await baseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier);
  
  if (hasArmor && !rollResults.hasSucceed) {
    if (armor.protectionPc !== '') {
      let prot = armor.protectionPc;
      let armorRoll = new Roll(prot, {});
      
      armorRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(armorRoll, game.user, true);
      }
      
      armorResults.name = armor.armor;
      armorResults.value = armorRoll.total;
      armorResults.diceBreakdown = formatDice(armorRoll.terms,"+");
    }
  }

  if (hasWeapon && rollResults.hasSucceed) {
    dam = weapon.damage.pc;
    if (dam !== '') {
      if ( advantage ) { dam += "+1d4["+game.i18n.localize('ROLL.ADVANTAGESHORT')+"]"; }
      if ( rollResults.critSuccess ) { dam += "+1d6["+game.i18n.localize('ROLL.CRITSHORT')+"]"; }
      if( damModifier !== '') { dam = dam+"+"+damModifier; }
      

      let weaponRoll = new Roll(dam, {});
      weaponRoll.roll();
      let tooltip = await weaponRoll.getTooltip();
      
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(weaponRoll, game.user, true);
      }
      
      weaponResults.value = weaponRoll.total;
      weaponResults.name = weapon.name; 
      weaponResults.diceBreakdown = tooltip;

      weaponResults.img = weapon.img;
    }
  }
  

 if( !hasWeapon && !hasArmor && !game.settings.get('symbaroum', 'critsApplyToAllTests') ) {
    rollResults.critSuccess = rollResults.critFail = false;
  } 
  
  let finalMod = modifier - getAttributeValue(targetActor, targetAttributeName) + 10;

  let rollData = {
    subImg: actor.data.img,
    name: `${getAttributeLabel(actor, actingAttributeName) } (${ getAttributeValue(actor, actingAttributeName) }) ⬅ ${getAttributeLabel(targetActor, targetAttributeName)} (${finalMod})`,
    margin: (rollResults.diceTarget - rollResults.diceResult),
    hasSucceed: rollResults.hasSucceed,
    diceResult: rollResults.diceResult,
    diceBreakdown: rollResults.diceBreakdown,
    diceTarget: rollResults.diceTarget,
    hasArmor: hasArmor,
    hasWeapon: hasWeapon,
    armor: armorResults,
    weapon: weaponResults,
    critSuccess: rollResults.critSuccess,
    critFail: rollResults.critFail
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/roll.html', rollData);
  let chatData = {
    user: game.user.id,
    speaker: {
			actor: actor.id
	},
    rollMode: game.settings.get('core', 'rollMode'),
    content: html,
  };
  if (['gmroll', 'blindroll'].includes(chatData.rollMode)) {
    chatData.whisper = ChatMessage.getWhisperRecipients('GM');
  } else if (chatData.rollMode === 'selfroll') {
    chatData.whisper = [game.user];
  }
  ChatMessage.create(chatData);
  return(rollData);
}

export async function deathRoll(sheet) {
  let death = new Roll('1d20', {});
  death.roll();
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(death, game.user, true);
  }
  let hasSucceed = death._total >= 2 && death._total <= 10;
  let isCriticalSuccess = death._total === 1;
  if (!hasSucceed) sheet.nbrOfFailedDeathRoll++;
  if (isCriticalSuccess) sheet.nbrOfFailedDeathRoll = 0;
  let heal = new Roll('1d4', {});
  heal.roll();
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(heal, game.user, true);
  }
  let rollData = {
    isCriticalSuccess: isCriticalSuccess,
    healing: heal._total,
    isCriticalFailure: death._total === 20 || sheet.nbrOfFailedDeathRoll >= 3,
    hasSucceed: hasSucceed,
    nbrOfFailure: sheet.nbrOfFailedDeathRoll,
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/death.html', rollData);
  let chatData = {
    user: game.user.id,
    rollMode: game.settings.get('core', 'rollMode'),
    content: html,
  };
  if (['gmroll', 'blindroll'].includes(chatData.rollMode)) {
    chatData.whisper = ChatMessage.getWhisperRecipients('GM');
  } else if (chatData.rollMode === 'selfroll') {
    chatData.whisper = [game.user];
  }
  ChatMessage.create(chatData);
}

//this function returns the localized name, and also accept defense.
export function getAttributeLabel(actor, attributeName) {
  if (attributeName === 'custom') {
    return (game.i18n.localize("ATTRIBUTE.CUSTOM"));
  }
  else if (attributeName === 'defense') {
    return (game.i18n.localize("ARMOR.DEFENSE"));
  } else {
      return (game.i18n.localize(actor.data.data?.attributes[attributeName].label));
  }
}

//this function returns the value of the attribute, modified by the its bonus, and also accept defense.
export function getAttributeValue(actor, attributeName) {
  if (attributeName === 'custom') {
    return 10;
  }
  if (attributeName === 'defense') {    
    return actor.data.data.combat.defense;
  } else {
    return actor.data.data?.attributes[attributeName].total;
  }
}

/*Base roll, to be use for self rolls, resisted rolls, attack rolls, defense rolls...
* @param {actor object} actor is the actor that do the roll (usually a PC)
* @param {string} actingAttribute is the name of the attribute used for action, and can also be "defense"
* @param {actor object} targetactor is the resisting actor, or null for a self roll
* @param {string} targetAttribute is the attribute used for resisting, and can also be defense, or null for a self roll.
* @param {number} Favour is for situation where you roll 2d20 and keep one:
    favour < 0 means keep the worst (for example, actor is cursed)
    favour > 0 means keep the best (for exemple, actor uses hunter's instinct, or target is cursed)
    favour = 0 is the usual situation, just roll 1d20
* @param {number} modifier is the modifier to the roll. A negative modifier is an hindrance, a positive one is a boon*/
/*@returns:
  {number}   actingAttributeValue, //final acting attribute value
  {string}  actingAttributeLabel   //
  {number}   resistAttributeValue, //final opposing attribute value or 0
  {string}  targetAttributeLabel
  {boolean}   hasSucceed,  // true = success
  {number}   diceResult,  // the result of the kept dice
  {number}   diceTarget, // The final target
  {number}   favour (same as @Params)
  {number}   modifier (same as @Param)
  {array}   dicesResult,  //if favour/unfavour, an array of the results of the 2 thrown dice, or null
  {string}  diceBreakdown, //HTML formatted string
  {boolean}  critSuccess,
  {boolean}  critFail, */
export async function baseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier) {
  let d20str = "1d20";
  let hasSucceed = false;
  let critGood = false;
  let critBad = false;
  let diceBreakdown = "";
  if(modifier == null){modifier = 0};
  
	if(favour > 0) d20str="2d20kl";
	else if(favour < 0) d20str="2d20kh";
  
  let attributeRoll = new Roll(d20str).evaluate();  
  
  let dicesResult;
  if(favour != 0){ 
    dicesResult = [attributeRoll.terms[0].results[0].result, attributeRoll.terms[0].results[1].result]
  };
  
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(attributeRoll, game.user, true);
  }
  
  diceBreakdown = formatDice(attributeRoll.terms,"+");

  let actingAttributeValue = getAttributeValue(actor, actingAttributeName);
  let actingAttributeLabel = getAttributeLabel(actor, actingAttributeName);

  let diceTarget = actingAttributeValue + modifier;
  
  let targetAttributeLabel;
  let resistAttributeValue = 0;

  if(targetActor && targetAttributeName){
    resistAttributeValue = getAttributeValue(targetActor, targetAttributeName);
    targetAttributeLabel = getAttributeLabel(targetActor, targetAttributeName);
    diceTarget += (10 - resistAttributeValue);
  }

  if(game.settings.get('symbaroum', 'alwaysSucceedOnOne') || game.settings.get('symbaroum', 'optionalCrit') || game.settings.get('symbaroum', 'optionalRareCrit')  ) {
    diceTarget = Math.min(Math.max(1,diceTarget), 19);
  }  

  if(attributeRoll.total <= diceTarget){
    hasSucceed = true;
  }
   
  // Check option - always succeed on 1, always fail on 20
	if(game.settings.get('symbaroum', 'optionalCrit') || game.settings.get('symbaroum', 'optionalRareCrit') ) {     
    if( attributeRoll.total === 1 || attributeRoll.total === 20 ) {
      if( game.settings.get('symbaroum', 'optionalCrit') ) {
          critBad = attributeRoll.total === 20;
          critGood = !critBad;
      }    
      if( game.settings.get('symbaroum', 'optionalRareCrit') ) {
        let secondRoll = new Roll("1d20").evaluate();        
        critGood = critGood && secondRoll.total <= diceTarget;
        critBad = critBad && secondRoll.total > diceTarget;
        diceBreakdown = `${diceBreakdown} &amp; <span class="${critGood?"critical":critBad?"fumble":"normal"}">${secondRoll.results}</span>`;
      }
    }
	}

  return({
    actingAttributeValue: actingAttributeValue,
    actingAttributeLabel: actingAttributeLabel,
    resistAttributeValue: resistAttributeValue,
    targetAttributeLabel: targetAttributeLabel,
    hasSucceed: hasSucceed,
    diceTarget: diceTarget,
    diceResult: attributeRoll.total,
    hasDamage: false,
    favour: favour,
    modifier: modifier,
    dicesResult: dicesResult,
    diceBreakdown: diceBreakdown,    
    critSuccess: critGood,
    critFail: critBad
  });
}

/*chatMessage that contain a button for the GM to apply status icons or damage to a token.
will be intercepted by a hook (see hook.js)
The actions to do on the token and its actor have to be detailled in the actionsData object:
* @param actionsDataArray is an array of actionData
ActionData = {
    tokenId: {string} the id of the token that will be modified (ex: token.data.id),
    
To add a status effect    
    addEffect: {string}  Path to the icon (ex:"icons/svg/daze.svg"),
    effectDuration: (number)  Duration of the effect (default: 1),

To remove a status effect    
    removeEffect: {string}  Path to the icon (ex:"icons/svg/daze.svg"),

To apply damage or healing on the token
    toughnessChange: {number}   the value to add to toughness: >0 for healing, <0 for damage

To apply temporary corruption on the token
    corruptionChange: {number}   the value to add to temporary corruption
}
*/
export async function createModifyTokenChatButton(actionsDataArray){
  game.symbaroum.emit(
    { 
      type: "GMMessage",
      data: actionsDataArray
    });
}

/*formatDice produces a string of any rolls with any ignored dice within a css class of .strike
@param diceResults is the dice terms containing all the dice rolled, including rare crit notifier
@param separator the chosen separator to use between dice

*/
function formatDice(diceResult, separator) {
	let rolls = "";
  
	for( let dd of diceResult ) {
    if (typeof dd === 'string' || Number.isInteger(dd) ) {
			rolls += dd;
    } else if( dd instanceof OperatorTerm) {
        rolls += dd.operator;
    } else if( dd instanceof NumericTerm) {
        rolls += dd.number;
		} else {
      if( dd.modifiers === undefined || dd.modifiers === null ) {
        continue;
      }
      let tmpSep = separator;
      
      if( dd.modifiers.includes("kl") || dd.modifiers.includes("kh") ) {
        tmpSep = " | ";
      }
			let j = 0;
			for( let diceDetails of dd.results) {
				if( j > 0 && tmpSep != null) {
					rolls += tmpSep;
				}
				if(diceDetails.active ) {
          rolls += diceDetails["result"];	
				} else {
					rolls += "<span class='strike'>"+diceDetails["result"]+"</span>";
				}
				j++;
			}
		}
		
	}
	return rolls;
}

/*function for evaluating Damage

****************this function needs damage and armor parameters as dice (ie: weapon.data.data.damage = "1d8")
for the NPC side, it will transform those parameters as NPC fixed values using the formula (dice maximum value)/2
It won't work with NPC fixed values as input

* @param {boolean} attackFromPC true: the actor that does damage is a PC; false : the damage is done by a NPC
* @param {actor object} actor  is the actor that does damage
* @param {item object} weapon is the weapon that is used
* @param {{isRanged: boolean, useBackstab: boolean, hasAdvantage: boolean, ignoreArm: boolean, modifier: string}} dmgData is an object of damage parameters.
* @param {object} targetData is information on the target that will receive the damage (as returned by the getTarget function)
* @param {boolean} critSuccess  for optional bonus damage on crits
* @param {integer} attack number - if > 0 some bonuses won't apply*/

export async function damageRollWithDiceParams(functionStuff, critSuccess, attackNumber){
  let newRollDmgString = "";  // for dice modificators like +1d4
  let modFixedDmg = 0;  // for fixed modificators like +1
  let damageAutoParams = "";
  let dmgData = functionStuff.dmgData;
  let damageModFormula = dmgData.modifier;
  if(damageModFormula != ""){
    damageModFormula += "[" + game.i18n.localize('DIALOG.DAMAGE_MODIFIER') + "]";
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_CUSTOM');
  }

  //if(dmgData.isRanged){
    if(dmgData.hunterIDmg){
      damageModFormula += " + 1d4" + game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_HUNTER");
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_HUNTER');
    }
  
  if(dmgData.hasAdvantage){
    if(dmgData.useBackstab && !attackNumber){
      damageModFormula += " + 2d4["+game.i18n.localize("ABILITY_LABEL.BACKSTAB")+"]";
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_BACKSTAB');
    }
    else
    {
      damageModFormula += " + 1d4"+game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_ADVANTAGE");
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_ADVANTAGE');
    }
  }
  if(functionStuff.beastLoreData.useBeastlore){
    if(functionStuff.beastLoreData.beastLoreMaster) damageModFormula += " + 1d6[" + game.i18n.localize('ABILITY_LABEL.BEAST_LORE') + "]";
    else damageModFormula += " + 1d4[" + game.i18n.localize('ABILITY_LABEL.BEAST_LORE') + "]";
    damageAutoParams += " [" + game.i18n.localize('ABILITY_LABEL.BEAST_LORE') + "] ";
  }
  if(dmgData.useRobustDmg && !attackNumber){
    let robustLvl = 0;
    let robust = functionStuff.actor.items.filter(element => element.data.data.reference === "robust");
    if(robust.length > 0){
        let powerLvl = getPowerLevel(robust[0]);
        robustLvl = powerLvl.level;
        if(robustLvl == 1){
          damageModFormula += "+1d4["+game.i18n.localize("TRAIT_LABEL.ROBUST")+"]";
        }
        else if(robustLvl == 2){
          damageModFormula += "+1d6["+game.i18n.localize("TRAIT_LABEL.ROBUST")+"]";
        }
        else if(robustLvl > 2){
          damageModFormula += "+1d8["+game.i18n.localize("TRAIT_LABEL.ROBUST")+"]";
        }
        damageAutoParams += " [" + game.i18n.localize('TRAIT_LABEL.ROBUST') + "] ";
    }
  }
  if(functionStuff.ironFistDmg){
    if(functionStuff.ironFistDmgMaster && !attackNumber){
      damageModFormula += "+1d8["+game.i18n.localize("ABILITY_LABEL.IRON_FIST")+"]";
    }
    else{
      damageModFormula += "+1d4["+game.i18n.localize("ABILITY_LABEL.IRON_FIST")+"]";
    }
  }
  if(functionStuff.targetData.leaderTarget){
    damageModFormula += " + 1d4" + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
  }
  if(critSuccess) { damageModFormula += "+ 1d6[crit.]"}

  if(dmgData.ignoreArm){
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR');
  }
    // If the attack is made by a PC, roll damage and substract static value for armor (=max armor/2)
    if(functionStuff.attackFromPC){  
      //build roll string
      newRollDmgString = functionStuff.weapon.damage.pc;
      if(damageModFormula != ""){
        newRollDmgString += damageModFormula
      }
      if(modFixedDmg) {newRollDmgString += "+"+ modFixedDmg.toString()};
      if(!dmgData.ignoreArm){
        newRollDmgString += " - " + functionStuff.targetData.actor.data.data.combat.protectionNpc.toString();
      }
    }
    else{
      // If the attack is made by a NPC, evaluate static value for damage (=max damage/2) then roll armor and substract
     //build roll string
      newRollDmgString = functionStuff.weapon.damage.npc.toString();
      if(modFixedDmg) {newRollDmgString += "+"+ modFixedDmg.toString()};
      if(damageModFormula != ""){
        let weaponModRoll= new Roll(damageModFormula).evaluate({maximize: true});
        let weaponModDmgValue = Math.ceil(weaponModRoll.total/2);
        newRollDmgString += "+"+ weaponModDmgValue.toString(); 
      }
      if(!dmgData.ignoreArm && functionStuff.targetData.actor.data.data.combat.protectionPc != 0){
        if(functionStuff.weapon.damage.damageFavour){
          newRollDmgString += " - (" + functionStuff.targetData.actor.data.data.combat.unfavourPcProt + ")";
        }
        else newRollDmgString += " - (" + functionStuff.targetData.actor.data.data.combat.protectionPc + ")";
      }
      else newRollDmgString += " - 0";
    }
    // final damage
    console.log(newRollDmgString);
    let dmgRoll= new Roll(newRollDmgString).evaluate();

    return{
    roll : dmgRoll,
    diceResult: dmgRoll.total,
    autoParams : damageAutoParams,
    favour: 0
  }
}

/* like damageRollWithDiceParams, but for spell damage and such */
export async function simpleDamageRoll(functionStuff, damageFormula){
  if(functionStuff.dmgData.modifier != ""){
    damageFormula += functionStuff.dmgData.modifier + "[" + game.i18n.localize('DIALOG.DAMAGE_MODIFIER') + "]";
  }
  if(functionStuff.beastLoreData.useBeastlore){
    if(functionStuff.beastLoreData.beastLoreMaster) damageFormula += " + 1d6[" + game.i18n.localize('ABILITY_LABEL.BEAST_LORE') + "]";
    else damageFormula += " + 1d4[" + game.i18n.localize('ABILITY_LABEL.BEAST_LORE') + "]";
  }
  if(functionStuff.dmgData.hasAdvantage){
    damageFormula += " + 1d4"+game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_ADVANTAGE");
  }
  if(functionStuff.targetData.leaderTarget){
    damageFormula += " + 1d4" + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
  }
  // If the attack is made by a PC, roll damage and substract static value for armor (=max armor/2)
  let newRollDmgString = "";
  if(functionStuff.attackFromPC){
    newRollDmgString = damageFormula;
    //build roll string
    if(!functionStuff.dmgData.ignoreArm){
      newRollDmgString += " - " + functionStuff.targetData.actor.data.data.combat.protectionNpc.toString();
    }
  }
  else{
    // If the attack is made by a NPC, evaluate static value for damage (=max damage/2) then roll armor and substract
    let weaponRoll= new Roll(damageFormula).evaluate({maximize: true});
    let weaponDmgValue = Math.ceil(weaponRoll.total/2);

   //build roll string
    newRollDmgString = weaponDmgValue.toString();
    if(!functionStuff.dmgData.ignoreArm){
      newRollDmgString += " - (" + functionStuff.targetData.actor.data.data.combat.protectionPc + ")";
    }
  }
  // final damage
  let dmgRoll= new Roll(newRollDmgString).evaluate();
  return{
    roll : dmgRoll,
    diceResult: dmgRoll.total,
    autoParams : "",
    favour: 0
  }
}

export function upgradeDice(formula, level){
  let formulaArray = formula.split("d");
  if(formulaArray.length != 2)
  {
    return(formula)
  }
  let formula2ndArray = formulaArray[1].split("k");
  let diceValue = parseInt(formula2ndArray[0], 10);
  diceValue += 2*level;
  let NewFormula = formulaArray[0] + "d" + diceValue.toString();
  if(formula2ndArray.length > 1){
    NewFormula += "k" + formula2ndArray[1]
  }
  return(NewFormula)
}
