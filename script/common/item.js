import {
  baseRoll,
  createRollData,
  damageRollWithDiceParams,
  simpleDamageRoll,
  getAttributeValue,
  getOwnerPlayer,
  createModifyTokenChatButton,
  createResistRollChatButton,
} from "./roll.js";
import { createLineDisplay } from "./dialog.js";

export class SymbaroumItem extends Item {
  /* -------------------------------------------- */
  /*  Importing and Exporting                     */
  /* -------------------------------------------- */

  /**
   * Present a Dialog form to create a new Document of this type.
   * Choose a name and a type from a select menu of types.
   * @param {object} data              Initial data with which to populate the creation form
   * @param {object} [context={}]      Additional context options or dialog positioning options
   * @returns {Promise<Document|null>} A Promise which resolves to the created Document, or null if the dialog was
   *                                   closed.
   * @memberof ClientDocumentMixin
   */
  static async createDialog(data = {}, { parent = null, pack = null, ...options } = {}) {
    // Collect data
    const documentName = this.metadata.name;
    const types = game.documentTypes[documentName]?.filter((e) => !game.symbaroum.config.itemDeprecated.includes(e));
    const folders = parent ? [] : game.folders.filter((f) => f.type === documentName && f.displayed);
    const label = game.i18n.localize(this.metadata.label);
    const title = game.i18n.format("DOCUMENT.Create", { type: label });

    // Render the document creation form
    const html = await renderTemplate("templates/sidebar/document-create.html", {
      name: data.name || game.i18n.format("DOCUMENT.New", { type: label }),
      folder: data.folder,
      folders: folders,
      hasFolders: folders.length >= 1,
      type: data.type || CONFIG[documentName]?.defaultType || types[0],
      types: types.reduce((obj, t) => {
        const label = CONFIG[documentName]?.typeLabels?.[t] ?? t;
        obj[t] = game.i18n.has(label) ? game.i18n.localize(label) : t;
        return obj;
      }, {}),
      hasTypes: types.length > 1,
    });

    // Render the confirmation dialog window
    return Dialog.prompt({
      title: title,
      content: html,
      label: title,
      callback: (html) => {
        const form = html[0].querySelector("form");
        const fd = new FormDataExtended(form);
        foundry.utils.mergeObject(data, fd.object, { inplace: true });
        if (!data.folder) delete data.folder;
        if (types.length === 1) data.type = types[0];
        return this.create(data, { parent, pack, renderSheet: true });
      },
      rejectClose: false,
      options: options,
    });
  }

  static async create(data, options) {
    if (!data.img) {
      if (data.type in game.symbaroum.config.itemImages) data.img = game.i18n.format(game.symbaroum.config.imageRef, { filename: game.symbaroum.config.itemImages[data.type] });
      else data.img = game.i18n.format(game.symbaroum.config.imageRef, { filename: "unknown-item.png" });
    }
    return super.create(data, options);
  }

  prepareData() {
    super.prepareData();
    this._initializeData(this);
    this._computeCombatData(this.system);
  }

  _initializeData(item) {
    let system = this.system;
    let transl = {
      A: "ACTION.ACTIVE",
      M: "ACTION.MOVEMENT",
      T: "ACTION.FULL_TURN",
      F: "ACTION.FREE",
      P: "ACTION.PASSIVE",
      R: "ACTION.REACTION",
      S: "ACTION.SPECIAL",
    };

    system["is" + this.type.capitalize()] = true;

    system.isPower = system.isTrait || system.isAbility || system.isMysticalPower || system.isRitual || system.isBurden || system.isBoon;
    system.hasLevels = system.isTrait || system.isAbility || system.isMysticalPower;
    system.isArtifact = this.type === "artifact" || system.isArtifact;
    system.isGear = system.isWeapon || system.isArmor || system.isEquipment || system.isArtifact;
    system.isMarker = system.marker === "active";

    if (system.isTrait && system.reference && system.reference !== "") {
      let label = game.symbaroum.config.traitsList[system.reference];
      if (label) system.itemLabel = game.i18n.localize(label);
    } else if (system.isAbility) {
      let label = game.symbaroum.config.abilitiesList[system.reference];
      if (label) system.itemLabel = game.i18n.localize(label);
    } else if (system.isMysticalPower) {
      let label = game.symbaroum.config.powersList[system.reference];
      if (label) system.itemLabel = game.i18n.localize(label);
    }

    if (system.isGear) {
      system.isActive = system.state === "active";
      system.isEquipped = system.state === "equipped";
    }

    if (this.type === "weapon") {
      system.pcDamage = "";
      system.npcDamage = 0;
    } else if (this.type === "armor") {
      system.isStackableArmor = system.baseProtection === "0";
      system.isSkin = system.baseProtection === "1d0";
      system.isLightArmor = system.baseProtection === "1d4";
      system.isMediumArmor = system.baseProtection === "1d6";
      system.isHeavyArmor = system.baseProtection == "1d8";
      system.isSuperArmor = system.baseProtection == "1d10" || system.baseProtection == "1d12";
      if (system.isStackableArmor) {
        system.reference = "stackable";
      } else if (system.isSkin) {
        system.reference = "skin";
      } else if (system.isLightArmor) {
        system.reference = "lightarmor";
      } else if (system.isMediumArmor) {
        system.reference = "mediumarmor";
      } else if (system.isHeavyArmor) {
        system.reference = "heavyarmor";
      } else {
        system.reference = "superarmor";
      }
      system.pcProtection = "";
      system.npcProtection = 0;
    } else if (this.type == "artifact") {
      if (system.power1.action !== "-") {
        system.power1.actionlabel = transl[system.power1.action];
      }
      if (system.power2.action !== "-") {
        system.power2.actionlabel = transl[system.power2.action];
      }
      if (system.power3.action !== "-") {
        system.power3.actionlabel = transl[system.power3.action];
      }
    }
    if (system.isPower) this._computeExperienceCost(system);
  }

  _computeExperienceCost(system) {
    let expCost = 0;

    if (system.isRitual) {
      system.actions = "Ritual";
    } else if (system.isBurden) {
      system.actions = "Burden";
      expCost = game.symbaroum.config.expCosts.burden["cost"] * system.level;
    } else if (system.isBoon) {
      system.actions = "Boon";
      expCost = game.symbaroum.config.expCosts.boon["cost"] * system.level;
    } else if (system.isPower) {
      let novice = "-";
      let adept = "-";
      let master = "-";
      if (system.novice.isActive || system.marker) {
        novice = system.novice.action ?? "?";
        expCost += game.symbaroum.config.expCosts.power["novice"];
      }
      if (system.adept.isActive && !system.marker) {
        adept = system.adept.action ?? "?";
        expCost += game.symbaroum.config.expCosts.power["adept"];
      }
      if (system.master.isActive && !system.marker) {
        master = system.master.action ?? "?";
        expCost += game.symbaroum.config.expCosts.power["master"];
      }
      if (game.symbaroum.config.expCosts.power["nocost"].includes(system.reference)) {
        expCost = 0;
      }

      if (system.marker) {
        system.actions = ``;
      } else {
        system.actions = `${novice}/${adept}/${master}`;
      }
    }
    system.bonus.experience.cost = expCost;
  }

  _computeCombatData(system) {
    if (this.type === "weapon") {
      system.isMelee = game.symbaroum.config.meleeWeapons.includes(system.reference);
      system.isDistance = game.symbaroum.config.rangeWeapons.includes(system.reference);
      let baseDamage = system.baseDamage;
      // game.symbaroum.log("baseDamage["+baseDamage+"]");
      if (baseDamage === null || baseDamage === undefined || baseDamage === "") {
        baseDamage = game.symbaroum.config.baseDamage;
      }
      let diceSides = baseDamage.match(/[0-9]d([1-9]+)/)[1];
      // game.symbaroum.log("diceSides["+diceSides+"]");
      if (system.qualities?.massive) {
        baseDamage = "2d" + Math.ceil(diceSides) + "kh";
      }
      if (system.bonusDamage != "") {
        if (system.bonusDamage.charAt(0) !== "+") {
          system.bonusDamage = "+" + system.bonusDamage;
        }
        baseDamage += system.bonusDamage;
      }
      system.pcDamage += baseDamage;
      if (system.qualities?.deepImpact) {
        system.pcDamage += "+1";
      }
      try {
        let weaponRoll = new Roll(baseDamage).evaluateSync({ maximize: true, async: false });
        system.npcDamage = Math.ceil(weaponRoll.total / 2);
      } catch (err) {
        system.npcDamage = 0;
        ui.notifications?.error("Could not evaulate weapon - check bonus damage fields - " + err);
      }
      if (system.qualities?.deepImpact) {
        system.npcDamage += 1;
      }
    } else if (this.type === "armor") {
      let protection = system.baseProtection;
      let armorRoll = null;
      if (protection === null || protection === undefined || protection === "") {
        protection = game.symbaroum.config.baseProtection;
      }
      if (protection === "0") {
        protection = "";
      }

      if (system.bonusProtection && system.bonusProtection != "") {
        let plus = "+";
        if (system.bonusProtection.charAt(0) === "+") {
          plus = "";
        }
        protection += plus + system.bonusProtection;
      }
      system.pcProtection = protection;
      if (system.qualities?.reinforced) {
        system.pcProtection += "+1";
      }

      system.npcProtection = 0;
      if (protection !== "" && Roll.validate(protection)) {
        system.npcProtection = Math.ceil(new Roll(protection).evaluateSync({ maximize: true, async: false }).total / 2);
      }
      if (system.qualities?.reinforced) {
        system.npcProtection += 1;
      }
    }
  }

  _getArtifactInfo(field) {
    let system = this.system;
    if (this.type == "artifact") {
      return `${system.power1[field]}/${system.power2[field]}/${system.power3[field]}`;
    } else if (system.isArtifact) {
      if (system.power === null || system.power == {}) {
        return "";
      }
      let keys = Object.keys(system.power);
      let actionStr = "";
      let notfirst = false;

      for (let i = 0; i < keys.length; i++) {
        if (notfirst) {
          actionStr += "/";
        } else {
          notfirst = true;
        }
        actionStr += system.power[keys[i]][field];
      }
      return actionStr;
    } else {
      return "";
    }
  }

  getArtifactActions() {
    return this._getArtifactInfo("action");
  }

  getArtifactCorruptions() {
    return this._getArtifactInfo("corruption");
  }

  /* affect reference on this item */
  async affectReference() {
    let list;
    if (this.type === "ability") {
      list = game.symbaroum.config.abilitiesList;
    } else if (this.type === "mysticalPower") {
      list = game.symbaroum.config.powersList;
    } else if (this.type === "trait") {
      list = game.symbaroum.config.traitsList;
    } else {
      return;
    }
    let referenceOptions = "";
    for (let [key, label] of Object.entries(list)) {
      referenceOptions += `<option value=${key}>${game.i18n.localize(label)} </option>`;
    }

    let htmlTemplate = `
        <h1> ${game.i18n.localize("ABILITYREF.DIALOG_TITLE")} </h1>
        <p> ${game.i18n.localize("ABILITYREF.DIALOG")}</p>
        <div style="display:flex">
        <div  style="flex:1"><select id="reference">${referenceOptions}</select></div>
        </div>`;
    new Dialog({
      title: game.i18n.localize("ABILITYREF.DIALOG_TITLE"),
      content: htmlTemplate,
      buttons: {
        validate: {
          label: "Validate",
          callback: (html) => {
            let selectedRef = html.find("#reference")[0].value;
            this.update({ "system.reference": selectedRef });
            return selectedRef;
          },
        },
        close: {
          label: "Close",
        },
      },
    }).render(true);
  }

  getLevel() {
    if (!this.system.hasLevels) {
      return { level: 0, lvlName: null };
    }
    let powerLvl = 0;
    let lvlName = game.i18n.localize("ABILITY.NOT_LEARNED");
    if (this.system.master.isActive) {
      powerLvl = 3;
      lvlName = game.i18n.localize("ABILITY.MASTER");
    } else if (this.system.adept.isActive) {
      powerLvl = 2;
      lvlName = game.i18n.localize("ABILITY.ADEPT");
    } else if (this.system.novice.isActive) {
      powerLvl = 1;
      lvlName = game.i18n.localize("ABILITY.NOVICE");
    }
    return { level: powerLvl, lvlName: lvlName };
  }

  getItemModifiers(combatMods, armors, weapons, abilities) {
    if (!this.isOwned || this.system.reference === undefined || this.system.reference === null) {
      return;
    }
    let ref = this.system.reference.capitalize();
    if (typeof this["getItemModifier" + ref] == "function") {
      this["getItemModifier" + ref](combatMods, armors, weapons, abilities);
    }
  }

  getAbilitiesConfig() {
    let base = {
      id: this.id,
      label: this.name,
      reference: this.system.reference,
      type: "ability",
      corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
      impeding: game.symbaroum.config.IMPEDING_NOT,
      isScripted: false,
      powerLvl: this.getLevel(),
      attributes: [],
      casting: game.symbaroum.config.CASTING,
      maintain: game.symbaroum.config.MAINTAIN_NOT,
      castingAttributeName: "cunning",
      targetText: game.i18n.localize("ABILITY.CHAT_TARGET_VICTIM"),
      package: [],
      autoParams: "",
    };
    if (!this.isOwned || this.system.reference === undefined || this.system.reference === null) {
      return base;
    }
    let ref = this.system.reference.capitalize();
    if (typeof this["abilitySetup" + ref] == "function") {
      base.isScripted = true;
      return this["abilitySetup" + ref](base);
    } else return base;
  }

  getMysticPowersConfig() {
    let base = {
      id: this.id,
      label: this.name,
      reference: this.system.reference,
      type: "mysticalPower",
      corruption: game.symbaroum.config.TEMPCORRUPTION_NORMAL,
      impeding: game.symbaroum.config.IMPEDING_MAGIC,
      isScripted: false,
      traditions: [],
      powerLvl: this.getLevel(),
      healingBonus: "",
      attributes: [],
      castingAttributeName: "resolute",
      targetText: game.i18n.localize("ABILITY.CHAT_TARGET_VICTIM"),
      package: [],
      autoParams: "",
    };
    if (!this.isOwned || this.system.reference === undefined || this.system.reference === null) {
      return base;
    }
    let ref = this.system.reference.capitalize();
    if (typeof this["mysticPowerSetup" + ref] == "function") {
      base.isScripted = true;
      return this["mysticPowerSetup" + ref](base);
    } else return base;
  }

  getTraitsConfig() {
    let base = {
      id: this.id,
      label: this.name,
      reference: this.system.reference,
      type: "trait",
      corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
      impeding: game.symbaroum.config.IMPEDING_NOT,
      casting: game.symbaroum.config.CASTING,
      maintain: game.symbaroum.config.MAINTAIN_NOT,
      isScripted: false,
      powerLvl: this.getLevel(),
      attributes: [],
      castingAttributeName: "quick",
      targetText: game.i18n.localize("ABILITY.CHAT_TARGET_VICTIM"),
      package: [],
      autoParams: "",
    };
    if (!this.isOwned || this.system.reference === undefined || this.system.reference === null) {
      return base;
    }
    let ref = this.system.reference.capitalize();
    if (typeof this["traitSetup" + ref] == "function") {
      base.isScripted = true;
      return this["traitSetup" + ref](base);
    } else return base;
  }

  get impeding() {
    if (this.system.isArmor) {
      const armorImpeding = game.symbaroum.config.IMPEDING_DEFAULTS[this.system.reference] ?? 0;
      const armorFlexible = this.system.qualities.flexible ? game.symbaroum.config.IMPEDING_DEFAULTS["flexible"] : 0;
      const armorCumbersome = this.system.qualities.cumbersome ? game.symbaroum.config.IMPEDING_DEFAULTS["cumbersome"] : 0;
      const armorImpedingBonus = (this.system.bonus.impeding ?? 0) * -1;
      return Math.max(0, armorImpeding + armorFlexible + armorCumbersome + armorImpedingBonus);
    } else {
      return 0;
    }
  }

  _getPackageFormat(label) {
    return {
      id: this.id,
      label: label ?? this.name,
      type: game.symbaroum.config.PACK_CHECK,
      member: [],
    };
  }

  _getBaseFormat() {
    return {
      id: this.id,
      label: this.name,
      reference: this.system.reference,
    };
  }

  // Reference combat modifiers
  // Armors
  _getOwnArmorBonuses(combatMods, armors) {
    for (let i = 0; i < armors.length; i++) {
      if (this.id == armors[i].id) {
        if (this.system.bonusProtection != "") {
          let base = this._getBaseFormat();
          let plus = "+";
          if (this.system.bonusProtection.charAt(0) === "+") {
            plus = "";
          }
          // NPC - cant get away from this
          let npcProt = 0;
          try {
            npcProt = Math.ceil(new Roll(this.system.bonusProtection).evaluateSync({ async: false, maximize: true }).total / 2);
          } catch (err) {
            ui.notifications?.error(`Could not evaulate armor bonus protection for ${this.name} - check bonus damage fields -` + err);
          }

          base.type = game.symbaroum.config.DAM_FIXED;
          base.alternatives = [
            {
              protectionMod: plus + this.system.bonusProtection,
              protectionModNPC: npcProt,
              displayMod: plus + this.system.bonusProtection,
            },
          ];
          combatMods.armors[armors[i].id].protectionChoices.push(base);
        }
        if (!this.system.isStackableArmor && this.system.qualities.reinforced) {
          let base = this._getBaseFormat();
          base.label = `${this.name}: ${game.i18n.localize("QUALITY.REINFORCED")}`;
          base.type = game.symbaroum.config.DAM_FIXED;
          base.alternatives = [
            {
              protectionMod: "+1d1",
              protectionModNPC: 1,
            },
          ];
          combatMods.armors[armors[i].id].protectionChoices.push(base);
        }
        if (!this.system.isStackableArmor) {
          if (this.system.qualities.flexible) {
            let base = this._getBaseFormat();
            base.label = `${this.name}: ${game.i18n.localize("QUALITY.FLEXIBLE")}`;
            base.modifier = 0; // Already calculated in total
            combatMods.armors[armors[i].id].impedingModifiers.push(base);
          }
          if (this.system.qualities.cumbersome) {
            let base = this._getBaseFormat();
            base.label = `${this.name}: ${game.i18n.localize("QUALITY.CUMBERSOME")}`;
            base.modifier = 0; // Already calcualted in total
            combatMods.armors[armors[i].id].impedingModifiers.push(base);
          }
          if (this.system.bonus.impeding) {
            let base = this._getBaseFormat();
            base.label = `${this.name}: ${game.i18n.localize("BONUS.IMPEDING_REDUCTION")}`;
            base.modifier = 0; // Already calcualted in total
            combatMods.armors[armors[i].id].impedingModifiers.push(base);
          }
        }
      } else if (this.system.isStackableArmor && !armors[i].system.isStackableArmor && this.system.isActive) {
        if (this.system.bonusProtection != "") {
          let base = this._getBaseFormat();
          let plus = "+";
          let npcProt = 0;
          try {
            npcProt = Math.ceil(new Roll(this.system.bonusProtection).evaluateSync({ async: false, maximize: true }).total / 2);
          } catch (err) {
            ui.notifications?.error(`Could not evaluate armor bonus protection for ${this.name} - check bonus damage fields -` + err);
          }
          base.type = game.symbaroum.config.DAM_FIXED;
          base.alternatives = [
            {
              protectionMod: plus + this.system.bonusProtection,
              protectionModNPC: npcProt,
              displayMod: plus + this.system.bonusProtection,
            },
          ];
          combatMods.armors[armors[i].id].protectionChoices.push(base);
        }
      }
    }
  }

  // All armor types
  getItemModifierStackable(combatMods, armors, weapons, abilities) {
    this._getOwnArmorBonuses(combatMods, armors);
  }

  getItemModifierLightarmor(combatMods, armors, weapons, abilities) {
    this._getOwnArmorBonuses(combatMods, armors);
  }

  getItemModifierMediumarmor(combatMods, armors, weapons, abilities) {
    this._getOwnArmorBonuses(combatMods, armors);
  }

  getItemModifierHeavyarmor(combatMods, armors, weapons, abilities) {
    this._getOwnArmorBonuses(combatMods, armors);
  }
  // Higher than d8
  getItemModifierSuperarmor(combatMods, armors, weapons, abilities) {
    this._getOwnArmorBonuses(combatMods, armors);
  }

  // Weapons
  _getOwnWeaponBonuses(combatMods, armors, weapons, abilities) {
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].id != this.id) {
        continue;
      }
      if (this.system.bonusDamage && this.system.bonusDamage !== "") {
        let base = this._getBaseFormat();
        base.display = game.i18n.localize("WEAPON.BONUS_DAMAGE") + ": ";
        let plus = "+";
        if (this.system.bonusDamage.charAt(0) === "+") {
          plus = "";
        }
        // NPC - cant get away from this
        let npcDam = 0;
        try {
          npcDam = Math.ceil(new Roll(this.system.bonusDamage).evaluateSync({ async: false, maximize: true }).total / 2);
        } catch (err) {
          ui.notifications?.error(`Could not evaluate weapon bonus for ${this.name} - check bonus damage fields - ` + err);
        }
        base.type = game.symbaroum.config.DAM_MOD;
        base.alternatives = [
          {
            damageMod: plus + this.system.bonusDamage,
            damageModNPC: npcDam,
            displayMod: plus + this.system.bonusDamage,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (this.system.qualities.deepImpact) {
        // Add 1
        let base = this._getBaseFormat();
        base.label = game.i18n.localize("QUALITY.DEEPIMPACT");
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = "+1";
        base.alternatives = [
          {
            damageMod: "+1d1",
            damageModNPC: 1,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (this.system.qualities.precise) {
        // Add 1
        let base = this._getBaseFormat();
        base.label = game.i18n.localize("QUALITY.PRECISE");
        base.type = game.symbaroum.config.TYPE_ROLL_MOD;
        base.modifier = 1;
        base.value = "1";
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (this.system.qualities.flaming) {
        let base = this._getBaseFormat();
        base.label = game.i18n.localize("QUALITY.FLAMING");
        base.value = game.i18n.localize("QUALITY.FLAMING");
        base.type = game.symbaroum.config.STATUS_DOT;
        base.damagePerRound = "1d4";
        base.damagePerRoundNPC = 2;
        base.duration = "1d4";
        base.durationNPC = 2;
        base.effectIcon = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "burning"));
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (this.system.qualities.massive) {
        let base = this._getBaseFormat();
        base.label = game.i18n.localize("QUALITY.MASSIVE");
        base.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
        base.type = game.symbaroum.config.DAM_FAVOUR;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
        combatMods.weapons[weapons[i].id].specialEffects.push(game.symbaroum.config.DAM_FAVOUR);
      }
      if (this.system.alternativeDamage !== "none") {
        let base = this._getBaseFormat();
        base.label = game.i18n.localize("ATTRIBUTE.MODIFIER") + " (" + game.i18n.localize("QUALITY.PRECISE") + "): ";
        base.type = game.symbaroum.config.TYPE_ALTERNATIVE_DAMAGE;
        base.AltDmgAttribute = this.system.alternativeDamage;
        base.value = this.system.alternativeDamage;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (this.system.isActive && this.system.qualities.balanced) {
        for (let i = 0; i < armors.length; i++) {
          if (!this.system.isActive || !armors[i].system.isActive || armors[i].system.isStackableArmor) {
            continue;
          }
          let base = this._getBaseFormat();
          base.label = `${this.name}: ${game.i18n.localize("QUALITY.BALANCED")}`;
          base.modifier = 1;
          this.system.isIntegrated = true;
          combatMods.armors[armors[i].id].defenseModifiers.push(base);
        }
      }
    }
  }

  // All melee weapons
  getItemModifierUnarmed(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  getItemModifier1handed(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  getItemModifierShort(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  getItemModifierLong(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  getItemModifierShield(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
    if (!this.system.isActive) {
      return;
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].id != this.id) {
        continue;
      }
      for (let i = 0; i < armors.length; i++) {
        if (!armors[i].system.isActive || armors[i].system.isStackableArmor) {
          continue;
        }
        let base = this._getBaseFormat();
        base.modifier = 1;
        combatMods.armors[armors[i].id].defenseModifiers.push(base);
      }
    }
  }

  getItemModifierHeavy(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  // All ranged
  getItemModifierRanged(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  getItemModifierThrown(combatMods, armors, weapons, abilities) {
    this._getOwnWeaponBonuses(combatMods, armors, weapons, abilities);
  }
  // End weapons

  // Start abilities & traits
  getItemModifierAlternativedamage(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage === "none") {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2 * lvl.level;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }
  getItemModifierArmored(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    // Many headed penalties
    let hasManyHeaded = this.actor.items.filter((manyheaded) => {
      return game.symbaroum.config.traitManyHeaded == manyheaded.system.reference;
    });
    if (hasManyHeaded.length > 0 && hasManyHeaded[0].getLevel().level > 1) {
      lvl.level = Math.max(0, lvl.level - hasManyHeaded[0].getLevel().level + 1);
      hasManyHeaded[0].system.isIntegrated = true;
      this.system.isIntegrated = true;
    }

    if (lvl.level == 0) return;

    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      let modifier = 0;
      // game.symbaroum.log("getItemModifierArmored", armors[i]); // TODO Remove
      if (armors[i].isNoArmor || armors[i].system.isSkin) {
        modifier = 4; // 1d4 armor
      }
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = modifier + 2 * (lvl.level - 1); // Exclude novice - it is accounted for either in the noArmor check, or by the armor itself
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].protectionChoices.push(base);
    }
  }

  getItemModifierArmoredmystic(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      if (armors[i].system.isLightArmor || armors[i].system.isMediumArmor || (armors[i].system.isHeavyArmor && lvl.level > 1)) {
        let base = this._getBaseFormat();
        base.modifierMagic = armors[i].system.impeding; // Reduce with up to current impeding
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].impedingModifiers.push(base);
      }
      if (lvl.level > 2) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_FIXED;
        base.alternatives = [
          {
            protectionMod: "+1d4",
            protectionModNPC: 2,
            displayMod: "+1d4",
          },
        ];
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].protectionChoices.push(base);
      }
    }
  }

  getItemModifierBackstab(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none") {
        continue;
      }
      let pack = this._getPackageFormat();
      let basedmg = this._getBaseFormat();
      basedmg.type = game.symbaroum.config.DAM_MOD;
      if (lvl.level < 3) {
        basedmg.value = "+1d4";
        basedmg.alternatives = [
          {
            damageMod: "+1d4",
            damageModNPC: 2,
            restrictions: [game.symbaroum.config.DAM_1STATTACK],
          },
        ];
      } else {
        // Only master gives +1d8
        basedmg.value = "+1d8";
        basedmg.alternatives = [
          {
            damageMod: "+1d8",
            damageModNPC: 4,
          },
        ];
      }
      pack.member.push(basedmg);

      let baseAtt = this._getBaseFormat();
      baseAtt.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      baseAtt.attribute = "discreet";
      pack.member.push(baseAtt);

      if (lvl.level > 1) {
        let baseBleed = this._getBaseFormat();
        baseBleed.value = game.i18n.localize("COMBAT.BLEED");
        baseBleed.type = game.symbaroum.config.STATUS_DOT;
        baseBleed.damagePerRound = "1d4";
        baseBleed.damagePerRoundNPC = 2;
        baseBleed.duration = "";
        baseBleed.durationNPC = 0;
        baseBleed.effectIcon = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "bleeding"));
        if (lvl.level == 2) {
          baseBleed.restrictions = [game.symbaroum.config.DAM_1STATTACK];
        }
        pack.member.push(baseBleed);
      }
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package.push(pack);
    }
  }

  getItemModifierBeastlore(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 2) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none") {
        continue;
      }
      let pack = this._getPackageFormat();
      let damageMod = "+1d" + (lvl.level * 2).toString();
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_MOD;
      base.value = damageMod;
      base.alternatives = [
        {
          damageMod: damageMod,
          damageModNPC: lvl.level,
        },
      ];
      pack.member.push(base);
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package.push(pack);
    }
    for (let i = 0; i < abilities.length; i++) {
      if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].hasDamage) {
        let pack = this._getPackageFormat();
        let damageMod = "+1d" + (lvl.level * 2).toString();
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = damageMod;
        base.alternatives = [
          {
            damageMod: damageMod,
            damageModNPC: lvl.level,
          },
        ];
        pack.member.push(base);
        this.system.isIntegrated = true;
        combatMods.abilities[abilities[i].id].package.push(pack);
      }
    }
  }

  getItemModifierBerserker(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    // Make this ActiveEffect - check if this aligns with existing bersker in the modules
    if (!this.actor.hasCondition("berserker") && !this.actor.getFlag(game.system.id, "berserker")) {
      this.system.isIntegrated = false;
      return;
    }

    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      if (lvl.level > 1) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_FIXED;
        base.alternatives = [
          {
            protectionMod: "+1d4",
            protectionModNPC: 2,
            displayMod: "+1d4",
          },
        ];
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].protectionChoices.push(base);
      }
      if (lvl.level < 3) {
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].specialEffects.push(game.symbaroum.config.SPECIAL_MIN_DEFENSE);
      }
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isMelee) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_MOD;
      base.value = "+1d6";
      base.alternatives = [
        {
          damageMod: "+1d6",
          damageModNPC: 3,
        },
      ];
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierBlessedshield(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    this.system.isIntegrated = !!this.actor.hasCondition("holyShield");
  }

  getItemModifierBlessings(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < abilities.length; i++) {
        if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_BLESSINGS)) {
          combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
          if (lvl.level > 2) {
            combatMods.abilities[abilities[i].id].healingBonus += "+1d4[" + this.name + "]";
            let pack = this._getPackageFormat();
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value = "+1d4";
            base.alternatives = [
              {
                damageMod: "+1d4",
                damageModNPC: 2,
              },
            ];
            pack.member.push(base);
            this.system.isIntegrated = true;
            combatMods.abilities[abilities[i].id].package.push(pack);
          }
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_BLESSINGS;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  getItemModifierChanneling(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.TEMPCORRUPTION_FAVOUR;
      this.system.isIntegrated = true;
      combatMods.corruption.push(base);
    }
  }

  getItemModifierColossal(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 2) {
      for (let i = 0; i < armors.length; i++) {
        if (armors[i].system.isStackableArmor) {
          continue;
        }
        let base = this._getBaseFormat();
        base.normal = 0;
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].damageReductions.push(base);
      }
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none") {
        continue;
      }
      let base = this._getBaseFormat();
      base.label = game.i18n.localize("QUALITY.MASSIVE");
      base.type = game.symbaroum.config.DAM_FAVOUR;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
      combatMods.weapons[weapons[i].id].specialEffects.push(game.symbaroum.config.DAM_FAVOUR);
      if (lvl.level > 1) {
        let base2 = this._getBaseFormat();
        base2.type = game.symbaroum.config.TYPE_FAVOUR;
        base2.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
        base2.favourMod = 1;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base2);
      }
    }
  }

  getItemModifierCorruptingattack(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.reference !== "unarmed") {
        continue;
      }
      let base = this._getBaseFormat();
      base.label = game.i18n.localize("TRAIT_LABEL.CORRUPTINGATTACK");
      base.type = game.symbaroum.config.CORRUPTION_DAMAGE;
      base.damage = "1d" + ((1 + lvl.level) * 2).toString();
      base.damageNPC = 1 + lvl.level;
      base.value = base.damage;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierDancingweapon(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0 || (!this.actor.hasCondition("dancingweapon") && !this.actor.getFlag(game.system.id, "dancingweapon"))) {
      return;
    }
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.attribute = "resolute";
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].attributes.push(base);
    }
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isMelee) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      base.attribute = "resolute";
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierDominate(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isMelee) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      base.attribute = "persuasive";
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierFeatofstrength(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isMelee) {
        continue;
      }
      if (lvl.level == 3 && this.actor.system.health.toughness.value <= this.actor.system.health.toughness.max / 2) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = "+1d4";
        base.alternatives = [
          {
            damageMod: "+1d4",
            damageModNPC: 2,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (lvl.level > 1 && this.actor.system.health.toughness.value <= this.actor.system.health.toughness.max / 2) {
        let base2 = this._getBaseFormat();
        base2.type = game.symbaroum.config.TYPE_FAVOUR;
        base2.condition = "conditionFeatofStrength";
        base2.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
        base2.favourMod = 1;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base2);
      }
    }
    let base3 = this._getBaseFormat();
    base3.type = game.symbaroum.config.SEC_ATT_BONUS;
    base3.value = 5;
    this.system.isIntegrated = true;
    combatMods.toughness.push(base3);
  }

  conditionFeatofStrength() {
    return weapon.attribute === "strong";
  }

  getItemModifierFeint(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < armors.length; i++) {
        if (armors[i].system.isStackableArmor) {
          continue;
        }
        let base = this._getBaseFormat();
        base.attribute = "discreet";
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].attributes.push(base);
      }
    }
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isMelee || !(weapons[i].system.qualities.precise || weapons[i].system.qualities.short)) {
        continue;
      }
      let base = this._getBaseFormat();
      base.attribute = "discreet";
      base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierHuntersinstinct(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1) return;
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isDistance) {
        continue;
      }
      let pack = this._getPackageFormat();
      let baseFav = this._getBaseFormat();
      baseFav.type = game.symbaroum.config.TYPE_FAVOUR;
      baseFav.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
      baseFav.favourMod = 1;
      pack.member.push(baseFav);
      if (lvl.level > 1) {
        let baseDmg = this._getBaseFormat();
        baseDmg.type = game.symbaroum.config.DAM_MOD;
        (baseDmg.value = "+1d4"),
          (baseDmg.alternatives = [
            {
              damageMod: "+1d4",
              damageModNPC: 2,
            },
          ]);
        pack.member.push(baseDmg);
      }
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package.push(pack);
    }
  }

  getItemModifierIronfist(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isMelee) {
        continue;
      }
      if (lvl.level > 0) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
        base.attribute = "strong";
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (lvl.level == 2) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = "+1d4";
        base.alternatives = [
          {
            damageMod: "+1d4",
            damageModNPC: 2,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (lvl.level == 3) {
        let pack = this._getPackageFormat();
        pack.label = game.i18n.localize("ABILITY_LABEL.IRON_FIST");
        pack.type = game.symbaroum.config.PACK_RADIO;
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_RADIO;
        if (this.actor.type === "player") {
          pack.defaultSelect = "+1d4";
        } else {
          pack.defaultSelect = "2";
        }
        base.alternatives = [
          {
            label: game.i18n.localize("ABILITY_LABEL.IRON_FIST"),
            damageMod: "+1d8",
            damageModNPC: 4,
            restrictions: [game.symbaroum.config.DAM_ACTIVE],
          },
          {
            label: game.i18n.localize("ABILITY_LABEL.IRON_FIST"),
            damageMod: "+1d4",
            damageModNPC: 2,
            restrictions: [game.symbaroum.config.DAM_NOTACTIVE],
          },
        ];
        pack.member.push(base);
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package.push(pack);
      }
    }
  }

  getItemModifierKnifeplay(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.qualities.knifePlayCompatibility) {
        continue;
      }
      let base = this._getBaseFormat();
      base.attribute = "quick";
      base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
      if (lvl.level > 1) {
        let base2 = this._getBaseFormat();
        base2.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
        base2.modifier = 1;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base2);
        combatMods.weapons[weapons[i].id].maxAttackNb += 1;
      }
    }
  }

  getItemModifierLeader(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < abilities.length; i++) {
      if (combatMods.abilities[abilities[i].id].type === "mysticalPower") {
        let base = this._getBaseFormat();
        base.attribute = "persuasive";
        base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
        this.system.isIntegrated = true;
        combatMods.abilities[abilities[i].id].attributes.push(base);
      }
    }
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.lvl = lvl;
      base.type = game.symbaroum.config.TYPE_ALT_RESIST_ATTR_RESOLUTE;
      base.attribute = "persuasive";
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierManatarms(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    let hasArmored = this.actor.items.filter((armored) => {
      return game.symbaroum.config.abilityArmor.includes(armored.system.reference);
    });
    for (let i = 0; i < armors.length; i++) {
      if ((hasArmored.length == 0 && armors[i].isNoArmor) || armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2;
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].protectionChoices.push(base);
      if (lvl.level > 1) {
        base = this._getBaseFormat();
        base.modifier = armors[i].impeding; // Reduce with up to current impeding
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].impedingModifiers.push(base);
      }
    }
  }

  getItemModifierMarksman(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || weapons[i].system.reference != "ranged") {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierNaturalwarrior(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || weapons[i].system.reference !== "unarmed") {
        continue;
      }
      if (lvl.level > 0) {
        let base = this._getBaseFormat();
        base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
        base.diceUpgrade = 2;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
      if (lvl.level > 1) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
        base.modifier = 1;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
        combatMods.weapons[weapons[i].id].maxAttackNb += 1;
      }
      if (lvl.level > 2) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = "+1d6";
        base.alternatives = [
          {
            damageMod: "+1d6",
            damageModNPC: 3,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
    }
  }

  getItemModifierNaturalweapon(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || weapons[i].system.reference !== "unarmed") {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2 * lvl.level;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierNopainthreshold(combatMods, armors, weapons, abilities) {
    let base = this._getBaseFormat();
    base.type = game.symbaroum.config.NO_TRESHOLD;
    this.system.isIntegrated = true;
    combatMods.toughness.push(base);
  }

  getItemModifierPoisonresilient(combatMods, armors, weapons, abilities) {
    let boonLevel = this.system.level;
    if (boonLevel < 1) return;
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.lvl = boonLevel;
      base.type = game.symbaroum.config.TYPE_ROLL_MOD;
      base.modifier = boonLevel;
      base.value = boonLevel.toString();
      base.powers = ["poisoner", "poisonous"];
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierPolearmmastery(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isMelee || !weapons[i].system.qualities.long) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierRapidfire(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.reference !== "ranged") {
        continue;
      }
      let attackNb = 1;
      if (lvl.level > 2) attackNb = 2;
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
      base.modifier = attackNb;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
      combatMods.weapons[weapons[i].id].maxAttackNb += attackNb;
    }
  }

  getItemModifierRapidreflexes(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1) return;
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.lvl = lvl;
      base.type = game.symbaroum.config.TYPE_DMG_AVOIDING;
      base.powers = game.symbaroum.config.rapidReflexesResistList;
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierRevenantstrike(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1 || (!this.actor.hasCondition("revenantstrike") && !this.actor.getFlag(game.system.id, "revenantstrike"))) {
      return;
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.qualities?.desecrated) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_MOD;
      (base.value = lvl.level > 2 ? "+1d8" : "+1d4"),
        (base.alternatives = [
          {
            damageMod: lvl.level > 2 ? "+1d8" : "+1d4",
            damageModNPC: lvl.level > 2 ? 4 : 2,
          },
        ]);
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierRobust(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();

    // Many headed penalties
    let hasManyHeaded = this.actor.items.filter((manyheaded) => {
      return game.symbaroum.config.traitManyHeaded == manyheaded.system.reference;
    });
    if (hasManyHeaded.length > 0 && hasManyHeaded[0].getLevel().level > 1) {
      lvl.level = Math.max(0, lvl.level - hasManyHeaded[0].getLevel().level + 1);
      hasManyHeaded[0].system.isIntegrated = true;
      this.system.isIntegrated = true;
    }

    if (lvl.level == 0) return;

    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_MOD;
      base.alternatives = [
        {
          protectionMod: "+1d" + (2 + lvl.level * 2),
          protectionModNPC: 1 + lvl.level,
        },
      ];
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].protectionChoices.push(base);
      base = this._getBaseFormat();
      base.modifier = -1 * lvl.level - 1; // Reduce with up to current impeding
      combatMods.armors[armors[i].id].defenseModifiers.push(base);
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isMelee) {
        continue;
      }
      let pack = this._getPackageFormat();
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_MOD;
      base.value = "+1d" + (2 + lvl.level * 2);
      base.alternatives = [
        {
          damageMod: "+1d" + (2 + lvl.level * 2),
          damageModNPC: 1 + lvl.level,
          restrictions: [game.symbaroum.config.DAM_1STATTACK],
        },
      ];
      pack.member.push(base);
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package.push(pack);
    }
  }

  getItemModifierShieldfighter(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let haveShieldEquipped = this.actor.items.filter((element) => element.system?.reference === "shield" && element.system.isActive);
      if (haveShieldEquipped.length === 0) {
        continue;
      }
      let base = this._getBaseFormat();
      base.modifier = 1;
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].defenseModifiers.push(base);
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.isMelee && ["1handed", "short", "unarmed"].includes(weapons[i].system.reference)) {
        let haveShieldEquipped = this.actor.items.filter((element) => element.system?.reference === "shield" && element.system.isActive);
        if (haveShieldEquipped.length === 0) {
          continue;
        }
        // Upgrade weapon
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
        base.diceUpgrade = 2;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      } else if (weapons[i].system.reference === "shield" && lvl.level > 2) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
        base.diceUpgrade = 4;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
    }
  }

  getItemModifierSixthsense(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    // Level 2
    if (lvl.level > 1) {
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.TYPE_INITIATIVE;
      base.attribute = "vigilant";
      this.system.isIntegrated = true;
      combatMods.initiative.push(base);
    }
    if (lvl.level > 1) {
      for (let i = 0; i < armors.length; i++) {
        if (armors[i].system.isStackableArmor) {
          continue;
        }
        let base = this._getBaseFormat();
        base.attribute = "vigilant";
        base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].attributes.push(base);
      }
    }
    // Level 1
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isDistance) {
        continue;
      }
      let base = this._getBaseFormat();
      base.attribute = "vigilant";
      base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }
  //TODO sorcery level>1
  getItemModifierSorcery(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < abilities.length; i++) {
        if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].corruption == game.symbaroum.config.TEMPCORRUPTION_NORMAL) {
          combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_TESTFORONE;
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_SORCERY;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  getItemModifierSpiritform(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.normal = 0.5;
      base.poison = 0;
      base.bleeding = 0;
      if (lvl.level > 1) {
        base.mysticArm = 0.5;
        base.mysticIgnArm = 0.5;
        base.elemental = 0.5;
        base.holy = 0.5;
        base.mysticalWeapon = 0.5;
      }
      if (lvl.level > 2) {
        base.normal = 0;
        base.elemental = 0;
      }
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierStafffighting(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    let haveStaffEquipped = this.actor.items.filter((element) => element.system.isWeapon && element.system.qualities.long && element.system.isActive);
    if (haveStaffEquipped.length) {
      let mod = 1;
      if (this.actor.items.filter((element) => element.system.isWeapon && element.system.isActive && element.system.qualities.staffFightingCompatibility).length) mod = 2;
      for (let i = 0; i < armors.length; i++) {
        if (armors[i].system.isStackableArmor) {
          continue;
        }
        let base = this._getBaseFormat();
        base.modifier = mod;
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].defenseModifiers.push(base);
      }
    }
  }

  getItemModifierStaffmagic(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    let activeStaff = false;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.isMelee && ["long"].includes(weapons[i].system.reference) && weapons[i].system.qualities.staffMagicCompatibility) {
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_MOD;
        base.value = "+1d4";
        base.alternatives = [
          {
            damageMod: "+1d4",
            damageModNPC: 2,
          },
        ];
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
        activeStaff = weapons[i].system.isActive || activeStaff;
      }
    }
    if (lvl.level > 1 && activeStaff) {
      for (let j = 0; j < abilities.length; j++) {
        if (combatMods.abilities[abilities[j].id].type === "mysticalPower" && combatMods.abilities[abilities[j].id].traditions.includes(game.symbaroum.config.TRAD_STAFFM)) {
          combatMods.abilities[abilities[j].id].corruption = lvl.level == 2 ? game.symbaroum.config.TEMPCORRUPTION_FAVOUR : game.symbaroum.config.TEMPCORRUPTION_NONE;
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_STAFFM;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  getItemModifierSteadfast(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1) return;
    for (let i = 0; i < armors.length; i++) {
      // Do we apply it if they just wear stackable armor?
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.lvl = lvl;
      base.type = game.symbaroum.config.TYPE_FAVOUR;
      base.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
      base.favourMod = -1;
      base.powers = game.symbaroum.config.steadFastNovResistList;
      if (lvl.level > 1) {
        base.powers = base.powers.concat(game.symbaroum.config.steadFastAdeptResistList);
      }
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierSteelthrow(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || weapons[i].system.reference != "thrown") {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
      if (lvl.level > 1) {
        let attackNb = 1;
        if (lvl.level > 2) attackNb = 2;
        let base2 = this._getBaseFormat();
        base2.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
        base2.modifier = attackNb;
        combatMods.weapons[weapons[i].id].package[0].member.push(base2);
        combatMods.weapons[weapons[i].id].maxAttackNb += attackNb;
      }
    }
  }

  getItemModifierStronggift(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 2) return;
    let base = this._getBaseFormat();
    base.type = game.symbaroum.config.SEC_ATT_MULTIPLIER;
    base.value = 2;
    combatMods.corruption.push(base);
    let base2 = this._getBaseFormat();
    base2.type = game.symbaroum.config.THRESHOLD_MULTIPLIER;
    base2.value = 1;
    this.system.isIntegrated = true;
    combatMods.corruption.push(base2);
  }

  getItemModifierSturdy(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    let base = this._getBaseFormat();
    base.type = game.symbaroum.config.SEC_ATT_MULTIPLIER;
    if (lvl.level == 1) base.value = 1.5;
    else base.value = lvl.level;
    this.system.isIntegrated = true;
    combatMods.toughness.push(base);
  }

  getItemModifierSurvivalinstinct(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 2) return;
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_FIXED;
      base.alternatives = [
        {
          protectionMod: "+1d4",
          protectionModNPC: 2,
          displayMod: "+1d4",
        },
      ];
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].protectionChoices.push(base);
    }
  }

  getItemModifierSwarm(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < armors.length; i++) {
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.normal = 0.5;
      base.mysticArm = 0.5;
      base.mysticIgnArm = 0.5;
      base.elemental = 0.5;
      base.holy = 0.5;
      base.mysticalWeapon = 0.5;
      base.poison = 0;
      base.bleeding = 0;
      if (lvl.level > 2) {
        base.normal = 0.25;
        base.mysticArm = 0.25;
        base.mysticIgnArm = 0.25;
        base.elemental = 0.25;
        base.holy = 0.25;
        base.mysticalWeapon = 0.25;
      }
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierSwordsaint(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.qualities.swordSaintCompatibility) {
        // Upgrade weapon
        let base = this._getBaseFormat();
        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
        base.diceUpgrade = lvl.level == 3 ? 4 : 2;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
    }
  }

  getItemModifierTactician(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    let base = this._getBaseFormat();
    base.attribute = "cunning";
    base.type = game.symbaroum.config.TYPE_INITIATIVE;
    combatMods.initiative.push(base);
    if (lvl.level > 1) {
      for (let i = 0; i < armors.length; i++) {
        // Do we apply it if they just wear stackable armor?
        if (armors[i].system.isStackableArmor) {
          continue;
        }
        base = this._getBaseFormat();
        base.attribute = "cunning";
        base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
        this.system.isIntegrated = true;
        combatMods.armors[armors[i].id].attributes.push(base);
      }
    }
    if (lvl.level > 2) {
      for (let i = 0; i < weapons.length; i++) {
        // Can use cunning for attacks for any attack, except heavy - as example an undead, this includes alternate damage
        if (weapons[i].system.reference == "heavy") {
          continue;
        }
        base = this._getBaseFormat();
        base.attribute = "cunning";
        base.type = game.symbaroum.config.TYPE_ATTRIBUTE;
        this.system.isIntegrated = true;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
    }
  }

  getItemModifierTheurgy(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < abilities.length; i++) {
        if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_THEURGY)) {
          combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
          if (lvl.level > 2) {
            combatMods.abilities[abilities[i].id].healingBonus += "+1d4[" + this.name + "]";
            let pack = this._getPackageFormat();
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_MOD;
            base.value = "+1d4";
            base.alternatives = [
              {
                damageMod: "+1d4",
                damageModNPC: 2,
              },
            ];
            pack.member.push(base);
            this.system.isIntegrated = true;
            combatMods.abilities[abilities[i].id].package.push(pack);
          }
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_THEURGY;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  getItemModifierThoroughlycorrupt(combatMods, armors, weapons, abilities) {
    let base = this._getBaseFormat();
    base.type = game.symbaroum.config.NO_TRESHOLD;
    this.system.isIntegrated = true;
    combatMods.corruption.push(base);
  }

  getItemModifierTwinattack(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    for (let i = 0; i < weapons.length; i++) {
      if (!weapons[i].system.isMelee || !["1handed", "short"].includes(weapons[i].system.reference)) {
        continue;
      }
      let twoWeapon = this.actor.items.filter((element) => ["1handed", "short"].includes(element.system?.reference) && element.system.isActive);
      if (twoWeapon.length < 2) {
        return;
      }

      let base = this._getBaseFormat();
      base.modifier = 1;
      base.type = game.symbaroum.config.TYPE_ATTACKINCREASE;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
      if (this.actor.type === "monster") combatMods.weapons[weapons[i].id].maxAttackNb += 1;

      if (lvl.level < 3 || this.actor.type === "player" || !game.settings.get("symbaroum", "showNpcAttacks")) {
        // Continue - do not want to indent further
        continue;
      }

      /* Calculations only for NPCs - can't easily be judged otherwise */
      // Master ability
      // Look at all active weapons of 1handed or short
      // If the current weapon is the first 1d6 or 1d8 base damage one - upgrade
      // If the current weapon is the first (or potentially second) 1d6 base damage one - upgrade
      let foundd8 = 0;
      let foundd6 = 0;
      let spared6weap = null;
      for (let j = 0; j < twoWeapon.length; j++) {
        if (twoWeapon[j].system.reference === "short") {
          foundd6++;
          if (foundd6 === 1 && twoWeapon[j].id == weapons[i].id) {
            base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
            // First short, upgrade
          } else if (foundd6 === 2 && spared6weap === null && twoWeapon[j].id === weapons[i].id) {
            // Store away this and if there is no d8 found once we are done, upgrade d8
            spared6weap = twoWeapon[j];
          }
        } else if (twoWeapon[j].system.reference === "1handed") {
          foundd8++;
          if (foundd8 === 1 && twoWeapon[j].id == weapons[i].id) {
            base = this._getBaseFormat();
            base.type = game.symbaroum.config.DAM_DICEUPGRADE;
            base.diceUpgrade = 2;
            combatMods.weapons[weapons[i].id].package[0].member.push(base);
          }
        }
      }
      if (foundd8 === 0 && spared6weap != null) {
        // Only wielding d6 weapons and this is the last d6 weapon, so upgrade it too
        base.type = game.symbaroum.config.DAM_DICEUPGRADE;
        base.diceUpgrade = 2;
        combatMods.weapons[weapons[i].id].package[0].member.push(base);
      }
    }
  }

  getItemModifierTwohandedforce(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;

    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.reference != "heavy") {
        continue;
      }
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_DICEUPGRADE;
      base.diceUpgrade = 2;
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package[0].member.push(base);
    }
  }

  getItemModifierUndead(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1) return;
    for (let i = 0; i < armors.length; i++) {
      // Do we apply it if they just wear stackable armor?
      if (armors[i].system.isStackableArmor) {
        continue;
      }
      let base = this._getBaseFormat();
      base.poison = 0;
      base.bleeding = 0;
      if (lvl.level > 1) {
        base.normal = 0.5;
        base.elemental = 0.5;
        base.mysticArm = 0.5;
      }
      if (lvl.level > 2) {
        base.mysticIgnArm = 0.5;
      }
      this.system.isIntegrated = true;
      combatMods.armors[armors[i].id].damageReductions.push(base);
    }
  }

  getItemModifierWitchcraft(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < abilities.length; i++) {
        if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_WITCHCRAFT)) {
          combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_WITCHCRAFT;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  getItemModifierWitchhammer(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level < 1 || (!this.actor.hasCondition("witchhammer") && !this.actor.getFlag(game.system.id, "witchhammer"))) {
      return;
    }
    for (let i = 0; i < weapons.length; i++) {
      if (weapons[i].system.alternativeDamage !== "none" || !weapons[i].system.isMelee) {
        continue;
      }
      let pack = this._getPackageFormat();
      pack.label = game.i18n.localize("POWER_LABEL.WITCH_HAMMER");
      pack.type = game.symbaroum.config.PACK_RADIO;
      let base = this._getBaseFormat();
      base.type = game.symbaroum.config.DAM_RADIO;
      if (this.actor.type === "player") {
        pack.defaultSelect = "+1d4";
      } else {
        pack.defaultSelect = "2";
      }
      base.alternatives = [
        {
          label: game.i18n.localize("POWER_LABEL.WITCH_HAMMER"),
          damageMod: "+1d4",
          damageModNPC: 2,
          restrictions: [game.symbaroum.config.DAM_ACTIVE],
        },
        {
          label: game.i18n.localize("POWER_LABEL.WITCH_HAMMER"),
          damageMod: "+1d" + (4 + lvl.level * 2).toString(),
          damageModNPC: 2 + lvl.level,
          restrictions: [game.symbaroum.config.DAM_NOTACTIVE],
        },
      ];
      pack.member.push(base);
      this.system.isIntegrated = true;
      combatMods.weapons[weapons[i].id].package.push(pack);
    }
  }

  getItemModifierWizardry(combatMods, armors, weapons, abilities) {
    let lvl = this.getLevel();
    if (lvl.level == 0) return;
    if (lvl.level > 1) {
      for (let i = 0; i < abilities.length; i++) {
        if (combatMods.abilities[abilities[i].id].type === "mysticalPower" && combatMods.abilities[abilities[i].id].traditions.includes(game.symbaroum.config.TRAD_WIZARDRY)) {
          combatMods.abilities[abilities[i].id].corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
          if (lvl.level > 2) {
            let pack = this._getPackageFormat();
            let base = this._getBaseFormat();
            base.type = game.symbaroum.config.TYPE_FAVOUR;
            base.value = game.i18n.localize("DIALOG.FAVOUR_FAVOUR");
            base.favourMod = 1;
            pack.member.push(base);
            this.system.isIntegrated = true;
            combatMods.abilities[abilities[i].id].package.push(pack);
          }
        }
      }
    }
    let base = this._getBaseFormat();
    base.value = game.symbaroum.config.TRAD_WIZARDRY;
    base.level = lvl.level;
    this.system.isIntegrated = true;
    combatMods.traditions.push(base);
  }

  //MysticPowers
  mysticPowerSetupAnathema(base) {
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY, game.symbaroum.config.TRAD_STAFFM];
    base.getTarget = true;
    base.targetMandatory = true;
    base.targetResistAttribute = "resolute";
    base.introText = game.i18n.localize("POWER_ANATHEMA.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("POWER_ANATHEMA.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_ANATHEMA.CHAT_FAILURE");
    base.maintain = game.symbaroum.config.MAINTAIN_NOT;
    base.casting = game.symbaroum.config.CASTING_RES;

    if (base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
    return base;
  }

  mysticPowerSetupBrimstonecascade(base) {
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
    base.hasDamage = true;
    base.damageDice = "1d12";
    base.avoidDamageDice = "1d6";
    base.damageType = {
      mysticArm: true,
    };
    base.getTarget = true;
    base.targetMandatory = true;
    base.targetResistAttribute = "quick";
    base.targetImpeding = true;
    base.introText = game.i18n.localize("POWER_BRIMSTONECASC.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_BRIMSTONECASC.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("POWER_BRIMSTONECASC.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_BRIMSTONECASC.CHAT_FAILURE");
    base.casting = game.symbaroum.config.CASTING_RES;
    if (base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
    base.rollFailedFSmod = {
      damageDice: "1d6",
      avoidDamageDice: "0d0",
    };
    return base;
  }

  mysticPowerSetupBendwill(base) {
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_WITCHCRAFT];
    base.targetResistAttribute = "resolute";
    base.getTarget = true;
    base.targetMandatory = true;
    base.casting = game.symbaroum.config.CASTING_RES;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "bendwill"))];
    base.introText = game.i18n.localize("POWER_BENDWILL.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_BENDWILL.CHAT_INTRO_M");
    base.resultTextSuccess = game.i18n.localize("POWER_BENDWILL.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_BENDWILL.CHAT_FAILURE");
    base.finalText = "";
    return base;
  }

  mysticPowerSetupBlackbolt(base) {
    base.traditions = [game.symbaroum.config.TRAD_SORCERY];
    base.targetResistAttribute = "quick";
    base.hasDamage = true;
    base.getTarget = true;
    base.targetMandatory = true;
    base.targetImpeding = true;
    base.introText = game.i18n.localize("POWER_BLACKBOLT.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_BLACKBOLT.CHAT_INTRO");
    base.resultTextSuccessT = game.i18n.localize("POWER_BLACKBOLT.CHAT_SUCCESS");
    base.resultTextFailT = game.i18n.localize("POWER_BLACKBOLT.CHAT_FAILURE");
    base.damageDice = "1d6";
    base.damageType = {
      mystic: true,
    };
    base.addTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "paralysis"))];
    base.ignoreArm = true;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.casting = game.symbaroum.config.CASTING_RES;

    if (base.powerLvl.level > 1) base.chain = game.symbaroum.config.CHAIN;
    return base;
  }

  mysticPowerSetupBlessedshield(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.traditions = [game.symbaroum.config.TRAD_THEURGY];
    base.addCasterEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "holyShield"))];
    base.introText = game.i18n.localize("POWER_BLESSEDSHIELD.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("POWER_BLESSEDSHIELD.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_BLESSEDSHIELD.CHAT_FAILURE");
    if (base.powerLvl.level > 1) {
      base.multipleTargets = true;
      base.multipleTargetsNb = base.powerLvl.level - 1;
    }
    return base;
  }

  mysticPowerSetupConfusion(base) {
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_TROLLS];
    base.targetResistAttribute = "resolute";
    base.getTarget = true;
    base.targetMandatory = true;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.casting = game.symbaroum.config.CASTING_RES;
    base.confusion = true;
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "confusion"))];
    return base;
  }

  mysticPowerSetupCurse(base) {
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.getTarget = true;
    base.targetMandatory = true;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
    base.resultText = game.i18n.localize("POWER_CURSE.CHAT_SUCCESS_N");
    if (base.powerLvl.level == 2) {
      base.resultText = game.i18n.localize("POWER_CURSE.CHAT_SUCCESS_A");
    } else if (base.powerLvl.level == 3) {
      base.resultText = game.i18n.localize("POWER_CURSE.CHAT_SUCCESS_M");
    }
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.introText = game.i18n.localize("POWER_CURSE.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_CURSE.CHAT_INTRO_M");
    base.resultTextSuccess = base.resultText;
    base.resultTextFail = game.i18n.localize("POWER_CURSE.CHAT_FAILURE");
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "curse"))];
    base.rollFailedFSmod = {
      finalText: game.i18n.localize("POWER_CURSE.CHAT_FAIL_FINAL"),
    };
    return base;
  }

  mysticPowerSetupDancingweapon(base) {
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.traditions = [game.symbaroum.config.TRAD_TROLLS, game.symbaroum.config.TRAD_STAFFM];
    base.corruption = false;
    base.gmOnlyChatResultNPC = true;
    base.flagTest = "dancingweapon";
    base.flagPresentFSmod = {
      introText: game.i18n.localize("POWER_DANCINGWEAPON.CHAT_DEACTIVATE"),
      resultTextSuccess: game.i18n.localize("POWER_DANCINGWEAPON.CHAT_RESULT_DEACTIVATE"),
      corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
      removeCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "dancingweapon"))],
    };
    base.flagNotPresentFSmod = {
      flagData: base.powerLvl.level,
      introText: game.i18n.localize("POWER_DANCINGWEAPON.CHAT_ACTIVATE"),
      resultTextSuccess: game.i18n.localize("POWER_DANCINGWEAPON.CHAT_RESULT_ACTIVATE"),
      addCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "dancingweapon"))],
    };
    return base;
  }

  mysticPowerSetupEarthshot(base) {
    base.casting = game.symbaroum.config.CASTING_RES;
    base.getTarget = true;
    base.targetMandatory = true;
    base.targetResistAttribute = "quick";
    base.targetImpeding = true;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.traditions = [game.symbaroum.config.TRAD_BLESSINGS];
    base.hasDamage = true;
    base.damageDice = "1d8";
    if (base.powerLvl.level > 2) {
      base.ignoreArm = true;
    }
    return base;
  }

  mysticPowerSetupEntanglingvines(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.casting = game.symbaroum.config.CASTING;
    base.targetResistAttribute = "strong";
    base.hasDamage = base.powerLvl.level === 3;
    base.damageDice = "1d6";
    base.damageType = {
      mysticIgnArm: true,
    };
    base.introTextMaintain = game.i18n.localize("POWER_ENTANGLINGVINES.CHAT_INTRO_M");
    base.resultTextSuccess = game.i18n.localize("POWER_ENTANGLINGVINES.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_ENTANGLINGVINES.CHAT_FAILURE");
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "entanglingvines"))];
    base.ignoreArm = true;
    return base;
  }

  mysticPowerSetupFlamewall(base) {
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.casting = game.symbaroum.config.CASTING;
    return base;
  }

  mysticPowerSetupHolyaura(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.traditions = [game.symbaroum.config.TRAD_THEURGY];
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.introText = game.i18n.localize("POWER_HOLYAURA.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_HOLYAURA.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("POWER_HOLYAURA.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_HOLYAURA.CHAT_FAILURE");
    base.activelyMaintaninedCasterEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "holyaura"))];
    let auraDamage = "1d6";
    let auraHeal = "1d4";
    if (base.powerLvl.level == 2) {
      auraDamage = "1d8";
    } else if (base.powerLvl.level == 3) {
      auraDamage = "1d10";
      auraHeal = "1d6";
    }
    base.finalTextSucceed = game.i18n.localize("COMBAT.DAMAGE") + auraDamage;
    if (base.powerLvl.level > 1) {
      base.finalTextSucceed += game.i18n.localize("POWER_HOLYAURA.HEALING") + auraHeal;
    }
    return base;
  }

  mysticPowerSetupInheritwound(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.maintain = game.symbaroum.config.MAINTAIN_NOT;
    base.getTarget = true;
    base.targetMandatory = true;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT, game.symbaroum.config.TRAD_THEURGY];
    base.healedToken = game.symbaroum.config.TARGET_TOKEN;
    base.introText = game.i18n.localize("POWER_INHERITWOUND.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("POWER_INHERITWOUND.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_INHERITWOUND.CHAT_FAILURE");
    base.healFormulaSucceed = base.powerLvl.level > 1 ? "1d8" : "1d6";
    base.damageType = {
      mysticIgnArm: true,
    };
    base.targetText = game.i18n.localize("ABILITY_MEDICUS.CHAT_TARGET");
    return base;
  }

  mysticPowerSetupLarvaeboils(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.targetResistAttribute = "strong";
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
    base.hasDamage = true;
    base.damageDice = "1d" + (2 * base.powerLvl.level + 2).toString();
    base.damageType = {
      mysticIgnArm: true,
    };
    base.introText = game.i18n.localize("POWER_LARVAEBOILS.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_LARVAEBOILS.CHAT_INTRO_M");
    base.resultTextSuccess = game.i18n.localize("POWER_LARVAEBOILS.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_LARVAEBOILS.CHAT_FAILURE");
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "larvaeboils"))];
    base.ignoreArm = true;
    return base;
  }

  mysticPowerSetupLayonhands(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.getTarget = true;
    base.targetMandatory = true;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT, game.symbaroum.config.TRAD_THEURGY];
    base.healFormulaSucceed = "1d6";
    if (base.powerLvl.level > 1) {
      base.healFormulaSucceed = "1d8";
      base.removeTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "poison")), foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "bleeding"))];
    }
    base.healedToken = game.symbaroum.config.TARGET_TOKEN;
    base.targetText = game.i18n.localize("ABILITY_MEDICUS.CHAT_TARGET");

    if (base.powerLvl.level > 2) {
      base.preDialogFunction = preDialogLayonHands;
    }
    return base;
  }

  mysticPowerSetupLevitate(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY];
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.addCasterEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "fly"))];
    if (base.powerLvl.level > 1) {
      base.getTarget = true;
      base.targetResistAttribute = "strong";
      base.casting = game.symbaroum.config.CASTING_RES;
      base.addTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "fly"))];
    }
    return base;
  }

  mysticPowerSetupMaltransformation(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
    base.casting = game.symbaroum.config.CASTING_RES;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.targetResistAttribute = "resolute";
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "maltransformation"))];
    return base;
  }

  mysticPowerSetupMindthrow(base) {
    base.getTarget = true;
    base.targetResistAttribute = "quick";
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY];
    base.targetPresentFSmod = {
      hasDamage: true,
      casting: game.symbaroum.config.CASTING_RES,
      damageDice: "1d8",
      targetImpeding: true,
      damageType: {
        mysticArm: true,
      },
    };
    if (base.powerLvl.level > 2) {
      base.maintain = game.symbaroum.config.MAINTAIN;
    }
    return base;
  }

  mysticPowerSetupPriosburningglass(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.getTarget = true;
    base.targetMandatory = true;
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.traditions = [game.symbaroum.config.TRAD_THEURGY];
    base.introText = game.i18n.localize("POWER_PRIOSBURNINGGLASS.CHAT_INTRO");
    base.hasDamage = true;
    base.askCorruptedTarget = true;
    if (base.powerLvl.level === 1) {
      base.damageDice = "1d6";
      base.targetFullyCorruptedFSmod = {
        damageDice: "1d8",
      };
    } else {
      base.damageDice = "1d8";
      base.targetFullyCorruptedFSmod = {
        damageDice: "1d12",
      };
    }
    base.damageType = {
      holy: true,
      mysticArm: true,
    };
    if (base.powerLvl.level === 3) {
      base.targetFullyCorruptedFSmod.finalTextSucceed = game.i18n.localize("POWER_PRIOSBURNINGGLASS.CHAT_EXTRA");
    }
    return base;
  }

  mysticPowerSetupRevenantstrike(base) {
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.gmOnlyChatResultNPC = true;
    base.flagTest = "revenantstrike";
    base.flagPresentFSmod = {
      introText: game.i18n.localize("POWER_REVENANTSTRIKE.CHAT_DEACTIVATE"),
      resultTextSuccess: game.i18n.localize("POWER_REVENANTSTRIKE.CHAT_RESULT_DEACTIVATE"),
      corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
      removeCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "revenantstrike"))],
    };
    base.flagNotPresentFSmod = {
      flagData: base.powerLvl.level,
      introText: game.i18n.localize("POWER_REVENANTSTRIKE.CHAT_ACTIVATE"),
      addCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "revenantstrike"))],
    };
    base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize("POWER_REVENANTSTRIKE.CHAT_RESULT");
    return base;
  }

  mysticPowerSetupTormentingspirits(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.getTarget = true;
    base.targetMandatory = true;
    base.maintain = game.symbaroum.config.MAINTAIN;
    base.traditions = [game.symbaroum.config.TRAD_WITCHCRAFT];
    base.isAlternativeDamage = true;
    base.alternativeDamageAttribute = "resolute";
    base.introText = game.i18n.localize("POWER_TORMENTINGSPIRITS.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("POWER_TORMENTINGSPIRITS.CHAT_INTRO_M");
    base.resultTextSuccess = game.i18n.localize("POWER_TORMENTINGSPIRITS.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("POWER_TORMENTINGSPIRITS.CHAT_FAILURE");
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "tormentingspirits"))];

    if (base.powerLvl.level > 1) {
      base.hasDamage = true;
      base.damageDice = "1d" + (2 * base.powerLvl.level).toString();
      base.ignoreArm = true;
      base.damageType = {
        mysticIgnArm: true,
      };
    }
    return base;
  }

  mysticPowerSetupUnnoticeable(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.traditions = [game.symbaroum.config.TRAD_WIZARDRY, game.symbaroum.config.TRAD_THEURGY];
    base.gmOnlyChatResultNPC = true;
    base.addCasterEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "unnoticeable"))];
    return base;
  }

  mysticPowerSetupWitchhammer(base) {
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.gmOnlyChatResultNPC = true;
    base.flagTest = "witchhammer";
    base.traditions = [game.symbaroum.config.TRAD_THEURGY];
    base.flagPresentFSmod = {
      introText: game.i18n.localize("POWER_WITCHHAMMER.CHAT_DEACTIVATE"),
      resultTextSuccess: game.i18n.localize("POWER_WITCHHAMMER.CHAT_RESULT_DEACTIVATE"),
      corruption: game.symbaroum.config.TEMPCORRUPTION_NONE,
      removeCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "witchhammer"))],
    };
    base.flagNotPresentFSmod = {
      flagData: base.powerLvl.level,
      introText: game.i18n.localize("POWER_WITCHHAMMER.CHAT_ACTIVATE"),
      addCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "witchhammer"))],
    };
    base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize("POWER_WITCHHAMMER.CHAT_RESULT");
    return base;
  }

  // ********************************************* ABILITIES *****************************************************

  abilitySetupAcrobatics(base) {
    base.castingAttributeName = "quick";
    base.impeding = game.symbaroum.config.IMPEDING_MOVE;
    return base;
  }

  abilitySetupArtifactcrafting(base) {
    return base;
  }

  abilitySetupAlchemy(base) {
    return base;
  }

  abilitySetupBeastlore(base) {
    return base;
  }

  abilitySetupBerserker(base) {
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.gmOnlyChatResultNPC = true;
    base.flagTest = "berserker";
    base.flagPresentFSmod = {
      introText: game.i18n.localize("ABILITY_BERSERKER.CHAT_DEACTIVATE"),
      resultTextSuccess: game.i18n.localize("ABILITY_BERSERKER.CHAT_RESULT_DEACTIVATE"),
      removeCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "berserker"))],
    };
    base.flagNotPresentFSmod = {
      flagData: base.powerLvl.level,
      introText: game.i18n.localize("ABILITY_BERSERKER.CHAT_ACTIVATE"),
      addCasterEffect: [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "berserker"))],
    };
    if (base.powerLvl.level == 2) base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize("ABILITY_BERSERKER.CHAT_RESULT_LVL2");
    else if (base.powerLvl.level > 2) base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize("ABILITY_BERSERKER.CHAT_RESULT_LVL3");
    else base.flagNotPresentFSmod.resultTextSuccess = game.i18n.localize("ABILITY_BERSERKER.CHAT_RESULT_LVL1");
    return base;
  }

  abilitySetupBlacksmith(base) {
    return base;
  }

  abilitySetupDominate(base) {
    if (base.powerLvl.level < 2) {
      base.isScripted = false;
    } else {
      base.getTarget = true;
      base.targetMandatory = true;
      base.casting = game.symbaroum.config.CASTING_RES;
      base.castingAttributeName = "persuasive";
      base.targetResistAttribute = "resolute";
      base.addTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "fear"))];
    }
    if (base.powerLvl.level == 2) {
      base.introText = game.i18n.localize("ABILITY_DOMINATE_ADEPT.CHAT_INTRO");
      base.resultTextSuccess = game.i18n.localize("ABILITY_DOMINATE_ADEPT.CHAT_SUCCESS");
    } else {
      base.introText = game.i18n.localize("ABILITY_DOMINATE_MASTER.CHAT_INTRO");
      base.resultTextSuccess = game.i18n.localize("ABILITY_DOMINATE_MASTER.CHAT_SUCCESS");
    }
    return base;
  }

  abilitySetupLeader(base) {
    if (base.powerLvl.level < 2) {
      base.isScripted = false;
    } else {
      base.getTarget = true;
      base.targetMandatory = true;
      base.casting = game.symbaroum.config.CASTING_NOT;
      base.resultTextSuccess = game.i18n.localize("ABILITY_LEADER.CHAT_SUCCESS");
      base.addTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "eye"))];
    }
    return base;
  }

  abilitySetupLoremaster(base) {
    base.introText = game.i18n.localize("ABILITY_LOREMASTER.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("ABILITY_LOREMASTER.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("ABILITY_LOREMASTER.CHAT_FAILURE");
    return base;
  }

  abilitySetupMedicus(base) {
    (base.castingAttributeName = "cunning"), (base.getTarget = true);
    base.healFormulaSucceed = "1d4";
    base.medicusExam = true;
    base.targetPresentFSmod = {
      medicusExam: false,
      healedToken: game.symbaroum.config.TARGET_TOKEN,
      targetText: game.i18n.localize("ABILITY_MEDICUS.CHAT_TARGET"),
      subText: base.label + " (" + base.powerLvl.lvlName + ")",
      medicus: true,
    };
    if (base.powerLvl.level == 1) {
      base.targetPresentFSmod.healFormulaSucceed = "1d4";
    } else if (base.powerLvl.level == 2) {
      base.targetPresentFSmod.healFormulaSucceed = "1d6";
    } else {
      base.targetPresentFSmod.healFormulaSucceed = "1d8";
      base.targetPresentFSmod.healFormulaFailed = "1d4";
    }
    return base;
  }

  abilitySetupPoisoner(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.casting = game.symbaroum.config.CASTING_RES;
    base.castingAttributeName = "cunning";
    base.targetResistAttribute = "strong";
    base.usePoison = true;
    base.poisoner = true;
    return base;
  }

  abilitySetupRecovery(base) {
    base.casting = game.symbaroum.config.CASTING;
    base.castingAttributeName = "resolute";
    base.healedToken = game.symbaroum.config.ACTING_TOKEN;

    if (base.powerLvl.level == 2) {
      base.healFormulaSucceed = "1d6";
    } else if (base.powerLvl.level == 3) {
      base.healFormulaSucceed = "1d8";
    } else {
      base.healFormulaSucceed = "1d4";
    }
    return base;
  }

  abilitySetupQuickdraw(base) {
    base.castingAttributeName = "quick";
    base.impeding = game.symbaroum.config.IMPEDING_MOVE;
    return base;
  }

  abilitySetupStrangler(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.casting = game.symbaroum.config.CASTING_RES;
    base.maintain = game.symbaroum.config.MAINTAIN_RES;
    base.castingAttributeName = "cunning";
    base.targetResistAttribute = "cunning";
    base.askCastingAttribute = false;
    base.impeding = game.symbaroum.config.IMPEDING_MOVE;
    base.introText = game.i18n.localize("ABILITY_STRANGLER.CHAT_INTRO");
    base.introTextMaintain = game.i18n.localize("ABILITY_STRANGLER.CHAT_INTRO_M");
    base.resultTextSuccess = game.i18n.localize("ABILITY_STRANGLER.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("ABILITY_STRANGLER.CHAT_FAILURE");
    base.activelyMaintainedTargetEffect = [foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "strangler"))];
    base.hasDamage = true;
    base.ignoreArm = true;
    base.damageDice = "1d6";
    base.newStuffIfMaintain = {
      castingAttributeName: "cunning",
      targetResistAttribute: "cunning",
      askCastingAttribute: false
    };
    return base;
  }

  abilitySetupWitchsight(base) {
    base.castingAttributeName = "vigilant";
    base.targetResistAttribute = "discreet";
    base.getTarget = true;
    base.targetPresentFSmod = {
      casting: game.symbaroum.config.CASTING_RES,
    };
    if (base.powerLvl.level == 2) {
      base.corruption = game.symbaroum.config.TEMPCORRUPTION_NORMAL;
    } else if (base.powerLvl.level > 2) {
      base.corruption = game.symbaroum.config.TEMPCORRUPTION_D6;
    } else base.corruption = game.symbaroum.config.TEMPCORRUPTION_ONE;
    base.introText = game.i18n.localize("ABILITY_WITCHSIGHT.CHAT_INTRO");
    base.resultTextSuccess = game.i18n.localize("ABILITY_WITCHSIGHT.CHAT_SUCCESS");
    base.resultTextFail = game.i18n.localize("ABILITY_WITCHSIGHT.CHAT_FAILURE");
    return base;
  }

  // ********************************************* TRAITS *****************************************************

  traitSetupPoisonous(base) {
    base.getTarget = true;
    base.targetMandatory = true;
    base.casting = game.symbaroum.config.CASTING_RES;
    base.castingAttributeName = "cunning";
    base.targetResistAttribute = "strong";
    base.usePoison = true;
    base.poison = base.powerLvl.level;
    return base;
  }

  traitSetupRegeneration(base) {
    base.introText = game.i18n.localize("TRAIT_REGENERATION.CHAT_ACTION");
    base.casting = game.symbaroum.config.CASTING_NOT;
    base.healedToken = game.symbaroum.config.ACTING_TOKEN;

    if (base.powerLvl.level == 2) {
      base.healFormulaSucceed = "1d6";
    } else if (base.powerLvl.level == 3) {
      base.healFormulaSucceed = "1d8";
    } else {
      base.healFormulaSucceed = "1d4";
    }
    let regenDice = 2 + 2 * base.powerLvl.level;
    base.healFormulaSucceed = "1d" + regenDice.toString();
    return base;
  }

  traitSetupShapeshifter(base) {
    base.castingAttributeName = "resolute";
    return base;
  }

  traitSetupWisdomages(base) {
    base.castingAttributeName = "resolute";
    return base;
  }

  async getFunctionStuffDefault(actor, actingToken) {
    let functionStuff = {
      casting: game.symbaroum.config.CASTING,
      maintain: game.symbaroum.config.MAINTAIN_NOT,
      chain: game.symbaroum.config.CHAIN_NOT,
      ability: this.system,
      abilityName: this.name,
      abilityImg: this.img,
      abilityId: this._id,
      actor: actor,
      askTargetAttribute: false,
      askCastingAttribute: false,
      attackFromPC: actor.type !== "monster",
      autoParams: "",
      combat: false,
      corruption: false,
      favour: 0,
      isMaintained: false,
      modifier: 0,
      targetMandatory: false,
      targetData: { hasTarget: false, leaderTarget: false },
      token: actingToken,
      tokenId: actingToken?.id,
      actingCharName: actingToken?.name ?? actor.name,
      actingCharImg: actingToken?.img ?? actor.img,
      addCasterEffect: [],
      addTargetEffect: [],
      activelyMaintainedTargetEffect: [],
      activelyMaintaninedCasterEffect: [],
      removeTargetEffect: [],
      removeCasterEffect: [],
      introText: game.i18n.localize("POWER.CHAT_INTRO") + this.name + ' ".',
      introTextMaintain: game.i18n.localize("POWER.CHAT_INTRO_M") + this.name + ' ".',
      resultTextSuccess: game.i18n.localize("POWER.CHAT_SUCCESS"),
      resultTextFail: game.i18n.localize("POWER.CHAT_FAILURE"),
      resistRollText: "",
      hasDamage: false,
      isAlternativeDamage: false,
      dmgModifier: "",
      hasAdvantage: false,
      ignoreArm: false,
    };
    return functionStuff;
  }
}

async function weaponTypeLabel(weapon) {
  switch (weapon.reference) {
    case "1handed":
      return game.i18n.localize("WEAPON_CLASS.1HANDED");
    case "short":
      return game.i18n.localize("WEAPON_CLASS.SHORT");
    case "long":
      return game.i18n.localize("WEAPON_CLASS.LONG");
    case "unarmed":
      return game.i18n.localize("WEAPON_CLASS.UNARMED");
    case "heavy":
      return game.i18n.localize("WEAPON_CLASS.HEAVY");
    case "ranged":
      return game.i18n.localize("WEAPON_CLASS.RANGED");
    case "thrown":
      return game.i18n.localize("WEAPON_CLASS.THROWN");
    case "shield":
      return game.i18n.localize("WEAPON_CLASS.SHIELD");
    case "other":
      return game.i18n.localize("GEAR.OTHER");
  }
  return game.i18n.localize("GEAR.OTHER");
}

/* format the string to print the roll result, including the 2 dice if favour was involved, and the second roll when the option rare crits is enabled
@returns:  {string} the formated and localized string*/
export function formatRollResult(rollDataElement) {
  let rollResult = game.i18n.localize("ABILITY.ROLL_RESULT") + rollDataElement.diceResult.toString();
  if (rollDataElement.favour != 0) {
    rollResult += "  (" + rollDataElement.dicesResult[0].toString() + " , " + rollDataElement.dicesResult[1].toString() + ")";
  }
  if (rollDataElement.secondRollResult) {
    rollResult += " - " + game.i18n.localize("ABILITY.SECOND_ROLL_RESULT") + rollDataElement.secondRollResult.toString();
  }
  return rollResult;
}

async function checkCorruptionThreshold(actor, corruptionGained) {
  let img = "icons/magic/air/wind-vortex-swirl-purple.webp";
  let introText = actor.name + game.i18n.localize("CORRUPTION.CHAT_WARNING");
  let finalText = actor.name + game.i18n.localize("CORRUPTION.CHAT_WARNING");
  if (!actor.system.health.corruption.threshold) return;
  else if (actor.system.health.corruption.value < actor.system.health.corruption.threshold) {
    if (actor.system.health.corruption.value + corruptionGained >= actor.system.health.corruption.threshold) {
      introText = actor.name + game.i18n.localize("CORRUPTION.CHAT_INTRO");
      finalText = actor.name + game.i18n.localize("CORRUPTION.CHAT_THRESHOLD");
      img = "icons/magic/acid/dissolve-arm-flesh.webp";
    } else if (actor.system.health.corruption.value + corruptionGained != actor.system.health.corruption.threshold - 1) {
      return;
    }
  } else if (actor.system.health.corruption.value < actor.system.health.corruption.max) {
    if (actor.system.health.corruption.value + corruptionGained >= actor.system.health.corruption.max) {
      introText = actor.name + game.i18n.localize("CORRUPTION.CHAT_INTRO");
      finalText = actor.name + game.i18n.localize("CORRUPTION.CHAT_MAX");
      img = "icons/creatures/unholy/demon-horned-winged-laughing.webp";
    } else if (actor.system.health.corruption.value + corruptionGained != actor.system.health.corruption.max - 1) {
      return;
    }
  }

  let templateData = {
    targetData: false,
    hasTarget: false,
    introText: introText,
    introImg: actor.img,
    targetText: "",
    subText: "",
    subImg: img,
    hasRoll: false,
    rollString: "",
    rollResult: "",
    resultText: "",
    finalText: finalText,
    haveCorruption: false,
    corruptionText: "",
  };

  const html = await renderTemplate("systems/symbaroum/template/chat/ability.hbs", templateData);
  const chatData = {
    user: game.user.id,
    content: html,
  };
  if (!actor.hasPlayerOwner) {
    let gmList = ChatMessage.getWhisperRecipients("GM");
    if (gmList.length > 0) {
      chatData.whisper = gmList;
    }
  }
  let NewMessage = await ChatMessage.create(chatData);
}

// check if pain (damage > toughness treshold)
function checkPainEffect(functionStuff, damageTotal) {
  if (
    !functionStuff.isAlternativeDamage &&
    functionStuff.targetData.actor.system.health.toughness.threshold &&
    damageTotal > functionStuff.targetData.actor.system.health.toughness.threshold
  ) {
    return true;
  }
  return false;
}

/*usualy called by any prepareAbility function, or the combat function
will send to screen a windows asking for modifiers for the roll, then roll, then call the abilityResult function (sent as a parameter)
   * @param {item} ability      The base (active or reactive) ability power or trait for the roll.
   * @param {actor} actor       The actor of the roll
   * @param {string} castingAttributeName   The name of the casting attribute. If null, the player will be asked to choose one
   * @param {actor} targetActor Can be null (no target)
   * @param {string} targetAttributeName Can be null (no opposition attribute to roll)
   * @param {string} autoParams Can be null. The list of parameters, passive abilities and such, that are already included (to inform the player he doesn't have to type them in)
   * @param {number} modifier  A modifier for the roll
   * @param {string}  favour: "0", "-1", "1"
   * @param {boolean} checkMaintain: if true, ask the player whether the roll is for casting the ability or maintaining it 
   * @param {any}   functionStuff  an object of parameters not used in the dialog function, but useful for resultFunction */
export async function modifierDialog(functionStuff) {
  let hasTarget = functionStuff.targetData.hasTarget;
  let isWeaponRoll = false;
  let askCorruptedTargetDefaultYes = functionStuff.askCorruptedTarget && functionStuff.targetFullyCorrupted;
  let askCorruptedTargetDefaultNo = functionStuff.askCorruptedTarget && !functionStuff.targetFullyCorrupted;
  let leaderTarget = functionStuff.targetData.leaderTarget ?? false;
  let medicus = functionStuff.medicus ?? false;
  let poisoner = functionStuff.poisoner ?? false;
  let targetImpeding = functionStuff.targetImpeding ?? false;
  let weaponDamage = "";
  let actorWeapons;
  let askImpeding = false;
  let impedingValue = 0;
  let hasRoll = functionStuff.casting !== game.symbaroum.config.CASTING_NOT;
  let d8 = "(+1d8)";
  let d6 = "(+1d6)";
  let d4 = "(+1d4)";
  let checkMaintain = functionStuff.maintain !== game.symbaroum.config.MAINTAIN_NOT || functionStuff.chain === game.symbaroum.config.CHAIN;
  if (functionStuff?.impeding === game.symbaroum.config.IMPEDING_MAGIC) {
    impedingValue = functionStuff.actor.system.combat.impedingMagic;
    if (impedingValue) askImpeding = true;
  } else if (functionStuff?.impeding === game.symbaroum.config.IMPEDING_MAGIC) {
    impedingValue = functionStuff.actor.system.combat.impedingMov;
    if (impedingValue) askImpeding = true;
  }
  if (functionStuff.askWeapon) {
    actorWeapons = functionStuff.actor.items.filter((item) => item.type == "weapon");
    if (actorWeapons.length == 0) {
      ui.notifications.error("No weapon in hand.");
      return;
    }
  }
  if (functionStuff.combat) {
    isWeaponRoll = true;
    if (functionStuff?.weapon) {
      if (functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster") {
        weaponDamage = functionStuff.weapon.damage.pc;
      } else {
        weaponDamage = functionStuff.weapon.damage.npc.toString();
        d8 = " (+4)";
        d6 = " (+3)";
        d4 = " (+2)";
      }
      if (functionStuff.isAlternativeDamage) {
        weaponDamage += " (" + game.symbaroum.api.getAttributeLabel(functionStuff.actor, functionStuff.alternativeDamageAttribute) + ")";
      }
    }
  }
  let targetAttributeName = null;
  if (functionStuff.targetData.resistAttributeName) {
    targetAttributeName = functionStuff.targetData.resistAttributeName;
  }
  createLineDisplay(functionStuff, functionStuff.attackFromPC);
  const html = await renderTemplate("systems/symbaroum/template/chat/dialog2.hbs", {
    hasTarget: hasTarget,
    askCastingAttribute: functionStuff.askCastingAttribute,
    askTargetAttribute: functionStuff.askTargetAttribute,
    isWeaponRoll: isWeaponRoll,
    autoparamsText: game.i18n.localize("DIALOG.AUTOPARAMS") + functionStuff.autoParams + functionStuff.targetData.autoParams,
    isArmorRoll: null,
    ignoreArmor: functionStuff.ignoreArm,
    leaderTarget: leaderTarget,
    packages: functionStuff.package,
    askImpeding: askImpeding,
    askCorruptedTargetDefaultYes: askCorruptedTargetDefaultYes,
    askCorruptedTargetDefaultNo: askCorruptedTargetDefaultNo,
    weaponDamage: weaponDamage,
    contextualDamage: functionStuff.hasDamage,
    d8: d8,
    d4: d4,
    choices: { 0: game.i18n.localize("DIALOG.FAVOUR_NORMAL"), "-1": game.i18n.localize("DIALOG.FAVOUR_DISFAVOUR"), 1: game.i18n.localize("DIALOG.FAVOUR_FAVOUR") },
    groupName: "favour",
    defaultFavour: "0",
    defaultModifier: functionStuff.modifier,
    defaultAdvantage: "",
    defaultDamModifier: "",
    checkMaintain: checkMaintain,
    askWeapon: functionStuff.askWeapon,
    targetImpeding: targetImpeding,
    weapons: actorWeapons,
    medicus: medicus,
    poisoner: poisoner,
    hasRoll: hasRoll,
  });
  let title;
  if (functionStuff.ability) {
    title = functionStuff.abilityName;
  } else {
    title = functionStuff.weapon.name;
  }
  let dialog = new Dialog({
    title: title,
    content: html,
    buttons: {
      roll: {
        icon: '<i class="fas fa-check"></i>',
        label: game.i18n.localize("BUTTON.ROLL"),
        callback: async (html) => {
          if (functionStuff.askWeapon) {
            let wepID = html.find("#weapon")[0].value;
            functionStuff.weapon = functionStuff.actor.items.find((item) => item.id == wepID);
            functionStuff.castingAttributeName = functionStuff.weapon.system.attribute;
            if (functionStuff.weapon.system.qualities.precise) {
              functionStuff.modifier += 1;
              functionStuff.autoParams += game.i18n.localize("COMBAT.PARAMS_PRECISE");
            }
          }
          // acting attribute for d20roll
          if (functionStuff.askCastingAttribute) {
            functionStuff.castingAttributeName = html.find("#castAt")[0].value;
          }

          //resist attribute for d20roll
          if (functionStuff.askTargetAttribute) {
            if (html.find("#resistAtt").length > 0) {
              targetAttributeName = html.find("#resistAtt")[0].value;
              functionStuff.targetData.resistAttributeName = targetAttributeName;
              functionStuff.targetData.resistAttributeValue = getAttributeValue(functionStuff.targetData.actor, targetAttributeName);
            }
          }
          if (hasRoll) {
            //custom modifier for d20roll
            const bonus = html.find("#bonus")[0].value;
            let modifierCustom = parseInt(bonus, 10);
            functionStuff.modifier = modifierCustom;
            //Favour (2d20 keep best) or disfavour(2d20 keep worst)
            let favours = html.find("input[name='favour']");
            let fvalue = 0;
            for (let f of favours) {
              if (f.checked) fvalue = parseInt(f.value, 10);
            }
            functionStuff.favour += fvalue;
          }

          //Power/Ability has already been started and is maintained or chained
          if (html.find("#maintain").length > 0) {
            let valueM = html.find("#maintain")[0].value;
            if (valueM === "M") {
              functionStuff.isMaintained = true;
            }
          }
          if (askImpeding) {
            if (html.find("#impeding")[0].checked) {
              functionStuff.modifier += -impedingValue;
              functionStuff.autoParams += game.i18n.localize("ARMOR.IMPEDINGLONG") + ", ";
            }
          }
          if (targetImpeding) {
            if (html.find("#impTarget")[0].checked) {
              functionStuff.modifier += functionStuff.targetImpeding;
              functionStuff.autoParams += game.i18n.localize("ARMOR.IMPEDING_TARGET") + ", ";
            }
          }
          if (askCorruptedTargetDefaultYes || askCorruptedTargetDefaultNo) {
            functionStuff.targetFullyCorrupted = html.find("#targetCorrupt")[0].checked;
            if (functionStuff.targetFullyCorrupted) {
              functionStuff = Object.assign({}, functionStuff, functionStuff.targetFullyCorruptedFSmod);
              functionStuff.targetData.autoParams += game.i18n.localize("TOOLTIP.HEALTH.CORRUPTION_NA_TEXT");
            }
          }
          //combat roll stuff
          if (functionStuff.hasDamage) {
            functionStuff.hasAdvantage = html.find("#advantage")[0].checked;
            if (functionStuff.hasAdvantage) {
              functionStuff.modifier += 2;
              functionStuff.autoParams += game.i18n.localize("DIALOG.ADVANTAGE") + ", ";
            }
            let hasDamModifier = html.find("#dammodifier").length > 0;
            let damModifier = "";
            let damModifierNPC = 0;
            if (hasDamModifier) {
              let damString = html.find("#dammodifier")[0].value;
              // Save - it is a string
              damString = damString.trim();

              if (damString.length) {
                functionStuff.additionalModifier = damString; // Regardless if valid or not, set it as attri_defaults
                let plus = "+";
                let damSource = "[" + game.i18n.localize("DIALOG.DAMAGE_MODIFIER") + "] ";
                if (damString.charAt(0) === "+") {
                  plus = ""; // If it already has plus, do not add another
                }
                if (/\[[^\]]+\]/.test(damString)) {
                  damSource = ""; // If it has "[damage source]" already in roll string, do not add another one
                }
                damModifier = `${plus}${damString}${damSource}`;

                try {
                  // Validate string as valid roll object
                  let r = await new Roll(damModifier, {}).evaluate();
                } catch (err) {
                  ui.notifications.error(`The ${game.i18n.localize("DIALOG.DAMAGE_MODIFIER")} can't be used for rolling damage ${err}`);
                  return;
                }
                // damModifierAttSup = damModifier;
                if (!functionStuff.attackFromPC && functionStuff.targetData.hasTarget && functionStuff.targetData.actor.type !== "monster") {
                  let parsedMod = parseInt(damString);
                  if (!isNaN(parsedMod)) {
                    damModifierNPC = parsedMod;
                  }
                }
              }
            }
            for (let pack of functionStuff.package) {
              if (pack.type === game.symbaroum.config.PACK_CHECK) {
                // Find if the box is checked
                let ticked = html.find(`#${pack.id}`);
                if (ticked.length > 0 && ticked[0].checked) {
                  functionStuff.autoParams += ", " + pack.label;
                  for (let member of pack.member) {
                    if (member.type == game.symbaroum.config.DAM_MOD) {
                      damModifier += `${member.alternatives[0].damageMod}[${pack.label}]`;
                      damModifierNPC += member.alternatives[0].damageModNPC;
                    }
                  }
                }
              }
            }

            if (damModifier.length > 0) {
              functionStuff.dmgModifier = damModifier;
              functionStuff.dmgModifierNPC = damModifierNPC;
            }
          }
          if (isWeaponRoll) {
            functionStuff.ignoreArm = html.find("#ignarm")[0].checked;
            if (functionStuff.ignoreArm) functionStuff.autoParams += game.i18n.localize("COMBAT.CHAT_DMG_PARAMS_IGN_ARMOR") + ", ";
            functionStuff.poison = Number(html.find("#poison")[0].value);
          }
          if (medicus) {
            if (hasTarget) {
              functionStuff.herbalCure = html.find("#herbalcure")[0].checked;
              functionStuff.medicusExam = html.find("#exam")[0].checked;
              let customHealingFormula = html.find("#customhealing")[0].value;
              if (customHealingFormula.length > 0) {
                functionStuff.healFormulaSucceed = customHealingFormula;
              } else if (functionStuff.herbalCure) {
                functionStuff.subText += ", " + game.i18n.localize("ABILITY_MEDICUS.HERBALCURE");
                if (functionStuff.powerLvl.level == 1) {
                  functionStuff.healFormulaSucceed = "1d6";
                } else if (functionStuff.powerLvl.level == 2) {
                  functionStuff.healFormulaSucceed = "1d8";
                } else {
                  functionStuff.healFormulaSucceed = "1d10";
                  functionStuff.healFormulaFailed = "1d6";
                }
              } else functionStuff.subText += ", " + game.i18n.localize("ABILITY_MEDICUS.NOHERBALCURE");
              if (!functionStuff.medicusExam) {
                functionStuff.removeTargetEffect = ["icons/svg/blood.svg"];
                functionStuff.introText = game.i18n.localize("ABILITY_MEDICUS.CHAT_INTRO");
                functionStuff.resultTextFail = game.i18n.localize("ABILITY_MEDICUS.CHAT_FAILURE");
                functionStuff.resultTextSuccess = game.i18n.localize("ABILITY_MEDICUS.CHAT_SUCCESS");
              }
            } else functionStuff.medicusExam = true;
          }
          if (poisoner) {
            functionStuff.poison = Number(html.find("#poisoner")[0].value);
          }
          functionStuff.notResisted =
            functionStuff.notResisted ??
            !(
              (functionStuff.casting === game.symbaroum.config.CASTING_RES && !functionStuff.isMaintained) ||
              (functionStuff.maintain === game.symbaroum.config.MAINTAIN_RES && functionStuff.isMaintained)
            );
          if (hasTarget && !functionStuff.combat && !functionStuff.notResisted) {
            let targetResMod = checkSpecialResistanceMod(
              functionStuff.targetData.actor.system.combat.damageReductions,
              functionStuff.targetData.autoParams,
              functionStuff.ability.reference
            );
            functionStuff.favour += targetResMod.favour;
            functionStuff.modifier += -1 * targetResMod.modifier;
            functionStuff.dmgavoiding = targetResMod.dmgavoiding;
            functionStuff.autoParams += targetResMod.autoParams;
          }
          if (hasTarget && !functionStuff.notResisted) {
            if (functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster") {
              functionStuff.resistRoll = false;
              buildRolls(functionStuff);
            } else {
              functionStuff.resistRoll = true;
              functionStuff.resistRollText = isWeaponRoll
                ? functionStuff.targetData.name + game.i18n.localize("COMBAT.DEFENSE_ROLL")
                : functionStuff.targetData.name + game.i18n.localize("ABILITY.RESIST_ROLL");
              let userArray = await getOwnerPlayer(functionStuff.targetData.actor);
              if (userArray.length > 0 && game.settings.get("symbaroum", "playerResistButton")) {
                functionStuff.targetUserId = userArray[0].id;
                functionStuff.targetUserName = userArray[0].name;
                createResistRollChatButton(functionStuff);
              } else {
                buildRolls(functionStuff);
              }
            }
          } else {
            buildRolls(functionStuff);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: game.i18n.localize("BUTTON.CANCEL"),
        callback: () => {},
      },
    },
    default: "roll",
    close: () => {},
  });
  dialog.render(true);
}

export async function buildRolls(functionStuff) {
  game.symbaroum.log("...buildRolls", ...arguments);

  if (functionStuff.casting === game.symbaroum.config.CASTING_NOT && !functionStuff.isMaintained) {
    return await standardPowerResult(null, functionStuff);
  }
  let isWeaponRoll = functionStuff.combat;
  let rollData = [];
  if (isWeaponRoll) {
    for (let j = 1; j <= functionStuff.numberofAttacks; j++) {
      rollData.push(
        await baseRoll(
          functionStuff.actor,
          functionStuff.castingAttributeName,
          functionStuff.targetData.actor,
          functionStuff.targetData.resistAttributeName,
          functionStuff.favour,
          functionStuff.modifier,
          functionStuff.resistRoll
        )
      );
    }
  } else if (functionStuff.targetData.hasTarget && !functionStuff.notResisted) {
    rollData.push(
      await baseRoll(
        functionStuff.actor,
        functionStuff.castingAttributeName,
        functionStuff.targetData.actor,
        functionStuff.targetData.resistAttributeName,
        functionStuff.favour,
        functionStuff.modifier,
        functionStuff.resistRoll
      )
    );
  } else {
    rollData.push(await baseRoll(functionStuff.actor, functionStuff.castingAttributeName, null, null, functionStuff.favour, functionStuff.modifier, functionStuff.resistRoll));
  }
  if (isWeaponRoll) {
    return await attackResult(rollData, functionStuff);
  } else {
    return await standardPowerResult(rollData, functionStuff);
  }
}

export function checkSpecialResistanceMod(damageReductions, autoParams = "", abilityRef) {
  let favour = 0;
  let modifier = 0;
  let dmgavoiding = false;
  for (let i = 0; i < damageReductions.length; i++) {
    if (damageReductions[i].powers) {
      if (damageReductions[i].powers.includes(abilityRef)) {
        if (damageReductions[i].type === game.symbaroum.config.TYPE_FAVOUR) {
          favour = damageReductions[i].favourMod;
          autoParams += damageReductions[i].label + ", ";
        } else if (damageReductions[i].type === game.symbaroum.config.TYPE_ROLL_MOD) {
          autoParams += damageReductions[i].label + "(" + damageReductions[i].value + "), ";
          modifier += damageReductions[i].modifier;
        } else if (damageReductions[i].type === game.symbaroum.config.TYPE_DMG_AVOIDING) {
          autoParams += damageReductions[i].label + ", ";
          dmgavoiding = true;
        }
      }
    }
  }
  return {
    favour: favour,
    modifier: modifier,
    dmgavoiding: dmgavoiding,
    autoParams: autoParams,
  };
}

/* This function applies damage reduction (Undead trait, swarm...) to the final damage */
async function mathDamageProt(targetActor, damage, damageType = {}) {
  async function damageReductionText(value) {
    if (value != 1) {
      return " (x" + value + ")";
    } else return "";
  }
  let finalDamage = Math.max(0, damage);
  let infoText = "";
  if (damageType.holy) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.holy);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.holy);
  } else if (damageType.elemental) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.elemental);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.elemental);
  } else if (damageType.mysticArm) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.mysticArm);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.mysticArm);
  } else if (damageType.mysticIgnArm) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.mysticIgnArm);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.mysticIgnArm);
  } else if (damageType.mysticalWeapon) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.mysticalWeapon);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.mysticalWeapon);
  } else if (damageType.bleeding) {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.bleeding);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.bleeding);
  } else {
    finalDamage = Math.round(finalDamage * targetActor.system.combat.damageProt.normal);
    infoText = await damageReductionText(targetActor.system.combat.damageProt.normal);
  }
  return { damage: finalDamage, text: infoText };
}

async function attackResult(rollData, functionStuff) {
  let namesForText = { actorname: functionStuff.actingCharName, targetname: functionStuff.targetData?.name ?? "" };
  let damage;
  let hasDamage;
  let targetDies = false;
  let pain = false;
  let flagDataArray = [];
  let damageTot = 0;
  let damageText = "";
  let damageFinalText = "";
  let damageRollMod = "";
  let hasDmgMod = "false";
  let attackNumber = 1;
  let mysticalWeapon = functionStuff.weapon.qualities.mystical;
  let corruptionDmgFormula = "";
  let printCorruption = false;
  let corruptionChatResult = "";
  let corruptionTooltip = "";
  let targetValue = functionStuff.targetData.actor.system.health.toughness.value;
  let targetText = game.i18n.format(functionStuff.targetText ?? "", namesForText);
  if (functionStuff.isAlternativeDamage) {
    targetValue = getAttributeValue(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute);
  }
  let rolls = [];

  for (let rollDataElement of rollData) {
    rolls = rolls.concat(rollDataElement.rolls);

    rollDataElement.finalText = "";
    rollDataElement.resultText = functionStuff.actingCharName + game.i18n.localize("COMBAT.CHAT_SUCCESS") + functionStuff.targetData.name;
    if (rollDataElement.critSuccess) {
      if (functionStuff.resistRoll) {
        //critSuccess is in the attackers perspective.
        rollDataElement.resultText += " - " + game.i18n.localize("CHAT.CRITICAL_FAILURE");
      } else {
        rollDataElement.resultText += " - " + game.i18n.localize("CHAT.CRITICAL_SUCCESS");
      }
    }
    if (functionStuff.weapon.qualities.jointed && !rollDataElement.trueActorSucceeded && rollDataElement.diceResult % 2 != 0) {
      rollDataElement.resultText = game.i18n.localize("COMBAT.CHAT_JOINTED_SECONDARY");
    } else if (rollDataElement.trueActorSucceeded) {
      hasDamage = true;
      rollDataElement.hasDamage = true;
      damage = await damageRollWithDiceParams(functionStuff, rollDataElement.critSuccess, attackNumber);
      rolls.push(damage.roll);

      attackNumber += 1;
      rollDataElement.dmgFormula = game.i18n.localize("WEAPON.DAMAGE") + ": " + damage.roll._formula;
      rollDataElement.damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());
      damageRollMod = game.i18n.localize("COMBAT.CHAT_DMG_PARAMS") + damage.autoParams;
      hasDmgMod = damage.autoParams.length > 0 ? true : false;
      //damage reduction (Undead trait, swarm...)
      let finalDmg = await mathDamageProt(functionStuff.targetData.actor, damage.roll.total, { mysticalWeapon: mysticalWeapon });
      // pain (damage > toughness treshold)
      pain = pain || checkPainEffect(functionStuff, finalDmg.damage);
      rollDataElement.dmg = finalDmg.damage;
      rollDataElement.dmgFormula += finalDmg.text;
      if (functionStuff.corruptingattack != "" && rollDataElement.dmg > 0) {
        if (corruptionDmgFormula != "") corruptionDmgFormula += "+";
        corruptionDmgFormula += functionStuff.corruptingattack;
        printCorruption = true;
      }
      rollDataElement.damageText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE") + rollDataElement.dmg.toString();
      damageTot += rollDataElement.dmg;
      if (functionStuff.isAlternativeDamage) {
        rollDataElement.damageText += " (" + game.symbaroum.api.getAttributeLabel(functionStuff.actor, functionStuff.alternativeDamageAttribute) + ")";
      }
    } else {
      rollDataElement.resultText = functionStuff.actingCharName + game.i18n.localize("COMBAT.CHAT_FAILURE");
      if (rollDataElement.critFail) {
        //critFail is in the attackers perspective, so it means the defenser gets a free attack
        if (functionStuff.resistRoll) {
          rollDataElement.resultText += " - " + game.i18n.localize("CHAT.CRITICAL_SUCCESS") + " : " + game.i18n.localize("CHAT.CRITICAL_FREEATTACK");
        } else {
          rollDataElement.resultText += " - " + game.i18n.localize("CHAT.CRITICAL_FAILURE") + " : " + game.i18n.localize("CHAT.CRITICAL_FAILURE_FREEATTACK");
        }
      }
    }
  }
  if (damageTot <= 0) {
    damageTot = 0;
    damageFinalText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_NUL");
  } else {
    if (damageTot >= targetValue) {
      targetDies = true;
      if (ui.combat.viewed && ui.combat.viewed.getCombatantByToken(functionStuff.targetData.tokenId)) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          defeated: true,
        });
      } else {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          addEffect: foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "dead")),
          overlay: true,
          effectDuration: 1,
        });
      }
      damageFinalText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_DYING");
    } else if (pain) {
      damageFinalText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_PAIN");
      flagDataArray.push({
        tokenId: functionStuff.targetData.tokenId,
        addEffect: foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "prone")),
        effectDuration: 1,
      });
    }
    if (functionStuff.isAlternativeDamage) {
      flagDataArray.push({
        tokenId: functionStuff.targetData.tokenId,
        attributeChange: damageTot * -1,
        attributeName: functionStuff.alternativeDamageAttribute,
      });
    } else {
      flagDataArray.push({
        tokenId: functionStuff.targetData.tokenId,
        toughnessChange: damageTot * -1,
      });
    }
  }

  if (printCorruption) {
    let corruptionRoll = await new Roll(corruptionDmgFormula).evaluate();
    rolls.push(corruptionRoll);
    corruptionChatResult = game.i18n.localize("COMBAT.CHAT_CORRUPTED_ATTACK") + corruptionRoll.total.toString();
    corruptionTooltip = new Handlebars.SafeString(await corruptionRoll.getTooltip());
    checkCorruptionThreshold(functionStuff.targetData.actor, corruptionRoll.total);
    flagDataArray.push({
      tokenId: functionStuff.targetData.tokenId,
      corruptionChange: corruptionRoll.total,
    });
  }

  if (functionStuff.targetData.autoParams != "") {
    functionStuff.targetData.targetText += ": " + functionStuff.targetData.autoParams;
  }
  let templateData = {
    rollData: rollData,
    targetData: functionStuff.targetData,
    hasTarget: functionStuff.targetData.hasTarget,
    introText: functionStuff.introText,
    introImg: functionStuff.actingCharImg,
    targetText: targetText,
    subText: functionStuff.weapon.name + " (" + (await weaponTypeLabel(functionStuff.weapon)) + ")",
    subImg: functionStuff.weapon.img,
    hasRoll: true,
    resistRoll: functionStuff.resistRoll,
    resistRollText: functionStuff.resistRollText,
    hasCorruption: false,
    rollString: await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier),
    hasDamage: hasDamage,
    hasDmgMod: hasDmgMod,
    damageRollMod: damageRollMod,
    damageText: damageText,
    damageFinalText: damageFinalText,
    printPoison: false,
    poisonRollString: "",
    poisonRollResultString: "",
    poisonChatIntro: "",
    poisonChatResult: "",
    poisonToolTip: "",
    printBleed: false,
    bleedChat: "",
    printFlaming: false,
    flamingChat: "",
    printCorruption: printCorruption,
    corruptionChatResult: corruptionChatResult,
    corruptionTooltip: corruptionTooltip,
  };
  if (functionStuff.autoParams != "") {
    templateData.subText += ", " + functionStuff.autoParams;
  }

  if (functionStuff.poison > 0 && !targetDies && damageTot > 0 && functionStuff.targetData.actor.system.combat.damageProt.poison) {
    let targetResMod = checkSpecialResistanceMod(functionStuff.targetData.actor.system.combat.damageReductions, functionStuff.targetData.autoParams, "poisoner");
    let poisonFavour = targetResMod.favour;
    functionStuff.targetData.autoParams += targetResMod.autoParams;
    let poisonRoll = await baseRoll(functionStuff.actor, "cunning", functionStuff.targetData.actor, "strong", poisonFavour, -1 * targetResMod.modifier, functionStuff.resistRoll);
    let poisonFunctionStuff = Object.assign(functionStuff, { modifier: -1 * targetResMod.modifier, favour: poisonFavour });
    let poisonRes = await poisonCalc(poisonFunctionStuff, poisonRoll);
    rolls.push(poisonRes.roll);
    if (poisonRes.flagData) flagDataArray.push(poisonRes.flagData);
    templateData = Object.assign(templateData, poisonRes);
  }
  for (let doTime of functionStuff.damageOverTime) {
    if (doTime.effectIcon?.id === "bleeding" && !targetDies && damageTot > 0) {
      templateData.printBleed = true;
      let bleedDamage = doTime.damagePerRound;
      if (!functionStuff.attackFromPC) bleedDamage = doTime.damagePerRoundNPC.toString();
      templateData.bleedChat = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_BLEED") + bleedDamage;
      let finalbleedDmg = await mathDamageProt(functionStuff.targetData.actor, 2, { bleeding: true });
      templateData.bleedChat += finalbleedDmg.text;
      flagDataArray.push({
        tokenId: functionStuff.targetData.tokenId,
        addEffect: doTime.effectIcon,
      });
    } else if (doTime.effectIcon?.id === "burning" && hasDamage) {
      let flamingRoundsRoll = 2;
      let flamingRounds = 2;
      let flamingDamage = " 2";
      if (functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster") {
        flamingRoundsRoll = await new Roll("1d4").evaluate();
        rolls.push(flamingRoundsRoll);
        flamingRounds = flamingRoundsRoll.total;
        flamingDamage = " 1d4";
      }
      flagDataArray.push({
        tokenId: functionStuff.targetData.tokenId,
        addEffect: doTime.effectIcon,
        effectDuration: flamingRounds,
      });
      templateData.printFlaming = true;
      templateData.flamingChat =
        functionStuff.targetData.name +
        game.i18n.localize("COMBAT.CHAT_FLAMING_SUCCESS1") +
        flamingDamage +
        game.i18n.localize("COMBAT.CHAT_POISON_SUCCESS2") +
        flamingRounds.toString();
      let finalburningDmg = await mathDamageProt(functionStuff.targetData.actor, 2, { elemental: true });
      templateData.flamingChat += finalburningDmg.text;
    }
  }
  // Here
  // Maestro support
  let actorid = functionStuff.actor.id;
  if (functionStuff.attackFromPC) {
    templateData.id = functionStuff.weapon.id;
  } else {
    templateData.id = functionStuff.targetData?.actor?.system.combat.id;
    actorid = functionStuff.targetData?.actor.id;
  }
  // end Maestro support
  const html = await renderTemplate("systems/symbaroum/template/chat/combat.hbs", templateData);
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({
      alias: game.user.name,
      actor: actorid,
    }),
    content: html,
    roll: JSON.stringify(createRollData(rolls)),
    rollMode: game.settings.get("core", "rollMode"),
  };
  let NewMessage = await ChatMessage.create(chatData);
  if (flagDataArray.length > 0) {
    await createModifyTokenChatButton(flagDataArray);
  }
  return templateData;
}

async function formatRollString(rollDataElement, hasTarget, modifier) {
  let rollString = `${rollDataElement.actingAttributeLabel} : (${rollDataElement.actingAttributeValue})`;
  if (hasTarget && rollDataElement.targetAttributeLabel) {
    let attributeMod = 10 - rollDataElement.resistAttributeValue;
    rollString += `  ⬅  ${rollDataElement.targetAttributeLabel} : (${attributeMod})`;
  }
  if (modifier) {
    rollString += "  " + game.i18n.localize("COMBAT.CHAT_MODIFIER") + modifier.toString();
  }
  return rollString;
}

async function healing(healFormula, targetToken, attackFromPC) {
  let healRoll;
  let totalResult = 0;
  let damageTooltip = "";
  if (attackFromPC) {
    healRoll = await new Roll(healFormula).evaluate();
    (totalResult = healRoll.total), (damageTooltip = new Handlebars.SafeString(await healRoll.getTooltip()));
  } else {
    healRoll = await new Roll(healFormula).evaluate({ maximize: true });
    totalResult = Math.ceil(healRoll.total / 2);
  }
  let healed = Math.min(totalResult, targetToken.actor.system.health.toughness.max - targetToken.actor.system.health.toughness.value);
  return {
    hasDamage: true,
    roll: healRoll,
    healed: healed,
    dmgFormula: game.i18n.localize("POWER_LAYONHANDS.CHAT_FINAL") + healFormula,
    damageText: game.i18n.localize("POWER_LAYONHANDS.CHAT_FINAL") + healed.toString(),
    damageTooltip: damageTooltip,
    flagData: {
      tokenId: targetToken.id,
      toughnessChange: healed,
    },
  };
}

async function poisonCalc(functionStuff, poisonRoll) {
  let poisonRes = {};
  poisonRes.printPoison = false;
  poisonRes.poisonChatIntro = functionStuff.actingCharName + game.i18n.localize("COMBAT.CHAT_POISON") + functionStuff.targetData.name;
  let poisonDamage = "0";
  let poisonedTimeLeft = 0;
  const effect = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "poison"));
  poisonRes.poisonResistRollText = functionStuff.targetData.name + game.i18n.localize("ABILITY.RESIST_ROLL");

  if (!poisonRoll.trueActorSucceeded) {
    poisonRes.poisonChatResult = game.i18n.localize("COMBAT.CHAT_POISON_FAILURE");
  } else {
    if (functionStuff.attackFromPC || functionStuff.targetData.actor.type === "monster") {
      poisonDamage = "1d" + (2 * functionStuff.poison + 2).toString();
    } else {
      poisonDamage = (functionStuff.poison + 1).toString();
    }
    let PoisonRoundsRoll = await new Roll(poisonDamage).evaluate();
    poisonRes.roll = PoisonRoundsRoll;

    let NewPoisonRounds = PoisonRoundsRoll.total;
    let poisonedEffectCounter = functionStuff.targetData.token.actor?.hasCondition(effect.id);
    if (poisonedEffectCounter) {
      //target already poisoned
      poisonRes.poisonChatResult = game.i18n.localize("COMBAT.CHAT_POISON_NOTEXTEND");
    } else {
      //new poisoning
      poisonRes.flagData = {
        tokenId: functionStuff.targetData.tokenId,
        addEffect: effect,
        effectDuration: NewPoisonRounds,
      };
      poisonRes.poisonChatResult =
        functionStuff.targetData.name +
        game.i18n.localize("COMBAT.CHAT_POISON_SUCCESS1") +
        poisonDamage +
        game.i18n.localize("COMBAT.CHAT_POISON_SUCCESS2") +
        NewPoisonRounds.toString();
    }
  }
  poisonRes.printPoison = true;
  poisonRes.poisonRollString = await formatRollString(poisonRoll, functionStuff.targetData.hasTarget, functionStuff.modifier);
  poisonRes.poisonRollResultString = await formatRollResult(poisonRoll);
  poisonRes.poisonToolTip = poisonRoll.toolTip;
  return poisonRes;
}

async function standardPowerResult(rollData, functionStuff) {
  game.symbaroum.log("standardPowerResult", ...arguments);
  let hasRoll = false;
  let trueActorSucceeded = true; //true by default for powers without rolls
  let rolls = [];
  let rollString = "";
  let rollResult = "";
  let rollToolTip = "";
  if (rollData != null) {
    hasRoll = true;
    trueActorSucceeded = rollData[0].trueActorSucceeded;
    rollString = await formatRollString(rollData[0], functionStuff.targetData.hasTarget, rollData[0].modifier);
    rollResult = rollData[0].rollResult;
    rollToolTip = rollData[0].toolTip;
    for (let i = 0; i < rollData.length; i++) {
      rolls = rolls.concat(rollData[i].rolls);
    }
  }

  if (functionStuff.rollFailedFSmod && !trueActorSucceeded) {
    functionStuff = Object.assign({}, functionStuff, functionStuff.rollFailedFSmod);
  }
  let flagData =
    functionStuff.actor.getFlag(game.system.id, functionStuff.flagTest) ?? functionStuff.actor.hasCondition(functionStuff.flagTest)?.getFlag(game.system.id, "flagData");

  game.symbaroum.log("Flag data", flagData);

  game.symbaroum.log("functionStuff before merge", functionStuff);
  if (functionStuff.flagTest && trueActorSucceeded) {
    if (flagData) {
      await functionStuff.actor.unsetFlag(game.system.id, functionStuff.flagTest);
      await functionStuff.actor.removeCondition(functionStuff.flagTest);
      functionStuff = Object.assign({}, functionStuff, functionStuff.flagPresentFSmod);
    } else {
      // await functionStuff.actor.setFlag(game.system.id, functionStuff.flagTest, functionStuff.flagNotPresentFSmod.flagData);
      await functionStuff.actor.addCondition(functionStuff.flagTest, functionStuff.flagNotPresentFSmod.flagData);
      functionStuff = Object.assign({}, functionStuff, functionStuff.flagNotPresentFSmod);
    }
  }
  game.symbaroum.log("functionStuff after merge", functionStuff);

  let flagDataArray = functionStuff.flagDataArray ?? [];
  let haveCorruption = false;
  let corruptionText = "";
  let corruption;
  let namesForText = {
    actorname: functionStuff.actingCharName,
    targetname: functionStuff.targetData?.name ?? "",
    targetshadow: functionStuff.targetData?.actor?.system.bio.shadow ?? "",
  };
  let targetText = game.i18n.format(functionStuff.targetText ?? "", namesForText);
  if (!functionStuff.isMaintained && functionStuff.corruption !== game.symbaroum.config.TEMPCORRUPTION_NONE) {
    haveCorruption = true;
    corruption = await functionStuff.actor.getCorruption(functionStuff);
    corruptionText = game.i18n.localize("POWER.CHAT_CORRUPTION") + corruption.value;
    if (corruption.sorceryRoll) corruptionText += " (sorcery roll result:" + corruption.sorceryRoll.diceResult + ")";
    checkCorruptionThreshold(functionStuff.actor, corruption.value);
    flagDataArray.push({
      tokenId: functionStuff.tokenId,
      actorId: functionStuff.actor.id,
      corruptionChange: corruption.value,
    });
  }

  if (functionStuff.resultRolls !== undefined && functionStuff.resultRolls !== null) {
    rolls = rolls.concat(functionStuff.resultRolls);
  }
  let resultText = game.i18n.format(trueActorSucceeded ? functionStuff.resultTextSuccess : functionStuff.resultTextFail, namesForText);
  let finalText = game.i18n.format(functionStuff.finalText ?? "", namesForText);
  let subText = functionStuff.subText ?? functionStuff.abilityName + " (" + functionStuff.powerLvl.lvlName + ")";
  let introText = game.i18n.format(functionStuff.isMaintained ? functionStuff.introTextMaintain : functionStuff.introText, namesForText);
  if (functionStuff.finalTextSucceed && trueActorSucceeded) finalText = game.i18n.format(functionStuff.finalTextSucceed, namesForText);
  else if (functionStuff.targetData.hasTarget && functionStuff.targetData.autoParams != "") {
    targetText += ": " + functionStuff.targetData.autoParams;
  }

  let hasDamage = functionStuff.hasDamage;
  let doDamage = (hasDamage && trueActorSucceeded) || functionStuff.avoidDamageDice;
  let damageTot = 0;
  let damageText = "";
  let damageRollResult = "";
  let dmgFormula = "";
  let damageTooltip = "";
  let damageFinalText = "";
  let damageDice = functionStuff.dmgavoiding ? functionStuff.avoidDamageDice : functionStuff.damageDice;
  let targetDies = false;

  if (damageDice === "0d0") {
    doDamage = false;
    resultText = game.i18n.format(game.i18n.localize("POWER_BRIMSTONECASC.CHAT_FAILURE_RR"), namesForText);
  }
  if (functionStuff.ability.reference === "blessedshield" && trueActorSucceeded) {
    let protectionFormula = "1d" + (2 + 2 * functionStuff.powerLvl.level);

    flagDataArray.push({
      tokenId: functionStuff.tokenId,
      actorId: functionStuff.actor.id,
      addObject: "blessedshield",
      protection: protectionFormula,
    });
    finalText = game.i18n.format(game.i18n.localize("POWER_BLESSEDSHIELD.PROTECTED"), namesForText) + " (" + protectionFormula + ")";

    if (functionStuff.targets) {
      for (let target of functionStuff.targets) {
        let effect = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "holyShield"));
        flagDataArray.push(
          {
            tokenId: target.tokenId,
            addEffect: effect,
            effectDuration: 1,
          },
          {
            tokenId: target.tokenId,
            addObject: "blessedshield",
            protection: protectionFormula,
          }
        );
        finalText += ", " + game.i18n.format(game.i18n.localize("POWER_BLESSEDSHIELD.PROTECTED"), { actorname: target.name });
      }
    }
  }

  if (functionStuff.confusion && trueActorSucceeded) {
    let confusionRoll = await new Roll("1d6").evaluate();
    rolls.push(confusionRoll);

    finalText = confusionRoll.total.toString() + ": ";
    if (confusionRoll.total < 3) {
      finalText += game.i18n.format(game.i18n.localize("POWER_CONFUSION.EFFECT12"), namesForText);
    } else if (confusionRoll.total < 5) {
      finalText += game.i18n.format(game.i18n.localize("POWER_CONFUSION.EFFECT34"), namesForText);
    } else {
      finalText += game.i18n.format(game.i18n.localize("POWER_CONFUSION.EFFECT56"), namesForText);
    }
  }

  if (functionStuff.usePoison) {
    let poisonRes = await poisonCalc(functionStuff, rollData[0]);
    rolls.push(poisonRes.roll);

    introText = poisonRes.poisonChatIntro;
    resultText = poisonRes.poisonChatResult;
    if (poisonRes.flagData) flagDataArray.push(poisonRes.flagData);
  }

  if (functionStuff.ability.reference === "strangler" && trueActorSucceeded) {
    functionStuff.hasAdvantage = false; //to prevent +1d4 damage
  }

  if (functionStuff.ability.reference === "witchsight" && functionStuff.targetData?.hasTarget && trueActorSucceeded) {
    finalText = game.i18n.format(game.i18n.localize("ABILITY_WITCHSIGHT.CHAT_FINAL"), namesForText);
  }

  if (doDamage) {
    let targetValue = functionStuff.targetData.actor.system.health.toughness.value;
    if (functionStuff.isAlternativeDamage) {
      targetValue = getAttributeValue(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute);
    }
    let damage = await simpleDamageRoll(functionStuff, damageDice);
    rolls.push(damage.roll);

    damageRollResult += await formatRollResult(damage);
    dmgFormula = game.i18n.localize("WEAPON.DAMAGE") + ": " + damage.roll._formula;

    //damage reduction (Undead trait, swarm...)
    let finalDmg = await mathDamageProt(functionStuff.targetData.actor, damage.roll.total, functionStuff.damageType);
    // pain (damage > toughness treshold)
    let pain = checkPainEffect(functionStuff, finalDmg.damage);
    damageTot = finalDmg.damage;
    dmgFormula += finalDmg.text;

    damageText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE") + damageTot.toString();
    damageTooltip = new Handlebars.SafeString(await damage.roll.getTooltip());

    if (functionStuff.isAlternativeDamage) {
      dmgFormula += " (" + game.symbaroum.api.getAttributeLabel(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute) + ")";
      damageText += " (" + game.symbaroum.api.getAttributeLabel(functionStuff.targetData.actor, functionStuff.alternativeDamageAttribute) + ")";
    }
    if (damageTot <= 0) {
      damageTot = 0;
      damageText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_NUL");
    } else {
      if (damageTot >= targetValue) {
        targetDies = true;
        damageFinalText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_DYING");
        if (ui.combat.viewed && ui.combat.viewed.getCombatantByToken(functionStuff.targetData.tokenId)) {
          flagDataArray.push({
            tokenId: functionStuff.targetData.tokenId,
            defeated: true,
          });
        } else {
          flagDataArray.push({
            tokenId: functionStuff.targetData.tokenId,
            addEffect: foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "dead")),
            overlay: true,
            effectDuration: 1,
          });
        }
      } else if (pain) {
        damageFinalText = functionStuff.targetData.name + game.i18n.localize("COMBAT.CHAT_DAMAGE_PAIN");
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          addEffect: foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "prone")),
          effectDuration: 1,
        });
      }
      if (functionStuff.isAlternativeDamage) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          attributeChange: damageTot * -1,
          attributeName: functionStuff.alternativeDamageAttribute,
        });
      } else {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          toughnessChange: damageTot * -1,
        });
      }
    }
  }

  let templateData = {
    targetData: functionStuff.targetData,
    hasTarget: functionStuff.targetData.hasTarget,
    introText: introText,
    introImg: functionStuff.actingCharImg,
    targetText: targetText,
    subText: subText,
    subImg: functionStuff.abilityImg,
    hasRoll: hasRoll,
    resistRoll: functionStuff.resistRoll,
    resistRollText: functionStuff.resistRollText,
    rollString: rollString,
    rollResult: rollResult,
    rollToolTip: rollToolTip,
    resultText: resultText,
    finalText: finalText,
    hasDamage: doDamage,
    damageText: damageText,
    damageRollResult: damageRollResult,
    dmgFormula: dmgFormula,
    damageRollMod: "",
    damageTooltip: damageTooltip,
    damageFinalText: damageFinalText,
    haveCorruption: haveCorruption,
    corruptionText: corruptionText,
  };
  if (functionStuff.autoParams != "") {
    templateData.subText += ", " + functionStuff.autoParams;
  }

  /* if the power / ability have healing effects  */
  if (functionStuff.healFormulaSucceed && !functionStuff.medicusExam) {
    let healResult;
    let healingBonus = functionStuff.healingBonus ?? "";
    if (functionStuff.healedToken === game.symbaroum.config.TARGET_TOKEN) {
      functionStuff.healedToken = functionStuff.targetData.token;
    } else functionStuff.healedToken = functionStuff.token;
    if (trueActorSucceeded) {
      healResult = await healing(functionStuff.healFormulaSucceed + healingBonus, functionStuff.healedToken, functionStuff.attackFromPC);
      if (functionStuff.attackFromPC) rolls.push(healResult.roll);
    } else if (!trueActorSucceeded && functionStuff.healFormulaFailed) {
      healResult = await healing(functionStuff.healFormulaFailed + healingBonus, functionStuff.healedToken, functionStuff.attackFromPC);
      if (functionStuff.attackFromPC) rolls.push(healResult.roll);
    }
    if (healResult) {
      // game.symbaroum.log(healResult)
      templateData.hasDamage = healResult.hasDamage;
      templateData.damageText = healResult.damageText;
      if (functionStuff.attackFromPC) {
        templateData.dmgFormula = healResult.dmgFormula;
        templateData.damageTooltip = healResult.damageTooltip;
      }
      templateData.damageFinalText = "";
      flagDataArray.push(healResult.flagData);

      if (functionStuff.ability.reference === "inheritwound") {
        let inheritDamage = functionStuff.powerLvl.level > 1 ? Math.ceil(healResult.healed / 2) : healResult.healed;
        templateData.finalText +=
          game.i18n.format(game.i18n.localize("POWER_INHERITWOUND.CHAT_HEALED"), namesForText) +
          healResult.healed.toString() +
          "; " +
          game.i18n.format(game.i18n.localize("POWER_INHERITWOUND.CHAT_DAMAGE"), namesForText) +
          inheritDamage.toString();
        flagDataArray.push({
          tokenId: functionStuff.tokenId,
          toughnessChange: inheritDamage * -1,
        });
        if (functionStuff.powerLvl.level > 1) {
          templateData.finalText += game.i18n.localize("POWER_INHERITWOUND.CHAT_REDIRECT");
          const pEffect = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "poison"));
          let poisonedEffectCounter = functionStuff.targetData.token?.actor.hasCondition(pEffect.id);
          if (poisonedEffectCounter) {
            //target  poisoned
            //get the number of rounds left
            let timeLeft = 1;
            //set status to caster
            flagDataArray.push(
              {
                tokenId: functionStuff.tokenId,
                addEffect: pEffect,
                effectDuration: timeLeft,
              },
              {
                tokenId: functionStuff.targetData.tokenId,
                removeEffect: pEffect,
              }
            );
          }
          const bEffect = foundry.utils.duplicate(CONFIG.statusEffects.find((e) => e.id === "bleeding"));
          let bleedEffectCounter = functionStuff.targetData.token?.actor.hasCondition(bEffect.id);
          if (bleedEffectCounter) {
            //get the number of rounds left
            let timeLeft = 1;
            //set status to caster
            flagDataArray.push(
              {
                tokenId: functionStuff.tokenId,
                addEffect: bEffect,
                effectDuration: timeLeft,
              },
              {
                tokenId: functionStuff.targetData.tokenId,
                removeEffect: bEffect,
              }
            );
          }
        }
      }
    }
  }
  // Maestro
  let actorid = functionStuff.actor.id;
  templateData.id = functionStuff.abilityId;
  // End Maestro

  // Pick up roll system
  const html = await renderTemplate("systems/symbaroum/template/chat/ability.hbs", templateData);
  const chatData = {
    user: game.user.id,
    speaker: ChatMessage.getSpeaker({
      alias: game.user.name,
      actor: actorid,
    }),
    rollMode: game.settings.get("core", "rollMode"),
    content: html,
  };
  if (functionStuff.gmOnlyChatResultNPC && !functionStuff.attackFromPC) {
    let gmList = ChatMessage.getWhisperRecipients("GM");
    if (gmList.length > 0) {
      chatData.whisper = gmList;
    }
  } else if (rolls.length > 0) {
    // Only shows rolls if they are displayed to everyone
    chatData.type = CONST.CHAT_MESSAGE_TYPES.ROLL;
    chatData.roll = JSON.stringify(createRollData(rolls));
  }
  let NewMessage = await ChatMessage.create(chatData);
  if (trueActorSucceeded && functionStuff.addTargetEffect.length > 0) {
    for (let effect of functionStuff.addTargetEffect) {
      let effectPresent = functionStuff.targetData.token?.actor.hasCondition(effect.id);
      if (!effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          addEffect: effect,
          effectDuration: 1,
        });
      }
    }
  }
  if (trueActorSucceeded && functionStuff.addCasterEffect.length > 0 && functionStuff.tokenId) {
    // Add condition to master actor first, that way when we loop through any effects for the token actor
    // we will not duplicate if it is a token actor - order is important here.
    await functionStuff.actor.addCondition(functionStuff.flagTest, flagData);
    for (let effect of functionStuff.addCasterEffect) {
      await functionStuff.token?.actor.addCondition(effect, flagData);
    }
  }
  if (trueActorSucceeded && functionStuff.removeTargetEffect.length > 0) {
    for (let effect of functionStuff.removeTargetEffect) {
      let effectPresent = functionStuff.targetData.token?.actor.hasCondition(effect.id);
      if (effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          removeEffect: effect,
        });
      }
    }
  }
  if (trueActorSucceeded && functionStuff.removeCasterEffect.length > 0 && functionStuff.tokenId) {
    await functionStuff.actor.removeCondition(functionStuff.flagTest);
    for (let effect of functionStuff.removeCasterEffect) {
      await functionStuff.token?.actor.removeCondition(effect);
    }
  }
  if (trueActorSucceeded && !functionStuff.isMaintained && functionStuff.activelyMaintainedTargetEffect.length > 0) {
    for (let effect of functionStuff.activelyMaintainedTargetEffect) {
      let effectPresent = functionStuff.targetData.token?.actor.hasCondition(effect.id);
      if (!effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          addEffect: effect,
          effectDuration: 1,
        });
      }
    }
  }
  if (!trueActorSucceeded && functionStuff.isMaintained && functionStuff.activelyMaintainedTargetEffect.length > 0) {
    for (let effect of functionStuff.activelyMaintainedTargetEffect) {
      let effectPresent = functionStuff.targetData.token?.actor.hasCondition(effect.id);
      if (effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.targetData.tokenId,
          removeEffect: effect,
        });
      }
    }
  }
  if (trueActorSucceeded && !functionStuff.isMaintained && functionStuff.activelyMaintaninedCasterEffect.length > 0 && functionStuff.tokenId) {
    for (let effect of functionStuff.activelyMaintaninedCasterEffect) {
      let effectPresent = functionStuff.token?.actor.hasCondition(effect.id);
      if (!effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.tokenId,
          addEffect: effect,
          effectDuration: 1,
        });
      }
    }
  }
  if (!trueActorSucceeded && functionStuff.isMaintained && functionStuff.activelyMaintaninedCasterEffect.length > 0 && functionStuff.tokenId) {
    for (let effect of functionStuff.activelyMaintaninedCasterEffect) {
      let effectPresent = functionStuff.token?.actor.hasCondition(effect.id);
      if (effectPresent) {
        flagDataArray.push({
          tokenId: functionStuff.tokenId,
          removeEffect: effect,
        });
      }
    }
  }

  if (flagDataArray.length) {
    await createModifyTokenChatButton(flagDataArray);
  }
  return templateData;
}

async function preDialogLayonHands(functionStuff) {
  let layHandsDialogTemplate = `
    <h1> ${game.i18n.localize("POWER_LAYONHANDS.DIALOG")} </h1>
    `;
  new Dialog({
    title: game.i18n.localize("POWER_LABEL.LAY_ON_HAND"),
    content: layHandsDialogTemplate,
    buttons: {
      touch: {
        label: game.i18n.localize("POWER_LAYONHANDS.TOUCH"),
        callback: (html) => {
          functionStuff.healFormulaSucceed = "1d12";
          functionStuff.touch = true;
          modifierDialog(functionStuff);
        },
      },

      lineofSight: {
        label: game.i18n.localize("POWER_LAYONHANDS.REMOTE"),
        callback: (html) => {
          functionStuff.touch = false;
          modifierDialog(functionStuff);
        },
      },
      close: {
        label: "Close",
      },
    },
  }).render(true);
}
