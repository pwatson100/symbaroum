export class SymbaroumActorSheet extends ActorSheet {
  nbrOfFailedDeathRoll = 0;

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item-create').click((ev) => this._onItemCreate(ev));
    html.find('.item-edit').click((ev) => this._onItemEdit(ev));
    html.find('.item-delete').click((ev) => this._onItemDelete(ev));
    html.find('input').focusin((ev) => this._onFocusIn(ev));
    html.find('.item-state').click(async (ev) => await this._onItemStateUpdate(ev));
    html.find('.activate-ability').click(async (ev) => await this._prepareActivateAbility(ev));
    html.find('.roll-weapon').click(async (ev) => await this._prepareRollWeapon(ev));
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.actor.owner) {
      buttons = [].concat(buttons);
    }
    return buttons;
  }

  _onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data['name'] = `New ${data.type.capitalize()}`;
    if (data.type === 'trait') {
      data.img = 'systems/symbaroum/asset/image/trait.png';
    } else if (data.type === 'ability') {
      data.img = 'systems/symbaroum/asset/image/ability.png';
    } else if (data.type === 'mysticalPower') {
      data.img = 'systems/symbaroum/asset/image/mysticalPower.png';
    } else if (data.type === 'ritual') {
      data.img = 'systems/symbaroum/asset/image/ritual.png';
    } else if (data.type === 'burden') {
      data.img = 'systems/symbaroum/asset/image/trait.png';
    } else if (data.type === 'boon') {
      data.img = 'systems/symbaroum/asset/image/trait.png';
    } else if (data.type === 'weapon') {
      data.img = 'systems/symbaroum/asset/image/weapon.png';
    } else if (data.type === 'armor') {
      data.img = 'systems/symbaroum/asset/image/armor.png';
    } else if (data.type === 'equipment') {
      data.img = 'systems/symbaroum/asset/image/equipment.png';
    } else if (data.type === 'artifact') {
      data.img = 'systems/symbaroum/asset/image/artifact.png';
    } else {
      data.img = 'systems/symbaroum/asset/image/unknown-item.png';
    }
    this.actor.createEmbeddedEntity('OwnedItem', data, { renderSheet: true });
  }

  _onItemEdit(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.getOwnedItem(div.data('itemId'));
    if (item !== null) item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.getOwnedItem(div.data('itemId'));
    if (item === null) {
      return;
    }
    this.actor.deleteOwnedItem(div.data('itemId'));
    div.slideUp(200, () => this.render(false));
  }

  _onFocusIn(event) {
    $(event.currentTarget).select();
  }

  async _onItemStateUpdate(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.getOwnedItem(div.data('itemId'));
    if (item === null) {
      return;
    }
    let data;
    switch (item.data.data.state) {
      case 'active':
        data = { _id: item._id, 'data.state': 'equipped' };
        break;
      case 'equipped':
        data = { _id: item._id, 'data.state': 'other' };
        break;
      default:
        data = { _id: item._id, 'data.state': 'active' };
        break;
    }
    await this.actor.updateOwnedItem(data);
    this._render();
  }

  async _prepareActivateAbility(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const ability = this.actor.getOwnedItem(div.data('itemId'));
    await ability.makeAction(this.actor);
  }

  async _prepareRollWeapon(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const weapon = this.actor.getOwnedItem(div.data('itemId'));
    await this.actor.rollWeapon(weapon);
  }
}
