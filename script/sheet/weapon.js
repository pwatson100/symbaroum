import { SymbaroumItemSheet } from "./item.js";

export class WeaponSheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
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
        return data;
    }
}
