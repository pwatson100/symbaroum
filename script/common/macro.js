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
								game.symbaroum.log("Can't understand damage["+damage+"] - is this a number?");
								break;
						}
						let actor = token.actor;
						if( actor.system.attributes[type] === undefined || actor.system.attributes[type] === null) {
								game.symbaroum.log("This is not an attribute in Symbaroum");
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
				// game.symbaroum.log(updates);
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
     * Macro: resetTemporaryCorruption
		 * Macro can be used by either selecting tokens on-screen or, if no tokens are selected, choosing which player characters (default all)
 		 * 
		 */
		async resetTemporaryCorruption()
		{
				let defaultCheck = "checked"; // set to unchecked
				const actorslist = this.getPlayerList();
				let allKeys = "";
				actorslist.forEach(t => {
						allKeys = allKeys.concat(`<div style="flex-basis: auto;flex-direction: row;display: flex;">
										<div style="width:10em;min-width:10em;"><label for="${t.id}">${t.name}</label> </div>
										<div><input id="${t.id}" type="checkbox" name="selection" value="${t.id}" ${defaultCheck}="${defaultCheck}"></div>
								</div>`);
				});

				let dialog_content = `  
				<div class="form-group">
				<h2>Select player(s)</h2>
				${allKeys}
				<br />
				</div>`;
				let x = new Dialog({
						title: "Reset Corruption",
						content : dialog_content,
						buttons : 
						{
								Ok :{ label : `Ok`, callback : async (html) => {             
																								let tmp = html.find("input[name='selection']").get().filter(v => { if(v.checked) return true; }).map(e => { return e.value});                                            
																								if(tmp.length == 0) {
																										ui.notifications.error("Need a valid number of players");
																										return;
																								}
																								this.resetCorruption(tmp);
																						}
										},
								Cancel : {label : `Cancel`}
						}
				});
				
				x.options.width = 200;
				x.position.width = 300;
				
				x.render(true);
		}

		async resetCorruption(actorids)
		{
				let actorNames = "";
				let updates = actorids.map(a => {
						let aexp = game.actors.get(a);
				
						actorNames = actorNames + "<li>" + aexp.name;

						return {
								_id: a,
								"system.health.corruption.temporary": 0
						};
				});
				
				Actor.updateDocuments(updates);
				let chatOptions = {
						rollMode: game.settings.get('core', 'rollMode'),        
						content: `<h2>Temporary corruption was washed away</h2> 
												The following actors:<ul> ${actorNames}</ul> is now at zero temporary corruption`
				};
				ChatMessage.create(chatOptions);
		}		
    /**********************************************
     * Macro: crbCharacterImporter
		 * To use this macro, paste monster system.from a pdf, for the core book:
		 * including the name of the monster, to the end of the "Tactics" section
		 * 
		 * For the monster codex, manually type in the name, then copy from Manners to end of tactics and paste.
		 * Warning: the tilted character sheet can cause issues, depending on your pdf viewer, you might need to do those manually.
		 * 
		 * WARNING 2: If you have multiple items that matches the name of abilities, traits and mystical powers, they might be found instead.
		 *  
		 * Make sure you have all abilities, traits and powers in the "Items" in Foundry.
     */

		async crbCharacterImporter() {
				let dialog_content = `  
				<div class="symbaroum dialog">
						<div style="width:100%; text-align:center">
								<h3><a href="https://freeleaguepublishing.com/shop/symbaroum/core-rulebook/" target="_blank">Symbaroum Core Book</a> Character Importer</h3>
						</div>
						<div class="advantage">
								<label for="isplayer">Player</label>
								<span class="lblfavour"><input type="checkbox" id="isplayer" name="isplayer"></span>
						</div>
						<div class="advantage">
								<label for="npctext">Paste PDF data</label>
								<input name="npctext" type="text">
						</div>
				</div>`;

				let x = new Dialog({
						content : dialog_content,
						buttons : 
						{
								Ok : { label : `Ok`, callback : async (html)=> await this.extractAllData(html.find('[name=npctext]')[0].value.replace(/[\r|\n]/g, ""), html.find("#isplayer")[0].checked)},
								Cancel : {label : `Cancel`}
						}
				});

				x.options.width = 400;
				x.position.width = 400;

				x.render(true);

		}

		async extractSpecialItems(actorItems, type, abilitilist, abilityPattern)
		{
				let message = "";
				if( abilitilist !== null) {
						await abilitilist.forEach(async element => { 
								let tmpdata = element.trim().match(abilityPattern);
								// game.symbaroum.log("tmpdata = "+tmpdata);
								if( tmpdata != null && tmpdata.length == 3)
								{
										let higherLevel = false;
										let ability = game.items.filter(element => element.name.trim().toLowerCase() === tmpdata[1].trim().toLowerCase() && element.type === type);                
										if(ability.length > 0 )
										{
												// game.symbaroum.log("ability="+JSON.stringify(ability));

												ability = duplicate(ability[0]);
												let abilityAction = "";

												// Master ability
												if(tmpdata[2] === "master" || tmpdata[2] === "III") {                    
														higherLevel = true;
														setProperty(ability, "system.master.isActive",true);                                            
												}                
												abilityAction = getProperty(ability, "system.master.action");
												if( abilityAction === "") {
														setProperty(ability, "system.master.action", "A");
												}
												// Adept ability
												if(tmpdata[2] === "adept" || tmpdata[2] === "II" || higherLevel) {                
														higherLevel = true;
														setProperty(ability, "system.adept.isActive",true);                        

												}    
												abilityAction = getProperty(ability, "system.adept.action");
												if( abilityAction === "") {
														setProperty(ability, "system.adept.action", "A");
												}
												// Novice ability
												if(tmpdata[2] === "novice" || tmpdata[2] === "I" || higherLevel) {                              
														setProperty(ability, "system.novice.isActive",true);                        
												}
												abilityAction = getProperty(ability, "system.novice.action");
												if( abilityAction === "") {
														setProperty(ability, "system.novice.action", "A");
												}
												// game.symbaroum.log("Final ability "+JSON.stringify(ability));
												game.symbaroum.log("Added ability "+ability.name)
												actorItems.push(ability);
										}
										else if( type !== "mysticalPower" && type !== "ability" )
										{
												message += `${element} not added as ${type} - add manually if needed <br/>`;
										}
								}
								else if( element.trim() !== "")
								{
										// message += `${element} not added - not found under Items - add manually <br/>`;
										game.symbaroum.log("element["+element+"] not found - add manually");           
								}
						});

				}    
				return message;    
		}

		async extractAllData(npcData, player)
		{
				let additionalInfo = "";

				const extractData = function(inputData, inputPattern) {
						let tmp = inputData.match(inputPattern);
						if( tmp != null && tmp.length >= 2) {
								// successful match
								return tmp[1];
						}
						return "nomatch";
				};
				let expectedData = npcData.replace(/- /g,"");

				let namePattern = /^(.+?) (Race|Manner)/;
				let newValues = {
						name: extractData(expectedData,namePattern),
						type: player ? "player": "monster",
						folder: null,
						sort: 12000,
						data: {},
						token: {},
						items: [],
						flags: {}        
				}

				let mannerPattern = /Manner (.*) Race /;
				setProperty(newValues, "system.bio.manner",extractData(expectedData,mannerPattern));

				let racePattern = /Race (.*) Resistance/;
				setProperty(newValues, "system.bio.race",extractData(expectedData,racePattern));

				let attributePattern = /Accurate ([0-9]+)/;
				// game.symbaroum.log("Accurate["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.accurate.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Cunning ([0-9]+)/;
				// game.symbaroum.log("Cunning["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.cunning.value", parseInt(extractData(expectedData,attributePattern)));    
				attributePattern = /Discreet ([0-9]+)/;
				// game.symbaroum.log("Discreet["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.discreet.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Persuasive ([0-9]+)/;
				// game.symbaroum.log("Persuasive["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.persuasive.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Quick ([0-9]+).+\)/;
				// game.symbaroum.log("Quick["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.quick.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Resolute ([0-9]+)/;
				// game.symbaroum.log("Resolute["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.resolute.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Strong ([0-9]+)/;
				// game.symbaroum.log("Strong["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.strong.value", parseInt(extractData(expectedData,attributePattern)));
				attributePattern = /Vigilant ([0-9]+)/;
				// game.symbaroum.log("Vigilant["+extractData(expectedData,attributePattern)+"]");
				setProperty(newValues, "system.attributes.vigilant.value", parseInt(extractData(expectedData,attributePattern)));

				let shadowPattern = /Shadow (.*) \(/;
				// game.symbaroum.log("Shadow["+extractData(expectedData,shadowPattern)+"]");    
				setProperty(newValues, "system.bio.shadow", extractData(expectedData,shadowPattern));
				
				// If nomatch == thouroughly corrupt
				let corruptionPattern = /\(corruption: ([0-9]+).?\)/;
				// game.symbaroum.log("Permanent Corruption["+extractData(expectedData,corruptionPattern)+"]");   
				let corr = extractData(expectedData,corruptionPattern);
				if( corr !== null && corr !== "nomatch" ) {
						setProperty(newValues, "system.health.corruption.permanent", parseInt(extractData(expectedData,corruptionPattern))); 
				}
				
				let tacticsPattern = / Tactics: (.*)/;
				// game.symbaroum.log("Tactics["+extractData(expectedData,tacticsPattern)+"]");
				setProperty(newValues, "system.bio.tactics", extractData(expectedData,tacticsPattern));

				let actor = await Actor.create(newValues);

				let abilitiesPattern = /Abilities (.+?) Weapons /;
				let singleAbilityPattern = /([^,^\)]+?\))?/g;
				let abilityPattern = / ?([^\(]+)\((.+)\)/;
				let allAbilities = extractData(expectedData,abilitiesPattern);
				game.symbaroum.log("allAbilities:"+allAbilities);
				let abilitilist = allAbilities.match(singleAbilityPattern);
				let actorItems = [];
				game.symbaroum.log("abilitylist:"+abilitilist);

				// Normal abilities
				// Medicus (master), 
				additionalInfo += await this.extractSpecialItems(actorItems, "ability", abilitilist, abilityPattern);
				additionalInfo += await this.extractSpecialItems(actorItems, "mysticalPower", abilitilist, abilityPattern);
				// Mystical Power
				// let mysticalPowerPattern = /Mystical [Pp]ower \(([^,]+), ([^\)]*)\)/g;
				let singleMysticalPowerPattern = /Mystical [Pp]ower \(([^\)]*)\)/g;
				abilitilist = allAbilities.match(singleMysticalPowerPattern);
				let mysticalPowerPattern = /\(([^,]+), (.*)\)/
				game.symbaroum.log("abilitylist[mp]:"+JSON.stringify(abilitilist));
				// Mystical Power (Bend Will, master)
				additionalInfo += await this.extractSpecialItems(actorItems, "mysticalPower", abilitilist, mysticalPowerPattern);

				let traitsPattern = /Traits (.+) Accurate [0-9]/;
				game.symbaroum.log("Traits["+extractData(expectedData,traitsPattern)+"]");
				let traitstlist = extractData(expectedData,traitsPattern).match(singleAbilityPattern);
				// game.symbaroum.log("traitslist ="+JSON.stringify(traitstlist));
				additionalInfo += await this.extractSpecialItems(actorItems, "trait", traitstlist, abilityPattern);

				// game.symbaroum.log("actorItems:"+JSON.stringify(actorItems));

				let updateObj = await actor.createEmbeddedDocuments("Item", actorItems);
				// game.symbaroum.log("updateObj "+JSON.stringify(updateObj));


				let healMe = {_id:actor.id};
				setProperty(healMe, "system.health.toughness.value", getProperty(actor, "system.health.toughness.max") );
				await Actor.updateDocuments([healMe]);

				let message = `Created ${actor.name}<br/>${additionalInfo}`;
				ChatMessage.create({
						speaker: ChatMessage.getSpeaker({alias: "Character Importer Macro"}),
						whisper: [game.user],
						content: message
				});

				actor.sheet.render(true);
		}
		
    /**********************************************
     * Macro: starterSetCharacterImport
		* To use this macro, paste monster data from a pdf, for the starter set or haunted wastes:
		* including the name of the monster, to the end of the "Tactics" section
		* 
		* If you use qpdfviewer - press 4 returns after the name
		* 
		* 
		* 
		*  
		* Make sure you have all abilities, traits and powers in the "Items" in Foundry.
		* 
		*/
	starterSetCharacterImport() {
			let dialog_content = `  
			<div class="symbaroum dialog">
					<div style="width:100%; text-align:center">
							<h3><a href="https://freeleaguepublishing.com/en/store/?product_id=7092044267669" target="_blank">Symbaroum Starter Set</a> Character Importer</h3>
					</div>
					<div class="advantage">
							<label for="isplayer">Player</label>
							<span class="lblfavour"><input type="checkbox" id="isplayer" name="isplayer"></span>
					</div>
					<div class="advantage">
							<label for="npctext">Paste PDF data</label>
							<textarea name="npctext" type="text" cols=30 rows=8></textarea>
					</div>
			</div>`;

			let x = new Dialog({
					content : dialog_content,
					buttons : 
					{
							Ok : { label : `Ok`, callback : async (html)=> await this.extractAllDataStartSet(html.find('[name=npctext]')[0].value, html.find("#isplayer")[0].checked)},
							Cancel : {label : `Cancel`}
					}
			});

			x.options.width = 400;
			x.position.width = 400;

			x.render(true);

	}
	/*
	async extractSpecialItems(actorItems, type, abilitilist, abilityPattern)
	{
			let message = "";
			if( abilitilist !== null) {
					await abilitilist.forEach(async element => { 
							let tmpdata = element.trim().match(abilityPattern);            
							if( tmpdata != null && tmpdata.length == 3)
							{
									game.symbaroum.log("tmpdata = ",tmpdata);
									let higherLevel = false;
									let ability = game.items.filter(element => element.name.trim().toLowerCase() === tmpdata[1].trim().toLowerCase() && element.type === type);
									if(ability.length > 0 )
									{
											// game.symbaroum.log("ability="+JSON.stringify(ability));

											ability = duplicate(ability[0].data);
											let abilityAction = "";

											// Master ability
											if(tmpdata[2] === "master" || tmpdata[2] === "III") {                    
													higherLevel = true;
													setProperty(ability, "data.master.isActive",true);                                            
											}                
											abilityAction = getProperty(ability, "data.master.action");
											if( abilityAction === "") {
													setProperty(ability, "data.master.action", "A");
											}
											// Adept ability
											if(tmpdata[2] === "adept" || tmpdata[2] === "II" || higherLevel) {                
													higherLevel = true;
													setProperty(ability, "data.adept.isActive",true);                        

											}    
											abilityAction = getProperty(ability, "data.adept.action");
											if( abilityAction === "") {
													setProperty(ability, "data.adept.action", "A");
											}
											// Novice ability
											if(tmpdata[2] === "novice" || tmpdata[2] === "I" || higherLevel) {                              
													higherLevel = true;
													setProperty(ability, "data.novice.isActive",true);                        
											}
											abilityAction = getProperty(ability, "data.novice.action");
											if( abilityAction === "") {
													setProperty(ability, "data.novice.action", "A");
											}
											if( !higherLevel ) {
													message += `Could not establish level for ${ability.name} - change manually <br/>`;
											}
											// game.symbaroum.log("Final ability "+JSON.stringify(ability));
											game.symbaroum.log("Added ability "+ability.name)
											actorItems.push(ability);
									}

							}
							else if( element.trim() !== "")
							{
									// message += `${element} not added - not found under Items - add manually <br/>`;
									game.symbaroum.log("element["+element+"] not found - add manually");           
							}
					});

			}    
			return message;    
	}
 */

	async extractAllDataStartSet(npcData, player)
	{
			let additionalInfo = "";
			const countnl = (str) => {
				const re = /[\n\r]/g
				return ((str || '').match(re) || []).length
			}
			const countother = (pattern, str) => {
				const re = pattern
				return ((str || '').match(re) || []).length
			}

			const extractData = function(inputData, inputPattern) {
				let tmp = inputData.match(inputPattern);
				if( tmp != null && tmp.length >= 2) {
						// successful match
						return tmp[1];
				}
				return "nomatch";
			};


			const extractWeapons = async function(actorItems, type, weaponList)
			{
					game.symbaroum.log(actorItems, type, weaponList);
					if(weaponList !== null)
					{

					}
					return "";
			};


			// Count new lines
			if( countnl(npcData) > 3 ) {
					npcData = npcData.replace(/[\r|\n]/, " NLMARKER ");
			} else {
					// Find text after name - not sure this is doable - hack it for now?
					// Recommendation is to "have 4 linebreaks after name"

			}
			let expectedData = npcData.replace(/[\r|\n]/g, " ");
			expectedData = expectedData.replace(/[–−]/g, "-");
			expectedData = expectedData.replace(/Integrated -?/g,""); 
			// expectedData = expectedData.replace(/Abilities /g,""); 
			// Hack
			expectedData = expectedData.replace(/Traits -?/g,""); 
			expectedData = expectedData.replace(/Abilities -/g,"Abilities ");
			// expectedData = expectedData.replace(/ ?[-]/g,"");
			
			game.symbaroum.log(expectedData);    

			let namePattern = /^(.+?) (Race|Manner|NLMARKER)/;
			let newValues = {
					name: extractData(expectedData,namePattern),
					type: player ? "player": "monster",
					folder: null,
					sort: 12000,
					data: {},
					token: {},
					items: [],
					flags: {}        
			}

			let mannerPattern = /resistance “(.*)”/;
			setProperty(newValues, "system.bio.manner",extractData(expectedData,mannerPattern));

			let racePattern = /NLMARKER (.*?), .* resistance/;
			setProperty(newValues, "system.bio.race",extractData(expectedData,racePattern));

			let myMatches = [];
			game.symbaroum.log("My count other is "+countother(/ACC CUN DIS PER QUI RES STR VIG/g,expectedData));
			if( countother(/ACC CUN DIS PER QUI RES STR VIG/g,expectedData) == 1 ) {
					// do it this way
					myMatches = expectedData.match(/ACC CUN DIS PER QUI RES STR VIG ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+) ([-+]?[0-9]+)/);
					
			} else {         
					// do it the other way
					myMatches = expectedData.match(/ACC ([-+]?[0-9]+) CUN ([-+]?[0-9]+) DIS ([-+]?[0-9]+) PER ([-+]?[0-9]+) QUI ([-+]?[0-9]+) RES ([-+]?[0-9]+) STR ([-+]?[0-9]+) VIG ([-+]?[0-9]+)/);
			}
			game.symbaroum.log(myMatches);
			if(myMatches !== null && myMatches.length === 9 ) {
					setProperty(newValues, "system.attributes.accurate.value", 10 - parseInt(myMatches[1]) );
					setProperty(newValues, "system.attributes.cunning.value", 10 - parseInt(myMatches[2]) );    
					setProperty(newValues, "system.attributes.discreet.value", 10 - parseInt(myMatches[3]) );    
					setProperty(newValues, "system.attributes.persuasive.value", 10 - parseInt(myMatches[4]) );    
					setProperty(newValues, "system.attributes.quick.value", 10 - parseInt(myMatches[5]) );    
					setProperty(newValues, "system.attributes.resolute.value", 10 - parseInt(myMatches[6]) );    
					setProperty(newValues, "system.attributes.strong.value", 10 - parseInt(myMatches[7]) );    
					setProperty(newValues, "system.attributes.vigilant.value", 10 - parseInt(myMatches[8]) );    
			} else {
					additionalInfo += "Could not find the attributes<br/>";
			}
			let shadowPattern = /Shadow ([^\(]*)/;
			game.symbaroum.log("Shadow["+extractData(expectedData,shadowPattern)+"]");    
			setProperty(newValues, "system.bio.shadow", extractData(expectedData,shadowPattern));
			
			// If nomatch == thouroughly corrupt
			let corruptionPattern = /\(corruption: ([0-9]+).?\)/;
			// game.symbaroum.log("Permanent Corruption["+extractData(expectedData,corruptionPattern)+"]");   
			let corr = extractData(expectedData,corruptionPattern);
			if( corr !== null && corr !== "nomatch" ) {
					setProperty(newValues, "system.health.corruption.permanent", parseInt(extractData(expectedData,corruptionPattern))); 
			}
			
			let tacticsPattern = / Tactics: (.*)/;
			game.symbaroum.log("Tactics["+extractData(expectedData,tacticsPattern)+"]");
			setProperty(newValues, "systembio.tactics", extractData(expectedData,tacticsPattern));

			let actor = await Actor.create(newValues);

			let abilitiesPattern = /Abilities(.+?) (Shadow|Equipment)/;
			let singleAbilityPattern = /([^,^\)]+?\))?/g;
			let abilityPattern = / ?([^\(]+)\((.+)\)/;
			let allAbilities = extractData(expectedData,abilitiesPattern);
			// game.symbaroum.log("allAbilities:"+allAbilities);
			let abilitilist = allAbilities.match(singleAbilityPattern);
			let actorItems = [];
			// game.symbaroum.log("abilitylist:"+abilitilist);

			// Normal abilities
			// Medicus (master), 
			additionalInfo += await this.extractSpecialItems(actorItems, "ability", abilitilist, abilityPattern);
			additionalInfo += await this.extractSpecialItems(actorItems, "mysticalPower", abilitilist, abilityPattern);
			additionalInfo += await this.extractSpecialItems(actorItems, "trait", abilitilist, abilityPattern);

			// game.symbaroum.log("actorItems:"+JSON.stringify(actorItems));
			// Weapons
			let weaponsPattern = /Weapons (.+?) (Abilities|Traits)/;
			let singelWeaponPattern = / ?([^0-9]*)[0-9]+/g;
			let allWeapons = extractData(expectedData,weaponsPattern);
			game.symbaroum.log("allWeapons", allWeapons)
			additionalInfo += await extractWeapons(allWeapons, "weapon", abilitilist, singelWeaponPattern);

			let updateObj = await actor.createEmbeddedDocuments("Item", actorItems);
			// game.symbaroum.log("updateObj "+JSON.stringify(updateObj));


			let healMe = {_id:actor.id};
			setProperty(healMe, "system.health.toughness.value", getProperty(actor, "system.health.toughness.max") );
			await Actor.updateDocuments([healMe]);

			let message = `Created ${actor.name}<br/>${additionalInfo}`;
			ChatMessage.create({
					speaker: ChatMessage.getSpeaker({alias: "Character Importer Macro"}),
					whisper: [game.user],
					content: message
			});
			actor.sheet.render(true);
	}		
    /**********************************************
     * Macro: 
     */

}
