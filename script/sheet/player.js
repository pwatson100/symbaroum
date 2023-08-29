import { SymbaroumActorSheet } from "./actor.js";
import { prepareRollAttribute, prepareRollDeathTest } from "../common/dialog.js";

export class PlayerSheet extends SymbaroumActorSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor", "player"],
            template: "systems/symbaroum/template/sheet/player.hbs",
            width: 800,
            height: "auto",
            resizable: true,
            dragDrop: [
                { dragSelector: '.item[data-item-id]', dropSelector: '.tab-content' },
                { dragSelector: '.attrDragM[data-attribute]' }
            ],            
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main"
                },
            ]
        });
    }

    async getData(options) {
        // game.symbaroum.log("actor-getData(..)",options);
        let data = {
            id: this.actor.id,
            actor: foundry.utils.deepClone(this.actor),
            system: foundry.utils.deepClone(this.actor.system),  
            options: options      
        }

        let enrichedFields = [ 
            "system.bio.appearance",
            "system.bio.background",
            "system.bio.personalGoal",
            "system.bio.stigmas",
            "system.bio.tactics",
            "system.notes"
        ];
        await this._enrichTextFields(data,enrichedFields);

        let items = Array.from(this.actor.items.values()).sort( (a, b) => {
            if(a.type == b.type) {
                return a.name == b.name ? 0 : a.name < b.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.type) - game.symbaroum.config.itemSortOrder.indexOf(b.type));
            }
        });

        data.items = items;
        data.cssClass = this.isEditable ? "editable" : "locked";
        data.editable = this.isEditable;

        data.symbaroumOptions = {
            isGM: game.user.isGM,
            isNPC: this.actor.type === "monster",
            showNpcModifiers: game.settings.get('symbaroum', 'showNpcModifiers')
        };
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

        html.find(".roll-attribute").click(async ev => await this._prepareRollAttribute(ev));
        html.find(".roll-armor").click(async ev => await this._onPrepareRollArmor(ev));
        html.find(".roll-weapon").click(async ev => await this._onPrepareRollWeapon(ev));
        html.find(".modify-attributes").click(async ev => await this._modifyAttributes(ev));

        const symbaroumContextMenu = [{
            name: `TOOLTIP.USE_ABILITY`,
            icon: `<i class="fa-solid fa-bolt-lightning"></i>`,
            isVisible: (elem) => {
                if(elem.system?.hasScript && elem.system?.isPower)
                    return true;
                return false;
            },
            callback: (elem) => this._prepareActivateAbility(elem)
        },{
            name: "TOOLTIP.USE_WEAPON",
            icon: `<i class="fa-solid fa-hand-fist"></i>`,
            isVisible: (elem) => { 
                return elem.system?.isWeapon && elem.system?.isActive;
            },
            callback: (elem, event) => {
                this._prepareRollWeapon(elem);
            }
        },{
            name: "TOOLTIP.USE_ARMOR",
            icon: `<i class="fa-solid fa-shield"></i>`,
            isVisible: (elem) => { 
                return elem == game.symbaroum.config.noArmorID || elem.system.isArmor && elem.system.isActive;
            },
            callback: (elem, event) => {
                this._prepareRollArmor(elem);
            }
        },{
            name: "TOOLTIP.VIEW_ITEM",
            icon: `<i class="fa-regular fa-eye"></i>`,
            isVisible: (elem) => { 
                return elem != game.symbaroum.config.noArmorID;
            },
            callback: (elem, event) => {
                this._itemEdit(elem);
            }
        },{
            name: `TOOLTIP.DELETE_ITEM`,
            icon: `<i class='fas fa-trash'></i>`,
            isVisible: (elem) => { 
                return elem != game.symbaroum.config.noArmorID;
            },
            callback: (elem) => this._itemDelete(elem)
        }];
        class CMPowerMenu extends ContextMenu {      
    
            constructor(html, selector, menuItems, {eventName="contextmenu", onOpen, onClose, parent}={}) {
                super(html, selector, menuItems, {eventName:eventName, onOpen:onOpen, onClose:onClose});
                this.myParent = parent;
                this.originalMenuItems = [...menuItems];
            }

            activateListeners(html) {
                super.activateListeners(html);
                this.menu.css('top', this.menu.parent().position().top);
                this.menu.css('left',this.menu.parent().get(0).getBoundingClientRect().x);
                
            }
        
            render(...args) {
                let item = null;
                if( args[0].data('itemId') == game.symbaroum.config.noArmorID ) {
                    // special case
                    item = game.symbaroum.config.noArmorID;
                } else { 
                    item = this.myParent?.actor.items.get(args[0].data('itemId'));
                }
                if( item ) {
                    this.menuItems = this.originalMenuItems.filter(elem => { 
                        return elem.isVisible(item); 
                    });
                } else {
                    this.menuItems = this.originalMenuItems;
                }
                super.render(...args);
                // console.log($(args).find('nav#context-menu'));
            }
        };
    
        new CMPowerMenu(html, ".symbaroum-contextmenu", symbaroumContextMenu, {  parent:this });
        /*
        new CMPowerMenu(html, ".weapons div.weapon", symbaroumContextMenu, { parent:this });
        new CMPowerMenu(html, ".armor div.item-row", symbaroumContextMenu, { parent:this });
        new CMPowerMenu(html, ".armor.item-row", symbaroumContextMenu, { parent:this });
        */
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

    async _onPrepareRollArmor(event) {
        event.preventDefault();
        await this.actor.rollArmor();
    }
    async _prepareRollArmor(elem) {
        await this.actor.rollArmor();
    }

    async _onPrepareRollWeapon(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        this._prepareRollWeapon(div);
    }
    async _prepareRollWeapon(div)
    {
        const weapon = this.actor.system.weapons.filter(item => item.id == div.data("itemId"))[0];
        await this.actor.rollWeapon(weapon);
    }

    async _modifyAttributes(event) {
        event.preventDefault();
        let system = foundry.utils.deepClone(this.actor.system);
        system.id = this.actor.id;

        const html = await renderTemplate('systems/symbaroum/template/sheet/attributes.hbs', {
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

