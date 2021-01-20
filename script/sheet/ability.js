import { SymbaroumItemSheet } from "./item.js";
import { activateAbility } from "../common/item.js";

export class AbilitySheet extends SymbaroumItemSheet {
    static get defaultOptions() {
        return mergeObject(super.defaultOptions, {
            classes: ["symbaroum", "sheet", "item"],
            template: "systems/symbaroum/template/sheet/ability.html",
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
        html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    }

    async _prepareActivateAbility(event) {
        event.preventDefault();
        const div = $(event.currentTarget).parents(".item");
        const ability = this.actor.getOwnedItem(div.data("itemId"));
        await activateAbility(ability, this.actor);
    }

    /* affect reference on this item */
    async affectReference(){
        const abilitiesList = [
            {label: game.i18n.localize('ABILITY_LABEL.DEFAULT'), value: "none"},
            {label: game.i18n.localize('ABILITY_LABEL.ACROBATICS'), value: "acrobatics"},
            {label: game.i18n.localize('ABILITY_LABEL.ALCHEMY'), value: "alchemy"},
            {label: game.i18n.localize('ABILITY_LABEL.AGILE_COMBAT'), value: "agilecombat"},
            {label: game.i18n.localize('ABILITY_LABEL.ARMORED_MYSTIC'), value: "armoredmystic"},
            {label: game.i18n.localize('ABILITY_LABEL.ARROW_JAB'), value: "arrowjab"},
            {label: game.i18n.localize('ABILITY_LABEL.ARTIFACT_CRAFTING'), value: "artifactcrafting"},
            {label: game.i18n.localize('ABILITY_LABEL.AXE_ARTIST'), value: "axeartist"},
            {label: game.i18n.localize('ABILITY_LABEL.BACKSTAB'), value: "backstab"},
            {label: game.i18n.localize('ABILITY_LABEL.BEAST_LORE'), value: "beastlore"},
            {label: game.i18n.localize('ABILITY_LABEL.BERSERKER'), value: "berserker"},
            {label: game.i18n.localize('ABILITY_LABEL.BLACKSMITH'), value: "blacksmith"},
            {label: game.i18n.localize('ABILITY_LABEL.BLOOD_COMBAT'), value: "bloodcombat"},
            {label: game.i18n.localize('ABILITY_LABEL.BODYGUARD'), value: "bodyguard"},
            {label: game.i18n.localize('ABILITY_LABEL.CHANNELING'), value: "channeling"},
            {label: game.i18n.localize('ABILITY_LABEL.CHEAP_SHOT'), value: "cheapshot"},
            {label: game.i18n.localize('ABILITY_LABEL.DOMINATE'), value: "dominate"},
            {label: game.i18n.localize('ABILITY_LABEL.ENSNARE'), value: "ensnare"},
            {label: game.i18n.localize('ABILITY_LABEL.EQUESTRIAN'), value: "equestrian"},
            {label: game.i18n.localize('ABILITY_LABEL.EX_ATTRIBUTE'), value: "exceptionalattribute"},
            {label: game.i18n.localize('ABILITY_LABEL.FEAT_STRENGTH'), value: "featofstrength"},
            {label: game.i18n.localize('ABILITY_LABEL.FEINT'), value: "feint"},
            {label: game.i18n.localize('ABILITY_LABEL.FLAILER'), value: "flailer"},
            {label: game.i18n.localize('ABILITY_LABEL.HAMMER_RHYTHM'), value: "hammerrhythm"},
            {label: game.i18n.localize('ABILITY_LABEL.HUNTER_INSTINCT'), value: "huntersinstinct"},
            {label: game.i18n.localize('ABILITY_LABEL.IRON_FIST'), value: "ironfist"},
            {label: game.i18n.localize('ABILITY_LABEL.KNIFE_PLAY'), value: "knifeplay"},
            {label: game.i18n.localize('ABILITY_LABEL.LEADER'), value: "leader"},
            {label: game.i18n.localize('ABILITY_LABEL.LOREMASTER'), value: "loremaster"},
            {label: game.i18n.localize('ABILITY_LABEL.MAN-AT-ARMS'), value: "manatarms"},
            {label: game.i18n.localize('ABILITY_LABEL.MANTLE_DANCE'), value: "mantledance"},
            {label: game.i18n.localize('ABILITY_LABEL.MARKSMAN'), value: "marksman"},
            {label: game.i18n.localize('ABILITY_LABEL.MEDICUS'), value: "medicus"},
            {label: game.i18n.localize('ABILITY_LABEL.NATURAL_WARRIOR'), value: "naturalwarrior"},
            {label: game.i18n.localize('ABILITY_LABEL.OPPORTUNIST'), value: "opportunist"},
            {label: game.i18n.localize('ABILITY_LABEL.POISONER'), value: "poisoner"},
            {label: game.i18n.localize('ABILITY_LABEL.POLEARM_MASTERY'), value: "polearmmastery"},
            {label: game.i18n.localize('ABILITY_LABEL.PYROTECHNICS'), value: "pyrotechnics"},
            {label: game.i18n.localize('ABILITY_LABEL.QUICK_DRAW'), value: "quickdraw"},
            {label: game.i18n.localize('ABILITY_LABEL.RAPID_FIRE'), value: "rapidfire "},
            {label: game.i18n.localize('ABILITY_LABEL.RAPID_REFLEXES'), value: "rapidreflexes"},
            {label: game.i18n.localize('ABILITY_LABEL.RECOVERY'), value: "recovery"},
            {label: game.i18n.localize('ABILITY_LABEL.RITUALIST'), value: "ritualist"},
            {label: game.i18n.localize('ABILITY_LABEL.RUNE_TATTOO'), value: "runetattoo"},
            {label: game.i18n.localize('ABILITY_LABEL.SHIELD_FIGHTER'), value: "shieldfighter"},
            {label: game.i18n.localize('ABILITY_LABEL.SIEGE_EXPERT'), value: "siegeexpert"},
            {label: game.i18n.localize('ABILITY_LABEL.SIXTH_SENSE'), value: "sixthsense"},
            {label: game.i18n.localize('ABILITY_LABEL.SORCERY'), value: "sorcery"},
            {label: game.i18n.localize('ABILITY_LABEL.STAFF_FIGHTING'), value: "stafffighting"},
            {label: game.i18n.localize('ABILITY_LABEL.STAFF_MAGIC'), value: "staffmagic"},
            {label: game.i18n.localize('ABILITY_LABEL.STEADFAST'), value: "steadfast"},
            {label: game.i18n.localize('ABILITY_LABEL.STEEL_THROW'), value: "steelthrow"},
            {label: game.i18n.localize('ABILITY_LABEL.STRANGLER'), value: "strangler"},
            {label: game.i18n.localize('ABILITY_LABEL.STRONG_GIFT'), value: "stronggift"},
            {label: game.i18n.localize('ABILITY_LABEL.SWORD_SAINT'), value: "swordsaint"},
            {label: game.i18n.localize('ABILITY_LABEL.SYMBOLISM'), value: "symbolism"},
            {label: game.i18n.localize('ABILITY_LABEL.TACTICIAN'), value: "tactician"},
            {label: game.i18n.localize('ABILITY_LABEL.THEURGY'), value: "theurgy"},
            {label: game.i18n.localize('ABILITY_LABEL.TRAPPER'), value: "trapper"},
            {label: game.i18n.localize('ABILITY_LABEL.TRICK_ARCHERY'), value: "trickarchery"},
            {label: game.i18n.localize('ABILITY_LABEL.TROLL_SINGING'), value: "trollsinging"},
            {label: game.i18n.localize('ABILITY_LABEL.TWIN_ATTACK'), value: "twinattack"},
            {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FORCE'), value: "twohandedforce "},
            {label: game.i18n.localize('ABILITY_LABEL.WITCHCRAFT'), value: "witchcraft"},
            {label: game.i18n.localize('ABILITY_LABEL.WITCHSIGHT'), value: "witchsight"},
            {label: game.i18n.localize('ABILITY_LABEL.WIZARDRY'), value: "wizardry"},
            {label: game.i18n.localize('ABILITY_LABEL.WHIPFIGHTER'), value: "whipfighter"},
            {label: game.i18n.localize('ABILITY_LABEL.WRESTLING'), value: "wrestling"},
            {label: game.i18n.localize('ABILITY_LABEL.2HANDED_FINESSE'), value: "twohandedfinesse"},
            {label: game.i18n.localize('ABILITY_LABEL.BLESSINGS'), value: "blessings"}
        ];
        let referenceOptions = "";
        for(let referenceEntry of abilitiesList){
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
                        let selectedRef = html.find("#reference")[0].value;
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
}
