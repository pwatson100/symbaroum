export const initializeHandlebars = () => {
  registerHandlebarsHelpers();
  preloadHandlebarsTemplates();
};

function preloadHandlebarsTemplates() {
  const templatePaths = [
    'systems/symbaroum/template/sheet/player.html',
    'systems/symbaroum/template/sheet/player2.html',
    'systems/symbaroum/template/sheet/tab/player-main.html',
    'systems/symbaroum/template/sheet/tab/player2-main.html',
    'systems/symbaroum/template/sheet/tab/player-gear.html',
    'systems/symbaroum/template/sheet/tab/player-bio.html',
    'systems/symbaroum/template/sheet/tab/player-note.html',
    'systems/symbaroum/template/sheet/trait.html',
    'systems/symbaroum/template/sheet/ability.html',
    'systems/symbaroum/template/sheet/mystical-power.html',
    'systems/symbaroum/template/sheet/ritual.html',
    'systems/symbaroum/template/sheet/burden.html',
    'systems/symbaroum/template/sheet/boon.html',
    'systems/symbaroum/template/sheet/weapon.html',
    'systems/symbaroum/template/sheet/armor.html',
    'systems/symbaroum/template/sheet/equipment.html',
    'systems/symbaroum/template/sheet/artifact.html',
    'systems/symbaroum/template/sheet/tab/bonus.html',
    'systems/symbaroum/template/sheet/tab/artifact.html',
    'systems/symbaroum/template/sheet/attributes.html',
    'systems/symbaroum/template/chat/item.html',
    'systems/symbaroum/template/chat/ability.html',
    'systems/symbaroum/template/chat/combat.html',
    'systems/symbaroum/template/chat/applyEffectsButton.html',
  ];
  return loadTemplates(templatePaths);
}
function registerHandlebarsHelpers() {
  Handlebars.registerHelper('removeMarkup', function (text) {
    const markup = /<(.*?)>/gi;
    return new Handlebars.SafeString(text.replace(markup, ''));
  });

  Handlebars.registerHelper('keepMarkup', function (text) {  
    return new Handlebars.SafeString(text);
  });

  Handlebars.registerHelper('localizeabbr', function (text) {  
    return game.i18n.localize(text+"ABBR");
  });

  // Ifis not equal
  Handlebars.registerHelper('ifne', function (v1, v2, options) {
    if (v1 !== v2) return options.fn(this);
    else return options.inverse(this);
  });
  // if not
  Handlebars.registerHelper('ifn', function (v1, options) {
    if (!v1) return options.fn(this);
    else return options.inverse(this);
  });
  // if equal
  Handlebars.registerHelper('ife', function (v1, v2, options) {
    if (v1 === v2) return options.fn(this);
    else return options.inverse(this);
  });
  // if equal
  Handlebars.registerHelper('ifgt', function (v1, v2, options) {
    if (v1 > v2) return options.fn(this);
    else return options.inverse(this);
  });
  // if all true
  Handlebars.registerHelper('ifat', function (...args) {
    // remove handlebar options
    let options = args.pop();
    console.log("inat:",args,":");

    return args.indexOf(false) === -1 ? options.fn(this) : options.inverse(this);
  });    
  Handlebars.registerHelper('keyIndex', function (str) {
    return 'data.power.' + str + '.description';
  });
  Handlebars.registerHelper('addOne', function (v1) {
    let newOne = parseInt(v1) + 1;
    return newOne;
  });
  Handlebars.registerHelper('ifSetting', function (v1, options) {
    if(game.settings.get('symbaroum',v1) ) return options.fn(this);
      else return options.inverse(this);
  });  
  Handlebars.registerHelper('toFixed', function (v1, v2) {
    return v1.toFixed(v2);  
  });



}
