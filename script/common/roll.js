export async function rollAttribute(attribute, modifier, armor, weapon) {
  let attributeRoll = new Roll('1d20', {});
  attributeRoll.roll();
  if (game.dice3d != null) {
    await game.dice3d.showForRoll(attributeRoll);
  }

  let mod = (modifier.value - 10) * -1;
  let diceTarget = attribute.value + mod;

  let hasArmor = armor != null;
  if (hasArmor && attributeRoll._total >= diceTarget) {
    if (armor.protection !== '') {
      let armorRoll = new Roll(armor.protection, {});
      armorRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(armorRoll);
      }
      armor.value = armorRoll._total;
    } else {
      armor.value = 0;
    }
  }

  let hasWeapon = weapon != null;
  if (hasWeapon && attributeRoll._total <= diceTarget) {
    if (weapon.damage !== '') {
      let weaponRoll = new Roll(weapon.damage, {});
      weaponRoll.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(weaponRoll);
      }
      weapon.value = weaponRoll._total;
    } else {
      weapon.value = 0;
    }
  }
  // Initilise as false so they are ignored if the GM does not want to use the optional crit rules
  let critAtGood = false;
  let critAtBad = false;
  let critDfGood = false;
  let critDfBad = false;

  // Critical hit code
  if (game.settings.get('symbaroum', 'optionalCrit')) {
    if (hasWeapon && attributeRoll.total === 1) {
      let critSucc = new Roll('1d6');
      critSucc.roll();
      if (game.dice3d != null) {
        await game.dice3d.showForRoll(critSucc);
      }
      weapon.value = weapon.value + critSucc.total;
      critAtGood = true;
    } else if (hasWeapon && attributeRoll.total === 20) {
      critAtBad = true;
    }
    // End Critical Hit code

    // Crit Defence code
    if (hasArmor && attributeRoll.total === 1) {
      critDfGood = true;
    } else if (hasArmor && attributeRoll.total === 20) {
      critDfBad = true;
    }
    // Crit Defence code end
  }

  let rollData = {
    name: `${attribute.name} (${diceTarget}) ⬅ ${modifier.name} (${mod})`,
    hasSucceed: attributeRoll._total <= diceTarget,
    diceResult: attributeRoll._total,
    hasArmor: hasArmor,
    hasWeapon: hasWeapon,
    armor: armor,
    weapon: weapon,
    critAtSuccess: critAtGood,
    critAtFail: critAtBad,
    critDfSuccess: critDfGood,
    critDfFail: critDfBad,
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/roll.html', rollData);
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
