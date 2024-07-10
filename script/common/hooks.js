import { initializeHandlebars } from './handlebars.js';
import { SYMBAROUM } from './config.js';
import { sendDevMessage } from './devmsg.js';
import { SymbaroumAPI } from './api.js';
import { SymbaroumCommsListener } from './symbcomms.js';
import { SymbaroumMacros } from './macro.js';
import { SymbaroumConfig } from './symbaroumConfig.js';
import { enrichTextEditors } from './enricher.js';

import { SymbaroumActor } from './actor.js';
import { SymbaroumItem, buildRolls } from './item.js';

import { PlayerSheet } from '../sheet/player.js';
import { MonsterSheet } from '../sheet/monster.js';
import { TraitSheet } from '../sheet/trait.js';
import { AbilitySheet } from '../sheet/ability.js';
import { MysticalPowerSheet } from '../sheet/mystical-power.js';
import { RitualSheet } from '../sheet/ritual.js';
import { BurdenSheet } from '../sheet/burden.js';
import { BoonSheet } from '../sheet/boon.js';
import { WeaponSheet } from '../sheet/weapon.js';
import { ArmorSheet } from '../sheet/armor.js';
import { EquipmentSheet } from '../sheet/equipment.js';
import { ArtifactSheet } from '../sheet/artifact.js';
import { SymbaroumWide } from '../sheet/journal.js';

import { migrateWorld } from './migration.js';

import { tourSetup } from '../../tours/toursetup.js';

Hooks.once('init', () => {

  const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 250);

  CONFIG.Actor.documentClass = SymbaroumActor;
  CONFIG.Item.documentClass = SymbaroumItem;
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('symbaroum', PlayerSheet, { types: ['player'], makeDefault: true });
  Actors.registerSheet('symbaroum', MonsterSheet, { types: ['monster'], makeDefault: true });
  Actors.registerSheet('symbaroum', PlayerSheet, { types: ['monster'], makeDefault: false });
  Items.unregisterSheet('core', ItemSheet);
  Items.registerSheet('symbaroum', TraitSheet, { types: ['trait'], makeDefault: true });
  Items.registerSheet('symbaroum', AbilitySheet, { types: ['ability'], makeDefault: true });
  Items.registerSheet('symbaroum', MysticalPowerSheet, { types: ['mysticalPower'], makeDefault: true });
  Items.registerSheet('symbaroum', RitualSheet, { types: ['ritual'], makeDefault: true });
  Items.registerSheet('symbaroum', BurdenSheet, { types: ['burden'], makeDefault: true });
  Items.registerSheet('symbaroum', BoonSheet, { types: ['boon'], makeDefault: true });
  Items.registerSheet('symbaroum', WeaponSheet, { types: ['weapon'], makeDefault: true });
  Items.registerSheet('symbaroum', ArmorSheet, { types: ['armor'], makeDefault: true });
  Items.registerSheet('symbaroum', EquipmentSheet, { types: ['equipment'], makeDefault: true });
  Items.registerSheet('symbaroum', ArtifactSheet, { types: ['artifact'], makeDefault: true });
  Journal.registerSheet('symbaroum', SymbaroumWide, { label: game.i18n.localize("SYMBAROUM.OPTIONAL_CUSTOMSHEETJOURNAL"), makeDefault: false });

  initializeHandlebars();

  game.symbaroum = {
    config: SYMBAROUM,
    SymbaroumConfig,
    debug: (...args) => { console.debug('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    error: (...args) => { console.error('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    info: (...args) => { console.info('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    log: (...args) => { console.log('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    api: new SymbaroumAPI()
  };

  CONFIG.symbaroum = game.symbaroum.config;

  game.settings.register('symbaroum', 'worldTemplateVersion', {
    // worldTemplateVersion is deprecated - not to use anymore
    name: 'World Template Version',
    hint: 'Used to automatically upgrade worlds data when the template is upgraded.',
    scope: 'world',
    config: false,
    default: 0,
    type: Number
  });

  game.settings.register('symbaroum', 'systemMigrationVersion', {
    name: 'World System Version',
    hint: 'Used to automatically upgrade worlds data when needed.',
    scope: 'world',
    config: false,
    default: '0',
    type: String
  });

  game.settings.register('symbaroum', 'symbaroumDevMessageVersionNumber', {
    name: 'Message from the devs',
    hint: 'Used to track last message id from the Symbaroum devs',
    scope: 'world',
    config: false,
    default: 0,
    type: Number
  });

  game.settings.register('symbaroum', 'combatAutomation', {
    name: 'SYMBAROUM.OPTIONAL_AUTOCOMBAT',
    hint: 'SYMBAROUM.OPTIONAL_AUTOCOMBAT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'playerResistButton', {
    name: 'SYMBAROUM.OPTIONAL_PLAYER_RESIST',
    hint: 'SYMBAROUM.OPTIONAL_PLAYER_RESIST_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'alwaysSucceedOnOne', {
    name: 'SYMBAROUM.OPTIONAL_ALWAYSSUCCEDONONE',
    hint: 'SYMBAROUM.OPTIONAL_ALWAYSSUCCEDONONE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'optionalCrit', {
    name: 'SYMBAROUM.OPTIONAL_CRIT',
    hint: 'SYMBAROUM.OPTIONAL_CRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'optionalRareCrit', {
    name: 'SYMBAROUM.OPTIONAL_RARECRIT',
    hint: 'SYMBAROUM.OPTIONAL_RARECRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'critsApplyToAllTests', {
    name: 'SYMBAROUM.OPTIONAL_ALWAYSUSECRIT',
    hint: 'SYMBAROUM.OPTIONAL_ALWAYSUSECRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'optionalMoreRituals', {
    name: 'SYMBAROUM.OPTIONAL_MORERITUALS',
    hint: 'SYMBAROUM.OPTIONAL_MORERITUALS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'saveCombatRoll', {
    name: 'SYMBAROUM.OPTIONAL_SAVECOMBATROLL',
    hint: 'SYMBAROUM.OPTIONAL_SAVECOMBATROLL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register('symbaroum', 'saveAttributeRoll', {
    name: 'SYMBAROUM.OPTIONAL_SAVEATTRIBUTEROLL',
    hint: 'SYMBAROUM.OPTIONAL_SAVEATTRIBUTEROLL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register('symbaroum', 'showModifiersInDialogue', {
    name: 'SYMBAROUM.OPTIONAL_SHOWMODIFIERSINDIALOGUE',
    hint: 'SYMBAROUM.OPTIONAL_SHOWMODIFIERSINDIALOGUE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register('symbaroum', 'showNpcModifiers', {
    name: 'SYMBAROUM.OPTIONAL_NPC_MODIFIERS',
    hint: 'SYMBAROUM.OPTIONAL_NPC_MODIFIERS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register('symbaroum', 'showNpcAttacks', {
    name: 'SYMBAROUM.OPTIONAL_NPC_ATTACKS',
    hint: 'SYMBAROUM.OPTIONAL_NPC_ATTACKS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    requiresReload: true,    
    config: true
  });
  game.settings.register('symbaroum', 'allowShowReference', {
    name: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE',
    hint: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'hideIniativeRolls', {
    name: 'SYMBAROUM.OPTIONAL_INIATITIVEROLLS',
    hint: 'SYMBAROUM.OPTIONAL_INIATITIVEROLLS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  game.settings.register('symbaroum', 'autoRollInitiative', {
    name: 'SYMBAROUM.OPTIONAL_AUTOROLLINITIATIVE',
    hint: 'SYMBAROUM.OPTIONAL_AUTOROLLINITIATIVE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });
  
  game.settings.register('symbaroum', 'enhancedDeathSaveBonus', {
    name: 'SYMBAROUM.OPTIONAL_ENHANCEDDEATHSAVEBONUS',
    hint: 'SYMBAROUM.OPTIONAL_ENHANCEDDEATHSAVEBONUS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'manualInitValue', {
    name: 'SYMBAROUM.OPTIONAL_INIT_MANUAL',
    hint: 'SYMBAROUM.OPTIONAL_INIT_MANUAL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true
  });

  game.settings.register('symbaroum', 'charBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/green_flower_light.webp) repeat'
  });
  game.settings.register('symbaroum', 'npcBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/purple_flower_light.webp) repeat'
  });
  game.settings.register('symbaroum', 'titleBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/title.webp)'
  });
  game.settings.register('symbaroum', 'editableChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/editable.webp)'
  });
  game.settings.register('symbaroum', 'nonEditableChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/not-editable.webp)'
  });

  game.settings.register('symbaroum', 'switchCharBGColour', {
    name: 'SYMBAROUM.OPTIONAL_PC_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/green_flower_light.webp) repeat'
  });
  game.settings.register('symbaroum', 'switchNpcBGColour', {
    name: 'SYMBAROUM.OPTIONAL_NPC_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/purple_flower_light.webp) repeat'
  });
  game.settings.register('symbaroum', 'switchTitleColour', {
    name: 'SYMBAROUM.OPTIONAL_TITLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/title.webp)'
  });
  game.settings.register('symbaroum', 'switchEditableColour', {
    name: 'SYMBAROUM.OPTIONAL_EDITABLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/editable.webp)'
  });
  game.settings.register('symbaroum', 'switchNoNEditableColour', {
    name: 'SYMBAROUM.OPTIONAL_EDITABLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/not-editable.webp)'
  });
  game.settings.register('symbaroum', 'chatBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/editable.webp)'
  });
  game.settings.register('symbaroum', 'switchChatBGColour', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/green_flower_light.webp) repeat'
  });  

  game.settings.registerMenu('symbaroum', 'symbaroumSettings', {
    name: 'SYMBAROUM.OPTIONAL_CONFIG_MENULABEL',
    label: 'SYMBAROUM.OPTIONAL_CONFIG_MENULABEL',
    hint: 'SYMBAROUM.OPTIONAL_CONFIG_MENUHINT',
    icon: 'fas fa-palette',
    type: SymbaroumConfig,
    restricted: false
  });

  // register setting for add/remove menu button
  game.settings.register('symbaroum', 'addMenuButton', {
    name: 'SYMBAROUM.OPTIONAL_ADD_MENUNAME',
    hint: 'SYMBAROUM.OPTIONAL_ADD_MENUHINT',
    scope: 'world',
    config: true,
    default: SymbaroumConfig.getDefaults.addMenuButton,
    type: Boolean,
    onChange: (enabled) => {
      SymbaroumConfig.toggleConfigButton(enabled);
    }
  });

  game.settings.register('symbaroum', 'symSemaphore', {
    name: 'Semaphore Flag',
    hint: 'Flag for running sequential actions/scripts',
    scope: 'world',
    type: String,
    config: false,
    default: ''
  });

  game.symbaroum.macros = new SymbaroumMacros();

  game.symbaroum.htmlEscape = function (str) {
    let escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '/': '&#x2F;',
      '`': '&#x60;',
      '=': '&#x3D;'
    };  
    return str.replace(/[&<>"'`=\/]/g, function (s) {
      return escapeMap[s];
    });
  };

  enrichTextEditors();
  // MOVE TO READY?!
  setupStatusEffects();
});


Hooks.once('ready', () => {
  game.symbaroum.macros.macroReady();
  const originalVersion = game.settings.get('symbaroum', 'systemMigrationVersion');  
  migrateWorld();
  sendDevMessage();
  showReleaseNotes(originalVersion);
  setupConfigOptions();
  setupEmit();
  setup3PartySettings();
  // enrichTextEditors();
  tourSetup();
});

Hooks.on("preDocumentSheetRegistrarInit", (settings) => {
  settings["JournalEntry"] = true;
});

Hooks.on("documentSheetRegistrarInit", (documentTypes) => {
  DocumentSheetConfig.updateDefaultSheets(game.settings.get("core", "sheetClasses"));
});

// create/remove the quick access config button
Hooks.once('renderSettings', () => {
  SymbaroumConfig.toggleConfigButton(JSON.parse(game.settings.get('symbaroum', 'addMenuButton')));
});

Hooks.on('preCreateActor', (doc, createData, options, userid) => {
  let createChanges = {};
  foundry.utils.mergeObject(createChanges, {
    'prototypeToken.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'prototypeToken.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'prototypeToken.disposition': CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    'prototypeToken.name': createData.name,
  });

  if (doc.img === 'icons/svg/mystery-man.svg') {
    createChanges.img = 'systems/symbaroum/asset/image/unknown-actor.png';
  }

  if (doc.type === 'player') {
    createChanges.prototypeToken.vision = true;
    createChanges.prototypeToken.actorLink = true;
  }
  doc.updateSource(createChanges);
});

// Hooks.on('createOwnedItem', (actor, item) => {});
Hooks.on("changeSidebarTabA", (app) => {
  game.symbaroum.log("In changeSidebarTab - sorting out available compendiums", app, app.rendered);

});

Hooks.on("preDeleteActiveEffect", (ae) => {
  game.symbaroum.log('preDeleteActiveEffect',ae);
  let holyShield = false;
  if (foundry.utils.isNewerVersion('11', game.version) ) {
    holyShield = ae.getFlag('core','statusId') == 'holyShield';
  } else {
    holyShield = ae.statuses.find(e => e == "holyShield") 
  }
  let actor = ae.parent;
  if( actor ) {
    if (holyShield) {
      const ids = actor.items.filter(i => i.getFlag(game.system.id, "blessedshield")).map(i => i.id);
      if (ids.length > 0) {
        actor.deleteEmbeddedDocuments("Item", ids);
      }
    }
  }
})

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: 'symbaroum', name: 'Symbaroum' }, 'preferred');
  dice3d.addColorset(
    {
      name: 'Symbaroum',
      description: 'Symbaroum',
      category: 'Symbaroum',
      foreground: '#e9e7c5',
      background: '#d6b076',
      outline: '#3b3832',
      texture: 'stars',
      edge: '#211f19',
    },
    'preferred'
  );
});

Hooks.on('combatStart', async (combat, ...args) => {
  // let isFirstRound = combat.active && combat.current.round == 1 && combat.current.turn == 0 && combat.previous.turn == null;
  if(game.user.isGM &&  game.settings.get('symbaroum', 'autoRollInitiative') )
  {
    await combat.rollAll();
  }
})

Hooks.on('preCreateChatMessage', (doc, message, options, userid) => {
  if (message.flags !== undefined) {
    if (foundry.utils.getProperty(message.flags, 'core.initiativeRoll') && game.settings.get('symbaroum', 'hideIniativeRolls')) {
      return false;
    }
  }
});

/*Hook for the chatMessage that contain a button for the GM to apply status icons or damage to a token.*/
Hooks.on('renderChatMessage', async (chatItem, html, data) => {
  const flagDataArray = await chatItem.getFlag(game.system.id, 'applyEffects');
  
  if (flagDataArray && game.user.isGM) {
    html.find('#applyEffect').click(async () => {
      console.log("Applying effects");
      for (let flagData of flagDataArray) {
        if (!flagData.tokenId && !flagData.actorId) {
          continue;
        }
        let token = flagData.tokenId ? canvas.tokens.objects.children.find((token) => token.id === flagData.tokenId) : null;
        let actor = token?.actor ?? game.actors.get(flagData.actorId);
        if(!actor) {
          continue;          
        }
        if (flagData.addEffect) {
          await actor.addCondition(flagData.addEffect);
        }
        else if (flagData.removeEffect) {
          await actor.removeCondition(flagData.removeEffect);
        }
        if (flagData.defeated && ui.combat.viewed && token) {
          let effect = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id == 'dead'));
          await token.toggleEffect(effect, { overlay: true, active: true });          
        }

        if (flagData.toughnessChange) {
          let newToughness = Math.max(0, Math.min(actor.system.health.toughness.max, actor.system.health.toughness.value + flagData.toughnessChange));
          await actor.update({ 'system.health.toughness.value': newToughness });
        } 
        if (flagData.attributeChange) {
          let newMod = actor.system.attributes[flagData.attributeName].temporaryMod + flagData.attributeChange;
          let linkMod = 'system.attributes.' + flagData.attributeName + '.temporaryMod';
          await actor.update({ [linkMod]: newMod });
        }
        if (flagData.corruptionChange) {
          let newCorruption = actor.system.health.corruption.temporary + flagData.corruptionChange;
          await actor.update({ 'system.health.corruption.temporary': newCorruption });
        }
        if (flagData.addObject == 'blessedshield') {
            await createBlessedShield(actor, flagData.protection);
        }
      }
      await chatItem.unsetFlag(game.system.id, 'applyEffects');
      await chatItem.delete();
      return;
    });
  }
  const functionStuff = await chatItem.getFlag(game.system.id, 'resistRoll');
  if (functionStuff) {
    html.find('#applyEffect').click(async () => {
      let tok = canvas.tokens.objects.children.find((token) => token.id === functionStuff.tokenId);
      let targetToken = canvas.tokens.objects.children.find((token) => token.id === functionStuff.targetData.tokenId);
      if (tok === undefined || targetToken === undefined) {
        ui.notifications.error("Can't find token.");
        return;
      }
      functionStuff.token = tok;
      functionStuff.actor = tok.actor;
      functionStuff.targetData.token = targetToken;
      functionStuff.targetData.actor = targetToken.actor;
      // game.symbaroum.log("from hook: ", functionStuff);
      buildRolls(functionStuff);
      await chatItem.unsetFlag(game.system.id, 'resistRoll');
      return;
    });
  }
});

Hooks.on("renderPause", (_app, html, options) => {
  html.find('img[src="icons/svg/clockwork.svg"]').attr("src", "systems/symbaroum/asset/image/head.webp");
});



function setup3PartySettings() {
  game.symbaroum.info("In setup3PartySettings");
  if (!game.user.isGM) {
    // Only make changes to system and 3rd party if it is a GM
    return;
  }
  if (game.settings.settings.has('dice-so-nice.enabledSimultaneousRollForMessage')) {
    game.settings.set('dice-so-nice', 'enabledSimultaneousRollForMessage', false);
  }
}
// This sets the css DOM objects we will change with the registered settings
async function setupConfigOptions() {
  let r = document.querySelector(':root');
  await r.style.setProperty('--color-charBG', game.settings.get('symbaroum', 'switchCharBGColour'));
  await r.style.setProperty('--color-npcBG', game.settings.get('symbaroum', 'switchNpcBGColour'));
  await r.style.setProperty('--title-image', game.settings.get('symbaroum', 'titleBGChoice'));
  await r.style.setProperty('--title-color', game.settings.get('symbaroum', 'switchTitleColour'));
  await r.style.setProperty('--box-editable', game.settings.get('symbaroum', 'switchEditableColour'));  
  await r.style.setProperty('--box-non-editable', game.settings.get('symbaroum', 'switchNoNEditableColour'));
  await r.style.setProperty('--chat-background', game.settings.get('symbaroum', 'chatBGChoice'));
}

// this add new status effect to the foundry list
async function setupStatusEffects() {
  CONFIG.statusEffects.push( ...game.symbaroum.config.systemConditionEffects);  
}

async function createBlessedShield(actor, protection = '1d4') {
  let blessedShield = {};
  blessedShield.system = foundry.utils.deepClone(game.model.Item.armor);

  blessedShield.name = game.i18n.localize('POWER_LABEL.BLESSED_SHIELD');
  blessedShield.type = "armor";
  blessedShield.img = 'icons/svg/holy-shield.svg',
  blessedShield.system.baseProtection = '0',
  blessedShield.system.bonusProtection = protection,
  blessedShield.system.state = "active";
  blessedShield.flags = {}
  blessedShield.flags[game.system.id] = {"blessedshield": true};
  await Item.create(blessedShield, { parent: actor }, { renderSheet: false });
}

async function showReleaseNotes(originalVersion) {
  if (!game.user.isGM) {
    return;
  }
  try {
    const newVer = game.system.version;
    const releaseNoteName = 'Symbaroum System guide EN';
    const releasePackLabel = 'Symbaroum for FVTT system user guides';

    let currentVer = '0';
    let oldReleaseNotes = game.journal.getName(releaseNoteName);
    if (oldReleaseNotes !== undefined && oldReleaseNotes !== null && oldReleaseNotes.getFlag('symbaroum', 'ver') !== undefined) {
      currentVer = oldReleaseNotes.getFlag('symbaroum', 'ver');
    }
    if (newVer === currentVer) {
      // Up to date
      return;
    }

    let newReleasePack = game.packs.find((p) => p.metadata.label === releasePackLabel);
    if (newReleasePack === null || newReleasePack === undefined) {
      let err = 'No pack found for the system guide in this release';
      game.symbaroum.error(err);
      ui.notifications.error(err);
      // This is bad - the symbaroum pack does not exist in the system packages
      return;
    }
    await newReleasePack.getIndex();

    let newReleaseNotes = newReleasePack.index.find((j) => j.name === releaseNoteName);
    // game.symbaroum.log("Found new release notes in the compendium pack");
    if (newReleaseNotes === undefined || newReleaseNotes === null) {
      let err = 'No system guide found in this release';
      game.symbaroum.error(err);
      ui.notifications.error(err);
      return;
    }

    // Don't delete until we have new release Pack
    if (oldReleaseNotes !== null && oldReleaseNotes !== undefined) {
      await oldReleaseNotes.delete();
    }

    await game.journal.importFromCompendium(newReleasePack, newReleaseNotes._id,{}, { keepId: true });
    let newReleaseJournal = game.journal.getName(newReleaseNotes.name);

    await newReleaseJournal.setFlag('symbaroum', 'ver', newVer);

    // Show journal
    return newReleaseJournal.sheet.render(true, { sheetMode: 'text' });
    if(originalVersion === '0') {
      // TODO - move to hbs templat or other means for translating
      const message = `<h1>Welcome to your new Symbaroum world</h1>
      If you are new to the system, recommend that you check out the @UUID[JournalEntry.sSZzEbMgSLEclyBL]{system guide} in the journals.
      <br/>We also have a set of tours to help you get started, for @Tour[settings-tour]{settings} and @Tour[acompendium-tour]{compendiums}. `;
      ChatMessage.create({
        speaker: ChatMessage.getSpeaker({alias: "Symbaroum"}),
        content: message
      }); 
    }
  
  } catch (error) {
    game.symbaroum.error(error);
  } // end of try
} // end of function

async function setupEmit() {
  game.symbaroum.info('Setting up Symbaroum emit system');
  SymbaroumCommsListener.ready();
}

Hooks.once("i18nInit", function () {
  // Prlocalization of system objects
  preLocalizeConfig();
});

function preLocalizeConfig() {
  const localizeConfigObject = (obj, keys) => {
    for (let o of Object.values(obj)) {
      for (let k of keys) {
        o[k] = game.i18n.localize(o[k]);
        console.log(o[k])
      }
    }
  };
  localizeConfigObject(game.symbaroum.config.ACTION_TYPES, ["label"]);
  localizeConfigObject(game.symbaroum.config.ARMOR_PROTECTION_SELECTION, ["label"]);
  localizeConfigObject(game.symbaroum.config.ATTRIBUTE_SELECTION, ["label"]);
  localizeConfigObject(game.symbaroum.config.WEAPON_TYPE_SELECTION, ["label"]);

}

