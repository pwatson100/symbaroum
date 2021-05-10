import { rollAttribute, getAttributeLabel } from './roll.js';

let roll_defaults = {};

export async function prepareRollAttribute(actor, attributeName, armor, weapon) {
  let targetTokens = Array.from(game.user.targets);
	let attri_defaults = getRollDefaults(attributeName,armor !== null, weapon !== null);
  let attri_mods = getVersusModifiers(targetTokens);
  let askImpeding = actor.data.data.combat.impeding !== 0 && weapon === null && armor === null;

  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {
    "hasTarget": targetTokens.length > 0,
    "isWeaponRoll" : weapon !== null,
    "weaponDamage" : weapon !== null ? weapon.damage.pc:"",
    "isArmorRoll" : armor !== null,
    "askImpeding" : askImpeding,
    "choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
    "groupName":"favour",
    "attri_mods" : attri_mods,
    "roll_defaults": attri_defaults
  });
  console.log(armor);
  console.log(weapon);
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

function getTarget() {
  const target = game.user.targets.values().next().value;
  if (target === undefined) {
    return null;
  } else {
    return target.actor;
  }
}