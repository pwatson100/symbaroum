import { PlayerSheet2 } from "./player2.js";

export class MonsterSheet extends PlayerSheet2 {

    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "actor", "monster"]            
        });
    }
}