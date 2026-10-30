// Keep Foundry V13 and V14 API differences in one place.
// System rules and sheet implementations should not depend on the core generation.
export function isFoundryV14() {
  return (game.release?.generation ?? Number(String(game.version).split('.')[0])) >= 14;
}

// Foundry V13 interpolates with format(); V14 accepts parameters in localize().
export function localize(key, data) {
  if (data === undefined) return game.i18n.localize(key);
  return isFoundryV14() ? game.i18n.localize(key, data) : game.i18n.format(key, data);
}

// Conditions are an array in V13 and an id-keyed collection in V14.
export function getStatusEffect(id) {
  return isFoundryV14()
    ? CONFIG.statusEffects[id]
    : CONFIG.statusEffects.find(effect => effect.id === id);
}

export function registerStatusEffect(effect) {
  const entry = { ...effect, img: effect.img ?? effect.icon };
  if (isFoundryV14()) CONFIG.statusEffects[entry.id] = entry;
  else {
    const index = CONFIG.statusEffects.findIndex(existing => existing.id === entry.id);
    if (index >= 0) CONFIG.statusEffects[index] = { ...entry, icon: entry.icon ?? entry.img };
    else CONFIG.statusEffects.push({ ...entry, icon: entry.icon ?? entry.img });
  }
}

// Use V14 mode names internally, translating only at the V13 chat API boundary.
const toLegacyMode = { public: 'publicroll', gm: 'gmroll', blind: 'blindroll', self: 'selfroll' };
const fromLegacyMode = { publicroll: 'public', gmroll: 'gm', blindroll: 'blind', selfroll: 'self' };

export function getChatModeData() {
  const mode = isFoundryV14()
    ? game.settings.get('core', 'messageMode')
    : game.settings.get('core', 'rollMode');
  return { messageMode: fromLegacyMode[mode] ?? mode };
}

export function applyChatMode(data) {
  const mode = data.messageMode;
  if (isFoundryV14()) return ChatMessage.applyMode(data, mode);
  delete data.messageMode;
  return ChatMessage.applyRollMode(data, toLegacyMode[mode] ?? mode);
}
