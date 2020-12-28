import { PlayerSheet } from "./player.js";
import { prepareRollAttribute } from "../common/dialog.js";
import { deathRoll } from "../common/roll.js";

export class PlayerSheet2 extends PlayerSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor"],
            template: "systems/symbaroum/template/sheet/player2.html",
            width: 700,
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
        const data = super.getData();
        return data;
    }
}
