import { SymbaroumActor } from './actor.js';
import { SymbaroumItem, buildRolls, getEffect } from './item.js';
import { PlayerSheet } from '../sheet/player.js';
import { PlayerSheet2 } from '../sheet/player2.js';
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
import { initializeHandlebars } from './handlebars.js';
import { migrateWorld } from './migration.js';
import { sendDevMessage } from './devmsg.js';
import { SYMBAROUM } from './config.js';
import { MonsterSheet } from '../sheet/monster.js';
import { SymbaroumConfig } from './symbaroumConfig.js';
import { SymbaroumCommsListener } from './symbcomms.js';
import { SymbaroumMacros } from './macro.js';

Hooks.once('init', () => {


  const debouncedReload = foundry.utils.debounce(() => window.location.reload(), 250);

  CONFIG.Actor.documentClass = SymbaroumActor;
  CONFIG.Item.documentClass = SymbaroumItem;
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('symbaroum', PlayerSheet2, { types: ['player'], makeDefault: true });
  Actors.registerSheet('symbaroum', PlayerSheet, { types: ['player'], makeDefault: false });
  Actors.registerSheet('symbaroum', MonsterSheet, { types: ['monster'], makeDefault: true });
  Actors.registerSheet('symbaroum', PlayerSheet2, { types: ['monster'], makeDefault: false });
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
  initializeHandlebars();

  game.symbaroum = {
    config: SYMBAROUM,
    SymbaroumConfig,
    debug: (...args) => { console.debug('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    error: (...args) => { console.error('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    info: (...args) => { console.info('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) },
    log: (...args) => { console.log('%cSymbaroum |', game.symbaroum.config.CONSOLESTYLE, ...args) }
  };

  game.settings.register('symbaroum', 'worldTemplateVersion', {
    // worldTemplateVersion is deprecated - not to use anymore
    name: 'World Template Version',
    hint: 'Used to automatically upgrade worlds data when the template is upgraded.',
    scope: 'world',
    config: true,
    default: 0,
    type: Number,
  });

  game.settings.register('symbaroum', 'systemMigrationVersion', {
    name: 'World System Version',
    hint: 'Used to automatically upgrade worlds data when needed.',
    scope: 'world',
    config: true,
    default: '0',
    type: String,
  });

  game.settings.register('symbaroum', 'symbaroumDevMessageVersionNumber', {
    name: 'Message from the devs',
    hint: 'Used to track last message id from the Symbaroum devs',
    scope: 'world',
    config: false,
    default: 0,
    type: Number,
  });

  game.settings.register('symbaroum', 'combatAutomation', {
    name: 'SYMBAROUM.OPTIONAL_AUTOCOMBAT',
    hint: 'SYMBAROUM.OPTIONAL_AUTOCOMBAT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'playerResistButton', {
    name: 'SYMBAROUM.OPTIONAL_PLAYER_RESIST',
    hint: 'SYMBAROUM.OPTIONAL_PLAYER_RESIST_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  /*TODO
  /*game.settings.register('symbaroum', 'allRollsDsN', {
    name: 'SYMBAROUM.OPTIONAL_ALLROLLSDICESONICE',
    hint: 'SYMBAROUM.OPTIONAL_ALLROLLSDICESONICE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });*/

  game.settings.register('symbaroum', 'alwaysSucceedOnOne', {
    name: 'SYMBAROUM.OPTIONAL_ALWAYSSUCCEDONONE',
    hint: 'SYMBAROUM.OPTIONAL_ALWAYSSUCCEDONONE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'optionalCrit', {
    name: 'SYMBAROUM.OPTIONAL_CRIT',
    hint: 'SYMBAROUM.OPTIONAL_CRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'optionalRareCrit', {
    name: 'SYMBAROUM.OPTIONAL_RARECRIT',
    hint: 'SYMBAROUM.OPTIONAL_RARECRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'critsApplyToAllTests', {
    name: 'SYMBAROUM.OPTIONAL_ALWAYSUSECRIT',
    hint: 'SYMBAROUM.OPTIONAL_ALWAYSUSECRIT_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'optionalMoreRituals', {
    name: 'SYMBAROUM.OPTIONAL_MORERITUALS',
    hint: 'SYMBAROUM.OPTIONAL_MORERITUALS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'saveCombatRoll', {
    name: 'SYMBAROUM.OPTIONAL_SAVECOMBATROLL',
    hint: 'SYMBAROUM.OPTIONAL_SAVECOMBATROLL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });
  game.settings.register('symbaroum', 'saveAttributeRoll', {
    name: 'SYMBAROUM.OPTIONAL_SAVEATTRIBUTEROLL',
    hint: 'SYMBAROUM.OPTIONAL_SAVEATTRIBUTEROLL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });
  game.settings.register('symbaroum', 'showModifiersInDialogue', {
    name: 'SYMBAROUM.OPTIONAL_SHOWMODIFIERSINDIALOGUE',
    hint: 'SYMBAROUM.OPTIONAL_SHOWMODIFIERSINDIALOGUE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });
  game.settings.register('symbaroum', 'showNpcModifiers', {
    name: 'SYMBAROUM.OPTIONAL_NPC_MODIFIERS',
    hint: 'SYMBAROUM.OPTIONAL_NPC_MODIFIERS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });
  game.settings.register('symbaroum', 'showNpcAttacks', {
    name: 'SYMBAROUM.OPTIONAL_NPC_ATTACKS',
    hint: 'SYMBAROUM.OPTIONAL_NPC_ATTACKS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });
  game.settings.register('symbaroum', 'allowShowReference', {
    name: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE',
    hint: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'hideIniativeRolls', {
    name: 'SYMBAROUM.OPTIONAL_INIATITIVEROLLS',
    hint: 'SYMBAROUM.OPTIONAL_INIATITIVEROLLS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'enhancedDeathSaveBonus', {
    name: 'SYMBAROUM.OPTIONAL_ENHANCEDDEATHSAVEBONUS',
    hint: 'SYMBAROUM.OPTIONAL_ENHANCEDDEATHSAVEBONUS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'manualInitValue', {
    name: 'SYMBAROUM.OPTIONAL_INIT_MANUAL',
    hint: 'SYMBAROUM.OPTIONAL_INIT_MANUAL_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
  });

  game.settings.register('symbaroum', 'charBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/green_flower_light.webp) repeat',
  });
  game.settings.register('symbaroum', 'npcBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/purple_flower_light.webp) repeat',
  });
  game.settings.register('symbaroum', 'titleBGChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/title.webp)',
  });
  game.settings.register('symbaroum', 'editableChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/editable.webp)',
  });
  game.settings.register('symbaroum', 'nonEditableChoice', {
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/not-editable.webp)',
  });

  game.settings.register('symbaroum', 'switchCharBGColour', {
    name: 'SYMBAROUM.OPTIONAL_PC_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/green_flower_light.webp) repeat',
  });
  game.settings.register('symbaroum', 'switchNpcBGColour', {
    name: 'SYMBAROUM.OPTIONAL_NPC_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/purple_flower_light.webp) repeat',
  });
  game.settings.register('symbaroum', 'switchTitleColour', {
    name: 'SYMBAROUM.OPTIONAL_TITLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/title.webp)',
  });
  game.settings.register('symbaroum', 'switchEditableColour', {
    name: 'SYMBAROUM.OPTIONAL_EDITABLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/editable.webp)',
  });
  game.settings.register('symbaroum', 'switchNoNEditableColour', {
    name: 'SYMBAROUM.OPTIONAL_EDITABLE_COLOUR_SELECTOR',
    restricted: false,
    type: String,
    config: false,
    scope: 'client',
    default: 'url(../asset/image/background/not-editable.webp)',
  });

  game.settings.registerMenu('symbaroum', 'symbaroumSettings', {
    name: 'SYMBAROUM.OPTIONAL_CONFIG_MENULABEL',
    label: 'SYMBAROUM.OPTIONAL_CONFIG_MENULABEL',
    hint: 'SYMBAROUM.OPTIONAL_CONFIG_MENUHINT',
    icon: 'fas fa-palette',
    type: SymbaroumConfig,
    restricted: false,
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
    },
  });

  game.settings.register('symbaroum', 'showLocalLangPack', {
    name: 'SYMBAROUM.OPTIONAL_SHOWLOCALLANGPACK',
    hint: 'SYMBAROUM.OPTIONAL_SHOWLOCALLANGPACK_HINT',
    scope: 'world',
    type: Boolean,
    default: true,
    config: true,
    onChange: () => debouncedReload(),
  });

  game.settings.register('symbaroum', 'showEnglishPacks', {
    name: 'SYMBAROUM.OPTIONAL_SHOWENGLISHPACKS',
    hint: 'SYMBAROUM.OPTIONAL_SHOWENGLISHPACKS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
    onChange: () => debouncedReload(),
  });
  game.settings.register('symbaroum', 'hideEnglishMacroSystemPack', {
    name: 'SYMBAROUM.OPTIONAL_HIDEENGLISHMACROS',
    hint: 'SYMBAROUM.OPTIONAL_HIDEENGLISHMACROS_HINT',
    scope: 'world',
    type: Boolean,
    default: false,
    config: true,
    onChange: () => debouncedReload(),
  });

  game.symbaroum.macros = new SymbaroumMacros();
  setupStatusEffects();
});

Hooks.once('ready', () => {
  game.symbaroum.macros.macroReady();

  migrateWorld();
  sendDevMessage();
  showReleaseNotes();
  setupConfigOptions();
  setupEmit();
  setup3PartySettings();
});

// create/remove the quick access config button
Hooks.once('renderSettings', () => {
  SymbaroumConfig.toggleConfigButton(JSON.parse(game.settings.get('symbaroum', 'addMenuButton')));
});

Hooks.on('preCreateActor', (doc, createData, options, userid) => {
  let createChanges = {};
  mergeObject(createChanges, {
    'token.bar1': { attribute: 'health.toughness' },
    'token.bar2': { attribute: 'combat.defense' },
    'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'token.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'token.disposition': CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    'token.name': createData.name,
  });

  if (doc.data.img === 'icons/svg/mystery-man.svg') {
    createChanges.img = 'systems/symbaroum/asset/image/unknown-actor.png';
  }

  if (doc.data.type === 'player') {
    createChanges.token.vision = true;
    createChanges.token.actorLink = true;
  }
  doc.data.update(createChanges);
});

// Hooks.on('createOwnedItem', (actor, item) => {});

Hooks.on("renderCompendiumDirectory", (app, html, data) => {
  game.symbaroum.log("In renderCompendiumDirectory - sorting out available compendiums");
  if (game.settings.get("symbaroum", "showLocalLangPack")) {
    const translatedDocs = [];
    const filterEnglish = game.settings.get("symbaroum", "showEnglishPacks");

    let languageCodeRegex = `systemuserguides|${game.i18n.lang}`;
    if (filterEnglish && game.i18n.lang !== "en") {
      languageCodeRegex = `en|${languageCodeRegex}`;
    }
    const avoidEnglishMacroSystem = game.settings.get("symbaroum", "hideEnglishMacroSystemPack") ? null : "(macros|systemitems)";
    // const avoidEnglishMacroSystem = "(macros|systemitems)";
    // Alternatives are:
    // Local Langauge only
    // Local Langauge + English macro/system abilities      
    const langReg = new RegExp(`symbaroum.+(${languageCodeRegex})$`);
    const translatedReg = new RegExp(`symbaroum(.*)${game.i18n.lang}$`);
    const macroReg = new RegExp(`symbaroum${avoidEnglishMacroSystem}en$`);
    let irrelvantCompendiums = game.packs.contents.filter((comp) => {
      if (comp.metadata.package === "symbaroum" && !/systemuserguides$/.test(comp.metadata.name) && !langReg.test(comp.metadata.name)) {
        if (avoidEnglishMacroSystem !== null && macroReg.test(comp.metadata.name)) {
          return false;
        }
        return true;
      }
      // store any translated docs here
      let part = comp.metadata.name.match(translatedReg);
      if (part !== null) {
        translatedDocs.push(comp.metadata.name.match(translatedReg)[1]);
      }
      return false;
    });
    const enReg = new RegExp(`symbaroum(.*)en$`);
    for (const comp of irrelvantCompendiums) {
      // check if the english doc is not one of the translated ones, continue
      let part = comp.metadata.name.match(enReg);
      if (part !== null) {
        if (!translatedDocs.includes(part[1])) {
          continue;
        }
      }
      let compositeKey = `${comp.metadata.system}.${comp.metadata.name}`;
      game.packs.delete(compositeKey);
      html.find(`li[data-pack="${compositeKey}"]`).hide();
    }
  }
});

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

Hooks.on('preCreateChatMessage', (doc, message, options, userid) => {
  if (message.flags !== undefined) {
    if (getProperty(message.flags, 'core.initiativeRoll') && game.settings.get('symbaroum', 'hideIniativeRolls')) {
      return false;
    }
  }
});

/*Hook for the chatMessage that contain a button for the GM to apply status icons or damage to a token.*/
Hooks.on('renderChatMessage', async (chatItem, html, data) => {
  const flagDataArray = await chatItem.getFlag(game.system.id, 'applyEffects');
  if (flagDataArray && game.user.isGM) {
    await html.find('#applyEffect').click(async () => {
      for (let flagData of flagDataArray) {
        if (flagData.tokenId || flagData.actorId) {
          let token = flagData.tokenId ? canvas.tokens.objects.children.find((token) => token.id === flagData.tokenId) : null;
          if (token !== undefined) {
            if (flagData.addEffect) {
              modifyEffectOnToken(token, flagData.addEffect, 1, flagData);
            }
            if (flagData.removeEffect) {
              modifyEffectOnToken(token, flagData.removeEffect, 0, flagData);
            }
            if (flagData.modifyEffectDuration) {
              modifyEffectOnToken(token, flagData.modifyEffectDuration, 2, flagData);
            }
            if (flagData.defeated && ui.combat.viewed) {
              let c = ui.combat.viewed.getCombatantByToken(flagData.tokenId);
              ui.combat._onToggleDefeatedStatus(c);
            }
          }
          let actor = token?.actor ?? game.actors.get(flagData.actorId);
          if (actor !== undefined) {
            if (flagData.toughnessChange) {
              let newToughness = Math.max(0, Math.min(actor.data.data.health.toughness.max, actor.data.data.health.toughness.value + flagData.toughnessChange));
              await actor.update({ 'data.health.toughness.value': newToughness });
            }
            if (flagData.attributeChange) {
              let newMod = actor.data.data.attributes[flagData.attributeName].temporaryMod + flagData.attributeChange;
              let linkMod = 'data.attributes.' + flagData.attributeName + '.temporaryMod';
              await actor.update({ [linkMod]: newMod });
            }
            if (flagData.corruptionChange) {
              let newCorruption = actor.data.data.health.corruption.temporary + flagData.corruptionChange;
              await actor.update({ 'data.health.corruption.temporary': newCorruption });
            }
            if (flagData.addObject) {
              if (flagData.addObject == 'blessedshield') {
                await createBlessedShield(actor, flagData.protection);
              }
            }
          }
        }
      }
      await chatItem.unsetFlag(game.system.id, 'applyEffects');
      return;
    });
  }
  const functionStuff = await chatItem.getFlag(game.system.id, 'resistRoll');
  if (functionStuff) {
    await html.find('#applyEffect').click(async () => {
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

  if (game.modules.get("dice-so-nice")?.active && foundry.utils.isNewerVersion("4.2.2", game.modules.get("dice-so-nice").data.version)) {
    // If dice so nice is older than 4.2.2 - lets notify
    ui.notifications.warn("Dice So Nice needs to be at minimum 4.2.2 to work with Symbaroum", { permanent: true });
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
}

// this add new status effect to the foundry list
async function setupStatusEffects() {
  CONFIG.statusEffects.push(
    {
      id: "bendwill",
      label: "POWER_LABEL.BEND_WILL",
      icon: "systems/symbaroum/asset/image/puppet.png"
    },
    {
      id: "berserker",
      label: "ABILITY_LABEL.BERSERKER",
      icon: "systems/symbaroum/asset/image/berserker.svg"
    },
    {
      id: "confusion",
      label: "POWER_LABEL.CONFUSION",
      icon: "systems/symbaroum/asset/image/unknown-item.png"
    },
    {
      id: "dancingweapon",
      label: "POWER_LABEL.DANCING_WEAPON",
      icon: "systems/symbaroum/asset/image/powers/dancingweapon.svg"
    },
    {
      id: "entanglingvines",
      label: "POWER_LABEL.ENTANGLING_VINES",
      icon: "systems/symbaroum/asset/image/vines.png"
    },
    {
      id: "holyaura",
      label: "POWER_LABEL.HOLY_AURA",
      icon: "icons/svg/aura.svg"
    },
    {
      id: "larvaeboils",
      label: "POWER_LABEL.LARVAE_BOILS",
      icon: "systems/symbaroum/asset/image/bug.png"
    },
    {
      id: "maltransformation",
      label: "POWER_LABEL.MALTRANSFORMATION",
      icon: "systems/symbaroum/asset/image/frog.png"
    },
    {
      id: "strangler",
      label: "ABILITY_LABEL.STRANGLER",
      icon: "systems/symbaroum/asset/image/lasso.png"
    },
    {
      id: "tormentingspirits",
      label: "POWER_LABEL.TORMENTING_SPIRITS",
      icon: "systems/symbaroum/asset/image/ghost.svg"
    },
    {
      id: "unnoticeable",
      label: "POWER_LABEL.UNNOTICEABLE",
      icon: "systems/symbaroum/asset/image/invisible.png"
    });
}

async function createBlessedShield(actor, protection = '1d4') {
  let data = {
    name: game.i18n.localize('POWER_LABEL.BLESSED_SHIELD'),
    img: 'icons/svg/holy-shield.svg',
    type: 'armor',
    data: {
      state: 'active',
      baseProtection: '0',
      bonusProtection: protection,
    },
  };
  //actor.createEmbeddedEntity('OwnedItem', data, { renderSheet: false });
  await Item.create(data, { parent: actor }, { renderSheet: false });
}

async function showReleaseNotes() {
  if (game.user.isGM) {
    try {
      const newVer = game.system.data.version;
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

      await game.journal.importFromCompendium(newReleasePack, newReleaseNotes._id);
      let newReleaseJournal = game.journal.getName(newReleaseNotes.name);

      await newReleaseJournal.setFlag('symbaroum', 'ver', newVer);

      // Show journal
      await newReleaseJournal.sheet.render(true, { sheetMode: 'text' });
    } catch (error) {
      game.symbaroum.error(error);
    } // end of try
  } // end of if(isgm)
} // end of function

async function setupEmit() {
  game.symbaroum.info('Setting up Symbaroum emit system');
  SymbaroumCommsListener.ready();
}

Hooks.on('createToken', async (token, options, userID) => {
  let flagBerserk = token.actor.getFlag(game.system.id, 'berserker');
  if (flagBerserk) {
    modifyEffectOnToken(token._object, CONFIG.statusEffects.find(e => e.id === "berserker"), 1, 1);
  }
  let flagDancingWeapon = token.actor.getFlag(game.system.id, 'dancingweapon');
  if (flagDancingWeapon) {
    modifyEffectOnToken(token._object, CONFIG.statusEffects.find(e => e.id === "dancingweapon"), 1, 1);
  }
});

/**
 * action = 0 : remove effect
 * action = 1 : add effect
 * action = 2 : modify effect duration 
 */
export async function modifyEffectOnToken(token, effect, action, options) {
  let statusCounterMod = false;
  if (game.modules.get('statuscounter')?.active) {
    //statusCounterMod = true; //  until problem is fixed
  }
  let duration = options.effectDuration ?? 1;
  if (action == 1) {
    //add effect
    if (!getEffect(token, effect)) {
      if (statusCounterMod) {
        let alreadyHereEffect = await EffectCounter.findCounter(token.document, effect.icon);
        if (alreadyHereEffect === undefined) {
          if (options?.effectStuff) {
            let statusEffect = new EffectCounter(options.effectStuff, effect.icon, token, false);
            await statusEffect.update();
          } else if (options.overlay) {
            token.toggleEffect(effect, { overlay: options.overlay });
          } else {
            let statusEffect = new EffectCounter(duration, effect.icon, token, false);
            await statusEffect.update();
          }
        }
      } else {
        await token.toggleEffect(effect, { overlay: options.overlay });
      }
    }
  } else if (action == 0) {
    //remove effect
    if (getEffect(token, effect)) {
      if (statusCounterMod) {
        let statusEffectCounter = await EffectCounter.findCounter(token, effect).getDisplayValue();
        if (statusEffectCounter != undefined) {
          await statusEffectCounter.remove();
        }
      } else {
        token.toggleEffect(effect, { overlay: options.overlay });
      }
    }
  } else {
    //modify duration - only with Status counter mod
    if (statusCounterMod) {
      let statusEffectCounter = await EffectCounter.findCounter(token, effect).getDisplayValue();
      if (statusEffectCounter != undefined) {
        await statusEffectCounter.setValue(duration);
        await statusEffectCounter.update();
      }
    }
  }
};
