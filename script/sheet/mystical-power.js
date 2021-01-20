import { SymbaroumItemSheet } from "./item.js";

export class MysticalPowerSheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/mystical-power.html",
            width: 500,
            height: 472,
            resizable: false,
            tabs: [
                {
                    navSelector: ".sheet-tabs",
                    contentSelector: ".sheet-body",
                    initial: "description",
                },
            ]
        });
    }

    getData() {
        const data = super.getData();
        return data;
    }

    _getHeaderButtons() {
        let buttons = super._getHeaderButtons();
        return buttons;
    }

    activateListeners(html) {
        super.activateListeners(html);
    }

/* affect reference */
    async affectReference(){
        const powersList = [
            {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},        
            {label: game.i18n.localize('POWER_LABEL.ANATHEMA'), value: "anathema"},
            {label: game.i18n.localize('POWER_LABEL.BANISHING_SEAL'), value: "banishingseal"},
            {label: game.i18n.localize('POWER_LABEL.BEND_WILL'), value: "bendwill"},
            {label: game.i18n.localize('POWER_LABEL.BLACK_BOLT'), value: "blackbolt"},
            {label: game.i18n.localize('POWER_LABEL.BLACK_BREATH'), value: "blackbreath"},
            {label: game.i18n.localize('POWER_LABEL.BLESSED_SHIELD'), value: "blessedshield"},
            {label: game.i18n.localize('POWER_LABEL.BLINDING_SYMBOL'), value: "blindingsymbol"},
            {label: game.i18n.localize('POWER_LABEL.BRIMSTONE_CASCADE'), value: "brimstonecascade"},
            {label: game.i18n.localize('POWER_LABEL.COMBAT_HYMN'), value: "combathymn"},
            {label: game.i18n.localize('POWER_LABEL.CONFUSION'), value: "confusion"},
            {label: game.i18n.localize('POWER_LABEL.CURSE'), value: "curse"},
            {label: game.i18n.localize('POWER_LABEL.DANCING_WEAPON'), value: "dancingweapon"},
            {label: game.i18n.localize('POWER_LABEL.DRAINING_GLYPH'), value: "drainingglyph"},
            {label: game.i18n.localize('POWER_LABEL.ENTANGLING_VINES'), value: "entanglingvines"},
            {label: game.i18n.localize('POWER_LABEL.EXORCIZE'), value: "exorcize"},
            {label: game.i18n.localize('POWER_LABEL.FIRE_SOUL'), value: "firesoul"},
            {label: game.i18n.localize('POWER_LABEL.FLAME_WALL'), value: "flamewall"},
            {label: game.i18n.localize('POWER_LABEL.HEROIC_HYMN'), value: "heroichymn"},
            {label: game.i18n.localize('POWER_LABEL.HOLY_AURA'), value: "holyaura"},
            {label: game.i18n.localize('POWER_LABEL.ILLUSORY_CORRECTION'), value: "illusorycorrection"},
            {label: game.i18n.localize('POWER_LABEL.INHERIT_WOUND'), value: "inheritwound"},
            {label: game.i18n.localize('POWER_LABEL.LARVAE_BOILS'), value: "larvaeboils"},
            {label: game.i18n.localize('POWER_LABEL.LAY_ON_HANDS'), value: "layonhands"},
            {label: game.i18n.localize('POWER_LABEL.LEVITATE'), value: "levitate"},
            {label: game.i18n.localize('POWER_LABEL.LIFEGIVER'), value: "lifegiver"},
            {label: game.i18n.localize('POWER_LABEL.MALTRANSFORMATION'), value: "maltransformation"},
            {label: game.i18n.localize('POWER_LABEL.MIND-THROW'), value: "mindthrow"},
            {label: game.i18n.localize('POWER_LABEL.MIRRORING'), value: "mirroring"},
            {label: game.i18n.localize('POWER_LABEL.NATURES_EMBRACE'), value: "naturesembrace"},
            {label: game.i18n.localize('POWER_LABEL.PRIOS_BURNING_GLASS'), value: "priosburningglass"},
            {label: game.i18n.localize('POWER_LABEL.PROTECTIVE_RUNES'), value: "protectiverunes"},
            {label: game.i18n.localize('POWER_LABEL.PSYCHIC_THRUST'), value: "psychicthrust"},
            {label: game.i18n.localize('POWER_LABEL.PURGATORY'), value: "purgatory"},
            {label: game.i18n.localize('POWER_LABEL.RETRIBUTION'), value: "retribution"},
            {label: game.i18n.localize('POWER_LABEL.REVENANT_STRIKE'), value: "revenantstrike"},
            {label: game.i18n.localize('POWER_LABEL.SHAPESHIFT'), value: "shapeshift"},
            {label: game.i18n.localize('POWER_LABEL.SPHERE'), value: "sphere"},
            {label: game.i18n.localize('POWER_LABEL.SPIRIT_WALK'), value: "spiritwalk"},
            {label: game.i18n.localize('POWER_LABEL.STAFF_PROJECTILE'), value: "staffprojectile"},
            {label: game.i18n.localize('POWER_LABEL.STORM_ARROW'), value: "stormarrow"},
            {label: game.i18n.localize('POWER_LABEL.TELEPORT'), value: "teleport"},
            {label: game.i18n.localize('POWER_LABEL.THORN_CLOAK'), value: "thorncloak"},
            {label: game.i18n.localize('POWER_LABEL.TORMENTING_SPIRITS'), value: "tormentingspirits"},
            {label: game.i18n.localize('POWER_LABEL.TRUE_FORM'), value: "trueform"},
            {label: game.i18n.localize('POWER_LABEL.UNHOLY_AURA'), value: "unholyaura"},
            {label: game.i18n.localize('POWER_LABEL.UNNOTICEABLE'), value: "unnoticeable"},
            {label: game.i18n.localize('POWER_LABEL.WEAKENING_HYMN'), value: "weakeninghymn"},
            {label: game.i18n.localize('POWER_LABEL.WILD_HUNT'), value: "wildhunt"},
            {label: game.i18n.localize('POWER_LABEL.BATTLE_SYMBOL'), value: "battlesymbol"},
            {label: game.i18n.localize('POWER_LABEL.EARTH_BINDING'), value: "earthbinding"},
            {label: game.i18n.localize('POWER_LABEL.MARK_OF_TORMENT'), value: "markoftorment"},
            {label: game.i18n.localize('POWER_LABEL.SERENITY'), value: "serenity"},
            {label: game.i18n.localize('POWER_LABEL.EARTH_SHOT'), value: "earthshot"},
            {label: game.i18n.localize('POWER_LABEL.WITCH_HAMMER'), value: "witchhammer"}
        ];
        let referenceOptions = "";
        let selectedRef;
        for(let referenceEntry of powersList){
            referenceOptions += `<option value=${referenceEntry.value}>${referenceEntry.label} </option>`
        }
        
        let htmlTemplate = `
        <h1> ${game.i18n.localize('ABILITYREF.DIALOG_TITLE')} </h1>
        <p> ${game.i18n.localize('ABILITYREF.DIALOG')}</p>
        <div style="display:flex">
        <div  style="flex:1"><select id="reference">${referenceOptions}</select></div>
        </div>`;
        new Dialog({
            title: game.i18n.localize('ABILITYREF.DIALOG_TITLE'), 
            content: htmlTemplate,
            buttons: {
                validate: {
                    label: "Validate",
                    callback: (html) => {
                        selectedRef = html.find("#reference")[0].value;
                        this.update({"data.reference": selectedRef});
                        return(selectedRef)
                    }
                }, 
                close: {
                    label: "Close"
                }
            }
        }).render(true);
    }


    async makeAction(actor, level){

        const scriptedPowers = 
            [{reference: "anathema", function: anathemaPrepare},
            {reference: "brimstonecascade", function: brimstoneCascadePrepare},
            {reference: "bendWill", function: bendWillPrepare},
            {reference: "curse", function: cursePrepare},
            {reference: "holyaura", function: holyAuraPrepare},
            {reference: "inheritwound", function: inheritWound},
            {reference: "larvaeboils", function: larvaeBoilsPrepare},
            {reference: "unnoticeable", function: unnoticeablePrepare}];

        const power = scriptedPowers.find(element => element.reference === powerName);
        if(power){
            try{await power.function(ability, actor)} catch(error){
                ui.notifications.error(error);
                return;
            }
        }
    }
}
