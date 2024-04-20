import { getOwnerPlayer, createResistRollChatButton, rollDeathTest } from './roll.js';
import { buildRolls } from './item.js';

let roll_defaults = {};

export async function prepareRollDeathTest(actor, showDialogue) {
  if( !showDialogue )
  {
    await rollDeathTest(actor, "0", 0);
    return;
  }
  let attri_defaults = getRollDefaults("deathtest",false, false);
  const html = await renderTemplate('systems/symbaroum/template/chat/dialog-deathtest.hbs', {  
    "choices": { "0": "DIALOG.FAVOUR_NORMAL", "-1":"DIALOG.FAVOUR_DISFAVOUR", "1":"DIALOG.FAVOUR_FAVOUR"},
    "roll_defaults":attri_defaults,
    "groupName" : "favour",
  });
  let dialog = new Dialog({
    title: "Death Test",
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BUTTON.ROLL'),
        callback: async (html) => {
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

          await rollDeathTest(actor, favour, modifier);
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

export async function prepareRollAttribute(actor, attributeName, armor, weapon, ecData = {targetData: {hasTarget: false, leaderTarget: false, actor: {}}}) {
  return new Promise(async (resolve, reject) => {
  const CombatDialog = class extends Dialog {
    activateListeners (html) {
      super.activateListeners(html);
      html.find(".packageInfo").click(function(ev) {
        if(ev.target.className === 'packageDetail') {
          let checkbox = $(ev.currentTarget).find('input[type="checkbox"]');
          checkbox.prop('checked', !checkbox.prop('checked'));
        }
      });
    }
  }
  let targetTokens = Array.from(game.user.targets);
  let attri_mods = getVersusModifiers(targetTokens);
	let attri_defaults = getRollDefaults(attributeName,armor !== null, weapon !== null, ecData);
  let askImpeding = actor.system.combat.impeding !== 0 && weapon === null && armor === null;
  let weaponModifiers = null;
  let askTargetAttribute = ecData.askTargetAttribute ?? false;
  let askIgnoreArmor = ecData.askIgnoreArmor ?? false;
  let ignoreArm = ecData.ignoreArm ?? false;
  let attackFromPC = true;
  let askCorruptedTarget = ecData.askCorruptedTarget ?? false;
  let weaponDamage = "";
  let hasTarget = false;
  let askPoison = false;
  let askAttackNb = false;
  let ecOn = game.settings.get('symbaroum', 'combatAutomation');
  if(ecOn && weapon !== null) {
    attackFromPC = actor.type !== "monster" || ecData.targetData.actor.type === "monster";
    askImpeding = ecData.askImpeding;
    attri_defaults.impeding = ecData.impeding;
    hasTarget = ecData.targetData.hasTarget;
    askPoison = ecData.askPoison;
  } else {
    askTargetAttribute = targetTokens.length > 0;
  }
  if(weapon !== null) {
    weaponModifiers = foundry.utils.deepClone(actor.system.combat.combatMods.weapons[weapon.id]); // All modifiers needed
    // Create any radio box alternatives from weaponModifier
    createLineDisplay(weaponModifiers, attackFromPC);
    weaponDamage = attackFromPC ? weapon.damage.base : weapon.damage.npcBase;
    if(weapon.doAlternativeDamage){
      ecData.isAlternativeDamage = true;
      ecData.alternativeDamageAttribute = weapon.damage.alternativeDamageAttribute;
      ecData.ignoreArm = true;
      ecData.isMystical = true;
      weaponDamage += " ("+game.symbaroum.api.getAttributeLabel(actor, ecData.alternativeDamageAttribute)+")";
    }
    if(game.settings.get('symbaroum', 'combatAutomation')){
      askAttackNb = weaponModifiers.maxAttackNb > 1;
    }
  }
  let targetAttribute_selection = duplicate(game.symbaroum.config.ATTRIBUTE_SELECTION);
  targetAttribute_selection.defense = {
    id: "defense",
    label: game.i18n.localize(`ARMOR.DEFENSE`),
  };
  if(attri_mods.show){
    for (const [key, value] of Object.entries(targetAttribute_selection)) {
      targetAttribute_selection[key].label = targetAttribute_selection[key].label +" "+attri_mods[key];
    }
  }
  targetAttribute_selection.custom = {
    id: "custom",
    label: game.i18n.localize(`WEAPON.NONE`),
  };
  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.hbs', {
    "askTargetAttribute": askTargetAttribute,
    "askPoison": askPoison,
    "isWeaponRoll" : weapon !== null,
    "weaponDamage" : weaponDamage,
    "askIgnoreArmor" : askIgnoreArmor,
    "ignoreArm": ignoreArm,
    "weaponModifiers" : weaponModifiers,
    "isArmorRoll" : armor !== null,
    "askImpeding" : askImpeding,
    "choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
    "groupName":"favour",
    "attri_mods" : attri_mods,
    "roll_defaults": attri_defaults,
    "askAttackNb": askAttackNb,
    "attNbRadio": "attNbRadio",
    "targetAttribute_selection":targetAttribute_selection
  });

  let dialog = new CombatDialog({
    title: game.symbaroum.api.getAttributeLabel(actor, attributeName),
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize('BUTTON.ROLL'),
        callback: async (html) => {
          let dummyMod = "custom";
          if(askTargetAttribute){	
            if( html.find("#targetAttribute").length > 0) {
              dummyMod = html.find("#targetAttribute")[0].value;											
            }
            if(game.settings.get('symbaroum', 'combatAutomation') && weapon !== null){
              ecData.targetData.resistAttributeName = dummyMod;
              ecData.targetData.resistAttributeValue = getAttributeValue(ecData.targetData.actor, dummyMod);
            }
          }
          attri_defaults.targetAttributeName = dummyMod;
          const targetAttributeName = dummyMod;
          let modifier = parseInt(html.find("#modifier")[0].value);   
          if(isNaN(modifier)) {
            modifier = 0;
          }
          attri_defaults.modifier = modifier;
          ecData.modifier = modifier;
          let hasAdvantage = html.find("#advantage").length > 0;
          if( hasAdvantage ) {
            // Note that this turns into disadvantage for Defense rolls
            hasAdvantage = html.find("#advantage")[0].checked;
          }
          attri_defaults.advantage = hasAdvantage ? "checked":"";
          const advantage = hasAdvantage; 
          ecData.hasAdvantage = advantage;
          if(advantage){
              ecData.modifier += 2;
              ecData.autoParams += game.i18n.localize('DIALOG.ADVANTAGE') + ", ";
              if(ecData.askBackstab && ecData.actor.system.attributes.discreet.total > ecData.actor.system.attributes[ecData.castingAttributeName].total){
                  ecData.castingAttributeName = "discreet";
              }
          }
          let hasDamModifier = html.find("#dammodifier").length > 0;
          let damModifier = "";
          let damModifierNPC = 0;
          let damModifierAttSup ="";
          let damModifierAttSupNPC=0;
          if(hasDamModifier) {
            let damString = html.find("#dammodifier")[0].value;            
            // Save - it is a string
            damString = damString.trim();
            
            if(damString.length) {
              attri_defaults.additionalModifier = damString; // Regardless if valid or not, set it as attri_defaults
              let plus = '+';
              let damSource = "["+game.i18n.localize("DIALOG.DAMAGE_MODIFIER")+"] ";
              if(damString.charAt(0)=== "+" ) {
                plus = ""; // If it already has plus, do not add another
              }
              if(/\[[^\]]+\]/.test(damString) ) {
                damSource = ""; // If it has "[damage source]" already in roll string, do not add another one
              }
              damModifier = `${plus}${damString}${damSource}`;

              try {
                // Validate string as valid roll object              
                let r = new Roll(damModifier,{}).evaluate({async:false});
              } catch (err) {
                  ui.notifications.error(`The ${game.i18n.localize("DIALOG.DAMAGE_MODIFIER")} can't be used for rolling damage ${err}`);
                  reject("invalid");
                  return;
              }
              damModifierAttSup = damModifier;
              if(!attackFromPC){
                let parsedMod = parseInt(damString);
                if (!isNaN(parsedMod)) { 
                  damModifierNPC = parsedMod;
                  damModifierAttSupNPC = parsedMod;
                }
              }
            }
          }          
          if( weapon !== null) {
            for(let pack of weaponModifiers.package) {
              //add all modifiers from the default package
              if(pack.type == game.symbaroum.config.PACK_DEFAULT) {
                for(let member of pack.member) {
                  if(member.type == game.symbaroum.config.DAM_MOD) {
                    if(/\[[^\]]+\]/.test(member.alternatives[0].damageMod)) {
                      damModifier += `${member.alternatives[0].damageMod}`;
                    } else {
                      damModifier += `${member.alternatives[0].damageMod}[${member.label}]`;
                    }
                    damModifierNPC += member.alternatives[0].damageModNPC;
                    if(!member.alternatives[0].restrictions || !alternatives[0].restrictions.includes(game.symbaroum.config.DAM_1STATTACK)){
                      damModifierAttSup +=`${member.alternatives[0].damageMod}[${pack.label}]`;
                      damModifierAttSupNPC+=member.alternatives[0].damageModNPC;
                    }
                  }
                  else if(member.type == game.symbaroum.config.TYPE_ROLL_MOD) {
                    modifier += member.modifier;
                    ecData.modifier += member.modifier;
                    ecData.autoParams += ", "+member.label;
                  }
                  else if(ecOn && member.type == game.symbaroum.config.STATUS_DOT) {
                    let dotime = Object.assign({}, member);
                    ecData.damageOverTime.push(dotime)
                  }
                  else if(member.type == game.symbaroum.config.TYPE_FAVOUR) {
                    // game.symbaroum.log("member", member);
                    ecData.favour += member.favourMod;
                  }
                  else if(member.type == game.symbaroum.config.CORRUPTION_DAMAGE) {
                    ecData.corruptingattack = member.value;
                  }
                  else if(member.type == game.symbaroum.config.TYPE_ALTERNATIVE_DAMAGE) {
                    ecData.isAlternativeDamage = true;
                    ecData.alternativeDamageAttribute = member.AltDmgAttribute;
                  }
                }
              } else if(pack.type === game.symbaroum.config.PACK_CHECK) {
                // Find if the box is checked
                let ticked = html.find(`#${pack.id}`);              
                if( ticked.length > 0 && ticked[0].checked ){
                  ecData.autoParams += ", "+pack.label;
                  for(let member of pack.member) {
                    if(member.type == game.symbaroum.config.DAM_MOD) {
                      if(/\[[^\]]+\]/.test(member.alternatives[0].damageMod)) {
                        damModifier += `${member.alternatives[0].damageMod}`;
                      } else {
                        damModifier += `${member.alternatives[0].damageMod}[${pack.label}]`;
                      }
                      damModifierNPC += member.alternatives[0].damageModNPC;
                      if(!member.alternatives[0].restrictions || !member.alternatives[0].restrictions.includes(game.symbaroum.config.DAM_1STATTACK)){
                        damModifierAttSup +=`${member.alternatives[0].damageMod}[${pack.label}]`;
                        damModifierAttSupNPC+=member.alternatives[0].damageModNPC;
                      }
                    }
                    else if(ecOn && member.type == game.symbaroum.config.STATUS_DOT) {
                      let dotime = Object.assign({}, member);
                      ecData.damageOverTime.push(dotime);
                    }
                    else if(ecOn && member.type == game.symbaroum.config.TYPE_FAVOUR) {
                      ecData.favour += member.favourMod;
                    }
                    else if(member.type == game.symbaroum.config.TYPE_ROLL_MOD) {
                      modifier += member.modifier;
                    }
                    else if(member.type == game.symbaroum.config.TYPE_ATTRIBUTE) {
                      let replacementAttribute = member.attribute;
                      if(actor.system.attributes[attributeName].total < actor.system.attributes[replacementAttribute].total)
                      {
                        attributeName = replacementAttribute;
                        ecData.castingAttributeName = replacementAttribute;
                      }
                    }
                  }
                }
              } else if( pack.type === game.symbaroum.config.PACK_RADIO) {
                if(pack.member[0].type === game.symbaroum.config.DAM_RADIO){
                  let radioSelection = html.find(`input[name='${pack.id}']`);
                  for( let f of radioSelection) {
                    if( f.checked ){
                      damModifier += `${f.value}[${pack.label}]`;
                      damModifierNPC += parseInt(f.value);
                    }
                  }
                  for(let altern of pack.member[0].alternatives){
                    if(altern.restrictions && altern.restrictions.includes(game.symbaroum.config.DAM_NOTACTIVE)){
                      damModifierAttSup +=`${altern.damageMod}[${pack.label}]`;
                      damModifierAttSupNPC+=altern.damageModNPC;
                    }
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
          ecData.favour += parseInt(fvalue);

          if(askImpeding){
            if(html.find("#impeding")[0].checked){
              modifier = modifier - actor.system.combat.impeding;
              ecData.modifier += -ecData.impeding;
              ecData.autoParams += game.i18n.localize("ARMOR.IMPEDINGLONG") + ", ";
            }            
            attri_defaults.impeding = html.find("#impeding")[0].checked ? "checked":"";
          }
          if(askIgnoreArmor){
            ignoreArm = html.find("#ignarm")[0].checked;
            ecData.ignoreArm = ignoreArm;
            if(ignoreArm) ecData.autoParams += game.i18n.localize('COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR') + ", ";
          }
          if(askAttackNb){
            let radioSelection = html.find(`input[name='attNbRadio']`);
            for( let f of radioSelection) {
              if( f.checked ){
                ecData.numberofAttacks = parseInt(f.value);
              }
            }
          }
          if(askPoison){
            ecData.poison = Number(html.find("#poison")[0].value);
          }
          if(askCorruptedTarget){
            ecData.targetFullyCorrupted = html.find("#targetCorrupt")[0].checked;
          }
          if(weapon && game.settings.get('symbaroum', 'combatAutomation')){
            attackFromPC = actor.type !== "monster" || ecData.targetData.actor.type === "monster";
            if(damModifier.length > 0) {
                ecData.dmgModifier = damModifier;
                ecData.dmgModifierNPC = damModifierNPC;
                ecData.dmgModifierAttackSupp= damModifierAttSup;
                ecData.dmgModifierAttackSuppNPC= damModifierAttSupNPC;
            }
            ecData.notResisted = ecData.notResisted ?? (((ecData.casting === game.symbaroum.config.CASTING_RES) && !ecData.isMaintained ) || ((ecData.maintain === game.symbaroum.config.MAINTAIN_RES) && ecData.isMaintained));
            if(hasTarget && !ecData.notResisted){
              if(ecData.attackFromPC || ecData.targetData.actor.type === "monster"){
                  ecData.resistRoll = false;
                  buildRolls(ecData).then(val => resolve(val));
              } else {
                ecData.resistRoll = true;
                ecData.resistRollText = (weapon !== null) ? ecData.targetData.name+game.i18n.localize('COMBAT.DEFENSE_ROLL') : ecData.targetData.name+game.i18n.localize('ABILITY.RESIST_ROLL');
                let userArray = await getOwnerPlayer(ecData.targetData.actor);
                if(userArray.length>0 && game.settings.get('symbaroum', 'playerResistButton')){
                    ecData.targetUserId=userArray[0].id;
                    ecData.targetUserName=userArray[0].name;
                    createResistRollChatButton(ecData).then(val => resolve(val));
                }
                else{
                    buildRolls(ecData).then(val => resolve(val));
                }
              }
            }
            else{
                buildRolls(ecData).then((val)=>resolve(val))
            }
          } else {            
            game.symbaroum.api.rollAttribute(actor, attributeName, getTarget(), targetAttributeName, favour, modifier, armor, weapon, advantage, damModifier).then((roll) => {resolve(roll)});
          }
        },
      },
      cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: game.i18n.localize('BUTTON.CANCEL'),
          callback: () => {reject("Cancelled")},
      },
    },
    default: 'roll',
    close: () => {},
  });

  dialog.render(true);
  })
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
    defense: (10 - targetTokens[0].actor.system?.combat.defense),
    accurate: (10 - targetTokens[0].actor.system?.attributes.accurate.total),
    cunning: (10 - targetTokens[0].actor.system?.attributes.cunning.total),
    discreet: (10 - targetTokens[0].actor.system?.attributes.discreet.total),
    persuasive: (10 - targetTokens[0].actor.system?.attributes.persuasive.total),
    quick: (10 - targetTokens[0].actor.system?.attributes.quick.total),
    resolute: (10 - targetTokens[0].actor.system?.attributes.resolute.total),
    strong: (10 - targetTokens[0].actor.system?.attributes.strong.total),
    vigilant: (10 - targetTokens[0].actor.system?.attributes.vigilant.total),
  };
}

export function createLineDisplay(weaponModifiers, attackFromPC) 
{
  game.symbaroum.log("...createLineDisplay", ...arguments);

  if(weaponModifiers.maxAttackNb > 1){
    let radioAttacks = {};
    for(let j = 1; j <= weaponModifiers.maxAttackNb; j++){
      radioAttacks[j] = j.toString()+"x"+game.i18n.localize("DIALOG.ATTACK");
    }
    weaponModifiers.radioAttacks = radioAttacks;
  }
  for(let i = 0; i < weaponModifiers.package.length; i++) 
  {
    let pack = weaponModifiers.package[i];
    if(pack.member.length !=0) {

      pack.member.forEach(member => {
        if(member.type == game.symbaroum.config.DAM_MOD) {
          for(let j = 0; j < member.alternatives.length; j++) 
          { // dispay NPC values for EC, and also reformat the "+1d1[something]" to just "+1"
            member.value = attackFromPC ? member.alternatives[j].damageMod.replace(/d1$/,'') : member.alternatives[j].damageModNPC;
          }
        }
        else if(member.type == game.symbaroum.config.STATUS_DOT) {
          let damageV= attackFromPC ? member.damagePerRound.replace(/d1$/,'') : member.damagePerRoundNPC.toString();
          member.value += " ("+ damageV + ")";
        }
        else if(member.type == game.symbaroum.config.CORRUPTION_DAMAGE) {
          if(!attackFromPC) {
            member.value = member.damageNPC.toString();
          }
        } else if(member.type == game.symbaroum.config.TYPE_ATTRIBUTE) {
          member.value = " "+game.i18n.localize(game.symbaroum.config.attributeLabels[member.attribute]);
        }
      });
      if(pack.type === game.symbaroum.config.PACK_CHECK)
      {
        if(pack.value === undefined) pack.value = "";
        pack.member.forEach((member, index) => {
          if(index!=0) pack.value += ", ";
          pack.value += member.value;
        })
      }
      if(pack.type === game.symbaroum.config.PACK_RADIO) 
      {
        let member= pack.member[0];
        if(member.type === game.symbaroum.config.DAM_RADIO){
          let radioAlternatives = {};
          
          for(let j = 0; j < member.alternatives.length; j++) 
          {
            if(attackFromPC){
              radioAlternatives[`${member.alternatives[j].damageMod}`] = `${member.alternatives[j].label} ${member.alternatives[j].damageMod}`;
            } else {
              radioAlternatives[`${member.alternatives[j].damageModNPC}`] = `${member.alternatives[j].label} ${member.alternatives[j].damageModNPC}`;
            }
          }
          pack.radioAlternatives = radioAlternatives;
          if(pack.defaultSelect === undefined || pack.defaultSelect === null) {
            if(attackFromPC) {
              pack.defaultSelect = `${member.alternatives[0].damageMod}`;
            } else {
              pack.defaultSelect = `${member.alternatives[0].damageModNPC}`;
            }
          }
        }
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