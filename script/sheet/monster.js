import { PlayerSheet } from "./player.js";

export class MonsterSheet extends PlayerSheet {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor", "monster"]            
        });
    }
}