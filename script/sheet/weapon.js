import { SymbaroumItemSheet } from "./item.js";

export class WeaponSheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/weapon.hbs",
            width: 700,
            height: 600,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "description",
                },
            ]
        });
    }

    async getData() {
        let data = await super.getData(...arguments);
        data.qualities = game.symbaroum.config.weaponQualities;
        data.compatibilities = game.symbaroum.config.weaponCompatibilities;
        data.bonuses = [...data.bonuses, ...game.symbaroum.config.BONUS_FIELDS_WEAPON];
        data.alternative_selection = game.symbaroum.config.ATTRIBUTE_SELECTION;
        data.alternative_selection.none = {
          id: "none",
          label: game.i18n.localize(`WEAPON.NONE`),
        };
        data.attribute_selection = game.symbaroum.config.ATTRIBUTE_SELECTION;
        data.weapon_damage_selection = game.symbaroum.config.WEAPON_DAMAGE_SELECTION;
        data.weapon_type_selection = game.symbaroum.config.WEAPON_TYPE_SELECTION;
        return data;
    }
}
