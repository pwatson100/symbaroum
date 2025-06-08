export function enrichTextEditors() {
    // With permission from @mcglintlock
    // e.g., @DRAW[Compendium.cy-borg-core.random-tables.vX47Buopuq9t0x9r]{Names}
    // optionally add a roll for the draw at the end
    // e.g., @DRAW[Compendium.cy-borg-core.random-tables.vX47Buopuq9t0x9r]{Names}{1d4}
    const DRAW_FROM_TABLE_PATTERN = /@DRAW\[([^\]]+)\]{([^}]*)}(?:{([^}]*)})?/gm;
    const drawFromTableEnricher = (match, _options) => {
        const uuid = match[1];
        const tableName = match[2];
        const roll = match[3];
        const elem = document.createElement("span");
        elem.className = "draw-from-table";
        elem.setAttribute("data-tooltip", `Draw from ${tableName}. <br> ${game.i18n.localize("TOOLTIP.DIALOG.ROLLONTABLE")}`);
        elem.setAttribute("data-uuid", uuid);
        if (roll) {
            elem.setAttribute("data-roll", roll);
        }
        elem.innerHTML = `<i class="fas fa-dice-d20">&nbsp;</i>`;
        return elem;
    };


    CONFIG.TextEditor.enrichers.push(...[
        {
            pattern: /@RAW\[(.+?)\]/gm,
            enricher: async (match, options) => {
                const myData = await $.ajax({
                    url: match[1],
                    type: 'GET',
                });
                const doc = document.createElement("span");
                doc.innerHTML = myData;
                return doc;
            }
        },
        {
            pattern: DRAW_FROM_TABLE_PATTERN,
            enricher: drawFromTableEnricher,
        }, {
            pattern: /@fas\[(.+?)\]/gm,
            enricher: async (match, options) => {
                const doc = document.createElement("span");                
                doc.innerHTML = `<i class="fas ${match[1]}"></i>`;
                return doc;
            }
        }, {
            pattern: /@SymbaroumActor\[(.+?)\](?:{(.+?)})?(?:{(.+?)})?/gm,
            enricher: (match, options) => {
                // Match 1 would be actor name or actorID
                // Match 2 would be a given name overruling Actor name
                // Match 3 would be a comma separated with integrated abilities (beyond the default)

                const actorDoc = document.createElement("span");
                let actor = game.actors.get(match[1]);
                if (!actor) {
                    actor = game.actors.getName(match[1]);
                }
                if (!actor) {
                    return actorDoc;
                }
                let name = match[2];
                if (!name) {
                    name = actor.name;
                }
                const monster = actor.type == "monster";

                // Integrated abilities/traits
                let integrated = [];
                let namedIntegrated = match[3] ? match[3].split(',') : [];
                // Add "special ones"
                for (var thingy of namedIntegrated) {
                    let fetchedItem = actor.items.getName(thingy);
                    if (fetchedItem) {
                        integrated.push(fetchedItem);
                    }
                }
                // weapons            
                for (var weaponModifiers in actor.system.combat.combatMods.weapons) {
                    // Get weapon modifier abilities
                    for (let pack of actor.system.combat.combatMods.weapons[weaponModifiers].package) {
                        if (pack.type == game.symbaroum.config.PACK_DEFAULT || pack.type === game.symbaroum.config.PACK_CHECK) {
                            for (let member of pack.member) {
                                integrated.push(actor.items.get(member.id));
                            }
                        }
                    }
                }
                for (var armorModifiers in actor.system.combat.combatMods.armors) {
                    // Get armor modifier abilities
                    for (let defMod of actor.system.combat.combatMods.armors[armorModifiers].defenseModifiers) {
                        integrated.push(actor.items.get(defMod.id));
                    }
                    for (let impMod of actor.system.combat.combatMods.armors[armorModifiers].impedingModifiers) {
                        integrated.push(actor.items.get(impMod.id));
                    }
                    for (let attribs of actor.system.combat.combatMods.armors[armorModifiers].attributes) {
                        integrated.push(actor.items.get(attribs.id));
                    }
                }
                for (var initiativeMod of actor.system.combat.combatMods.initiative) {
                    // Get weapon modifier abilities
                    integrated.push(actor.items.get(initiativeMod.id));
                }
                integrated = integrated.filter(onlyUnique).filter(abil => { return abil.system.isPower });

                // Wielded weapons
                let weapons = actor.items.filter(weap => { return weap.system.isWeapon && weap.system.isActive; });
                // Traits
                const traits = actor.items.filter(trait => { return isTrait(trait) && integrated.indexOf(trait) == -1 && !game.symbaroum.config.systemTraits.includes(trait.system.reference) });
                // Abilities
                const abilities = actor.items.filter(ability => { return !isTrait(ability) && ability.system.isPower && !ability.system.isRitual && integrated.indexOf(ability) == -1 });

                // TODO - change this to hbs
                const htmlFormat =
                    `<h5 style="margin-left: 25%;">${name}, ${actor.system.bio.race} <a class="content-link" draggable="false" data-type="Macro" data-uuid="Actor.${actor.id}">${name}</a></h5>
<p class="pblock" style="margin-left: auto; margin-right: auto; width: 50%;"><em>${monster ? actor.system.bio.manner : actor.system.bio.quote}</em></p>
<hr style="margin-left: auto; margin-right: auto; width: 50%;" />
<table style="border-style: solid; margin-left: auto; margin-right: auto; width: 50%; border: 3px; font-size: 12pt;">
<tbody>
<tr style="color: aliceblue; background-color: black;">
<td style="width: 15%; text-align: center;" colspan="8">
<h6>${name.toUpperCase()}</h6>
<hr /><strong>${actor.system.bio.race}</strong><br />${actor.system.bio.appearance == null ? "" : actor.system.bio.appearance}</td>
</tr>
${getAttributes(actor, monster)}
<tr style="border-top: solid 1px;">
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>${game.i18n.localize("ARMOR.DEFENSE")}</strong><br />${monster ? actor.system.combat.defmod : actor.system.combat.defense}</td>
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>${game.i18n.localize("ITEM.ARMOR")}</strong><br />${actor.system.combat.name} ${actor.system.combat.displayTextShort}</td>
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>${game.i18n.localize("HEALTH.TOUGHNESS")}</strong><br />${actor.system.health.toughness.value}</td>
<td style="width: 25%; text-align: center;" colspan="2"><strong>${game.i18n.localize("HEALTH.TOUGHNESS_THRESHOLD_FULL")}</strong><br />${actor.system.health.toughness.threshold}</td>
</tr>
<tr>
<td style="width: 15%;" colspan="2"><strong>${game.i18n.localize("WEAPON.HEADER")}</strong><br />${weapons.length > 0 ? game.i18n.localize(`ATTRIBUTE.${weapons[0].system.attribute.toUpperCase()}`) : ""}</td>
<td style="width: 85%;" colspan="6">${displayWeaponFacts(actor, weapons)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("ABILITY.HEADER")}</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, abilities)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("TRAIT.HEADER")}</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, traits)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("ENRICHER.INTEGRATED_HEADER")}</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, integrated)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("ITEM.TypeEquipment")}</td>
<td style="width: 85%;" colspan="6">${getMoney(actor)} ${getEquipment(actor)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("BIO.SHADOW")}</td>
<td style="width: 85%;" colspan="6">${actor.system.bio.shadow} (${getCorruption(actor)})</td>
</tr>
${monster ? getTactics(actor) : ""}

</tbody>
</table>`;

                actorDoc.innerHTML = htmlFormat;

                return actorDoc;
            }
        },
        {
            pattern: /@Tour\[(.+?)\](?:{(.+?)})/gm,
            enricher: (match, options) => {
                const tourDoc = document.createElement("span");
                let tour = match[1];
                let name = match[2];
                tourDoc.innerHTML = `${name} <a class="control symbaroum-tour" data-tour-id="${tour}" data-action="play" data-tooltip="Start Tour" aria-describedby="tooltip"><i class="fas fa-play"></i></a>`;
                return tourDoc;
            }
        }]);

    async function drawFromRollableTable(event) {
        event.preventDefault();
        let currentNode = event.target.parentNode;
        // const & var = globally defined
        game.symbaroum.log("drawFromRollableTable",currentNode);
        let uuid = currentNode.getAttribute("data-uuid");
        if (!uuid) {
            return;
        }
        let table = await fromUuid(uuid);
        let myF = async function (uuid, modifier) {
            if (table instanceof RollTable) {
                const formula = currentNode.getAttribute("data-roll");
                const roll = formula ? new Roll(formula) : new Roll(`${table.formula} + ${modifier}`);
                await table.draw({ roll });
            }
        };
        if (event.ctrlKey) {
            let dialog_content = `<p>${game.i18n.format("DIALOG.ROLLONTABLE", {
                tablename: table.name
            })}</p>
            <form>
                <div class="form-group">
                    <label>${game.i18n.localize("DIALOG.MODIFIER")}</label>
                    <input type="text" id="modifier" name="modifier" value="0" autofocus="autofocus" />
                </div>
            </form>`;
            let x = new Dialog({
                title: game.i18n.format("DIALOG.ROLLONTABLE", {
                    tablename: table.name
                }),
                content: dialog_content,
                buttons:
                {
                    Ok: {
                        label: game.i18n.localize("DIALOG.OK"), callback: async (html) => {
                            let modifier = parseInt(html.find("input[name='modifier'")[0].value);
                            if (isNaN(modifier)) { modifier = 0; }
                            await myF(uuid, modifier);
                        }
                    },
                    Cancel: { label: game.i18n.localize("DIALOG.CANCEL") }
                }
            });
            x.options.width = 200;
            x.position.width = 300;
            x.render(true);
        } else {
            await myF(uuid, 0);
        }
    }
    document.addEventListener("click", (e) => {
        game.symbaroum.log("Click",e)
        if(e.target.parentNode && e.target.parentNode.classList?.contains('draw-from-table') ) {            
            drawFromRollableTable(e);
        }
    });
}

function getAttributes(actor, monster) {
    let abbrv = '';
    let values = '';
    for (var aKey in actor.system.attributes) {
        abbrv += `<td class="newstatheader"><strong>${game.i18n.localize(actor.system.attributes[aKey].label + 'ABBR')}</strong></td>`;
        values += `<td class="newstatheader">${monster ? 10 - actor.system.attributes[aKey].total : actor.system.attributes[aKey].total}</td>`;

    }
    return `<tr>${abbrv}</tr><tr>${values}</tr>`;
}

function displayWeaponFacts(actor, weapons) {
    let display = "";
    let first = true;
    for (var weap of weapons) {
        if (!first) {
            display += ", ";
        }
        let dam = "";
        for (var damageWeap of actor.system.weapons) {
            if (damageWeap.id == weap.id) {
                dam = damageWeap.damage.displayTextShort;
            }
        }
        display += `${weap.name} ${dam}`;
        if (actor.system.combat.combatMods.weapons[weap.id].maxAttackNb > 1) {
            display += `, ${actor.system.combat.combatMods.weapons[weap.id].maxAttackNb} attacks`;
        }
        display += `<br/>`;

    }
    return display;
}

function getAbilities(actor, monster, abilityList) {
    let first = true;
    let list = "";
    for (var ability of abilityList) {
        if (!first) {
            list += ", ";
        }
        first = false;
        list += `${ability.name}`;
        if (!ability.system.isMarker && !ability.system.isBoon && !ability.system.isBurden) {
            list += ` (${getAbilityLevelName(actor, monster, ability)})`;
        }
    }
    return list;
}

function getTactics(actor) {
    return `<tr><td style="width: 15%; font-weight: bold;" colspan="2">${game.i18n.localize("BIO.TACTICS")}</td>
    <td style="width: 15%;" colspan="6">${actor.system.bio.tactics}</td>
    </tr>`;
}

function getCorruption(actor) {
    let info = "";
    if (actor.system.isThoroughlyCorrupt) {
        info += `${game.i18n.localize("HEALTH.CORRUPTION_THROUGHLY")}`;
    } else {
        info += `<span style="text-transform:lowercase">${game.i18n.localize("HEALTH.CORRUPTION")}</span>: ${actor.system.health.corruption.value}`;
    }
    return info;
}

function getMoney(actor) {
    let monies = "";
    if (actor.system.money.thaler > 0) {
        monies += `${actor.system.money.thaler} ${game.i18n.localize("MONEY.THALER")}`;
    }
    if (actor.system.money.shilling > 0) {
        if (actor.system.money.thaler > 0) {
            monies += ", ";
        }
        monies += `${actor.system.money.shilling} ${game.i18n.localize("MONEY.SHILLING")}`;
    }
    if (actor.system.money.orteg > 0) {
        if (actor.system.money.thaler > 0 || actor.system.money.shilling > 0) {
            monies += ", ";
        }
        monies += `${actor.system.money.orteg} ${game.i18n.localize("MONEY.ORTEG")}`;
    }
    return monies;
}

function getEquipment(actor) {
    let equipment = "";
    const eq = actor.items.filter(obj => { return obj.system.isGear && !(obj.system.isWeapon && obj.system.isActive || obj.system.isArmor && obj.system.isActive) });
    for (let i = 0; i < eq.length; i++) {
        if (i > 0) equipment += ", ";
        if (eq[i].system.isEquipment && eq[i].system.number > 1) {
            equipment += `${eq[i].system.number} `;
        }
        equipment += eq[i].name;
    }
    return equipment;
}

function isTrait(trait) {
    return trait.system.isTrait || trait.system.isBoon || trait.system.isBurden;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function getAbilityLevelName(actor, monster, item) {
    if (monster && item.system.isTrait) {
        return game.symbaroum.config.monsterTraitLevels[item.getLevel().level];
    } else {
        if (item.system.reference == "ritualist") {
            let rituals = Array.prototype.map.call(actor.items.filter(itm => { return itm.system.isRitual; }), tmp => { return tmp.name; }).join(", ");

            return `${game.i18n.localize(item.getLevel().lvlName)}, ${rituals}`;
        }
        return game.i18n.localize(item.getLevel().lvlName);
    }
}