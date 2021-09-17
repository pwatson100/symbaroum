import { rollAttribute, getAttributeLabel } from './roll.js';

let roll_defaults = {};

export async function prepareRollAttribute(actor, attributeName, armor, weapon) {
  let targetTokens = Array.from(game.user.targets);
	let attri_defaults = getRollDefaults(attributeName,armor !== null, weapon !== null);
  let attri_mods = getVersusModifiers(targetTokens);
  let askImpeding = actor.data.data.combat.impeding !== 0 && weapon === null && armor === null;
  let weaponModifier = {};
  weaponModifier.attribute = [];
  weaponModifier.damageChoices = [];
  weaponModifier.damageBonus = [];
  
  if(weapon !== null)
  {
    calculateWeaponModifiers(actor, weapon, weaponModifier);
    weaponModifier.damageChoicesLength = weaponModifier.damageChoices.length;
    weaponModifier.damageBonusLength = weaponModifier.damageBonus.length;
    // console.log("Weapon Modifier",weaponModifier);
  }

  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {
    "hasTarget": targetTokens.length > 0,
    "isWeaponRoll" : weapon !== null,
    "weaponDamage" : weapon !== null ? weapon.damage.pc:"",
    "weaponModifier" : weaponModifier,
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

          for(let bonus of weaponModifier.damageBonus) {
            damModifier += `${bonus.damageModifier}[${bonus.label}]`;            
          }
          for(let optionalBonus of weaponModifier.damageChoices) {
            if(optionalBonus.type === "check") {
              // Find if the box is checked
              let ticked = html.find(`#${optionalBonus.label}`);
              if( ticked.length > 0 && ticked[0].checked )
                damModifier += ticked[0].value;
            } else if( optionalBonus.type === "radio") {
              // Find the selected radio button
              let radioSelection = html.find("input[name='"+optionalBonus.identifier+"']");
              for( let f of radioSelection) {
                if( f.checked ) 
                  damModifier += f.value;
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
          // console.log("Damage bonus",damModifier);
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

function getRollDefaults(attributeName, isArmor, isWeapon) {
  if( !game.settings.get('symbaroum', 'saveCombatRoll')) {
    if(isArmor || isWeapon) {
      return createDefaults();
    }
  }
  if( !game.settings.get('symbaroum', 'saveAttributeRoll')) {
    if(!isArmor && !isWeapon) {
      return createDefaults();
    }
  }
  if( roll_defaults[attributeName+":"+isArmor+":"+isWeapon] === undefined )
	{
		roll_defaults[attributeName+":"+isArmor+":"+isWeapon] = createDefaults();
	}
	return roll_defaults[attributeName+":"+isArmor+":"+isWeapon];
}

function createDefaults() {
	return {
		targetAttributeName: "custom",
		additionalModifier: "",
		selectedFavour: "0",
		modifier: "0",
    advantage: "",
    impeding: ""
	};
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

function calculateWeaponModifiers(actor, weapon, weaponModifier)
{
  let robust = actor.data.items.filter(element => element.data.data?.reference === "robust");
  // If actor has Robust (and weapon is melee)
  if(robust.length > 0 && weapon.isMelee) {
    let dice = robust[0].getLevel().level;
    let choice = {};
    choice["label"] = robust[0].name;
    choice["type"] = "check";
    let damMod = `+1d${(dice+1)*2}`;
    let damlabel =  `(${damMod})`;
    damMod = `${damMod}[${robust[0].name}]`;
    choice["alternatives"] = {
      "label":damlabel,
      "damMod":damMod
    };
    choice["restrition"] = "1st-attack"; // Only apply damage bonus to first attack
    weaponModifier.damageChoices.push(choice);
  }

  let ironFist = actor.data.items.filter(element => element.data.data?.reference === "ironfist");
  if( ironFist.length > 0 && weapon.isMelee) {
    // If actor has Iron Fist Master (and weapon is melee)
    let power = ironFist[0].getLevel();
    if( power.level > 0) {
      weaponModifier.attribute.push( {
          attribute:"strong",
          label: ironFist[0].name
        });
    }
    if( power.level === 2) {
      let bonus = {};
      bonus.label = ironFist[0].name;
      bonus.damageModifier = "+1d4";
      // No choice
      weaponModifier.damageBonus.push(bonus);
    } else if( power.level === 3) {
      let choice = {};
      choice["type"] = "radio";
      choice["label"] = ironFist[0].name;
      choice["identifier"] = "weapMod_"+ironFist[0].name;
      choice["defaultSelect"] = `+1d4[${ironFist[0].name}]`;
      choice["alternatives"] = {};
      choice["alternatives"][`+1d4[${ironFist[0].name}]`] = `${ironFist[0].name} - ${power.lvlName} (1d4)`;
      choice["alternatives"][`+1d8[${ironFist[0].name}]`] = `${ironFist[0].name} - ${power.lvlName} (1d8)`;
      weaponModifier.damageChoices.push(choice);
    }
  }

  /*
  let featOfStr = actor.data.items.filter(element => element.data.data?.reference === "featofstrength");
  if( featOfStr.length > 0 && featOfStr[0].getLevel().level === 3 && weapon.isMelee) {
    if(actor.data.data.health.toughness.value <= (actor.data.data.health.toughness.max/2) )
    {        
      let bonus = {};
      bonus.label = featOfStr[0].name;
      bonus.damageModifier = "+1d4";
      weaponModifier.damageBonus.push(bonus);
    }
  }
  */

  let hunterInstinct = actor.items.filter(item => item.data.data?.reference === "huntersinstinct");
  
  if( weapon.isDistance && hunterInstinct.length > 0 && hunterInstinct[0].getLevel().level > 1) {
    let choice = {};
    choice["label"] = hunterInstinct[0].name;
    choice["type"] = "check";
    let damMod = `+1d4`;
    let damlabel =  `(${damMod})`;
    damMod = `${damMod}[${hunterInstinct[0].name}]`;
    choice["alternatives"] = {
      "label":damlabel,
      "damMod":damMod
    };
    weaponModifier.damageChoices.push(choice);
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