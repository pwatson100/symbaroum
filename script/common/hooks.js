import { SymbaroumActor } from './actor.js';
import { SymbaroumItem } from './item.js';
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

Hooks.once('init', () => {
  CONFIG.Actor.documentClass = SymbaroumActor;
  CONFIG.Item.documentClass = SymbaroumItem;
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('symbaroum', PlayerSheet2, { types: ['player'], makeDefault: true });
  Actors.registerSheet('symbaroum', PlayerSheet, { types: ['player'], makeDefault: false });
  Actors.registerSheet('symbaroum', PlayerSheet2, { types: ['monster'], makeDefault: true });
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
  game.settings.register('symbaroum', 'worldTemplateVersion', {
    name: 'World Template Version',
    hint: 'Used to automatically upgrade worlds data when the template is upgraded.',
    scope: 'world',
    config: true,
    default: 0,
    type: Number,
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
  game.settings.register('symbaroum', 'allowShowReference', {
    name: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE',
    hint: 'SYMBAROUM.OPTIONAL_SHOWREFERENCE_HINT',
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
});

Hooks.once('ready', () => {
  migrateWorld();
  sendDevMessage();
  showReleaseNotes();
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

Hooks.on('createOwnedItem', (actor, item) => {});

Hooks.once('diceSoNiceReady', (dice3d) => {
  dice3d.addSystem({ id: 'symbaroum', name: 'Symbaroum' }, true);
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
    'default'
  );
});

/*Hook for the chatMessage that contain a button for the GM to apply status icons or damage to a token.*/
Hooks.on('renderChatMessage', async (chatItem, html, data) => {
  const flagDataArray = await chatItem.getFlag(game.system.id, 'abilityRoll');
  if (flagDataArray) {
    await html.find('#applyEffect').click(async () => {
      for (let flagData of flagDataArray) {
        if (flagData.tokenId) {
          let token = canvas.tokens.objects.children.find((token) => token.id === flagData.tokenId);
          let statusCounterMod = false;
          if (game.modules.get('statuscounter')?.active) {
            statusCounterMod = true;
          }
          if (flagData.addEffect) {
            if (token == undefined) {
              return;
            }
            let duration = 1;
            if (flagData.effectDuration) {
              duration = flagData.effectDuration;
            }
            modifyEffectOnToken(token, flagData.addEffect, 1, duration, flagData.effectStuff);
          }
          if (flagData.removeEffect) {
            modifyEffectOnToken(token, flagData.removeEffect, 0, 0);
          }
          if (flagData.modifyEffectDuration) {
            modifyEffectOnToken(token, flagData.modifyEffectDuration, 2, flagData.effectDuration);
          }

          if (flagData.toughnessChange) {
            let newToughness = Math.max(0, Math.min(token.actor.data.data.health.toughness.max, token.actor.data.data.health.toughness.value + flagData.toughnessChange));
            await token.actor.update({ 'data.health.toughness.value': newToughness });
          }
          if (flagData.attributeChange) {
            let newMod = token.actor.data.data.attributes[flagData.attributeName].temporaryMod + flagData.attributeChange;
            let linkMod = 'data.attributes.' + flagData.attributeName + '.temporaryMod';
            await token.actor.update({ [linkMod]: newMod });
          }
          if (flagData.corruptionChange) {
            let newCorruption = token.actor.data.data.health.corruption.temporary + flagData.corruptionChange;
            await token.actor.update({ 'data.health.corruption.temporary': newCorruption });
          }
          if (flagData.addObject) {
            let actor = token.actor;
            if (flagData.addObject == 'blessedshield') {
              await createBlessedShield(actor, flagData.protection);
            }
          }
        }
      }
      await chatItem.unsetFlag(game.system.id, 'abilityRoll');
      return;
    });
  }
});

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
      const newVer = '1';
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
        console.log('No pack found');
        // This is bad - the symbaroum pack does not exist in the system packages
        return;
      }
      await newReleasePack.getIndex();

      let newReleaseNotes = newReleasePack.index.find((j) => j.name === releaseNoteName);
      // console.log("Found new release notes in the compendium pack");

      // Don't delete until we have new release Pack
      if (newReleaseNotes !== undefined && newReleaseNotes !== null && oldReleaseNotes !== null && oldReleaseNotes !== undefined) {
        await oldReleaseNotes.delete();
      }

      await game.journal.importFromCompendium(newReleasePack, newReleaseNotes._id);
      let newReleaseJournal = game.journal.getName(newReleaseNotes.name);

      await newReleaseJournal.setFlag('symbaroum', 'ver', newVer);

      // Before we show final - tidy up release prior to this
      tidyReleaseNotes11();

      // Show journal
      await newReleaseJournal.sheet.render(true, { sheetMode: 'text' });
    } catch (error) {
      console.log(error);
    } // end of try
  } // end of if(isgm)
} // end of function

async function tidyReleaseNotes11() {
  const releaseNoteName = 'Symbaroum System guide EN (1.1)';
  let old11ReleaseNotes = game.journal.getName(releaseNoteName);
  // Delete Delete Delete
  if (old11ReleaseNotes !== undefined && old11ReleaseNotes !== null) {
    await old11ReleaseNotes.delete();
  }
}

Hooks.on('createToken', async (token, options, userID) => {
  let flagBerserk = token.actor.getFlag(game.system.id, 'berserker');
  if(flagBerserk){
    modifyEffectOnToken(token._object,"systems/symbaroum/asset/image/berserker.svg", 1, 1);
  }
})

/* action = 0 : remove effect
   action = 1 : add effect
   action = 2 : modify effect duration */
export async function modifyEffectOnToken(token, effect, action, duration, effectStuff){
  let statusCounterMod = false;
  if (game.modules.get('statuscounter')?.active) {
    statusCounterMod = true;
  }
  if (action == 1) { //add effect
    if (statusCounterMod) {
      let alreadyHereEffect = await EffectCounter.findCounter(token, effect);
      if (alreadyHereEffect == undefined) {
        if (effectStuff) {
          let statusEffect = new EffectCounter(effectStuff, effect, token, false);
          await statusEffect.update();
        } else {
          let statusEffect = new EffectCounter(duration, effect, token, false);
          await statusEffect.update();
        }
      }
    } else {
      token.toggleEffect(effect);
    }
  }
  else if (action == 0){ //remove effect
    if (statusCounterMod) {
      let statusEffectCounter = await EffectCounter.findCounter(token, effect);
      if (statusEffectCounter != undefined) {
        await statusEffectCounter.remove();
      }
    } else {
      token.toggleEffect(effect);
    }
  }
  else { //modify duration - only with Status counter mod
    if (statusCounterMod) {
      let statusEffectCounter = await EffectCounter.findCounter(token, effect);
      if (statusEffectCounter != undefined) {
        await statusEffectCounter.setValue(duration);
        await statusEffectCounter.update();
      }
    }
  }
}