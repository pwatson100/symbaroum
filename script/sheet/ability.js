import { SymbaroumItemSheet } from "./item.js";

export class AbilitySheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/ability.html",
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

    getData() {
        const data = super.getData();
        data.isOwned = this.item.isOwned;
        return data;
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        return buttons;
    }
}
