import { PlayerSheet } from "./player.js";
import { prepareRollAttribute } from "../common/dialog.js";
import { deathRoll } from "../common/roll.js";

export class PlayerSheet2 extends PlayerSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor"],
            template: "systems/symbaroum/template/sheet/player2.html",
            width: 800,
            height: 1000,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main"
                },
            ]
        });
    }

    getData() {
        let data = {
            id: this.actor.id,
            actor: foundry.utils.deepClone(this.actor.data),
            data: foundry.utils.deepClone(this.actor.data.data),        
        }

        let items = Array.from(this.actor.data.items.values()).sort( (a, b) => {
            if(a.data.type == b.data.type) {
                return a.data.name == b.data.name ? 0 : a.data.name < b.data.name ? -1:1;
            } else {                
                return  (game.symbaroum.config.itemSortOrder.indexOf(a.data.type) - game.symbaroum.config.itemSortOrder.indexOf(b.data.type));
            }
        });

        data.items = items;
        console.log(items.toObject());
        data.cssClass = this.isEditable ? "editable" : "locked";
        data.editable = this.isEditable;

        return data;
    }
}
