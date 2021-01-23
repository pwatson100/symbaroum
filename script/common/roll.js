export async function rollAttribute(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier, armor, weapon, advantage, damModifier) {
  let dam = "";	

  let hasWeapon = weapon != null;
  let weaponResults = {
    value:0,
    name: "",
    message: "",
    diceBreakdown: ""

  };
  let hasArmor = armor != null;
  let armorResults = {
    value: 0,
    name: "",
    message: "",
    diceBreakdown: ""
  };

	if(hasWeapon && advantage ) { modifier +=2 }
  else if (hasArmor && advantage) { modifier =-2; }
  
	if(hasWeapon && weapon.data.data.qualities.precise) {		
		modifier++;
  }
  
  let rollResults = await baseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier);
  
  if (hasArmor && !rollResults.hasSucceed) {
    if (armor.protection !== '') {
      let prot = armor.protection;
      /* if( armor.qualties.reinforced ) { prot += "+1[reinforced]"; } */
      let armorRoll = new Roll(prot, {});
      
      armorRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(armorRoll);
      }
      
      armorResults.name = armor.armor;
      armorResults.value = armorRoll.total;
    }
  }

  if (hasWeapon && rollResults.hasSucceed) {
    dam = weapon.data.data.damage;
    if (dam !== '') {
      if ( advantage ) { dam += "+1d4[advantage]"; }
      if ( rollResults.critSuccess ) { dam += "+1d6[critical]"; }
      if( weapon.data.data.qualities.deepImpact ) { dam += "+1[deep impact]"; }
      if( damModifier !== '') { dam = dam+"+"+damModifier; }
      

      let weaponRoll = new Roll(dam, {});
      weaponRoll.roll();
      
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(weaponRoll);
      }
      console.log("Weapon roll is:"+JSON.stringify(weapon)+":");
      weaponResults.value = weaponRoll.total;
      weaponResults.name = weapon.name;      
    }
  }
  

 if( !hasWeapon && !hasArmor && !game.settings.get('symbaroum', 'critsApplyToAllTests') ) {
    rollResults.critSuccess = rollResults.critFail = false;
  } 
  
  let finalMod = modifier - getAttributeValue(targetActor, targetAttributeName) + 10;

  let rollData = {
    name: `${getAttributeLabel(actor, actingAttributeName) } (${ getAttributeValue(actor, actingAttributeName) }) ⬅ ${getAttributeLabel(targetActor, targetAttributeName)} (${finalMod})`,
    hasSucceed: rollResults.hasSucceed,
    diceResult: rollResults.diceResult,
    hasArmor: hasArmor,
    hasWeapon: hasWeapon,
    armor: armorResults,
    weapon: weaponResults,
    critSuccess: rollResults.critSuccess,
    critFail: rollResults.critFail
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/roll.html', rollData);
  let chatData = {
    user: game.user._id,
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
    await game.dice3d.showForRoll(death);
  }
  let hasSucceed = death._total >= 2 && death._total <= 10;
  let isCriticalSuccess = death._total === 1;
  if (!hasSucceed) sheet.nbrOfFailedDeathRoll++;
  if (isCriticalSuccess) sheet.nbrOfFailedDeathRoll = 0;
  let heal = new Roll('1d4', {});
  heal.roll();
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(heal);
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
    user: game.user._id,
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
  {number}   favour (same as @Params)
  {number}   modifier (same as @Param)
  {array}   dicesResult,  //if favour/unfavour, an array of the results of the 2 thrown dice, or null
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
    await game.dice3d.showForRoll(attributeRoll);
  }
  
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

  if(game.settings.get('symbaroum', 'alwaysSucceedOnOne') ) {
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
      }
    }
	}

  return({
    actingAttributeValue: actingAttributeValue,
    actingAttributeLabel: actingAttributeLabel,
    resistAttributeValue: resistAttributeValue,
    targetAttributeLabel: targetAttributeLabel,
    hasSucceed: hasSucceed,
    diceResult: attributeRoll.total,
    favour: favour,
    modifier: modifier,
    dicesResult: dicesResult,
    critSuccess: critGood,
    critFail: critBad
  });
}

/*chatMessage that contain a button for the GM to apply status icons or damage to a token.
will be intercepted by a hook (see hook.js)
The actions to do on the token and its actor have to be detailled in the actionsData object:
* @param actionsDataArray is an array of actionData
ActionData = {
    tokenId: {string} the id of the token that will be modified (ex: token.data._id),
    
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

  const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.html");
  let gmList =  ChatMessage.getWhisperRecipients('GM');
  if(gmList.length > 0){
    const chatData = {
        user: game.user._id,
        content: html,
        whisper: gmList,
        blind: true
    }
    let NewMessage = await ChatMessage.create(chatData);
    await NewMessage.setFlag(game.system.id, 'abilityRoll', actionsDataArray);
  }
}

/*formatDice produces a string of any rolls with any ignored dice within a css class of .strike
@param diceResults is the dice results containing all the dice rolled, including rare crit notifier
@param separator the chosen separator to use between dice

*/
function formatDice(diceResult, separator) {
	let rolls = "";
	for( let dd of diceResult ) {
		if (typeof dd === 'string' || Number.isInteger(dd) ) {
			rolls += dd;
		} else {
			let j = 0;
			for( let diceDetails of dd.results) {
				if( j > 0 && separator != null) {
					rolls += separator;
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
* @param {object} targetData is information on the target that will receive the damage (as returned by the getTarget function)*/

export async function damageRollWithDiceParams(attackFromPC, actor, weapon, dmgData, targetData){
  
  let newRollDmgString = "";
  let wepDmg = weapon.data.data.damage;
  let modDmg = 0;
  let armorProt = targetData.actor.data.data.combat.protection;   

  let damageAutoParams = game.i18n.localize('COMBAT.CHAT_DMG_PARAMS');
  if(dmgData.isRanged){
    if(dmgData.hunterIDmg){
      dmgData.modifier += " + 1d4";
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_HUNTER');
    }
  }

  if(dmgData.modifier != "0"){
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_CUSTOM');
  }

  if(dmgData.hasAdvantage){
    if(dmgData.useBackstab){
      dmgData.modifier += " + 2d4";
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_BACKSTAB');
    }
    else
    {
      dmgData.modifier += " + 1d4";
      damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_ADVANTAGE');
    }
  }
  if(targetData.leaderTarget){
    dmgData.modifier += " + 1d4";
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
  }
  if(weapon.data.data.qualities.deepImpact){
    modDmg = modDmg + 1;
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_DEEPIMPACT');
  }
  if(dmgData.ignoreArm){
    damageAutoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR');
  }

  // If the attack is made by a PC, roll damage and substract static value for armor (=max armor/2)
  if(attackFromPC){
    // evaluate NPC armor value
    let armorRoll= new Roll(armorProt).evaluate({maximize: true});
    let armorValue = Math.ceil(armorRoll.total/2);

    //build roll string
    newRollDmgString = wepDmg + " + " + dmgData.modifier + " + " + modDmg;
    if(!dmgData.ignoreArm){
      newRollDmgString += " - " + armorValue;
    }
  }
  else{
    // If the attack is made by a NPC, evaluate static value for damage (=max damage/2) then roll armor and substract
    wepDmg += " + " + dmgData.modifier;
    let weaponRoll= new Roll(wepDmg).evaluate({maximize: true});
    let weaponDmgValue = Math.ceil(weaponRoll.total/2);

   //build roll string
    newRollDmgString = weaponDmgValue + " + " + modDmg.toString(); 
    if(!dmgData.ignoreArm){
      newRollDmgString += " - " + armorProt;
    }
  }
  // final damage
  let dmgRoll= new Roll(newRollDmgString).evaluate();

  return{
    roll : dmgRoll,
    diceResult: dmgRoll.total,
    autoParams : damageAutoParams,
    favour: 0
  }
}
