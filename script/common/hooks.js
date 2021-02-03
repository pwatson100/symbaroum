import { SymbaroumActor } from './actor.js';
import { SymbaroumItem } from './item.js';
import { PlayerSheet } from '../sheet/player.js';
import { PlayerSheet2 } from '../sheet/player2.js';
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
import { initializeHandlebars } from './handlebars.js';
import { migrateWorld } from './migration.js';

Hooks.once('init', () => {
  CONFIG.Actor.entityClass = SymbaroumActor;
  CONFIG.Item.entityClass = SymbaroumItem;
  Actors.unregisterSheet('core', ActorSheet);
  Actors.registerSheet('symbaroum', PlayerSheet2, { types: ['player'], makeDefault: true });
  Actors.registerSheet('symbaroum', PlayerSheet, { types: ['player'], makeDefault: false });
  Actors.registerSheet('symbaroum', MonsterSheet, { types: ['monster'], makeDefault: true });
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
  game.settings.register('symbaroum', 'worldSchemaVersion', {
    name: 'World Version',
    hint: 'Used to automatically upgrade worlds data when the system is upgraded.',
    scope: 'world',
    config: true,
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
  
  
 
});

Hooks.once('ready', () => {
  migrateWorld();
});

Hooks.on('preCreateActor', (createData) => {
  mergeObject(createData, {
    'token.bar1': { attribute: 'health.toughness' },
    'token.bar2': { attribute: 'combat.defense' },
    'token.displayName': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'token.displayBars': CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER,
    'token.disposition': CONST.TOKEN_DISPOSITIONS.NEUTRAL,
    'token.name': createData.name,
  });
  if (!createData.img) {
    createData.img = 'systems/symbaroum/asset/image/unknown-actor.png';
  }
  if (createData.type === 'player') {
    createData.token.vision = true;
    createData.token.actorLink = true;
  }
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
  if(flagDataArray){
    await html.find("#applyEffect").click(async () => {
      for(let flagData of flagDataArray){

        if(flagData.tokenId){
          let token = canvas.tokens.objects.children.find(token => token.data._id === flagData.tokenId);
          let statusCounterMod = false;
          if(game.modules.get("statuscounter")?.active){
            statusCounterMod = true;
          }
          if(flagData.addEffect){
            if(token == undefined){return}
            let duration = 1;
            if(flagData.effectDuration){duration = flagData.effectDuration}
            if(statusCounterMod){
              let alreadyHereEffect = await EffectCounter.findCounter(token, flagData.addEffect);
              if(alreadyHereEffect == undefined){
                let statusEffect = new EffectCounter(duration, flagData.addEffect, token, false);
                await statusEffect.update();
              }
            }
            else {token.toggleEffect(flagData.addEffect)}
          }
          
          if(flagData.removeEffect){
            if(statusCounterMod){
              let statusEffectCounter = await EffectCounter.findCounter(token, flagData.removeEffect);
              if(statusEffectCounter != undefined){
                  await statusEffectCounter.remove();
              }
            }
            else {token.toggleEffect(flagData.removeEffect)}
          }

          if(flagData.modifyEffectDuration){
            if(statusCounterMod){
              let statusEffectCounter = await EffectCounter.findCounter(token, flagData.modifyEffectDuration);
              if(statusEffectCounter != undefined){
                await statusEffectCounter.setValue(effectDuration);
                await statusEffectCounter.update();
              }
            }
          }

          if(flagData.toughnessChange){
            let newToughness = Math.max(0, Math.min(token.actor.data.data.health.toughness.max, token.actor.data.data.health.toughness.value + flagData.toughnessChange))
            await token.actor.update({"data.health.toughness.value" : newToughness}); 
          }

          if(flagData.corruptionChange){
            let newCorruption = token.actor.data.data.health.corruption.temporary + flagData.corruptionChange;
            await token.actor.update({"data.health.corruption.temporary" : newCorruption}); 
          }
        }
      }
      await chatItem.unsetFlag(game.system.id, 'abilityRoll');
      return;
    })
  }
})