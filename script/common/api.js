import { baseRoll, rollAttribute } from './roll.js';

export class SymbaroumAPI
{
    /**
     * The constructor - only used internally of the symbaroum system. Note that this is a singleton.
     */    
    constructor() {
        // Set-up anything else
        this.baseRoll = baseRoll;
        this.rollAttribute = rollAttribute;
        
        this.registerFunction("getEffect", function(token, effect) {
            //check if there is an icon effect on the token
            if(token.actor.effects.find(e => e.getFlag("core", "statusId") === effect.id) ) {
                return true;
            }
            else return false;
        });
    }


    /**
     * Registers an API reference to call. It will not overwrite an existing one. Any form/shape of cascading has to be done by the registrant if there is a conflict.
     * 
     * @throws If the name API is already registered
     * @param {string} name - The name of the API reference
     * @param {function} func - The function for the API reference
     */
    registerFunction(name, func) {
        if( this[name] == undefined) {
            this[name] = func;
        } else {
            throw `Symbaroum API Function ${name} is already registered`;
        }
    }

    /**
     * De-registers an API reference. Note that the API is used internally and you might brick the system by un-registering API required.
     * 
     * @param {string} name - The name of the API reference
     */
    deregisterFunction(name) {
        if( this[name] == undefined) {
            throw `Function ${name} is already deregistered`;
        } else {
            delete this[name];
        }
    }

    /**
     * 
     * @param {The name of the modifier function} name 
     * @returns 
     */
    _getItemModifierFunctionName(name) {
        return `getItemModifier${name.charAt(0).toUpperCase() + name.slice(1)}`;
    }

    /**
     * Register a function as an item modifier
     * 
     * @param {The name of the function} name 
     * @param {The function} func 
     */
    registerItemModifier(name, func) {
        const funcName = this._getItemModifierFunctionName(name)

        if( CONFIG.Item.documentClass.prototype[funcName] != undefined) {
            throw `ItemModifier ${name} is already registered`
        } else {
            CONFIG.Item.documentClass.prototype[funcName] = func;
        }        
    }

    /**
     * Unregisters an item modifier function
     * 
     * @param {The name of the function} name 
     */
    unregisterItemModifier(name) {
        const funcName = this._getItemModifierFunctionName(name)

        if( CONFIG.Item.documentClass.prototype[funcName] == undefined) {
            throw `ItemModifier ${name} is already unregistered`
        } else {
            delete CONFIG.Item.documentClass.prototype[funcName];
        }        
    }

    /**
     * format the string to print the roll result, including the 2 dice if favour was involved, and the second roll when the option rare crits is enabled
     * 
     * @param {Roll} rollDataElement - The roll data information containing dice result
     * @returns {string} the formated and localized string
     */
    formatRollResult(rollDataElement){
        let rollResult = game.i18n.localize('ABILITY.ROLL_RESULT') + rollDataElement.diceResult.toString();
        if(rollDataElement.favour != 0){
            rollResult += "  (" + rollDataElement.dicesResult[0].toString() + " , " + rollDataElement.dicesResult[1].toString() + ")";
        }
        if(rollDataElement.secondRollResult){
            rollResult += " - " + game.i18n.localize('ABILITY.SECOND_ROLL_RESULT') + rollDataElement.secondRollResult.toString();
        }
        return rollResult;
    }

    /**
     * 
     * @param {The actor with attributes} actor 
     * @param {The name of the attribute, or "custom" or "defense"} attributeName 
     * @returns The I18N version of the attribute
     */
    getAttributeLabel(actor, attributeName) {
        if (attributeName === 'custom') {
            return game.i18n.localize("ATTRIBUTE.CUSTOM");
        } else if (attributeName === 'defense') {
            return game.i18n.localize("ARMOR.DEFENSE");
        } else {
            return game.i18n.localize(actor.system.attributes[attributeName].label);
        }
    }

    /**
     * Generates names from specific category
     * 
     * @param {The syllabels in the name} nameParts 
     * @param {The number of names to be generated} numNames 
     * @returns 
     */
	generateCategoryName(nameParts, numNames)
	{		
		let arr = [];
		for(let i = 0; i < numNames; i++)
		{
			let fullName = '';
			for ( let syllabel of nameParts ) {
				let syllabelIndex = Math.floor(Math.random() * syllabel.length);
				let actualSyllabel = syllabel[syllabelIndex];
				if( actualSyllabel != "_") {
					fullName = fullName.concat(actualSyllabel);
				} else if(fullName.length > 3) {
					break;
				}
			}
			arr.push(fullName);
		}
		return arr;
	}

    /**
     * Generates name of the defined categories
     * 
     * @param {The category to generate names for} category 
     * @param {The number of names to be retrieved} numNames 
     * @returns 
     */
	async generateNames(category, numNames) {
		// allNames needs to load json
		const response = await fetch('systems/symbaroum/supplemental-data/names.json');
		if(!response.ok) {
			game.symbaroum.error("Could not fetch supplemental name data",response);
			return;
		}
		const allNames = await response.json();
		return this.generateCategoryName(allNames[category], numNames);
	}


    /**
     * Hooks
     */

    /**
     * This is the syntax for the hook of Symbaroum combat modifiers - these are passed by reference just prior to making changes
     * to the character.
     * 
     * @param {The actor for the hook} actor 
     * @param {All combatMods, by reference} combatMods 
     * @param {All allArmors, by refernce} allArmors 
     * @param {All weapons, by reference} allWeapons 
     * @param {All allAbilities, by refrence} allAbilities 
     */
    symbaroumItemModifiersSetup(actor, combatMods, allArmors, allWeapons, allAbilities) {
        Hooks.callAll(game.symbaroum.config.HOOKS.symbaroumItemModifiersSetup,actor, combatMods, allArmors, allWeapons, allAbilities);
    }



}
