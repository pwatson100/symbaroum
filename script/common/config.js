// Namespace Configuration Values
export const SYMBAROUM = {};

SYMBAROUM.namespace = "symbaroum";

SYMBAROUM.attributes = ["accurate", "cunning", "discreet", "persuasive", "quick", "resolute", "strong", "vigilant"];

SYMBAROUM.attributeLabels = {
  accurate: "ATTRIBUTE.ACCURATE",
  cunning: "ATTRIBUTE.CUNNING",
  discreet: "ATTRIBUTE.DISCREET",
  persuasive: "ATTRIBUTE.PERSUASIVE",
  quick: "ATTRIBUTE.QUICK",
  resolute: "ATTRIBUTE.RESOLUTE",
  strong: "ATTRIBUTE.STRONG",
  vigilant: "ATTRIBUTE.VIGILANT",
};

SYMBAROUM.attributeImages = {
  accurate: "arrow-scope.svg",
  cunning: "think.svg",
  discreet: "hooded-figure.svg",
  persuasive: "discussion.svg",
  quick: "fire-dash.svg",
  resolute: "rear-aura.svg",
  strong: "biceps.svg",
  vigilant: "dead-eye.svg",
};

SYMBAROUM.imageRef = "systems/symbaroum/asset/image/{filename}";

SYMBAROUM.itemSortOrder = ["ability", "trait", "mysticalPower", "ritual", "boon", "burden", "armor", "weapon", "equipment", "artifact"];

SYMBAROUM.itemImages = {
  ability: "ability.png",
  trait: "trait.png",
  mysticalPower: "mysticalPower.png",
  ritual: "ritual.png",
  boon: "trait.png",
  burden: "trait.png",
  armor: "armor.png",
  weapon: "weapon.png",
  equipment: "equipment.png",
  artifact: "artifact.png",
};

// Deprecated item types
SYMBAROUM.itemDeprecated = ["artifact", "base"];

// Ability definitions
SYMBAROUM.abilitiesList = {
  none: "ABILITY_LABEL.DEFAULT",
  acrobatics: "ABILITY_LABEL.ACROBATICS",
  alchemy: "ABILITY_LABEL.ALCHEMY",
  agilecombat: "ABILITY_LABEL.AGILE_COMBAT",
  armoredmystic: "ABILITY_LABEL.ARMORED_MYSTIC",
  arrowjab: "ABILITY_LABEL.ARROW_JAB",
  artifactcrafting: "ABILITY_LABEL.ARTIFACT_CRAFTING",
  axeartist: "ABILITY_LABEL.AXE_ARTIST",
  backstab: "ABILITY_LABEL.BACKSTAB",
  beastlore: "ABILITY_LABEL.BEAST_LORE",
  berserker: "ABILITY_LABEL.BERSERKER",
  blacksmith: "ABILITY_LABEL.BLACKSMITH",
  bloodcombat: "ABILITY_LABEL.BLOOD_COMBAT",
  bodyguard: "ABILITY_LABEL.BODYGUARD",
  channeling: "ABILITY_LABEL.CHANNELING",
  cheapshot: "ABILITY_LABEL.CHEAP_SHOT",
  dominate: "ABILITY_LABEL.DOMINATE",
  ensnare: "ABILITY_LABEL.ENSNARE",
  equestrian: "ABILITY_LABEL.EQUESTRIAN",
  exceptionalattribute: "ABILITY_LABEL.EX_ATTRIBUTE",
  featofstrength: "ABILITY_LABEL.FEAT_STRENGTH",
  feint: "ABILITY_LABEL.FEINT",
  flailer: "ABILITY_LABEL.FLAILER",
  hammerrhythm: "ABILITY_LABEL.HAMMER_RHYTHM",
  huntersinstinct: "ABILITY_LABEL.HUNTER_INSTINCT",
  ironfist: "ABILITY_LABEL.IRON_FIST",
  knifeplay: "ABILITY_LABEL.KNIFE_PLAY",
  leader: "ABILITY_LABEL.LEADER",
  loremaster: "ABILITY_LABEL.LOREMASTER",
  manatarms: "ABILITY_LABEL.MAN-AT-ARMS",
  mantledance: "ABILITY_LABEL.MANTLE_DANCE",
  marksman: "ABILITY_LABEL.MARKSMAN",
  medicus: "ABILITY_LABEL.MEDICUS",
  naturalwarrior: "ABILITY_LABEL.NATURAL_WARRIOR",
  opportunist: "ABILITY_LABEL.OPPORTUNIST",
  poisoner: "ABILITY_LABEL.POISONER",
  polearmmastery: "ABILITY_LABEL.POLEARM_MASTERY",
  pyrotechnics: "ABILITY_LABEL.PYROTECHNICS",
  quickdraw: "ABILITY_LABEL.QUICK_DRAW",
  rapidfire: "ABILITY_LABEL.RAPID_FIRE",
  rapidreflexes: "ABILITY_LABEL.RAPID_REFLEXES",
  recovery: "ABILITY_LABEL.RECOVERY",
  ritualist: "ABILITY_LABEL.RITUALIST",
  runetattoo: "ABILITY_LABEL.RUNE_TATTOO",
  shieldfighter: "ABILITY_LABEL.SHIELD_FIGHTER",
  siegeexpert: "ABILITY_LABEL.SIEGE_EXPERT",
  sixthsense: "ABILITY_LABEL.SIXTH_SENSE",
  sorcery: "ABILITY_LABEL.SORCERY",
  stafffighting: "ABILITY_LABEL.STAFF_FIGHTING",
  staffmagic: "ABILITY_LABEL.STAFF_MAGIC",
  steadfast: "ABILITY_LABEL.STEADFAST",
  steelthrow: "ABILITY_LABEL.STEEL_THROW",
  strangler: "ABILITY_LABEL.STRANGLER",
  stronggift: "ABILITY_LABEL.STRONG_GIFT",
  swordsaint: "ABILITY_LABEL.SWORD_SAINT",
  symbolism: "ABILITY_LABEL.SYMBOLISM",
  tactician: "ABILITY_LABEL.TACTICIAN",
  theurgy: "ABILITY_LABEL.THEURGY",
  trapper: "ABILITY_LABEL.TRAPPER",
  trickarchery: "ABILITY_LABEL.TRICK_ARCHERY",
  trollsinging: "ABILITY_LABEL.TROLL_SINGING",
  twinattack: "ABILITY_LABEL.TWIN_ATTACK",
  twohandedforce: "ABILITY_LABEL.2HANDED_FORCE",
  witchcraft: "ABILITY_LABEL.WITCHCRAFT",
  witchsight: "ABILITY_LABEL.WITCHSIGHT",
  wizardry: "ABILITY_LABEL.WIZARDRY",
  whipfighter: "ABILITY_LABEL.WHIPFIGHTER",
  wrestling: "ABILITY_LABEL.WRESTLING",
  twohandedfinesse: "ABILITY_LABEL.2HANDED_FINESSE",
  blessings: "ABILITY_LABEL.BLESSINGS",
};

SYMBAROUM.powersList = {
  none: "ABILITY_LABEL.DEFAULT",
  anathema: "POWER_LABEL.ANATHEMA",
  banishingseal: "POWER_LABEL.BANISHING_SEAL",
  bendwill: "POWER_LABEL.BEND_WILL",
  blackbolt: "POWER_LABEL.BLACK_BOLT",
  blackbreath: "POWER_LABEL.BLACK_BREATH",
  blessedshield: "POWER_LABEL.BLESSED_SHIELD",
  blindingsymbol: "POWER_LABEL.BLINDING_SYMBOL",
  brimstonecascade: "POWER_LABEL.BRIMSTONE_CASCADE",
  combathymn: "POWER_LABEL.COMBAT_HYMN",
  confusion: "POWER_LABEL.CONFUSION",
  curse: "POWER_LABEL.CURSE",
  dancingweapon: "POWER_LABEL.DANCING_WEAPON",
  drainingglyph: "POWER_LABEL.DRAINING_GLYPH",
  entanglingvines: "POWER_LABEL.ENTANGLING_VINES",
  exorcize: "POWER_LABEL.EXORCIZE",
  firesoul: "POWER_LABEL.FIRE_SOUL",
  flamewall: "POWER_LABEL.FLAME_WALL",
  heroichymn: "POWER_LABEL.HEROIC_HYMN",
  holyaura: "POWER_LABEL.HOLY_AURA",
  illusorycorrection: "POWER_LABEL.ILLUSORY_CORRECTION",
  inheritwound: "POWER_LABEL.INHERIT_WOUND",
  larvaeboils: "POWER_LABEL.LARVAE_BOILS",
  layonhands: "POWER_LABEL.LAY_ON_HANDS",
  levitate: "POWER_LABEL.LEVITATE",
  lifegiver: "POWER_LABEL.LIFEGIVER",
  maltransformation: "POWER_LABEL.MALTRANSFORMATION",
  mindthrow: "POWER_LABEL.MIND-THROW",
  mirroring: "POWER_LABEL.MIRRORING",
  naturesembrace: "POWER_LABEL.NATURES_EMBRACE",
  priosburningglass: "POWER_LABEL.PRIOS_BURNING_GLASS",
  protectiverunes: "POWER_LABEL.PROTECTIVE_RUNES",
  psychicthrust: "POWER_LABEL.PSYCHIC_THRUST",
  purgatory: "POWER_LABEL.PURGATORY",
  retribution: "POWER_LABEL.RETRIBUTION",
  revenantstrike: "POWER_LABEL.REVENANT_STRIKE",
  shapeshift: "POWER_LABEL.SHAPESHIFT",
  sphere: "POWER_LABEL.SPHERE",
  spiritwalk: "POWER_LABEL.SPIRIT_WALK",
  staffprojectile: "POWER_LABEL.STAFF_PROJECTILE",
  stormarrow: "POWER_LABEL.STORM_ARROW",
  teleport: "POWER_LABEL.TELEPORT",
  thorncloak: "POWER_LABEL.THORN_CLOAK",
  tormentingspirits: "POWER_LABEL.TORMENTING_SPIRITS",
  trueform: "POWER_LABEL.TRUE_FORM",
  unholyaura: "POWER_LABEL.UNHOLY_AURA",
  unnoticeable: "POWER_LABEL.UNNOTICEABLE",
  weakeninghymn: "POWER_LABEL.WEAKENING_HYMN",
  wildhunt: "POWER_LABEL.WILD_HUNT",
  battlesymbol: "POWER_LABEL.BATTLE_SYMBOL",
  earthbinding: "POWER_LABEL.EARTH_BINDING",
  markoftorment: "POWER_LABEL.MARK_OF_TORMENT",
  serenity: "POWER_LABEL.SERENITY",
  earthshot: "POWER_LABEL.EARTH_SHOT",
  witchhammer: "POWER_LABEL.WITCH_HAMMER",
};

SYMBAROUM.traitsList = {
  acidicattack: "TRAIT_LABEL.ACIDICATTACK",
  acidicblood: "TRAIT_LABEL.ACIDICBLOOD",
  alternativedamage: "TRAIT_LABEL.ALTERNATIVEDAMAGE",
  amphibian: "TRAIT_LABEL.AMPHIBIAN",
  armored: "TRAIT_LABEL.ARMORED",
  avengingsuccessor: "TRAIT_LABEL.AVENGINGSUCCESSOR",
  bloodlust: "TRAIT_LABEL.BLOODLUST",
  carapace: "TRAIT_LABEL.CARAPACE",
  collectivepower: "TRAIT_LABEL.COLLECTIVEPOWER",
  colossal: "TRAIT_LABEL.COLOSSAL",
  companions: "TRAIT_LABEL.COMPANIONS",
  corruptingattack: "TRAIT_LABEL.CORRUPTINGATTACK",
  corruptionhoarder: "TRAIT_LABEL.CORRUPTIONHOARDER",
  corruptionsensitive: "TRAIT_LABEL.CORRUPTIONSENSITIVE",
  crushingembrace: "TRAIT_LABEL.CRUSHINGEMBRACE",
  deadlybreath: "TRAIT_LABEL.DEADLYBREATH",
  deathstruggle: "TRAIT_LABEL.DEATHSTRUGGLE",
  devour: "TRAIT_LABEL.DEVOUR",
  diminutive: "TRAIT_LABEL.DIMINUTIVE",
  enthrall: "TRAIT_LABEL.ENTHRALL",
  earthbound: "TRAIT_LABEL.EARTHBOUND",
  freespirit: "TRAIT_LABEL.FREESPIRIT",
  grapplingtongue: "TRAIT_LABEL.GRAPPLINGTONGUE",
  gravelycold: "TRAIT_LABEL.GRAVELYCOLD",
  harmfulaura: "TRAIT_LABEL.HARMFULAURA",
  haunting: "TRAIT_LABEL.HAUNTING",
  infectious: "TRAIT_LABEL.INFECTIOUS",
  infestation: "TRAIT_LABEL.INFESTATION",
  invisibility: "TRAIT_LABEL.INVISIBILITY",
  leap: "TRAIT_LABEL.LEAP",
  lifesense: "TRAIT_LABEL.LIFESENSE",
  manifestation: "TRAIT_LABEL.MANIFESTATION",
  "many-headed": "TRAIT_LABEL.MANYHEADED",
  metamorphosis: "TRAIT_LABEL.METAMORPHOSIS",
  mysticalresistance: "TRAIT_LABEL.MYSTICALRESISTANCE",
  naturalweapon: "TRAIT_LABEL.NATURALWEAPON",
  nightperception: "TRAIT_LABEL.NIGHTPERCEPTION",
  observant: "TRAIT_LABEL.OBSERVANT",
  paralyzingvenom: "TRAIT_LABEL.PARALYZINGVENOM",
  piercingattack: "TRAIT_LABEL.PIERCINGATTACK",
  poisonous: "TRAIT_LABEL.POISONOUS",
  poisonspit: "TRAIT_LABEL.POISONSPIT",
  prehensileclaws: "TRAIT_LABEL.PREHENSILECLAWS",
  rampage: "TRAIT_LABEL.RAMPAGE",
  regeneration: "TRAIT_LABEL.REGENERATION",
  robust: "TRAIT_LABEL.ROBUST",
  rootwall: "TRAIT_LABEL.ROOTWALL",
  shapeshifter: "TRAIT_LABEL.SHAPESHIFTER",
  spiritform: "TRAIT_LABEL.SPIRITFORM",
  sturdy: "TRAIT_LABEL.STURDY",
  summoner: "TRAIT_LABEL.SUMMONER",
  survivalinstinct: "TRAIT_LABEL.SURVIVALINSTINCT",
  swarm: "TRAIT_LABEL.SWARM",
  swift: "TRAIT_LABEL.SWIFT",
  terrify: "TRAIT_LABEL.TERRIFY",
  tunneler: "TRAIT_LABEL.TUNNELER",
  undead: "TRAIT_LABEL.UNDEAD",
  web: "TRAIT_LABEL.WEB",
  wings: "TRAIT_LABEL.WINGS",
  wisdomages: "TRAIT_LABEL.WISDOM_AGES",
  wrecker: "TRAIT_LABEL.WRECKER",
};

SYMBAROUM.boonsList = {
  absolutememory: "BOON_LABEL.ABSOLUTE_MEMORY",
  archivist: "BOON_LABEL.ARCHIVIST",
  augur: "BOON_LABEL.AUGUR",
  beasttongue: "BOON_LABEL.BEAST_TONGUE",
  bloodties: "BOON_LABEL.BLOODTIES",
  bloodhound: "BOON_LABEL.BLOODHOUND",
  bushcraft: "BOON_LABEL.BUSHCRAFT",
  cartographer: "BOON_LABEL.CARTOGRAPHER",
  catburglar: "BOON_LABEL.CAT_BURGLAR",
  cheat: "BOON_LABEL.CHEAT",
  commandingvoice: "BOON_LABEL.COMMANDING_VOICE",
  conartist: "BOON_LABEL.CON_ARTIST",
  contacts: "BOON_LABEL.CONTACTS",
  darkblood: "BOON_LABEL.DARKBLOOD",
  dexterous: "BOON_LABEL.DEXTEROUS",
  "double-tongue": "BOON_LABEL.DOUBLE_TONGUE",
  enduringmarch: "BOON_LABEL.ENDURING_MARCH",
  enterprise: "BOON_LABEL.ENTERPRISE",
  escapeartist: "BOON_LABEL.ESCAPE_ARTIST",
  falseidentity: "BOON_LABEL.FALSE_IDENTITY",
  fireforged: "BOON_LABEL.FIRE_FORGED",
  "fleet-footed": "BOON_LABEL.FLEET_FOOTED",
  forbiddenknowledge: "BOON_LABEL.FORBIDDEN_KNOWLEDGE",
  gambler: "BOON_LABEL.GAMBLER",
  greenthumb: "BOON_LABEL.GREEN_THUMB",
  heirloom: "BOON_LABEL.HEIRLOOM",
  hideouts: "BOON_LABEL.HIDEOUTS",
  horrifying: "BOON_LABEL.HORRIFYING",
  impressionist: "BOON_LABEL.IMPRESSIONIST",
  "long-lived": "BOON_LABEL.LONGLIVED",
  manipulator: "BOON_LABEL.MANIPULATOR",
  medium: "BOON_LABEL.MEDIUM",
  mirage: "BOON_LABEL.MIRAGE",
  musician: "BOON_LABEL.MUSICIAN",
  "pack-mule": "BOON_LABEL.PACK_MULE",
  pathfinder: "BOON_LABEL.PATHFINDER",
  pet: "BOON_LABEL.PET",
  poisonresilient: "BOON_LABEL.POISON_RESILIENT",
  priviledged: "BOON_LABEL.PRIVILEDGED",
  servant: "BOON_LABEL.SERVANT",
  shadowspawn: "BOON_LABEL.SHADOW_SPAWN",
  soulmate: "BOON_LABEL.SOULMATE",
  storyteller: "BOON_LABEL.STORYTELLER",
  telltale: "BOON_LABEL.TELLTALE",
  tough: "BOON_LABEL.TOUGH",
};

SYMBAROUM.burdensList = {
  addiction: "BURDEN_LABEL.ADDICTION",
  archenemy: "BURDEN_LABEL.ARCHENEMY",
  bestial: "BURDEN_LABEL.BESTIAL",
  bloodthirst: "BURDEN_LABEL.BLOODTHIRST",
  codeofhonor: "BURDEN_LABEL.CODE_OF_HONOR",
  darksecret: "BURDEN_LABEL.DARK_SECRET",
  elderly: "BURDEN_LABEL.ELDERLY",
  epileptic: "BURDEN_LABEL.EPILEPTIC",
  impulsive: "BURDEN_LABEL.IMPULSIVE",
  mysticalmark: "BURDEN_LABEL.MYSTICAL_MARK",
  nightmares: "BURDEN_LABEL.NIGHTMARES",
  pariah: "BURDEN_LABEL.PARIAH",
  protege: "BURDEN_LABEL.PROTEGE",
  "short-lived": "BURDEN_LABEL.SHORTLIVED",
  sickly: "BURDEN_LABEL.SICKLY",
  slow: "BURDEN_LABEL.SLOW",
  wanted: "BURDEN_LABEL.WANTED",
};

SYMBAROUM.meleeWeapons = ["1handed", "short", "long", "shield", "unarmed", "heavy"];

SYMBAROUM.rangeWeapons = ["ranged", "thrown"];

SYMBAROUM.baseDamage = "1d8";
SYMBAROUM.baseProtection = "1d4";

SYMBAROUM.powersList = {
  none: "ABILITY_LABEL.DEFAULT",
  anathema: "POWER_LABEL.ANATHEMA",
  banishingseal: "POWER_LABEL.BANISHING_SEAL",
  bendwill: "POWER_LABEL.BEND_WILL",
  blackbolt: "POWER_LABEL.BLACK_BOLT",
  blackbreath: "POWER_LABEL.BLACK_BREATH",
  blessedshield: "POWER_LABEL.BLESSED_SHIELD",
  blindingsymbol: "POWER_LABEL.BLINDING_SYMBOL",
  brimstonecascade: "POWER_LABEL.BRIMSTONE_CASCADE",
  combathymn: "POWER_LABEL.COMBAT_HYMN",
  confusion: "POWER_LABEL.CONFUSION",
  curse: "POWER_LABEL.CURSE",
  dancingweapon: "POWER_LABEL.DANCING_WEAPON",
  drainingglyph: "POWER_LABEL.DRAINING_GLYPH",
  entanglingvines: "POWER_LABEL.ENTANGLING_VINES",
  exorcize: "POWER_LABEL.EXORCIZE",
  firesoul: "POWER_LABEL.FIRE_SOUL",
  flamewall: "POWER_LABEL.FLAME_WALL",
  heroichymn: "POWER_LABEL.HEROIC_HYMN",
  holyaura: "POWER_LABEL.HOLY_AURA",
  illusorycorrection: "POWER_LABEL.ILLUSORY_CORRECTION",
  inheritwound: "POWER_LABEL.INHERIT_WOUND",
  larvaeboils: "POWER_LABEL.LARVAE_BOILS",
  layonhands: "POWER_LABEL.LAY_ON_HANDS",
  levitate: "POWER_LABEL.LEVITATE",
  lifegiver: "POWER_LABEL.LIFEGIVER",
  maltransformation: "POWER_LABEL.MALTRANSFORMATION",
  mindthrow: "POWER_LABEL.MIND-THROW",
  mirroring: "POWER_LABEL.MIRRORING",
  naturesembrace: "POWER_LABEL.NATURES_EMBRACE",
  priosburningglass: "POWER_LABEL.PRIOS_BURNING_GLASS",
  protectiverunes: "POWER_LABEL.PROTECTIVE_RUNES",
  psychicthrust: "POWER_LABEL.PSYCHIC_THRUST",
  purgatory: "POWER_LABEL.PURGATORY",
  retribution: "POWER_LABEL.RETRIBUTION",
  revenantstrike: "POWER_LABEL.REVENANT_STRIKE",
  shapeshift: "POWER_LABEL.SHAPESHIFT",
  sphere: "POWER_LABEL.SPHERE",
  spiritwalk: "POWER_LABEL.SPIRIT_WALK",
  staffprojectile: "POWER_LABEL.STAFF_PROJECTILE",
  stormarrow: "POWER_LABEL.STORM_ARROW",
  teleport: "POWER_LABEL.TELEPORT",
  thorncloak: "POWER_LABEL.THORN_CLOAK",
  tormentingspirits: "POWER_LABEL.TORMENTING_SPIRITS",
  trueform: "POWER_LABEL.TRUE_FORM",
  unholyaura: "POWER_LABEL.UNHOLY_AURA",
  unnoticeable: "POWER_LABEL.UNNOTICEABLE",
  weakeninghymn: "POWER_LABEL.WEAKENING_HYMN",
  wildhunt: "POWER_LABEL.WILD_HUNT",
  battlesymbol: "POWER_LABEL.BATTLE_SYMBOL",
  earthbinding: "POWER_LABEL.EARTH_BINDING",
  markoftorment: "POWER_LABEL.MARK_OF_TORMENT",
  serenity: "POWER_LABEL.SERENITY",
  earthshot: "POWER_LABEL.EARTH_SHOT",
  witchhammer: "POWER_LABEL.WITCH_HAMMER",
};

SYMBAROUM.scriptedAbilities = [
  "alchemy",
  "acrobatics",
  "artifactcrafting",
  "beastlore",
  "berserker",
  "blacksmith",
  "dominate",
  "leader",
  "loremaster",
  "medicus",
  "poisoner",
  "quickdraw",
  "recovery",
  "strangler",
  "witchsight",
  "anathema",
  "brimstonecascade",
  "bendwill",
  "blackbolt",
  "blessedshield",
  "confusion",
  "curse",
  "dancingweapon",
  "earthshot",
  "entanglingvines",
  "flamewall",
  "holyaura",
  "inheritwound",
  "larvaeboils",
  "layonhands",
  "levitate",
  "maltransformation",
  "mindthrow",
  "priosburningglass",
  "revenantstrike",
  "tormentingspirits",
  "unnoticeable",
  "poisonous",
  "regeneration",
  "shapeshifter",
  "wisdomages",
  "witchhammer",
];

SYMBAROUM.steadFastNovResistList = ["drainingglyph", "entanglingvines", "larvaeboils", "mindthrow", "earthbinding", "poisoner", "poisonous"];

SYMBAROUM.steadFastAdeptResistList = [
  "anathema",
  "banishingseal",
  "bendwill",
  "blindingsymbol",
  "confusion",
  "exorcize",
  "maltransformation",
  "priosburningglass",
  "retribution",
  "trueform",
  "unnoticeable",
  "weakeninghymn",
  "battlesymbol",
  "markoftorment",
  "serenity",
];

SYMBAROUM.rapidReflexesResistList = ["brimstonecascade", "deadlybreath"];

SYMBAROUM.monsterTraitLevels = {
  0: "ABILITY.NOT_LEARNED",
  1: "I",
  2: "II",
  3: "III",
};

SYMBAROUM.systemTraits = ["nopainthreshold", "thoroughlycorrupt"];

SYMBAROUM.noArmorID = "NoArmorID";

SYMBAROUM.abilityArmor = ["armored"];

SYMBAROUM.weaponQualities = [
  "flexible",
  "bastard",
  "returning",
  "blunt",
  "short",
  "unwieldy",
  "wrecking",
  "concealed",
  "balanced",
  "deepImpact",
  "jointed",
  "ensnaring",
  "long",
  "massive",
  "precise",
  "bloodLetting",
  "areaMeleeRadius",
  "areaShortRadius",
  "areaCone",
  "acidcoated",
  "bane",
  "deathrune",
  "desecrated",
  "flaming",
  "hallowed",
  "poison",
  "thundering",
  "mystical",
];

SYMBAROUM.weaponCompatibilities = ["staffFightingCompatibility", "swordSaintCompatibility", "knifePlayCompatibility", "staffMagicCompatibility"];

SYMBAROUM.armorQualities = ["flexible", "concealed", "cumbersome", "desecrated", "flaming", "hallowed", "mystical"];

SYMBAROUM.armorCompatibilities = [];

SYMBAROUM.equipmentQualities = [];

SYMBAROUM.equipmentCompatibilities = [];

SYMBAROUM.systemConditionEffects = [
  {
    id: "bendwill",
    label: "POWER_LABEL.BEND_WILL",
    name: "POWER_LABEL.BEND_WILL",
    icon: "systems/symbaroum/asset/image/puppet.png",
  },
  {
    id: "berserker",
    label: "ABILITY_LABEL.BERSERKER",
    name: "ABILITY_LABEL.BERSERKER",
    icon: "systems/symbaroum/asset/image/berserker.svg",
  },
  {
    id: "confusion",
    label: "POWER_LABEL.CONFUSION",
    name: "POWER_LABEL.CONFUSION",
    icon: "systems/symbaroum/asset/image/unknown-item.png",
  },
  {
    id: "dancingweapon",
    label: "POWER_LABEL.DANCING_WEAPON",
    name: "POWER_LABEL.DANCING_WEAPON",
    icon: "systems/symbaroum/asset/image/powers/dancingweapon.svg",
  },
  {
    id: "entanglingvines",
    label: "POWER_LABEL.ENTANGLING_VINES",
    name: "POWER_LABEL.ENTANGLING_VINES",
    icon: "systems/symbaroum/asset/image/vines.png",
  },
  {
    id: "holyaura",
    label: "POWER_LABEL.HOLY_AURA",
    name: "POWER_LABEL.HOLY_AURA",
    icon: "icons/svg/aura.svg",
  },
  {
    id: "larvaeboils",
    label: "POWER_LABEL.LARVAE_BOILS",
    name: "POWER_LABEL.LARVAE_BOILS",
    icon: "systems/symbaroum/asset/image/bug.png",
  },
  {
    id: "maltransformation",
    label: "POWER_LABEL.MALTRANSFORMATION",
    name: "POWER_LABEL.MALTRANSFORMATION",
    icon: "systems/symbaroum/asset/image/frog.png",
  },
  {
    id: "revenantstrike",
    label: "POWER_LABEL.REVENANT_STRIKE",
    name: "POWER_LABEL.REVENANT_STRIKE",
    icon: "systems/symbaroum/asset/image/powers/revenantstrike.svg",
  },
  {
    id: "strangler",
    label: "ABILITY_LABEL.STRANGLER",
    name: "ABILITY_LABEL.STRANGLER",
    icon: "systems/symbaroum/asset/image/lasso.png",
  },
  {
    id: "tormentingspirits",
    label: "POWER_LABEL.TORMENTING_SPIRITS",
    name: "POWER_LABEL.TORMENTING_SPIRITS",
    icon: "systems/symbaroum/asset/image/ghost.svg",
  },
  {
    id: "unnoticeable",
    label: "POWER_LABEL.UNNOTICEABLE",
    name: "POWER_LABEL.UNNOTICEABLE",
    icon: "systems/symbaroum/asset/image/invisible.png",
  },
  {
    id: "witchhammer",
    label: "POWER_LABEL.WITCH_HAMMER",
    name: "POWER_LABEL.WITCH_HAMMER",
    icon: "systems/symbaroum/asset/image/powers/witchhammer.svg",
  },
];

SYMBAROUM.traitManyHeaded = "many-headed";

SYMBAROUM.expCosts = {
  ritual: {
    free: 6,
    cost: 10,
  },
  burden: { cost: -5 },
  boon: { cost: 5 },
  power: {
    novice: 10,
    adept: 20,
    master: 30,
    nocost: [],
  },
};

SYMBAROUM.BONUS_FIELDS = [
  {
    label: "ARMOR.DEFENSE",
    name: "system.bonus.defense",
  },
  {
    label: "ATTRIBUTE.ACCURATE",
    name: "system.bonus.accurate",
  },
  {
    label: "ATTRIBUTE.CUNNING",
    name: "system.bonus.cunning",
  },
  {
    label: "ATTRIBUTE.DISCREET",
    name: "system.bonus.discreet",
  },
  {
    label: "ATTRIBUTE.PERSUASIVE",
    name: "system.bonus.persuasive",
  },
  {
    label: "ATTRIBUTE.QUICK",
    name: "system.bonus.quick",
  },
  {
    label: "ATTRIBUTE.RESOLUTE",
    name: "system.bonus.resolute",
  },
  {
    label: "ATTRIBUTE.STRONG",
    name: "system.bonus.strong",
  },
  {
    label: "ATTRIBUTE.VIGILANT",
    name: "system.bonus.vigilant",
  },
  {
    label: "HEALTH.TOUGHNESS_MAX",
    name: "system.bonus.toughness.max",
  },
  {
    label: "HEALTH.TOUGHNESS_THRESHOLD_MAX",
    name: "system.bonus.toughness.threshold",
  },
  {
    label: "HEALTH.CORRUPTION_THRESHOLD_MAX",
    name: "system.bonus.corruption.threshold",
  },
  {
    label: "HEALTH.CORRUPTION_MAX",
    name: "system.bonus.corruption.max",
  },
  {
    label: "EXPERIENCE",
    name: "system.bonus.experience.value",
  },
];

SYMBAROUM.BONUS_FIELDS_WEAPON = [];

SYMBAROUM.BONUS_FIELDS_EQUIPMENT = [];

SYMBAROUM.BONUS_FIELDS_ARMOR = [
  {
    label: "BONUS.IMPEDING_REDUCTION",
    name: "system.bonus.impeding",
  },
];

//combat mod types
SYMBAROUM.TYPE_ALTERNATIVE_DAMAGE = "alternative_damage";
SYMBAROUM.TYPE_FAVOUR = "favour";

SYMBAROUM.RAPIREFLEXINIBONUS = 20;

SYMBAROUM.DAM_FAVOUR = "damagefavour";
SYMBAROUM.STATUS_DOT = "statusDoT";
SYMBAROUM.TYPE_ATTRIBUTE = "attribute";
SYMBAROUM.TYPE_INITIATIVE = "initiative";
SYMBAROUM.TYPE_ATTACKINCREASE = "attackincrease";
SYMBAROUM.DAM_DICEUPGRADE = "diceupgrade";
SYMBAROUM.DAM_MOD = "damagemodifier";
SYMBAROUM.TYPE_ROLL_MOD = "attackrollmod";
SYMBAROUM.CORRUPTION_DAMAGE = "corruptingattack";
SYMBAROUM.DAM_CHECK = "checkdamage";
SYMBAROUM.DAM_RADIO = "radio";
SYMBAROUM.DAM_FIXED = "fixed";
SYMBAROUM.PACK_CHECKED = "checkpackage";
SYMBAROUM.DAM_BUILTIN = "builtin"; // builtin is for those that EC assumes are already calculated
SYMBAROUM.DAM_BUILTIN_REFERENCES = [];
SYMBAROUM.DAM_1STATTACK = "1stattack";
SYMBAROUM.DAM_NOTACTIVE = "not1stattack";
SYMBAROUM.DAM_ACTIVE = "active";
SYMBAROUM.DAM_ADVANTAGE = "advantage";

SYMBAROUM.SPECIAL_STRONG = "strong";
SYMBAROUM.SPECIAL_WEAK = "weak";
SYMBAROUM.SPECIAL_MIN_DEFENSE = "min_defense";

//combat mod package types
SYMBAROUM.PACK_DEFAULT = "default";
SYMBAROUM.PACK_CHECK = "checkbox";
SYMBAROUM.PACK_RADIO = "radio";

SYMBAROUM.SEC_ATT_BONUS = "secattributebonus";
SYMBAROUM.SEC_ATT_MULTIPLIER = "secattributemultiplier";
SYMBAROUM.THRESHOLD_MULTIPLIER = "tresholdmultiplier";
SYMBAROUM.NO_TRESHOLD = "nothreshold";

SYMBAROUM.CONSOLESTYLE = "font-weight: bold;";

//Mystic powers
SYMBAROUM.TRADITION = "tradition";
SYMBAROUM.TRAD_BLESSINGS = "blessings";
SYMBAROUM.TRAD_SORCERY = "sorcery";
SYMBAROUM.TRAD_STAFFM = "staffmagic";
SYMBAROUM.TRAD_SYMBOLISM = "symbolism";
SYMBAROUM.TRAD_THEURGY = "theurgy";
SYMBAROUM.TRAD_TROLLS = "trollsinging";
SYMBAROUM.TRAD_WITCHCRAFT = "witchcraft";
SYMBAROUM.TRAD_WIZARDRY = "wizardry";

//temporary corruption gain for mystic powers
SYMBAROUM.TEMPCORRUPTION_NORMAL = "corrnormal"; // 1d4 (default)
SYMBAROUM.TEMPCORRUPTION_ONE = "corr1"; // 1
SYMBAROUM.TEMPCORRUPTION_TESTFORONE = "corrtestfor1"; // 1 if test against resolute
SYMBAROUM.TEMPCORRUPTION_FAVOUR = "corrfavour"; // 2dxkl
SYMBAROUM.TEMPCORRUPTION_NONE = "corrnone"; // 0
SYMBAROUM.TEMPCORRUPTION_D6 = "corrd6"; // 1d6

//impeding types
SYMBAROUM.IMPEDING_NOT = "impedingnot"; // no impeding malus (default)
SYMBAROUM.IMPEDING_MAGIC = "impedingmagic"; // no impeding malus for magic
SYMBAROUM.IMPEDING_MOVE = "impedingmov"; // impeding malus for movement

SYMBAROUM.IMPEDING_DEFAULTS = {
  stackable: 0,
  skin: 0,
  cumbersome: 1,
  flexible: -2,
  lightarmor: 2,
  mediumarmor: 3,
  heavyarmor: 4,
  superarmor: 4,
};

//1rst round of casting - for maintaining, see "maintain"
SYMBAROUM.CASTING = "casting"; // (default) the power is cast with castingAttribute, no resistance
SYMBAROUM.CASTING_NOT = "castingnot"; // the power success is automatic
SYMBAROUM.CASTING_RES = "castingresisted"; // the power is cast with castingAttribute and resisted with resistAttribute

//Maintain
SYMBAROUM.MAINTAIN_NOT = "notmaintain"; // (default) the power can't be maintained
SYMBAROUM.MAINTAIN = "maintainroll"; //the power can be maintained (simple casting attribute roll)
SYMBAROUM.MAINTAIN_RES = "maintainrollres"; //the power can be maintained (resisted roll)

SYMBAROUM.CHAIN = "chain"; //the power can do chain effect
SYMBAROUM.CHAIN_NOT = "chainnot"; //the power can't do chain effect

//Resisting
SYMBAROUM.TYPE_DMG_AVOIDING = "dmgavoiding"; // damage reduction like in rapid reflexes
SYMBAROUM.TYPE_ALT_RESIST_ATTR_RESOLUTE = "altresistatt"; //Alt resist attribute against mental alterations

//Healing
SYMBAROUM.TARGET_TOKEN = "targettoken";
SYMBAROUM.ACTING_TOKEN = "actingtoken";

SYMBAROUM.SYSTEM_MACRO_FOLDER = "Symbaroum System Macros";

SYMBAROUM.HOOKS = {
  symbaroumItemModifiersSetup: "symbaroumItemModifiersSetup",
};

SYMBAROUM.CONTEXT_MENU = {
  equipmentAddRemoveFlag: "equipmentAddRemove",
};

SYMBAROUM.ACTION_TYPES = {
  none: {
    id: "none",
    label: "-",
  },
  A: {
    id: "A",
    label: "SYMBAROUM.ACTION.ACTIVE",
  },
  M: {
    id: "M",
    label: "SYMBAROUM.ACTION.MOVEMENT",
  },
  T: {
    id: "T",
    label: "SYMBAROUM.ACTION.FULL_TURN",
  },
  F: {
    id: "F",
    label: "SYMBAROUM.ACTION.FREE",
  },
  P: {
    id: "P",
    label: "SYMBAROUM.ACTION.PASSIVE",
  },
  R: {
    id: "R",
    label: "SYMBAROUM.ACTION.REACTION",
  },
  S: {
    id: "S",
    label: "SYMBAROUM.ACTION.SPECIAL",
  },
};

SYMBAROUM.ATTRIBUTE_SELECTION = {
  accurate: {
    id: "accurate",
    label: "ATTRIBUTE.ACCURATE",
  },
  cunning: {
    id: "cunning",
    label: "ATTRIBUTE.CUNNING",
  },
  discreet: {
    id: "discreet",
    label: "ATTRIBUTE.DISCREET",
  },
  quick: {
    id: "quick",
    label: "ATTRIBUTE.QUICK",
  },
  persuasive: {
    id: "persuasive",
    label: "ATTRIBUTE.PERSUASIVE",
  },
  resolute: {
    id: "resolute",
    label: "ATTRIBUTE.RESOLUTE",
  },
  strong: {
    id: "strong",
    label: "ATTRIBUTE.STRONG",
  },
  vigilant: {
    id: "vigilant",
    label: "ATTRIBUTE.VIGILANT",
  },
};

SYMBAROUM.ARMOR_PROTECTION_SELECTION = {
  "1d4": {
    id: "1d4",
    label: "1d4",
  },
  "1d6": {
    id: "1d6",
    label: "1d6",
  },
  "1d8": {
    id: "1d8",
    label: "1d8",
  },
  "1d10": {
    id: "1d10",
    label: "1d10",
  },
  0: {
    id: "0",
    label: "ARMOR.BONUS_ONLY",
  },
  "1d0": {
    id: "1d0",
    label: "ARMOR.SKIN",
  },
};

SYMBAROUM.WEAPON_TYPE_SELECTION = {
  "1handed": {
    id: "1handed",
    label: "WEAPON_CLASS.1HANDED",
  },
  short: {
    id: "short",
    label: "WEAPON_CLASS.SHORT",
  },
  long: {
    id: "long",
    label: "WEAPON_CLASS.LONG",
  },
  unarmed: {
    id: "unarmed",
    label: "WEAPON_CLASS.UNARMED",
  },
  heavy: {
    id: "heavy",
    label: "WEAPON_CLASS.HEAVY",
  },
  ranged: {
    id: "ranged",
    label: "WEAPON_CLASS.RANGED",
  },
  thrown: {
    id: "thrown",
    label: "WEAPON_CLASS.THROWN",
  },
  shield: {
    id: "shield",
    label: "WEAPON_CLASS.SHIELD",
  },
  other: {
    id: "other",
    label: "GEAR.OTHER",
  },
};

SYMBAROUM.WEAPON_DAMAGE_SELECTION = {
  "1d4": {
    id: "1d4",
    label: "1d4",
  },
  "1d6": {
    id: "1d6",
    label: "1d6",
  },
  "1d8": {
    id: "1d8",
    label: "1d8",
  },
  "1d10": {
    id: "1d10",
    label: "1d10",
  },
  "1d12": {
    id: "1d12",
    label: "1d12",
  },
};
