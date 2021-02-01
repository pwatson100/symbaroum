import { SymbaroumActorSheet } from "./actor.js";

export class MonsterSheet extends SymbaroumActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor"],
            template: "systems/symbaroum/template/sheet/monster.html",
            width: 800,
            height: 1000,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main",
                },
            ],
        });
    }

    getData() {
        const data = super.getData();
        return data;
    }

    activateListeners(html) {
        super.activateListeners(html);
        if(game.settings.get('symbaroum', 'combatAutomation')){
            html.find(".roll-weapon").click(async ev => await this._prepareRollWeapon(ev))
        }
    }

    async _prepareRollWeapon(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const weapon = this.actor.getOwnedItem(div.data("itemId"));
        await this.actor.rollWeapon(weapon)
    }
}
