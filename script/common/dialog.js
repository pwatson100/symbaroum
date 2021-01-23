import { rollAttribute, getAttributeLabel } from './roll.js';

let roll_defaults = {};

export async function prepareRollAttribute(actor, attributeName, armor, weapon) {
	let attri_defaults = getRollDefaults(attributeName,armor != null, weapon != null);

  const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {
    "hasTarget": game.user.targets.values().next().value !== undefined,
    "isWeaponRoll" : weapon !== null,
    "isArmorRoll" : armor !== null,
    "choices": { "0": game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1":game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), "1":game.i18n.localize("DIALOG.FAVOUR_FAVOUR")},
    "groupName":"favour",
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
                    
          let favours = html.find("input[name='favour']");
          let fvalue = 0;
          for ( let f of favours) {						
            if( f.checked ) fvalue = f.value;
          }
          attri_defaults.selectedFavour = ""+fvalue;			
          const favour = fvalue;
          
          const modifier = html.find("#modifier")[0].value;   
          attri_defaults.bonus = modifier;              
                              
          await rollAttribute(actor, attributeName, getTarget(), targetAttributeName, favour,parseInt(modifier), armor, weapon, advantage, damModifier);
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
		modifier: 0,
		advantage: "",
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