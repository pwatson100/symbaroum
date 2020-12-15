import { rollAttribute } from './roll.js';

export async function prepareRollAttribute(attribute, armor, weapon) {
    const html = await renderTemplate('systems/symbaroum/template/chat/dialog.html', {});
    let dialog = new Dialog({
        title: attribute.name,
        content: html,
        buttons: {
            roll: {
                icon: '<i class="fas fa-check"></i>',
                label: game.i18n.localize('BUTTON.ROLL'),
                callback: async (html) => {
                    const modifierName = html.find('#modifier')[0].value;
                    const bonus = html.find('#bonus')[0].value;
                    const modifier = getTargetAttribute(modifierName, bonus);
                    await rollAttribute(attribute, modifier, armor, weapon);
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

function getTargetAttribute(attributeName, bonus) {
    const target = game.user.targets.values().next().value;
    console.log('🚀 ~ file: dialog.js ~ line 33 ~ getTargetAttribute ~ target', target);
    if (target === undefined || attributeName === 'custom') {
        return { name: game.i18n.localize('ATTRIBUTE.CUSTOM'), value: 10 - bonus };
    } else if (attributeName === 'defense') {
        let defense = target.actor.data.data.combat.defense + target.actor.data.data.bonus.defense;
        return { name: game.i18n.localize('ARMOR.DEFENSE'), value: defense - bonus };
    } else {
        console.log(target.actor.data.data);
        const attribute = target.actor.data.data.attributes[attributeName];
        const attributeValue = attribute.value + target.actor.data.data.bonus[attributeName];
        return { name: game.i18n.localize(attribute.label), value: attributeValue - bonus };
    }
}