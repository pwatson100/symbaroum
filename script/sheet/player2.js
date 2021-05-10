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
        // const data = super.getData();
        /*
        if(!this.actor.data.isDataPrepared)
            this.actor.prepareData();
        */
        let data = {
            id: this.actor.id,
            actor: foundry.utils.deepClone(this.actor.data),
            data: foundry.utils.deepClone(this.actor.data.data)
        }
        data.items = this.actor.items;
        return data;
    }
}
