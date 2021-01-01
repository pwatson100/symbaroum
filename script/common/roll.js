export async function rollAttribute(character, attribute, favourmod, modifier, armor, weapon, advantage, damModifier) {
  let d20str = "1d20";
  let detailedRoll = "";
  let dam = "";
  let isMultiDice = favourmod != 0;
  let isMultiDiceCombat = false;
  let critGood = false;
  let critBad = false;
	
	if(favourmod == 1) d20str="2d20kl";
	else if(favourmod == -1) d20str="2d20kh";
  
	let attributeRoll = new Roll(d20str, {});  
  
  attributeRoll.roll();
  
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(attributeRoll);
  }

  let mod = (modifier.value - 10) * -1;

	let advantagemod = 0;
	let hasWeapon = weapon != null;
	let hasArmor = armor != null;
		 

	if(hasWeapon && advantage ) { advantagemod=2 }
	else if (hasArmor && advantage) { advantagemod=-2; }  

	if(hasWeapon && weapon.qualities.precise) {		
		mod++;
	}
	
  let diceTarget = attribute.value + mod;
   
  // Check option - always succeed on 1, always fail on 20
	if(game.settings.get('symbaroum', 'alwaysSucceedOnOne') || game.settings.get('symbaroum', 'optionalCrit') || game.settings.get('symbaroum', 'optionalRareCrit') ) { 
		diceTarget = Math.min(Math.max(1,attribute.value + mod + advantagemod), 19);
    
    if( attributeRoll._total === 1 || attributeRoll._total === 20 ) {
      if( game.settings.get('symbaroum', 'optionalCrit') ) {
        critGood = attributeRoll._total === 1;
        critBad = attributeRoll._total === 20;
      }    
      if( game.settings.get('symbaroum', 'optionalRareCrit') ) {
        let secondRoll = new Roll("1d20",{});
        secondRoll.roll();
        critGood = critGood && secondRoll._total <= diceTarget;
        critBad = critBad && secondRoll._total > diceTarget;
      }
    }
	}

  if (hasArmor && attributeRoll._total >= diceTarget) {
    if (armor.protection !== '') {
      let prot = armor.protection;
      // if( armor.qualties.reinforced ) { prot += "+1"; }
      let armorRoll = new Roll(prot, {});
      
      armorRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(armorRoll);
      }
      armor.value = armorRoll._total;
    } else {
      armor.value = 0;
    }
  }

  if (hasWeapon && attributeRoll._total <= diceTarget) {
    dam = weapon.damage;
    if (dam !== '') {
      if ( advantage ) { dam += "+1d4"; }
      if ( critGood ) { dam += "+1d6"; }
      if( weapon.qualities.deepImpact ) { dam += "+1"; }
      if( damModifier !== '') { dam = dam+"+"+damModifier; }
      
      let weaponRoll = new Roll(dam, {});
      weaponRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(weaponRoll);
      }
      weapon.value = weaponRoll._total;
    } else {
      weapon.value = 0;
    }
  }
  
  if( !hasWeapon && !hasArmor && !game.settings.get('symbaroum', 'critsApplyToAllTests') ) {
    critGood = false;
    critBad = false;
  } 

  let rollData = {
    name: `${attribute.name} (${diceTarget}) ⬅ ${modifier.name} (${mod})`,
    hasSucceed: attributeRoll._total <= diceTarget,
    diceResult: attributeRoll._total,
    hasArmor: hasArmor,
    hasWeapon: hasWeapon,
    armor: armor,
    weapon: weapon,
    critSuccess: critGood,
    critFail: critBad,
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/roll.html', rollData);
  let chatData = {
    user: game.user._id,
    speaker: {
			actor: character.id
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
