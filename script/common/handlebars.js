export const initializeHandlebars = () => {
  registerHandlebarsHelpers();
  preloadHandlebarsTemplates();
};

function preloadHandlebarsTemplates() {
  const templatePaths = [
    "systems/symbaroum/template/sheet/player.html",
    "systems/symbaroum/template/sheet/player2.html",
    "systems/symbaroum/template/sheet/tab/player-main.html",
    "systems/symbaroum/template/sheet/tab/player2-main.html",
    "systems/symbaroum/template/sheet/tab/player-gear.html",
    "systems/symbaroum/template/sheet/tab/player-bio.html",
    "systems/symbaroum/template/sheet/tab/player-note.html",
    "systems/symbaroum/template/sheet/monster.html",
    "systems/symbaroum/template/sheet/tab/monster-main.html",
    "systems/symbaroum/template/sheet/tab/monster-gear.html",
    "systems/symbaroum/template/sheet/tab/monster-bio.html",
    "systems/symbaroum/template/sheet/tab/monster-note.html",
    "systems/symbaroum/template/sheet/trait.html",
    "systems/symbaroum/template/sheet/ability.html",
    "systems/symbaroum/template/sheet/mystical-power.html",
    "systems/symbaroum/template/sheet/ritual.html",
    "systems/symbaroum/template/sheet/burden.html",
    "systems/symbaroum/template/sheet/boon.html",
    "systems/symbaroum/template/sheet/weapon.html",
    "systems/symbaroum/template/sheet/armor.html",
    "systems/symbaroum/template/sheet/equipment.html",
    "systems/symbaroum/template/sheet/artifact.html",
    "systems/symbaroum/template/sheet/tab/bonus.html",
    "systems/symbaroum/template/chat/item.html",
    "systems/symbaroum/template/chat/ability.html",
    "systems/symbaroum/template/chat/applyEffectsButton.html"
  ];
  return loadTemplates(templatePaths);
}

function registerHandlebarsHelpers() {
  Handlebars.registerHelper("removeMarkup", function (text) {
    const markup = /<(.*?)>/gi;
    return new Handlebars.SafeString(text.replace(markup, ""));
  });
}
