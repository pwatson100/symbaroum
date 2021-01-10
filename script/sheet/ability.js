import { SymbaroumItemSheet } from "./item.js";
import { activateAbility } from "../common/item.js";

export class AbilitySheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/ability.html",
            width: 500,
            height: 472,
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
        return data;
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        return buttons;
    }

    activateListeners(html) {
        super.activateListeners(html);
        html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    }

    async _prepareActivateAbility(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const ability = this.actor.getOwnedItem(div.data("itemId"));
        await activateAbility(ability, this.actor);
    }
}
