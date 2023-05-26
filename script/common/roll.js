
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
    diceBreakdown: "",
    img: ""
  };

	if(hasWeapon && advantage ) { modifier +=2 }
  else if (hasArmor && advantage) { modifier -=2; }
  
  let rollResults = await baseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier, false);
  let rolls = rollResults.rolls;

  if (hasArmor && !rollResults.hasSucceed) {
    if (armor.protectionPc !== '') {
      let prot = armor.protectionPc;
      let armorRoll = new Roll(prot, {}).evaluate({async:false});
      rolls.push(armorRoll);
    
      armorResults.id = armor.id;
      armorResults.name = armor.name;
      armorResults.value = armorRoll.total;
      armorResults.diceBreakdown = await armorRoll.getTooltip();
      armorResults.img = armor.img;
    }
  }

  if (hasWeapon && rollResults.hasSucceed) {
    dam = `${weapon.damage.base}[${weapon.name}]`;
    if (dam !== '') {
      if ( advantage ) { dam += "+1d4["+game.i18n.localize('ROLL.ADVANTAGESHORT')+"]"; }
      if ( rollResults.critSuccess ) { dam += "+1d6["+game.i18n.localize('ROLL.CRITSHORT')+"]"; }
      if( damModifier !== '') { dam = dam+"+"+damModifier; }
      

      let weaponRoll = new Roll(dam, {}).evaluate({async:false});
      rolls.push(weaponRoll);
      
      let tooltip = await weaponRoll.getTooltip();
      
      weaponResults.id = weapon.id;
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

  let tokenList = actor.getActiveTokens();
  let actingToken = tokenList[0];
  let actingCharName= actingToken?.name ?? actor.name;
  let actingCharImg= actingToken?.document.actorLink ? actor.img : actingToken?.document?.texture.src ?? actor.img;
  let rollData = {
    subImg: actingCharImg,
    name: `${game.symbaroum.api.getAttributeLabel(actor, actingAttributeName) } (${ getAttributeValue(actor, actingAttributeName) }) ⬅ ${game.symbaroum.api.getAttributeLabel(targetActor, targetAttributeName)} (${finalMod})`,
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

  // Once we go to non-API version of DsN, then set this in chatData: type: CONST.CHAT_MESSAGE_TYPES.ROLL,
  let chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({ 
      alias: actingCharName,
      actor: actor.id
    }),
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: JSON.stringify(createRollData(rolls)),
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

export function createRollData(rolls) 
{
  // game.symbaroum.log(rolls); // TODO
  let finalRolls = [];
  let rollCount = 1;
  for(let i = 0; i < rolls.length; i++) {
    if( rolls[i] === undefined || rolls[i] === null)
    {
      continue;
    }
    for(let j = 0; j < rolls[i].dice.length; j++) {
      rolls[i].dice[j].options.rollOrder = rollCount;
    }
    finalRolls.push(rolls[i]);  
    rollCount++;
  }
  let pool = PoolTerm.fromRolls(finalRolls);
  // game.symbaroum.log(pool); // TODO
  return Roll.fromTerms([pool]);
}

export async function rollDeathTest(actor, withFavour, modifier) {
  let rolls = [];
  let death = new Roll('1d20', {});
  let favour = 0;
  let dicesResult;
  if( withFavour === "1") {
    favour = 1;
    death = new Roll('2d20kl', {});
    dicesResult= [death.terms[0].results[0].result, death.terms[0].results[1].result];
  } else if( withFavour === "-1") {
    favour = -1;
    death = new Roll('2d20kh', {});
    dicesResult= [death.terms[0].results[0].result, death.terms[0].results[1].result];
  }

  death.evaluate({async:false});
  rolls.push(death);
  let hasSucceed = death.total <= 10+modifier;
  let finalMod = game.settings.get('symbaroum', 'enhancedDeathSaveBonus') ? modifier:0;
  let isCriticalSuccess = death.total <= (1+finalMod);
  let heal = null;
  let nbrOfFailedDeathRoll = actor.system.nbrOfFailedDeathRoll;
  let rollResult = game.symbaroum.api.formatRollResult({favour: favour, diceResult: death.total, dicesResult: dicesResult});
  if (!hasSucceed) nbrOfFailedDeathRoll = Math.min(3, nbrOfFailedDeathRoll+1);
  if (isCriticalSuccess) {
    nbrOfFailedDeathRoll = 0;
    heal = new Roll('1d4', {}).evaluate({async:false});
    rolls.push(heal);
  }
  let diceBreakdown = formatDice(death.terms,"+");
  let rollData = {
    actor: actor,
    isCriticalSuccess: isCriticalSuccess,
    rollResult: rollResult,
    modifier: finalMod,
    healing: heal?.total,
    isCriticalFailure: death.total === 20 || nbrOfFailedDeathRoll >= 3,
    hasSucceed: hasSucceed,
    nbrOfFailure: nbrOfFailedDeathRoll,
    diceBreakdown: diceBreakdown
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/death.html', rollData);
  let chatData = {
    user: game.user.id,
    speaker: {
			actor: actor.id
    },
    type: CONST.CHAT_MESSAGE_TYPES.ROLL,
    roll: JSON.stringify(createRollData(rolls)),
    rollMode: game.settings.get('core', 'rollMode'),
    content: html,
  };
  if (['gmroll', 'blindroll'].includes(chatData.rollMode)) {
    chatData.whisper = ChatMessage.getWhisperRecipients('GM');
  } else if (chatData.rollMode === 'selfroll') {
    chatData.whisper = [game.user];
  }
  ChatMessage.create(chatData);
  if(actor.system.nbrOfFailedDeathRoll != nbrOfFailedDeathRoll) {
    await actor.update({"system.nbrOfFailedDeathRoll":nbrOfFailedDeathRoll });
  }
}

//this function returns the value of the attribute, modified by the its bonus, and also accept defense.
export function getAttributeValue(actor, attributeName) {
  if (attributeName === 'custom') {
    return 10;
  }
  if (attributeName === 'defense') {    
    return actor.system.combat.defense;
  } else {
    return actor.system.attributes[attributeName].total;
  }
}

/* Get the Players owning an actor, that is not a GM and that is connected */
export async function getOwnerPlayer(actor){
    let permissions = Object.entries(actor.ownership);
    let ownerIds = permissions.reduce((idValue, e) => {
        if(e[1] === CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER) {
            idValue.push(e[0]);
        }
        return idValue
    },[])
    let owningPlayers = game.users.filter(user => user.active && !user.isGM && ownerIds.includes(user.id));
    // game.symbaroum.log(owningPlayers);
    return(owningPlayers)
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
export async function baseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier = 0, resistRoll = false) {
  if(resistRoll){return(await doBaseRoll(targetActor, targetAttributeName, actor, actingAttributeName, -1*favour, -1*modifier, resistRoll))}
  else{return(await doBaseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier, resistRoll))}
}

async function doBaseRoll(actor, actingAttributeName, targetActor, targetAttributeName, favour, modifier, resistRoll){
  let d20str = "1d20";
  let rolls = [];

  let hasSucceed = false;
  let trueActorSucceeded = resistRoll;
  let critGood = false;
  let critBad = false;
  let diceBreakdown = "";
	if(favour > 0) d20str="2d20kl";
	else if(favour < 0) d20str="2d20kh";
  
  let attributeRoll = new Roll(d20str).evaluate({async:false});
  rolls.push(attributeRoll); // add the first attribute roll
  let dicesResult;
  if(favour != 0){ 
    dicesResult = [attributeRoll.terms[0].results[0].result, attributeRoll.terms[0].results[1].result]
  };
  
  diceBreakdown = formatDice(attributeRoll.terms,"+");

  let actingAttributeValue = getAttributeValue(actor, actingAttributeName);
  let actingAttributeLabel = game.symbaroum.api.getAttributeLabel(actor, actingAttributeName);

  let diceTarget = actingAttributeValue + modifier;
  
  let targetAttributeLabel;
  let resistAttributeValue = 0;

  if(targetActor && targetAttributeName){
    resistAttributeValue = getAttributeValue(targetActor, targetAttributeName);
    targetAttributeLabel = game.symbaroum.api.getAttributeLabel(targetActor, targetAttributeName);
    diceTarget += (10 - resistAttributeValue);
  }

  if(game.settings.get('symbaroum', 'alwaysSucceedOnOne') || game.settings.get('symbaroum', 'optionalCrit') || game.settings.get('symbaroum', 'optionalRareCrit')  ) {
    diceTarget = Math.min(Math.max(1,diceTarget), 19);
  }  

  if(attributeRoll.total <= diceTarget){
    hasSucceed = true;
    //trueActorSucceded is boolean, success from the attacker perspective. When a defending PC succeeds, trueActorSucceded === false
    trueActorSucceeded = !resistRoll;
  }

  diceBreakdown = formatDice(attributeRoll.terms,"+", hasSucceed ? "normal":"failure");
  let secondRollResult;
  // Check option - always succeed on 1, always fail on 20
	if(game.settings.get('symbaroum', 'optionalCrit') || game.settings.get('symbaroum', 'optionalRareCrit') ) {     
    if( attributeRoll.total === 1 || attributeRoll.total === 20 ) {
      //critGood and critBad below are from the attacker perspective. Hence a defending PC rolling 20 is a critGood
      if( game.settings.get('symbaroum', 'optionalCrit') ) {
          critBad = (attributeRoll.total === 20 && !resistRoll) || (attributeRoll.total === 1 && resistRoll);
          critGood = !critBad;
          let css = `${critGood?"critical":critBad?"fumble":"normal"}`;
          diceBreakdown = formatDice(attributeRoll.terms,"+", css);
      }    
      if( game.settings.get('symbaroum', 'optionalRareCrit') ) {
        //optional rare crit do a second roll.
        let secondRoll = new Roll("1d20").evaluate({async:false});
        rolls.push(secondRoll);
        secondRollResult = secondRoll.total;
        //critGood and critBad below are again from the attacker perspective.
        critGood = (critGood && (secondRoll.total <= diceTarget) && !resistRoll) || (critGood && (secondRoll.total > diceTarget) && resistRoll);
        critBad = (critBad && (secondRoll.total > diceTarget) && !resistRoll) || (critBad && (secondRoll.total <= diceTarget) && resistRoll);
        let css = `${critGood?"critical":critBad?"fumble":"normal"}`;
        diceBreakdown = formatDice(attributeRoll.terms,"+", css);
        diceBreakdown = `${diceBreakdown} &amp; <span class="symba-rolls roll d20 ${css}">${secondRoll.total}</span>`;
      }
    }
  }

  return({
    actingAttributeValue: actingAttributeValue,
    actingAttributeLabel: actingAttributeLabel,
    resistAttributeValue: resistAttributeValue,
    targetAttributeLabel: targetAttributeLabel,
    trueActorSucceeded: trueActorSucceeded,
    hasSucceed: hasSucceed,
    diceTarget: diceTarget,
    diceResult: attributeRoll.total,
    hasDamage: false,
    favour: favour,
    modifier: modifier,
    dicesResult: dicesResult,
    rollResult: game.symbaroum.api.formatRollResult({favour: favour, diceResult: attributeRoll.total, dicesResult: dicesResult, secondRollResult: secondRollResult}),
    rolls: rolls,
    toolTip: new Handlebars.SafeString(await attributeRoll.getTooltip()),
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
    tokenId: {string} the id of the token that will be modified (ex: token.id),
    
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

export async function createResistRollChatButton(functionStuff){
  //inform the GM
  const html = await renderTemplate("systems/symbaroum/template/chat/chatInfoMessage.html", {
    infoText: functionStuff.targetUserName + game.i18n.localize("CHAT.GM_INFO_RESIST")
  });
  const chatData = {
      speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
      whisper: [game.user],
      content: html
  };
  ChatMessage.create(chatData);
  //send data message to the player session
  
  const emitData = Object.assign({}, functionStuff);
  emitData.mainText= functionStuff.targetData.name + game.i18n.localize("CHAT.RESIST_TEXT_BUTTON") + game.symbaroum.api.getAttributeLabel(functionStuff.targetData.actor, functionStuff.targetData.resistAttributeName);
  emitData.actor = null;
  emitData.token = null;
  emitData.targetData.token = null;
  emitData.targetData.actor = null;
  game.symbaroum.emit({ 
      type: "ResistRoll",
      data: emitData
    });
}

/*formatDice produces a string of any rolls with any ignored dice within a css class of .strike
@param diceResults is the dice terms containing all the dice rolled, including rare crit notifier
@param separator the chosen separator to use between dice

*/
function formatDice(diceResult, separator, css = "normal") {
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
          rolls += `<span class="symba-rolls roll d20 ${css}">${diceDetails["result"]}</span>`;	
				} else {
					rolls += `<span class='symba-rolls roll d20 strike'>${diceDetails["result"]}</span>`;
				}
				j++;
			}
		}
		
	}
	return rolls;
}

/*function for evaluating Damage

it works for PC and NPC
for the PC, it builds the damage formula with tags: 1d8+1d4[advantage]+1d4[leader target]... than roll and substract NPC fixed armor
for the NPC side, it will first sum up the fixed damage 4+2+2 than roll armor and substract
It will also use parameters like ignore armor, damage favour / unfavour from weapon qualities...
*/

export async function damageRollWithDiceParams(functionStuff, critSuccess, attackNumber){
  let newRollDmgString = "";
  let damageAutoParams = functionStuff.autoParams;
  let damageModFormula = functionStuff.dmgModifier;
  let damageModNPC = functionStuff.dmgModifierNPC ?? 0;
  if(attackNumber>1){
    damageModFormula = functionStuff.dmgModifierAttackSupp;
    damageModNPC = functionStuff.dmgModifierAttackSuppNPC ?? 0;
  }
  if(functionStuff.hasAdvantage){
    damageModFormula += " +1d4"+game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_ADVANTAGE");
    damageAutoParams += ", " +game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_ADVANTAGE');
    damageModNPC += 2;
  }
  if(functionStuff.targetData.leaderTarget){
    damageModFormula += " +1d4" + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
    damageAutoParams += ", " + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
    damageModNPC += 2;
  }
  if(critSuccess) {
    //critSuccess is in the attackers perspective, so it always add damage.
    damageModFormula += " +1d6[crit.]";
    damageAutoParams += ", " + game.i18n.localize('CHAT.CRITICAL_SUCCESS');
    damageModNPC += 3;
  }
  if(functionStuff.ignoreArm){
    damageAutoParams += ", " + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR');
  }
    // If the attack is made by a PC, roll damage and substract static value for armor (=max armor/2)
    if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){  
      //build roll string
      newRollDmgString = functionStuff.weapon.damage.base;
      if(damageModFormula != ""){
        newRollDmgString += damageModFormula
      }
      if(!functionStuff.ignoreArm){
        newRollDmgString += " - " + functionStuff.targetData.actor.system.combat.protectionNpc.toString();
      }
    }
    else{
      // If the attack is made by a NPC, evaluate static value for damage (=max damage/2) then roll armor and substract
     //build roll string
      newRollDmgString = (functionStuff.weapon.damage.npcBase + damageModNPC).toString();
      if(!functionStuff.ignoreArm && functionStuff.targetData.actor.system.combat.protectionPc != 0){
        if(functionStuff.weapon.damage.damageFavour){
          newRollDmgString += " - (" + functionStuff.targetData.actor.system.combat.unfavourPcProt + ")";
        }
        else newRollDmgString += " - (" + functionStuff.targetData.actor.system.combat.protectionPc + ")";
      }
      else newRollDmgString += " - 0";
    }
    // final damage
    //console.log(newRollDmgString);
    let dmgRoll= new Roll(newRollDmgString).evaluate({async:false});

    return{
    roll : dmgRoll,
    diceResult: dmgRoll.total,
    autoParams : damageAutoParams,
    favour: 0
  }
}

/* like damageRollWithDiceParams, but for spell damage and such */
export async function simpleDamageRoll(functionStuff, damageFormula){
  if(functionStuff.dmgModifier != ""){
    damageFormula += functionStuff.dmgModifier;
  }
  if(functionStuff.hasAdvantage){
    damageFormula += " + 1d4"+game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_ADVANTAGE");
  }
  if(functionStuff.targetData.leaderTarget){
    damageFormula += " + 1d4" + game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_LEADER');
  }
  // If the attack is made by a PC, roll damage and substract static value for armor (=max armor/2)
  let newRollDmgString = "";
  if(functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster"){
    newRollDmgString = damageFormula;
    //build roll string
    if(!functionStuff.ignoreArm){
      newRollDmgString += " - " + functionStuff.targetData.actor.system.combat.protectionNpc.toString();
    }
  }
  else{
    // If the attack is made by a NPC, evaluate static value for damage (=max damage/2) then roll armor and substract
    let weaponRoll= new Roll(damageFormula).evaluate({maximize: true, async:false});
    let weaponDmgValue = Math.ceil(weaponRoll.total/2);

   //build roll string
    newRollDmgString = weaponDmgValue.toString();
    if(!functionStuff.ignoreArm){
      newRollDmgString += " - (" + functionStuff.targetData.actor.system.combat.protectionPc + ")";
    }
  }
  // final damage
  let dmgRoll= new Roll(newRollDmgString).evaluate({async:false});

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
