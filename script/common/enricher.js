export function enrichTextEditors()
{
    CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
    {
        pattern : /@SymbaroumActor\[(.+?)\](?:{(.+?)})?(?:{(.+?)})?/gm,
        enricher : (match, options) => {
            // Match 1 would be actor name or actorID
            // Match 2 would be a given name overruling Actor name
            // Match 3 would be a comma separated with integrated abilities (beyond the default)

            const actorDoc = document.createElement("span");
            let actor = game.actors.get(match[1]);
            if(!actor) { 
                actor = game.actors.getName(match[1]);
            }
            if(!actor) {
                return actorDoc;
            }
            let name = match[2];
            if( !name ) {
                name = actor.name;
            }
            const monster = actor.type == "monster";

            // Integrated abilities/traits
            let integrated = [];
            let namedIntegrated = match[3] ? match[3].split(',') : [];
            // Add "special ones"
            for(var thingy of namedIntegrated) {                
                let fetchedItem = actor.items.getName(thingy);
                if( fetchedItem ) {
                    integrated.push( fetchedItem);
                }
            }
            // weapons            
            for(var weaponModifiers in actor.system.combat.combatMods.weapons) {
                // Get weapon modifier abilities
                for(let pack of actor.system.combat.combatMods.weapons[weaponModifiers].package) {
                    if(pack.type ==game.symbaroum.config.PACK_DEFAULT || pack.type === game.symbaroum.config.PACK_CHECK) {
                        for(let member of pack.member) {
                            integrated.push( actor.items.get(member.id));
                        }
                    }
                }
            }
            for(var armorModifiers in actor.system.combat.combatMods.armors) {
                // Get armor modifier abilities
                for(let defMod of actor.system.combat.combatMods.armors[armorModifiers].defenseModifiers) {
                    integrated.push( actor.items.get(defMod.id));
                }
                for(let impMod of actor.system.combat.combatMods.armors[armorModifiers].impedingModifiers) {
                    integrated.push( actor.items.get(impMod.id));
                }
                for(let attribs of actor.system.combat.combatMods.armors[armorModifiers].attributes) {
                    integrated.push( actor.items.get(attribs.id));
                }
            }
            for(var initiativeMod of actor.system.combat.combatMods.initiative) {
                // Get weapon modifier abilities
                integrated.push( actor.items.get(initiativeMod.id));
            }
            integrated = integrated.filter(onlyUnique).filter( abil => { return abil.system.isPower});

            // Wielded weapons
            let weapons = actor.items.filter( weap => { return weap.system.isWeapon && weap.system.isActive; });
            // Traits
            const traits = actor.items.filter( trait => { return isTrait(trait) && integrated.indexOf(trait) == -1});
            // Abilities
            const abilities = actor.items.filter( ability => { return !isTrait(ability) && ability.system.isPower && !ability.system.isRitual && integrated.indexOf(ability) == -1});
            

            const htmlFormat = 
`<h5 style="margin-left: 25%;">${name}, ${actor.system.bio.race} <a class="content-link" draggable="false" data-type="Macro" data-uuid="Actor.${actor.id}">${name}</a></h5>
<p class="pblock" style="margin-left: auto; margin-right: auto; width: 50%;"><em>${actor.system.bio.quote}</em></p>
<hr style="margin-left: auto; margin-right: auto; width: 50%;" />
<table style="border-style: solid; margin-left: auto; margin-right: auto; width: 50%; border: 3px; font-size: 12pt;">
<tbody>
<tr style="color: aliceblue; background-color: black;">
<td style="width: 15%; text-align: center;" colspan="8">
<h6>${name.toUpperCase()}</h6>
<hr /><strong>${actor.system.bio.race}</strong><br />${actor.system.bio.appearance}</td>
</tr>
${getAttributes(actor, monster)}
<tr style="border-top: solid 1px;">
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>Defence</strong><br />${ monster? actor.system.combat.defmod: actor.system.combat.defense}</td>
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>Armor</strong><br />${actor.system.combat.name} ${actor.system.combat.displayTextShort}</td>
<td style="width: 25%; text-align: center; border-right: solid 1px;" colspan="2"><strong>Toughness</strong><br />${actor.system.health.toughness.value}</td>
<td style="width: 25%; text-align: center;" colspan="2"><strong>Pain Threshold</strong><br />${actor.system.health.toughness.threshold}</td>
</tr>
<tr>
<td style="width: 15%;" colspan="2"><strong>Weapons</strong><br />${weapons.length > 0 ? game.i18n.localize(`ATTRIBUTE.${weapons[0].system.attribute.toUpperCase()}`) : ""}</td>
<td style="width: 85%;" colspan="6">${displayWeaponFacts(actor, weapons)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">Abilities</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, abilities)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">Traits</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, traits)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">Integrated</td>
<td style="width: 85%;" colspan="6">${getAbilities(actor, monster, integrated)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">Equipment</td>
<td style="width: 85%;" colspan="6">${getMoney(actor)} ${getEquipment(actor)}</td>
</tr>
<tr>
<td style="width: 15%; font-weight: bold;" colspan="2">Shadow</td>
<td style="width: 85%;" colspan="6">${actor.system.bio.shadow} (corruption: ${actor.system.health.corruption.value})</td>
</tr>
${monster ? getTactics(actor) : ""}

</tbody>
</table>`;

            actorDoc.innerHTML = htmlFormat;

            return actorDoc;
        }
    }]);
}

function getAttributes(actor, monster) {
    let abbrv = '';
    let values = '';
    for (var aKey in actor.system.attributes) {
        abbrv += `<td class="newstatheader"><strong>${ game.i18n.localize(actor.system.attributes[aKey].label+'ABBR')}</strong></td>`;
        values += `<td class="newstatheader">${monster ? 10 - actor.system.attributes[aKey].total : actor.system.attributes[aKey].total}</td>`;

    }
    return `<tr>${abbrv}</tr><tr>${values}</tr>`;
}

function displayWeaponFacts(actor, weapons) {
    let display = "";
    let first = true;
    for(var weap of weapons) {
        if(!first) {
            display += ", ";
        }
        let dam = "";
        for(var damageWeap of actor.system.weapons) {
            if( damageWeap.id == weap.id) {
                dam = damageWeap.damage.displayTextShort;
            }
        }
        display += `${weap.name} ${dam}`;
        if(actor.system.combat.combatMods.weapons[weap.id].maxAttackNb > 1) {
            display += `, ${actor.system.combat.combatMods.weapons[weap.id].maxAttackNb} attacks`;
        }
        display += `<br/>`;

    }
    return display;
}

function getAbilities(actor, monster, abilityList) {    
    let first = true;
    let list = "";
    for(var ability of abilityList) {
        if(!first) {
            list += ", ";        
        }
        first = false;
        list += `${ability.name} (${getAbilityLevelName(actor, monster, ability)})`;
    }
    return list;
}

function getTactics(actor) {
    return `<tr><td style="width: 15%; font-weight: bold;" colspan="2">Tactics</td>
    <td style="width: 15%;" colspan="6">${actor.system.bio.tactics}</td>
    </tr>`;
}

function getMoney(actor) {
    let monies = "";
    if(actor.system.money.thaler > 0) {
        monies += `${actor.system.money.thaler} ${game.i18n.localize("MONEY.THALER")}`;
    }
    if(actor.system.money.shilling > 0) {
        if(actor.system.money.thaler > 0) {
            monies += ", ";
        }
        monies += `${actor.system.money.shilling} ${game.i18n.localize("MONEY.SHILLING")}`;
    }
    if(actor.system.money.orteg > 0) {
        if(actor.system.money.thaler > 0 || actor.system.money.shilling > 0) {
            monies += ", ";
        }
        monies += `${actor.system.money.orteg} ${game.i18n.localize("MONEY.ORTEG")}`;
    }
    return monies;
}

function getEquipment(actor) {
    let equipment = "";
    const eq = actor.items.filter( obj => { return obj.system.isGear && !(obj.system.isWeapon && obj.system.isActive || obj.system.isArmor && obj.system.isActive ) });    
    for(let i = 0; i < eq.length; i++) {
        if( i > 0 ) equipment += ", ";
        if(eq[i].system.isEquipment && eq[i].system.number > 1) {
            equipment += `${eq[i].system.number } `;
        }
        equipment += eq[i].name;
    }
    return equipment;
}

function isTrait(trait)
{
    return trait.system.isTrait || trait.system.isBoon || trait.system.isBurden;
}

function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

function getAbilityLevelName(actor, monster, item) {
    if(monster && item.system.isTrait) {
        return game.symbaroum.config.monsterTraitLevels[item.getLevel().level];
    } else {
        if(item.system.reference == "ritualist") {
            let rituals = Array.prototype.map.call(actor.items.filter(itm => {  return itm.system.isRitual;}), tmp => { return tmp.name; }).join(", ");

            return `${game.i18n.localize(item.getLevel().lvlName)}, ${rituals}`;
        }
        return game.i18n.localize(item.getLevel().lvlName);
    }
}