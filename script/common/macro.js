import { prepareRollAttribute } from "../common/dialog.js";

export class SymbaroumMacros {
	constructor() {}

	macroReady() {
		this.setupMacroFolders();
		Hooks.on("hotbarDrop", (bar, data, slot) =>
			this.createSymbaroumMacro(data, slot)
		);
	}

	setupMacroFolders() {
		game.symbaroum.info("In setupMacroFolders");
		if (!game.user.isGM) {
			// Only make changes to system
			return;
		}
		const folderName = game.symbaroum.config.SYSTEM_MACRO_FOLDER;
		let folder = game.folders
			.filter((f) => f.type === "Macro")
			.find((f) => f.name === folderName);
		if (!folder) {
			Folder.create({
				name: folderName,
				type: "Macro",
				parent: null,
			});
		}
	}

	/* -------------------------------------------- */
	/*  Hotbar Macros                               */
	/* -------------------------------------------- */

	/**
	 * Create a Macro from an Item drop.
	 * Get an existing item macro if one exists, otherwise create a new one.
	 * @param {Object} data     The dropped data
	 * @param {number} slot     The hotbar slot to use
	 * @returns {Promise}
	 */
	async createSymbaroumMacro(data, slot) {
		game.symbaroum.log(data);
		const folder = game.folders
			.filter((f) => f.type === "Macro")
			.find((f) => f.name === game.symbaroum.config.SYSTEM_MACRO_FOLDER);
		if (data.type === "attribute") {
			// Create the macro command
			const command = `game.symbaroum.macros.rollAttribute('${data.attribute}');`;
			const actor = game.actors.get(data.actorId);
			if (!actor) return;

			const commmandName = game.i18n.format("MACRO.MAKETEST", {
				testtype: game.i18n.localize(
					actor.data.data.attributes[data.attribute].label
				),
			});

			let macro = game.macros.find(
				(m) =>
					m.name === commmandName &&
					m.data.command === command &&
					(m.data.author === game.user.id ||
						m.data.permission.default >=
							CONST.ENTITY_PERMISSIONS.OBSERVER ||
						m.data.permission[game.user.id] >=
							CONST.ENTITY_PERMISSIONS.OBSERVER)
			);
			if (!macro) {
				macro = await Macro.create({
					name: commmandName,
					type: "script",
					img: game.i18n.format(game.symbaroum.config.imageRef, {
						filename:
							game.symbaroum.config.attributeImages[
								data.attribute
							],
					}),
					command: command,
					flags: { "symbaroum.attributeMacro": true },
					folder: folder?.id,
					"permission.default": CONST.ENTITY_PERMISSIONS.OBSERVER,
				});
			}
			game.user.assignHotbarMacro(macro, slot);
			return false;
		} else if (data.type === "Item") {
			if (!("data" in data))
				return ui.notifications.warn(
					game.i18n.localize("ERROR.MACRO_NOT_OWNED")
				);
			const item = data.data;
			// Create the macro command
			const command = `game.symbaroum.macros.rollItem("${item.name}");`;
			let macro = game.macros.find(
				(m) =>
					m.name === item.name &&
					m.data.command === command &&
					(m.data.author === game.user.id ||
						m.data.permission.default >=
							CONST.ENTITY_PERMISSIONS.OBSERVER ||
						m.data.permission[game.user.id] >=
							CONST.ENTITY_PERMISSIONS.OBSERVER)
			);
			if (!macro) {
				macro = await Macro.create({
					name: item.name,
					type: "script",
					img: item.img,
					command: command,
					flags: { "symbaroum.itemMacro": true },
					folder: folder?.id,
					"permission.default": CONST.ENTITY_PERMISSIONS.OBSERVER,
				});
			}
			game.user.assignHotbarMacro(macro, slot);
			return false;
		}
	}
	/**
	 * Create a Macro from an attribute drop.
	 * Get an existing item macro if one exists, otherwise create a new one.
	 * @param {string} attribute
	 */
	async rollAttribute(attribute) {
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);
		if (!actor) {
			return ui.notifications.warn(
				game.i18n.localize("ERROR.MACRO_NO_OBJECT") + speaker
			);
		}
		prepareRollAttribute(actor, attribute, null, null);
	}

	/**
	 * Create a Macro from an Item drop.
	 * Get an existing item macro if one exists, otherwise create a new one.
	 * @param {string} itemName
	 * @return {Promise}
	 */
	async rollItem(itemName) {
		const speaker = ChatMessage.getSpeaker();
		let actor;
		if (speaker.token) actor = game.actors.tokens[speaker.token];
		if (!actor) actor = game.actors.get(speaker.actor);
		const item = actor
			? actor.items.find(
					(i) => i.name === itemName && i.data.data.isActive
			)
			: null;
		if (!item)
			return ui.notifications.warn(
				game.i18n.localize("ERROR.MACRO_NO_OBJECT") + itemName
			);

		if (item.data.isWeapon) {
			const weapon = actor.data.data.weapons.filter(
				(it) => it.id == item.id
			)[0];
			return actor.rollWeapon(weapon);
		}
		if (item.data.isArmor) {
			return actor.rollArmor();
		} else if (item.data.isPower) {
			if (
				actor.data.data.combat.combatMods.abilities[item.data._id]
					?.isScripted
			) {
				return actor.usePower(item);
			} else
				return ui.notifications.warn(
					itemName + game.i18n.localize("ERROR.MACRO_NO_SCRIPT")
				);
		} else return;
	}

    /**********************************************
     * Macro: addExp
     */

    // Built-in macros
	async addExp() {
		let defaultCheck = "checked"; // set to unchecked
		let actorslist = [];

		if (canvas.tokens.controlled.length > 0) {
			// If no actor selected
			// Time to get busy
			canvas.tokens.controlled.map((e) => {
				if (e.actor.data.type === "player") {
					if (game.user.isGM || e.actor.owner)
						actorslist.push(e.actor);
				}
			});
		} else {
			let gameacts = game.actors.filter((e) => {
				if (
					(game.user.isGM || e.owner) &&
					e.data.type === "player" &&
					e.hasPlayerOwner
				) {
					return e;
				}
			});
			Array.prototype.push.apply(actorslist, gameacts);
		}

		let allKeys = "";
		actorslist.forEach((t) => {
			allKeys =
				allKeys.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
                    <div style="width:10em;min-width:10em;"><label for="${t.data._id}">${t.data.name}</label> </div>
                    <div><input id="${t.data._id}" type="checkbox" name="selection" value="${t.data._id}" ${defaultCheck}="${defaultCheck}"></div>
                </div>`);
		});

		let dialog_content = `  
        <div class="form-group">
        <h2>${game.i18n.localize("MACRO.SELECTPLAYERS")}</h2>
        ${allKeys}
        <br />
        <div style="flex-basis: auto;flex-direction: row;display: flex;">
                    <div style="width:10em;min-width:10em;"><label for="experience" style="width:10em;min-width:10em">${game.i18n.localize("MACRO.EXPERIENCE")}</label></div><div><input type="text" name="experience" value="1" style="width:5em"></div>
        </div>
        <br/>
        </div>`;
		let x = new Dialog({
			title: game.i18n.localize("MACRO.ADDEXP_TITLE"),
			content: dialog_content,
			buttons: {
				Ok: {
					label: game.i18n.localize("DIALOG.OK"),
					callback: async (html) => {
						let tmp = html
							.find("input[name='selection']")
							.get()
							.filter((v) => {
								if (v.checked) return true;
							})
							.map((e) => {
								return e.value;
							});
						let exp = parseInt(
							html.find("input[name='experience'")[0].value
						);
						if (isNaN(exp) || tmp.length == 0) {
							ui.notifications.error(
								game.i18n.localize("MACRO.ADDEXP_NUMBER")
							);
							return;
						}
						this.addExperience(tmp, exp);
					},
				},
				Cancel: { label: game.i18n.localize("DIALOG.CANCEL") },
			},
		});

		x.options.width = 200;
		x.position.width = 300;

		x.render(true);
	}

	addExperience(actorids, exp) {
		let actorNames = "";
		let updates = actorids.map((a) => {
			let aexp = game.actors.get(a);

			actorNames = actorNames + "<li>" + aexp.name;

			return {
				_id: a,
				"data.experience.total": aexp.data.data.experience.total + exp,
			};
		});

		Actor.updateDocuments(updates);
		let chatOptions = {
			rollMode: game.settings.get("core", "rollMode"),
			content: `<h2>${game.i18n.localize("MACRO.ADDEXP_CHANGE")}</h2> 
						${game.i18n.format("MACRO.ADDEXP_CHANGE_LONG", {actorNames:actorNames, exp:exp })}`
			/// The following actors:<ul> ${actorNames}</ul> were awarded ${exp} experience`,
		};
		ChatMessage.create(chatOptions);
	}

    /**********************************************
     * Macro: addAlternativeDamage
     */

	addAlternativeDamage() {
		if (canvas.tokens.controlled.length === 0)
			return ui.notifications.error("Please select a token first");

		new Dialog({
			title: `Alternate Damage`,
			content: `<form>
            <div style="display:flex">
            <label style="min-width:15em" for="damagetype">Damage type:</label>
            <select id="vision-type" style="min-width:10em" name="damagetype">
            <option value="accurate">${game.i18n.localize("ATTRIBUTE.ACCURATE")}</option>
            <option value="cunning">${game.i18n.localize("ATTRIBUTE.CUNNING")}</option>
            <option value="discreet">${game.i18n.localize("ATTRIBUTE.DISCREET")}</option>
            <option value="persuasive">${game.i18n.localize("ATTRIBUTE.PERSUASIVE")}</option>
            <option value="quick">${game.i18n.localize("ATTRIBUTE.QUICK")}</option>
            <option value="resolute">${game.i18n.localize("ATTRIBUTE.RESOLUTE")}</option>
            <option value="strong">${game.i18n.localize("ATTRIBUTE.STRONG")}</option>
            <option value="vigilant">${game.i18n.localize("ATTRIBUTE.VIGILANT")}</option>    
            </select>
            </div>
            <div style="display:flex; margin-top:5px; margin-bottom:5px">
            <label style="min-width:15em" for="altdam">Damage:</label>
            <input style="max-width:10em" id="altdam" name="altdam" type="text">
            </div>
            </form>
            `,
			buttons: {
				yes: {
					icon: "<i class='fas fa-check'></i>",
					label: `Apply Damage`,
					callback: async (html) => {
						await dealDamage(
							html.find("#vision-type")[0].value,
							html.find("#altdam")[0].value
						);
					},
				},
				no: {
					icon: "<i class='fas fa-times'></i>",
					label: `Cancel Damage`,
				},
			},
			default: "yes",
		}).render(true);

		async function dealDamage(type, damage) {
			for (let token of canvas.tokens.controlled) {
				let calcDam = parseInt(damage) * -1;
				if (isNaN(calcDam)) {
					console.log(
						"Can't understand damage[" +
							damage +
							"] - is this a number?"
					);
					break;
				}
				let actor = token.actor;
				if (
					actor.data.data.attributes[type] === undefined ||
					actor.data.data.attributes[type] === null
				) {
					console.log("This is not an attribute in Symbaroum");
					break;
				}
				let tot =
					actor.data.data.attributes[type].temporaryMod + calcDam;
				let modification = {};
				setProperty(
					modification,
					`data.attributes.${type}.temporaryMod`,
					tot
				);
				await actor.update(modification);
			}
		}
	}

    /**********************************************
     * Macro: rollAttribute
     */
    async rollAttribute() {
        let defaultCheck = "unchecked"; // set to unchecked
        let actorslist = [];
    
        if(canvas.tokens.controlled.length > 0) {
            // If no actor selected
            // Time to get busy
            canvas.tokens.controlled.map(e => { 
                if(game.user.isGM || e.actor.owner && e.actor.data.type === "player" && e.hasPlayerOwner) {
					actorslist.push(e.actor);
                }
            });
        } else {     
            // if there are no controlled tokens on the map, select all player actors in the actor catalogue
            let gameacts = game.actors.filter(e => { if( (game.user.isGM || e.owner) && e.data.type === "player" && e.hasPlayerOwner) { return e; } });
            Array.prototype.push.apply(actorslist, gameacts);
        }
    
        if(actorslist.length === 0) {
            ui.notifications.info(`No actor available for you to do an attribute test`);
            return;
        } else if(actorslist.length === 1) {
            defaultCheck = "checked";
        }
    
        let allActors = "";
        actorslist.forEach(t => {
            allActors = allActors.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
                    <div style="width:10em;min-width:10em;"><label for="${t.data._id}">${t.data.name}</label> </div>
                    <div><input id="${t.data._id}" type="radio" name="selection" value="${t.data._id}" ${defaultCheck}="${defaultCheck}"></div>
                </div>`);
        });
        
        let keys = Object.keys(actorslist[0].data.data.attributes);
        let allKeys = "";
        keys.forEach(t => {
            allKeys = allKeys.concat(`<option value="${t}">${game.i18n.localize(actorslist[0].data.data.attributes[t].label)}`);
        });
    
        let dialog_content = `  
        <div class="form-group">
        <h2>Select player(s)</h2>
        ${allActors}
        <br />
        <div style="flex-basis: auto;flex-direction: row;display: flex;">
        <div style="width:10em;min-width:10em;"><label for="attribute" style="min-width:10em">${game.i18n.localize("DIALOG.ATTRIBUTE")}</label> </div>
        <div style="width:10em;min-width:10em;"><select id="attribute" name="category">${allKeys}</select></div>
        </div><br/>
        </div>`;
    
        let x = new Dialog({
            content : dialog_content,
            alternatives: keys,
            buttons : 
            {
            Ok : { 
                label : game.i18n.localize("DIALOG.OK"), callback : async (html)=> {
                    let actorids = html.find("input[name='selection']").get().filter(v => { if(v.checked) return true; }).map(e => { return e.value});
                    let attribute = html.find('#attribute')[0].value;
                    actorids.map(a => {
                        let aexp = game.actors.get(a);
                        aexp.rollAttribute(attribute, null, null);
                    });
                }
            },
            Cancel : {label : game.i18n.localize("DIALOG.CANCEL")}
            }
        });
        
        x.options.width = 200;
        x.position.width = 300;
        
        x.render(true);
    }

    /**********************************************
     * Macro: 
     */

    /**********************************************
     * Macro: 
     */

    /**********************************************
     * Macro: 
     */

    /**********************************************
     * Macro: 
     */
    /**********************************************
     * Macro: 
     */
    /**********************************************
     * Macro: 
     */
    /**********************************************
     * Macro: 
     */
    /**********************************************
     * Macro: 
     */

}
