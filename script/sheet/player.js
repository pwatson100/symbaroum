import { SymbaroumActorSheet } from "./actor.js";
import { prepareRollAttribute } from "../common/dialog.js";
import { deathRoll } from "../common/roll.js";
import { activateAbility } from "../common/item.js";

export class PlayerSheet extends SymbaroumActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor"],
            template: "systems/symbaroum/template/sheet/player.html",
            width: 700,
            height: 1000,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main",
                },
            ]
        });
    }

    getData() {
        const data = super.getData();
        return data;
    }


    activateListeners(html) {
        super.activateListeners(html);
        html.find(".roll-attribute").click(async ev => await this._prepareRollAttribute(ev));
        html.find(".roll-armor").click(async ev => await this._prepareRollArmor(ev));
        html.find(".roll-weapon").click(async ev => await this._prepareRollWeapon(ev));
        html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (this.actor.owner) {
            buttons = [
                {
                    label: game.i18n.localize("BUTTON.DEATH"),
                    class: "death-roll",
                    icon: "fas fa-skull",
                    onclick: async (ev) => await deathRoll(this)
                },
                {
                    label: game.i18n.localize("BUTTON.RECOVER"),
                    class: "recover-death-roll",
                    icon: "fas fa-heart",
                    onclick: (ev) => this.nbrOfFailedDeathRoll = 0
                }
            ].concat(buttons);
        }
        return buttons;
    }

    async _prepareRollAttribute(event) {
        event.preventDefault();
        const attributeName = $(event.currentTarget).data("attribute");
        const attribute = this.actor.data.data.attributes[attributeName];
        const bonus = this.actor.data.data.bonus[attributeName];
        const attributeData = {name: game.i18n.localize(attribute.label), value: attribute.value + bonus};
        await prepareRollAttribute(this.actor, attributeData, null, null);
    }

    async _prepareRollArmor(event) {
        event.preventDefault();
        const attributeData = {name: this.actor.data.data.combat.armor, value: this.actor.data.data.combat.defense};
        const armor = { protection: this.actor.data.data.combat.protection, quality: this.actor.data.data.combat.quality }
        await prepareRollAttribute(this.actor, attributeData, armor, null);
    }

    async _prepareRollWeapon(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const weapon = this.actor.getOwnedItem(div.data("itemId"));
        const attribute = this.actor.data.data.attributes[weapon.data.data.attribute];
        const bonus = this.actor.data.data.bonus[weapon.data.data.attribute];
        const attributeData = { name: game.i18n.localize(attribute.label), value: attribute.value + bonus };
        const weaponData = { damage: weapon.data.data.damage, quality: weapon.data.data.quality, qualities: weapon.data.data.qualities }
        await prepareRollAttribute(this.actor, attributeData, null, weaponData);
    }

    async _prepareActivateAbility(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const ability = this.actor.getOwnedItem(div.data("itemId"));
        await activateAbility(ability, this.actor);
    }
}
