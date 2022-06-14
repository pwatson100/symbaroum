import { SymbaroumActorSheet } from "./actor.js";
import { prepareRollAttribute, prepareRollDeathTest } from "../common/dialog.js";

export class PlayerSheet extends SymbaroumActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor"],
            template: "systems/symbaroum/template/sheet/player.html",
            width: 800,
            height: 1000,
            resizable: false,
            dragDrop: [
                { dragSelector: '.item[data-item-id]', dropSelector: '.tab-content' },
                { dragSelector: '.attrDragM[data-attribute]' }
            ],
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

    _onDragStart(event)
    {
        if(event.srcElement.dataset.attribute !== undefined) {
            const dragData = {
                actorId: this.actor.id,
                sceneId: this.actor.isToken ? canvas.scene?.id : null,
                tokenId: this.actor.isToken ? this.actor.token.id : null
            };
            dragData.type = 'attribute';
            dragData.attribute = event.srcElement.dataset.attribute;
            return event.dataTransfer.setData("text/plain",JSON.stringify(dragData));
        }
        return super._onDragStart(event);
    }

    activateListeners(html) {
        super.activateListeners(html);
        // console.log(this.actor);

        html.find(".roll-attribute").click(async ev => await this._prepareRollAttribute(ev));
        html.find(".roll-armor").click(async ev => await this._prepareRollArmor(ev));
        html.find(".roll-weapon").click(async ev => await this._prepareRollWeapon(ev));
        html.find(".modify-attributes").click(async ev => await this._modifyAttributes(ev));
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        if (this.actor.isOwner ) {
            buttons = [
                {
                    label: game.i18n.localize("BUTTON.DEATH"),
                    class: "death-roll",
                    icon: "fas fa-skull",
                    onclick: async ev => await this._prepareRollDeathTest(ev),
                },
                {
                    label: game.i18n.localize("BUTTON.RECOVER"),
                    class: "recover-death-roll",
                    icon: "fas fa-heart",
                    onclick: async (ev) => await this.actor.update( {"system.nbrOfFailedDeathRoll":0 })
                }
            ].concat(buttons);
        }
        return buttons;
    }


    async _prepareRollDeathTest(event) {
        event.preventDefault();
        await prepareRollDeathTest(this.actor, event.shiftKey);
    }

    async _prepareRollAttribute(event) {
        event.preventDefault();
        const attributeName = $(event.currentTarget).data("attribute");        
        await prepareRollAttribute(this.actor, attributeName, null, null);
    }

    async _prepareRollArmor(event) {
        event.preventDefault();
        await this.actor.rollArmor();
    }

    async _prepareRollWeapon(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const weapon = this.actor.system.weapons.filter(item => item.id == div.data("itemId"))[0];
        await this.actor.rollWeapon(weapon);
    }

    async _modifyAttributes(event) {
        event.preventDefault();
        let system = foundry.utils.deepClone(this.actor.system);
        system.id = this.actor.id;

        const html = await renderTemplate('systems/symbaroum/template/sheet/attributes.html', {
            id: this.actor.id,
            system: system
        });
        let title = game.i18n.localize('TITLE.ATTRIBUTES');
        let dialog = new Dialog({
            //              label: "toto",
            title: title,
            content: html,
            buttons:{
                confirm: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('BUTTON.CONFIRM'),
                    callback: async (html) => {
                        for (var aKey in system.attributes) {
                            var base = "#" + system.id + "-" + [aKey] + "-value";
                            const stringValue = html.find(base)[0].value;

                            let newValue = parseInt(stringValue, 10);
                            if( !isNaN(newValue)) {
                                let link = "system.attributes."+[aKey]+".value";
                                var mod = "#" + [aKey] + "-mod";
                                const stringMod = html.find(mod)[0].value;
                                let newModValue = parseInt(stringMod, 10);
                                if( !isNaN(newModValue)) {
                                    let linkMod = "system.attributes."+[aKey]+".temporaryMod";
                                    await this.actor.update({ [link] : newValue, [linkMod] : newModValue });
                                }
                            }
                        }
                    }
                },
                cancel: {
                    icon: '<i class="fas fa-check"></i>',
                    label: game.i18n.localize('BUTTON.CANCEL'),
                    callback: async (html) => {}
                }
            }
        });
        
        dialog.render(true);
    }
}

