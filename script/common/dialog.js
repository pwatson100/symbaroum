import { rollAttribute, getAttributeLabel } from './roll.js';

let roll_defaults = {};

export async function prepareRollAttribute(actor, attributeName, armor, weapon) {
  let targetTokens = Array.from(game.user.targets);
	let attri_defaults = getRollDefaults(attributeName,armor !== null, weapon !== null);
  let attri_mods = getVersusModifiers(targetTokens);
  let askImpeding = actor.data.data.combat.impeding !== 0 && weapon === null && armor === null;
  let weaponModifiers = null;
  /* */
  if(weapon !== null) {
    weaponModifiers = foundry.utils.deepClone(actor.data.data.combat.combatMods.weapons[weapon.id]); // All modifiers needed
    // Create any radio box alternatives from weaponModifiers
    createRadioboxAlternatives(weaponModifiers);
  }

  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {
    "hasTarget": targetTokens.length > 0,
    "isWeaponRoll" : weapon !== null,
    "weaponDamage" : weapon !== null ? weapon.damage.base:"",
    "weaponModifier" : weaponModifiers,
    "isArmorRoll" : armor !== null,
    "askImpeding" : askImpeding,
    "choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
    "groupName":"favour",
    "attri_mods" : attri_mods,
    "roll_defaults": attri_defaults
  });

  let dialog = new Dialog({
    title: getAttributeLabel(actor, attributeName),
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BUTTON.ROLL'),
        callback: async (html) => {
          let dummyMod = "custom";			
          if( html.find("#targetAttribute").length > 0) {
            dummyMod = html.find("#targetAttribute")[0].value;											
          }
          attri_defaults.targetAttributeName = dummyMod;
          const targetAttributeName = dummyMod;

          let hasAdvantage = html.find("#advantage").length > 0;
          if( hasAdvantage ) {
            // Note that this turns into disadvantage for Defense rolls
            hasAdvantage = html.find("#advantage")[0].checked;
          }					
          attri_defaults.advantage = hasAdvantage ? "checked":"";
          const advantage = hasAdvantage; 

          let hasDamModifier = html.find("#dammodifier").length > 0;
          let damModifier = "";
          if(hasDamModifier) {
            damModifier = html.find("#dammodifier")[0].value;
          }
          attri_defaults.additionalModifier = damModifier;
          if( weapon !== null) {
            for(let optionalBonus of weaponModifiers.damageChoices) {
              if(optionalBonus.type == game.symbaroum.config.DAM_FIXED) {
                damModifier += `${optionalBonus.alternatives[0].damageMod}[${optionalBonus.label}]`;
              } else if(optionalBonus.type === game.symbaroum.config.DAM_CHECK) {
                // Find if the box is checked
                let ticked = html.find(`#${optionalBonus.id}`);              
                if( ticked.length > 0 && ticked[0].checked )
                  damModifier += `${optionalBonus.alternatives[0].damageMod}[${optionalBonus.label}]`;
              } else if( optionalBonus.type === game.symbaroum.config.DAM_RADIO) {
                // Find the selected radio button
                let radioSelection = html.find(`input[name='${optionalBonus.id}']`);
                for( let f of radioSelection) {
                  if( f.checked ) 
                    damModifier += `${f.value}[${optionalBonus.label}]`;
                }
              }
            }
          }
                    
          let favours = html.find("input[name='favour']");
          let fvalue = 0;
          for ( let f of favours) {						
            if( f.checked ) fvalue = f.value;
          }
          attri_defaults.selectedFavour = ""+fvalue;			
          const favour = fvalue;
          
          let modifier = parseInt(html.find("#modifier")[0].value);   
          if(isNaN(modifier)) {
            modifier = 0;
          }
          attri_defaults.modifier = modifier;

          if(askImpeding){
            if(html.find("#impeding")[0].checked){
              modifier = modifier - actor.data.data.combat.impeding;
            }            
            attri_defaults.impeding = html.find("#impeding")[0].checked ? "checked":"";
          }
          if( weapon !== null ) 
          {
            for(let i = 0; i < weaponModifiers.attackModifiers.length; i++) 
            {
              modifier += weaponModifiers.attackModifiers[i].modifier;
            }
          }
          console.log("modifier", modifier);
          await rollAttribute(actor, attributeName, getTarget(), targetAttributeName, favour, modifier, armor, weapon, advantage, damModifier);
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

export async function prepareRollAttributeNew(actor, attributeName, armor, weapon, ecData = {}) {
  let targetTokens = Array.from(game.user.targets);
	let attri_defaults = getRollDefaults(attributeName,armor !== null, weapon !== null, ecData);
  let askImpeding = actor.data.data.combat.impeding !== 0 && weapon === null && armor === null;
  let weaponModifiers = null;
  let askTargetAttribute = ecData.askTargetAttribute ?? false;
  let askIgnoreArmor = ecData.askIgnoreArmor ?? false;
  let attackFromPC = true;
  let askCorruptedTarget = ecData.askCorruptedTarget ?? false;

  if(game.settings.get('symbaroum', 'combatAutomation')){
    attackFromPC = actor.type !== "monster" || ecData.targetData.actor.type === "monster";
    askImpeding = ecData.askImpeding;
    attri_defaults.impeding = ecData.impeding
  }
  else{
    askTargetAttribute = targetTokens.length > 0;
  }


  if(weapon !== null) {
    weaponModifiers = foundry.utils.deepClone(actor.data.data.combat.combatMods.weapons[weapon.id]); // All modifiers needed
    // Create any radio box alternatives from weaponModifiers
    createLineDisplay(weaponModifiers, attackFromPC);
  }

  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {
    "askTargetAttribute": askTargetAttribute,
    "isWeaponRoll" : weapon !== null,
    "weaponDamage" : weapon !== null ? weapon.damage.base:"",
    "askIgnoreArmor" : askIgnoreArmor,
    "defaultWeaponModifier" : weaponModifiers[0],
    "weaponModifier" : weaponModifiers,
    "isArmorRoll" : armor !== null,
    "askImpeding" : askImpeding,
    "choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
    "groupName":"favour",
    "attri_mods" : attri_mods,
    "roll_defaults": attri_defaults
  });

  let dialog = new Dialog({
    title: getAttributeLabel(actor, attributeName),
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BUTTON.ROLL'),
        callback: async (html) => {
          let dummyMod = "custom";			
          if( html.find("#targetAttribute").length > 0) {
            dummyMod = html.find("#targetAttribute")[0].value;											
          }
          attri_defaults.targetAttributeName = dummyMod;
          const targetAttributeName = dummyMod;
          ecData.targetData.resistAttributeName = targetAttributeName;
          ecData.targetData.resistAttributeValue = getAttributeValue(ecData.targetData.actor, targetAttributeName);

          let hasAdvantage = html.find("#advantage").length > 0;
          if( hasAdvantage ) {
            // Note that this turns into disadvantage for Defense rolls
            hasAdvantage = html.find("#advantage")[0].checked;
          }
          attri_defaults.advantage = hasAdvantage ? "checked":"";
          const advantage = hasAdvantage; 
          ecData.dmgData.hasAdvantage = advantage;
          if(advantage){
              ecData.modifier += 2;
              ecData.autoParams += game.i18n.localize('DIALOG.ADVANTAGE') + ", ";
              if(ecData.askBackstab && ecData.actor.data.data.attributes.discreet.total > ecData.actor.data.data.attributes[ecData.castingAttributeName].total){
                  ecData.castingAttributeName = "discreet";
              }
          }
          let hasDamModifier = html.find("#dammodifier").length > 0;
          let damModifier = "";
          let damModifierNPC = 0;
          if(hasDamModifier) {
            damModifier = html.find("#dammodifier")[0].value;
          }
          attri_defaults.additionalModifier = damModifier;
          if( weapon !== null) {
            for(let package of weaponModifiers.package) {
              if(package.type == game.symbaroum.config.PACK_DEFAULT) {
                for(let member of package.member) {
                  if(member.type == game.symbaroum.config.DAM_MOD) {
                    damModifier += `${member.alternatives[0].damageMod}[${package.label}]`;
                    damModifierNPC += member.alternatives[0].damageModNPC;
                  }
                  if(member.type == game.symbaroum.config.STATUS_DOT) {
                    damModifier += `${member.alternatives[0].damageMod}[${package.label}]`;
                    damModifierNPC += member.alternatives[0].damageModNPC;
                    let dotime = Object.assign({}, member.alternatives[0]);
                    dotime.display = member.display;
                    ecData.damageOverTime.push(dotime)
                  }
                  if(member.type == game.symbaroum.config.TYPE_FAVOUR) {
                    ecData.favour += member.favourMod;
                  }
                }
              } else if(package.type === game.symbaroum.config.PACK_CHECK) {
                // Find if the box is checked
                let ticked = html.find(`#${package.id}`);              
                if( ticked.length > 0 && ticked[0].checked ){
                  for(let member of package.member) {
                    if(member.type == game.symbaroum.config.DAM_MOD) {
                      damModifier += `${member.alternatives[0].damageMod}[${package.label}]`;
                      damModifierNPC += member.alternatives[0].damageModNPC;
                    }
                    if(member.type == game.symbaroum.config.STATUS_DOT) {
                      damModifier += `${member.alternatives[0].damageMod}[${package.label}]`;
                      damModifierNPC += member.alternatives[0].damageModNPC;
                      let dotime = Object.assign({}, member.alternatives[0]);
                      dotime.display = member.display;
                      ecData.damageOverTime.push(dotime)
                    }
                    if(member.type == game.symbaroum.config.TYPE_FAVOUR) {
                      ecData.favour += member.favourMod;
                    }
                }
              } else if( package.type === game.symbaroum.config.PACK_RADIO) {
                // Find the selected radio button
                let radioSelection = html.find(`input[name='${package.id}']`);
                for( let f of radioSelection) {
                  if( f.checked ){
                    damModifier += `${f.value}[${package.label}]`;
                    damModifierNPC += `${f.value}`;
                  }
                }
              }
            }
          }
                    
          let favours = html.find("input[name='favour']");
          let fvalue = 0;
          for ( let f of favours) {						
            if( f.checked ) fvalue = f.value;
          }
          attri_defaults.selectedFavour = ""+fvalue;			
          const favour = fvalue;
          ecData.favour += fvalue;
          
          let modifier = parseInt(html.find("#modifier")[0].value);   
          if(isNaN(modifier)) {
            modifier = 0;
          }
          attri_defaults.modifier = modifier;
          ecData.modifier = modifier;

          if(askImpeding){
            if(html.find("#impeding")[0].checked){
              modifier = modifier - actor.data.data.combat.impeding;
              ecData.modifier += -ecData.impeding;
              ecData.autoParams += game.i18n.localize("ARMOR.IMPEDINGLONG") + ", ";
            }            
            attri_defaults.impeding = html.find("#impeding")[0].checked ? "checked":"";
          }
          if( weapon !== null ) 
          {
            for(let i = 0; i < weaponModifiers.attackModifiers.length; i++) 
            {
              modifier += weaponModifiers.attackModifiers[i].modifier;
              attri_defaults.ecData.autoParams += game.i18n.localize('COMBAT.PARAMS_PRECISE');
            }
          }
          console.log("modifier", modifier);

          if(askCorruptedTarget){
            ecData.targetFullyCorrupted = html.find("#targetCorrupt")[0].checked;
          }
          if(game.settings.get('symbaroum', 'combatAutomation')){
            attackFromPC = actor.type !== "monster" || ecData.targetData.actor.type === "monster";
            if(damModifier.length > 0) {
                ecData.dmgData.modifier += " + " + damModifier;
                ecData.dmgData.modifierNPC += modifierNPC;
            }
            ecData.notResisted = ecData.notResisted ?? (ecData.notResistWhenFirstCast && !ecData.isMaintained);
            if(hasTarget && !ecData.notResisted){
              if(ecData.attackFromPC || ecData.targetData.actor.type === "monster"){
                  ecData.resistRoll = false;
                  buildRolls(ecData);
              }
              else{
                ecData.resistRoll = true;
                ecData.resistRollText = (isWeaponRoll) ? ecData.targetData.name+game.i18n.localize('COMBAT.DEFENSE_ROLL') : ecData.targetData.name+game.i18n.localize('ABILITY.RESIST_ROLL');
                let userArray = await getOwnerPlayer(ecData.targetData.actor);
                if(userArray.length>0 && game.settings.get('symbaroum', 'playerResistButton')){
                    ecData.targetUserId=userArray[0].data._id;
                    ecData.targetUserName=userArray[0].data.name;
                    createResistRollChatButton(ecData);
                }
                else{
                    buildRolls(ecData);
                }
              }
            }
            else{
                buildRolls(ecData)
            }
          }
          else{
            await rollAttribute(actor, attributeName, getTarget(), targetAttributeName, favour, modifier, armor, weapon, advantage, damModifier);
          }
        }
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

function getRollDefaults(attributeName, isArmor, isWeapon, ecData) {
  if( !game.settings.get('symbaroum', 'saveCombatRoll')) {
    if(isArmor || isWeapon) {
      return createDefaults(ecData);
    }
  }
  if( !game.settings.get('symbaroum', 'saveAttributeRoll')) {
    if(!isArmor && !isWeapon) {
      return createDefaults(ecData);
    }
  }
  if( roll_defaults[attributeName+":"+isArmor+":"+isWeapon] === undefined )
	{
		roll_defaults[attributeName+":"+isArmor+":"+isWeapon] = createDefaults(ecData);
	}
	return roll_defaults[attributeName+":"+isArmor+":"+isWeapon];
}

function createDefaults(ecData={}) {
  let defaultValues = {
		targetAttributeName: "custom",
		additionalModifier: "",
		selectedFavour: "0",
		modifier: "0",
    advantage: "",
    impeding: "",
    ignoreArmor: false,
    ecData: ecData
	};
  return(defaultValues)
}

function getVersusModifiers(targetTokens) {
  if( targetTokens.length === 0) {
    return null;
  }
  return {
    show: game.settings.get('symbaroum', 'showModifiersInDialogue'),
    custom:0,
    defense: (10 - targetTokens[0].actor.data.data?.combat.defense),
    accurate: (10 - targetTokens[0].actor.data.data?.attributes.accurate.total),
    cunning: (10 - targetTokens[0].actor.data.data?.attributes.cunning.total),
    discreet: (10 - targetTokens[0].actor.data.data?.attributes.discreet.total),
    persuasive: (10 - targetTokens[0].actor.data.data?.attributes.persuasive.total),
    quick: (10 - targetTokens[0].actor.data.data?.attributes.quick.total),
    resolute: (10 - targetTokens[0].actor.data.data?.attributes.resolute.total),
    strong: (10 - targetTokens[0].actor.data.data?.attributes.strong.total),
    vigilant: (10 - targetTokens[0].actor.data.data?.attributes.vigilant.total),
  };
}

function createLineDisplay(packages, attackFromPC) 
{
  game.symbaroum.log("packages", packages)
  for(let i = 0; i < packages.length; i++) 
  {
    let package = packages[i];
    if(package.member.length !=0){
      package.member.forEach(member => {
        if(member.type == game.symbaroum.config.DAM_MOD){
          for(let j = 0; j < member.alternatives.length; j++) 
          { // dispay NPC values for EC, and also reformat the "+1d1[something]" to just "+1"
            member.alternatives.display = attackFromPC ? member.alternatives[j].damageMod.replace(/d1$/,'') : member.alternatives[j].damageModNPC;
            member.display += member.alternatives.display;
          }
        }
        if(member.type == game.symbaroum.config.STATUS_DOT){
          for(let j = 0; j < member.alternatives.length; j++) 
          { // dispay NPC values for EC, and also reformat the "+1d1[something]" to just "+1"
            member.display += attackFromPC ? member.alternatives[j].damagePerRound.replace(/d1$/,'') : member.alternatives[j].damagePerRoundNPC;
          }
        }
      });
      if(package.type === game.symbaroum.config.PACK_CHECK)
      {
        package.member.forEach((member, index) => {
          if(index!=0) package.display += ", ";
          package.display += member.display;
        })
      }
      if(package.type === game.symbaroum.config.PACK_RADIO) 
      {
        package.member.forEach((member, index) => {
          let radioAlternatives = {};
          package.defaultSelect = "";
          for(let j = 0; j < member.alternatives.length; j++) 
          {
            if(attackFromPC){
              radioAlternatives[`${member.alternatives[j].damageMod}`] = `${member.display} (${member.alternatives[j].label}) - ${member.alternatives[j].damageMod}`;
            }
            else{
              radioAlternatives[`${member.alternatives[j].damageModNPC}`] = `${member.display} (${member.alternatives[j].label}) - ${member.alternatives[j].damageModNPC}`;
              }
          }
          package.radioAlternatives = radioAlternatives;
        })
      }
    }
  }
}

function getTarget() {
  const target = game.user.targets.values().next().value;
  if (target === undefined) {
    return null;
  } else {
    return target.actor;
  }
}