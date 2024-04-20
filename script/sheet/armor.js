import { SymbaroumItemSheet } from "./item.js";

export class ArmorSheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/armor.hbs",
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
        data.qualities = game.symbaroum.config.armorQualities;
        data.compatibility = game.symbaroum.config.armorCompatibilities;
        data.bonuses = [...data.bonuses, ...game.symbaroum.config.BONUS_FIELDS_ARMOR];
        data.protection_selection = game.symbaroum.config.ARMOR_PROTECTION_SELECTION;
        return data;
    }
}
