import { prepareRollAttribute } from "../common/dialog.js";

export class SymbaroumMacros {
	constructor() {}

	macroReady() {
		this.setupMacroFolders();
		Hooks.on("hotbarDrop", (bar, data, slot) => {
			if (data.type === "attribute") {
				this.createSymbaroumAttributeMacro(data, slot);
				return false;
			} else if (data.type === "Item" && typeof data.uuid === "string") {
				// Check more
				let item = fromUuidSync(data.uuid);								
				if(item && item.system && (item.system.isWeapon || item.system.isArmor || item.system.isPower)) {
					this.createSymbaroumItemMacro(item, slot);
					return false;
				}	
			}
		});
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

	async createSymbaroumAttributeMacro(data, slot)
	{
		game.symbaroum.log(data);
		const folder = game.folders
			.filter((f) => f.type === "Macro")
			.find((f) => f.name === game.symbaroum.config.SYSTEM_MACRO_FOLDER);
		// Create the macro command
		const command = `game.symbaroum.macros.rollAttribute('${data.attribute}');`;
		const actor = game.actors.get(data.actorId);
		if (!actor) return;

		const commmandName = game.i18n.format("MACRO.MAKETEST", {
			testtype: game.i18n.localize(
				actor.system.attributes[data.attribute].label
			),
		});

		let macro = game.macros.find(
			(m) =>
				m.name === commmandName &&
				m.command === command &&
				(m.author === game.user.id ||
					m.ownership.default >=
						CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ||
					m.ownership[game.user.id] >=
						CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
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
				"ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
			});
		}
		game.user.assignHotbarMacro(macro, slot);
	}

	/**
	 * Create a Macro from an Item drop.
	 * Get an existing item macro if one exists, otherwise create a new one.
	 * @param {Object} data     The dropped data
	 * @param {number} slot     The hotbar slot to use
	 * @returns {Promise}
	 */
	async createSymbaroumItemMacro(item, slot) {
		game.symbaroum.log(item);
		const folder = game.folders
			.filter((f) => f.type === "Macro")
			.find((f) => f.name === game.symbaroum.config.SYSTEM_MACRO_FOLDER);
		// Create the macro command
		const command = `game.symbaroum.macros.rollItem("${item.name}");`;
		let macro = game.macros.find(
			(m) =>
				m.name === item.name &&
				m.command === command &&
				(m.author === game.user.id ||
					m.ownership.default >=
						CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER ||
					m.ownership[game.user.id] >=
						CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER)
		);
		if (!macro) {
			macro = await Macro.create({
				name: item.name,
				type: "script",
				img: item.img,
				command: command,
				flags: { "symbaroum.itemMacro": true },
				folder: folder?.id,
				"ownership.default": CONST.DOCUMENT_OWNERSHIP_LEVELS.OBSERVER,
			});
		}
		game.user.assignHotbarMacro(macro, slot);
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
					(i) => i.name === itemName && (i.system.isGear && i.system.isActive || i.system.isPower)
			)
			: null;
		if (!item)
			return ui.notifications.warn(
				game.i18n.localize("ERROR.MACRO_NO_OBJECT") + itemName
			);

		if (item.system.isWeapon) {
			const weapon = actor.system.weapons.filter(
				(it) => it.id == item.id
			)[0];
			return actor.rollWeapon(weapon);
		}
		if (item.system.isArmor) {
			return actor.rollArmor();
		} else if (item.system.isPower) {
			if (
				actor.system.combat.combatMods.abilities[item.id]
					?.isScripted
			) {
				return actor.usePower(item);
			} else
				return ui.notifications.warn(
					itemName + game.i18n.localize("ERROR.MACRO_NO_SCRIPT")
				);
		} else return;
	}


	getPlayerList() {
		let actorslist = [];

		if (canvas.tokens.controlled.length > 0) {
			// If no actor selected
			// Time to get busy
			canvas.tokens.controlled.map((e) => {
				if (e.actor.type === "player") {
					if (game.user.isGM || e.actor.owner)
						actorslist.push(e.actor);
				}
			});
		} else {
			let gameacts = game.actors.filter((e) => {
				if (
					(game.user.isGM || e.owner) &&
					e.type === "player" &&
					e.hasPlayerOwner
				) {
					return e;
				}
			});
			Array.prototype.push.apply(actorslist, gameacts);
		}
		return actorslist;
	}

    /**********************************************
     * Macro: addExp
     */

    // Built-in macros
	async addExp() {
		let defaultCheck = "checked"; // set to unchecked

		let allKeys = "";
		const actorslist = this.getPlayerList();

		if(actorslist.length === 0) {
			ui.notifications.info(`No actor available for you to add exp to`);
			return;
		} else if(actorslist.length === 1) {
			defaultCheck = "checked";
		}
		actorslist.forEach((t) => {
			allKeys =
				allKeys.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
                    <div style="width:10em;min-width:10em;"><label for="${t.id}">${t.name}</label> </div>
                    <div><input id="${t.id}" type="checkbox" name="selection" value="${t.id}" ${defaultCheck}="${defaultCheck}"></div>
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
				"system.experience.total": aexp.system.experience.total + exp,
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
					game.symbaroum.error(
						"Can't understand damage[" +
							damage +
							"] - is this a number?"
					);
					break;
				}
				let actor = token.actor;
				if (
					actor.system.attributes[type] === undefined ||
					actor.system.attributes[type] === null
				) {
					game.symbaroum.error(`This[${type}] is not an attribute in Symbaroum`);
					break;
				}
				let tot =
					actor.system.attributes[type].temporaryMod + calcDam;
				let modification = {};
				foundry.utils.setProperty(
					modification,
					`system.attributes.${type}.temporaryMod`,
					tot
				);
				await actor.update(modification);
			}
		}
	}

    /**********************************************
     * Macro: rollAttribute
     */
    async rollAnyAttribute() {
        let defaultCheck = "unchecked"; // set to unchecked
        let actorslist = this.getPlayerList();
    
        if(actorslist.length === 0) {
            ui.notifications.info(`No actor available for you to do an attribute test`);
            return;
        } else if(actorslist.length === 1) {
            defaultCheck = "checked";
        }
    
        let allActors = "";
        actorslist.forEach(t => {
            allActors = allActors.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
                    <div style="width:10em;min-width:10em;"><label for="${t.id}">${t.name}</label> </div>
                    <div><input id="${t.id}" type="radio" name="selection" value="${t.id}" ${defaultCheck}="${defaultCheck}"></div>
                </div>`);
        });
        
        let keys = Object.keys(actorslist[0].system.attributes);
        let allKeys = "";
        keys.forEach(t => {
            allKeys = allKeys.concat(`<option value="${t}">${game.i18n.localize(actorslist[0].system.attributes[t].label)}`);
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
     * Macro: Generate Name
     */
	async generateNames()
	{
		// allNames needs to load json
		const response = await fetch('systems/symbaroum/supplemental-data/names.json');
		if(!response.ok) {
			game.symbaroum.error("Could not fetch supplemental name data",response);
			return;
		}
		const allNames = await response.json();
		let keys = Object.keys(allNames);
		let allKeys = "";
		keys.forEach(t => {
			allKeys = allKeys.concat(`<option value="${t}">${t}`);
		});
	
		let dialog_content = `  
		<div class="form-group">
			<label for="category">Select name generator</label>
			<select id="category" name="category">${allKeys}
			</select>
		</div>`;
	
		// let template = Handlebars.compile(dialog_content);
		
		let x = new Dialog({
			content : dialog_content,
			alternatives: keys,
			buttons : 
			{
				Ok : { label : `Ok`, callback : async (html)=> await this.generateNameChat(html.find('#category')[0].value, allNames)},
				Cancel : {label : `Cancel`}
			}
		});
		x.options.width = 400;
		x.position.width = 300;
		x.render(true);
	}

	async generateNameChat(category, allNames)
	{
		let message = `Category ${category} - Names<br />`;
	
		const myNames = game.symbaroum.api.generateCategoryName(allNames[category], 10);
		message += myNames.join('<br />');

		ChatMessage.create({
			speaker: ChatMessage.getSpeaker({alias: "Name generator"}),
			whisper: [game.user], // ChatMessage.getWhisperRecipients('GM'),
			content: message        
		});
	}

    /**********************************************
     * Macro: Make a monster a PC, make a PC a monster
     */
	async togglePlayerNPC()
	{
    let dialog_content = `  
    <div class="form-group">
        Type the exact name of the player/npc - ensure the Player/NPC has a unique name among all your actors.  <br/> A NPC will be made into a player. A player will be made into an NPC.<br/>
      <label for="npctext">NPC name</label>
      <input name="npctext" type="text">
    </div>`;
  
    let x = new Dialog({
      content : dialog_content,
      buttons : 
      {
        Ok : { label : `Ok`, callback : async (html)=> await this.change2PC(html.find('[name=npctext]')[0].value.replace(/[\r|\n]/g, ""))},
        Cancel : {label : `Cancel`}
      }
    });
  
    x.options.width = 200;
    x.position.width = 200;
  
    x.render(true);
	}

	async change2PC(npcname)
	{
    let myActor = game.actors.getName(npcname);
    
    if( myActor === null) {
        ui.notifications.error(`Could not find actor with name ${npcname}. Try again`);
        return;
    }
    let update = { 
        "type" : myActor.type === "player" ? "monster":"player",
				"==system" : myActor.toObject().system
    };
    await myActor.update(update);
    ui.notifications.info(`Actor with name ${npcname} is now a ${update.type}.`);
	}
    /**********************************************
     * Macro: dealAlternativeDamage
     */
		async dealAlternativeDamage() {
			if (canvas.tokens.controlled.length === 0)
				return ui.notifications.error("Please select a token first");

			new Dialog({
				title: `Alternate Damage`,
				content: `
					<form>
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
						callback: async (html)=> {
								await this.dealDamage(html.find("#vision-type")[0].value, html.find('#altdam')[0].value);
							}
					},
					no: {
						icon: "<i class='fas fa-times'></i>",
						label: `Cancel Damage`
					},
				},
				default: "yes",
			}).render(true);
		}

		async dealDamage(type, damage)
		{
				for ( let token of canvas.tokens.controlled ) {
						let calcDam = parseInt(damage) * -1;
						if( isNaN(calcDam)) {
								console.log("Can't understand damage["+damage+"] - is this a number?");
								break;
						}
						let actor = token.actor;
						if( actor.system.attributes[type] === undefined || actor.system.attributes[type] === null) {
								console.log("This is not an attribute in Symbaroum");
								break;
						}
						let tot = actor.system.attributes[type].temporaryMod + calcDam;
						let modification = {        };
						setProperty(modification, `system.attributes.${type}.temporaryMod`, tot);        
						await actor.update(modification);
						ui.notifications.info(`${actor.name} takes ${damage} damage to ${game.i18n.localize(actor.system.attributes[type].label)}.`);

				}
		}
    /**********************************************
     * Macro: Pay for Re-Roll
		 * 
     */
		async payForReRoll()
		{
				let defaultCheck = "unchecked"; // set to unchecked
				const actorslist = this.getPlayerList();
				if(actorslist.length === 0) {
						ui.notifications.info(`No actor available for you to apply re-roll cost`);
						return;
				} else if(actorslist.length === 1) {
						defaultCheck = "checked";
				}    

				let allKeys = "";
				actorslist.forEach(t => {
						allKeys = allKeys.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
										<div style="width:10em;min-width:10em;"><label for="${t.id}">${t.name}</label> </div>
										<div><input id="${t.id}" type="radio" name="selection" value="${t.id}" ${defaultCheck}="${defaultCheck}"></div>
								</div>`);
				});

				let dialog_content = `  
				<div class="form-group">
				<h2>Select player(s)</h2>
				${allKeys}
				<br />
				<div>Select what was used for the re-roll</div>
				<div style="flex-basis: auto;flex-direction: row;display: flex;">
						<div style="width:10em;min-width:10em;"><label for="artifactrr">Experience</label> </div>
						<div><input type="radio" id="artifactrr" value="artifactrr" name="costType"></div>
				</div>
				<div style="flex-basis: auto;flex-direction: row;display: flex;">
						<div style="width:10em;min-width:10em;"><label for="permanent">Corruption (perm)</label></div>
						<div><input type="radio" id="permanent" value="permanent" name="costType"></div>
				</div>`;
				dialog_content += `<br /></div>`;
				let x = new Dialog({
						title: "Pay the cost for re-roll",
						content : dialog_content,
						buttons : 
						{
								Ok :{ label : `Ok`, callback : async (html) => {             
																								let tmp = html.find("input[name='selection']").get().filter(v => { if(v.checked) return true; }).map(e => { return e.value});
																								let costType = html.find("input[name='costType']").get().filter(v => { if(v.checked) return true; }).map(e => { return e.value});

																								await this.payCost(tmp,costType);
																						}
										},
								Cancel : {label : `Cancel`}
						}
				});
				
				x.options.width = 200;
				x.position.width = 300;
				
				x.render(true);
		}

		async payCost(actorids, costType)
		{
				let aexp = null;
				let actorName = "";
				
				let message_content = "";

				let updates = actorids.map(a => {
						aexp = game.actors.get(a);
						actorName = aexp.name;        
						return {
								_id: a,
								"system.experience.artifactrr": aexp.system.experience.artifactrr + ( costType.includes("artifactrr")? 1:0),
								"system.health.corruption.permanent": aexp.system.health.corruption.permanent + ( costType.includes("permanent")? 1:0),
								"system.health.corruption.longterm": aexp.system.health.corruption.longterm + ( costType.includes("longterm")? dice.total:0)
						};
				});
				// console.log(updates);
				let chatOptions = {
						speaker: 
						{
					actor: aexp._id
						},
						rollMode: game.settings.get("core", "rollMode")
				};

				// 
				chatOptions["content"] = `<h2>Re-roll for ${ costType.includes("artifactrr") ? "experience":"permanent corruption" }</h2>
						${actorName} paid 1 ${ costType.includes("artifactrr") ? "experience":"permanent corruption" } for a re-roll`
				ChatMessage.create(chatOptions);     
				await Actor.updateDocuments(updates);				
				// Post results
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

}
