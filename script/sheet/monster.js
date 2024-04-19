import { PlayerSheet } from "./player.js";

export class MonsterSheet extends PlayerSheet {

    static get defaultOptions() {
        return foundry.utils.mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor", "monster"]            
        });
    }
}