export const initializeHandlebars = () => {
  registerHandlebarsHelpers();
  preloadHandlebarsTemplates();
};

function preloadHandlebarsTemplates() {
  const templatePaths = [
    'systems/symbaroum/template/sheet/player.hbs',
    'systems/symbaroum/template/sheet/tab/player-main.hbs',
    'systems/symbaroum/template/sheet/tab/player-gear.hbs',
    'systems/symbaroum/template/sheet/tab/player-bio.hbs',
    'systems/symbaroum/template/sheet/tab/player-note.hbs',
    'systems/symbaroum/template/sheet/trait.hbs',
    'systems/symbaroum/template/sheet/ability.hbs',
    'systems/symbaroum/template/sheet/mystical-power.hbs',
    'systems/symbaroum/template/sheet/ritual.hbs',
    'systems/symbaroum/template/sheet/burden.hbs',
    'systems/symbaroum/template/sheet/boon.hbs',
    'systems/symbaroum/template/sheet/weapon.hbs',
    'systems/symbaroum/template/sheet/armor.hbs',
    'systems/symbaroum/template/sheet/equipment.hbs',
    'systems/symbaroum/template/sheet/artifact.hbs',
    'systems/symbaroum/template/sheet/tab/bonus.hbs',
    'systems/symbaroum/template/sheet/tab/artifact.hbs',
    'systems/symbaroum/template/sheet/attributes.hbs',
    'systems/symbaroum/template/chat/item.hbs',
    'systems/symbaroum/template/chat/ability.hbs',
    'systems/symbaroum/template/chat/combat.hbs',
    'systems/symbaroum/template/chat/applyEffectsButton.hbs',
  ];
  return foundry.applications.handlebars.loadTemplates(templatePaths);
}
function registerHandlebarsHelpers() {
  Handlebars.registerHelper('removeMarkup', function (text) {
    const markup = /<(.*?)>/gi;
    return new Handlebars.SafeString(text.replace(markup, ''));
  });
    
  Handlebars.registerHelper('removeStyling', function (text) {
    const styling = /style="[^"]+"/gi;
    return new Handlebars.SafeString(text.replace(styling, ''));
  });

  Handlebars.registerHelper('keepMarkup', function (text) {  
    return new Handlebars.SafeString(text);
  });

  Handlebars.registerHelper('localizeabbr', function (text) {  
    return game.i18n.localize(text+"ABBR");
  });

  Handlebars.registerHelper('qualitylocalize', function (text) {  
    return game.i18n.localize(`QUALITY.${text.toUpperCase()}`);
  });


  Handlebars.registerHelper('getProperty', function (item, prop) {
    return foundry.utils.getProperty(item, prop);
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
    return args.indexOf(false) === -1 ? options.fn(this) : options.inverse(this);
  });    
  Handlebars.registerHelper('keyIndex', function (str) {
    return 'system.power.' + str + '.description';
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

  // Times
  Handlebars.registerHelper('times', function(n, block) {
    var accum = '';
    for(var i = 0; i < n; ++i)
        accum += block.fn(i);
    return accum;
  });  

  // ifNotLimited to return whether permissions are not set to Limited or if the user is a GM
  Handlebars.registerHelper('ifNotLimited', function (v1, options) {
    if (v1.getUserLevel(game.user) > CONST.DOCUMENT_OWNERSHIP_LEVELS.LIMITED || game.user.isGM) return options.fn(this);
    else return options.inverse(this);
  });

  Handlebars.registerHelper('if_even', function(conditional, options) {
    if((conditional % 2) == 0) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });

  Handlebars.registerHelper('if_empty', function(conditional, options) {
    if(Handlebars.Utils.isEmpty(conditional)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });  

  Handlebars.registerHelper('if_nempty', function(conditional, options) {
    if(!Handlebars.Utils.isEmpty(conditional)) {
      return options.fn(this);
    } else {
      return options.inverse(this);
    }
  });  

  Handlebars.registerHelper('loud', function (aString) {
    return aString.toUpperCase();
  });


}
