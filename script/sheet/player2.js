import { PlayerSheet } from "./player.js";

export class PlayerSheet2 extends PlayerSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor", "player"],
            template: "systems/symbaroum/template/sheet/player2.html",
            width: 800,
            height: 1000,
            resizable: true,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "main"
                },
            ]
        });
    }

    async getData() {
        let data = {
            id: this.actor.id,
            actor: foundry.utils.deepClone(this.actor),
            system: foundry.utils.deepClone(this.actor.system),        
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
        game.symbaroum.log("data", data);
        return data;
    }

}
