export class SymbaroumActorSheet extends ActorSheet {
  // nbrOfFailedDeathRoll = 0;

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item-create').click((ev) => this._onItemCreate(ev));
    html.find('.item-edit').click((ev) => this._onItemEdit(ev));
    html.find('.item-delete').click((ev) => this._onItemDelete(ev));
    html.find('input').focusin((ev) => this._onFocusIn(ev));
    html.find('.item-state').click(async (ev) => await this._onItemStateUpdate(ev));
    html.find('.activate-ability').click(async (ev) => await this._prepareActivateAbility(ev));
    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      // Find all items on the character sheet.
      html.find('li.trait').each((i, li) => {
        // Ignore for the header row.
        console.log("li: ", li);
        if (li.classList.contains("item-header")) return;
        // Add draggable attribute and dragstart listener.
        li.setAttribute("draggable", true);
        li.addEventListener("dragstart", handler, false);
      });
    }
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    if (this.actor.isOwner) {
      buttons = [].concat(buttons);
    }
    return buttons;
  }

  _onItemCreate(event) {
    event.preventDefault();
    let header = event.currentTarget;
    let data = duplicate(header.dataset);
    data['name'] = `New ${data.type.capitalize()}`;
    if(data.type in game.symbaroum.config.itemImages)
      data.img = game.i18n.format(game.symbaroum.config.imageRef, {"filename":game.symbaroum.config.itemImages[data.type]});
    else
      data.img = game.i18n.format(game.symbaroum.config.imageRef, {"filename":"unknown-item.png"});

    let itemData = {
      name:data["name"],
      type:data.type,
      img:data.img,
      data:foundry.utils.deepClone(data)
    };
    
    // Not required in "data.<x>"
    delete itemData.data["name"];
    delete itemData.data["type"];
    delete itemData.data["img"];

    this.actor.createEmbeddedDocuments('Item', [itemData], {render:true} ).then( item => {
      // Automatically render the item sheet we just created
      item[0].sheet.render(true);
    });

  }

  _onItemEdit(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(div.data('itemId'));
    if (item) item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(div.data('itemId'));
    if (item === null) {
      return;
    }    
    div.slideUp(200, () => {
      this.actor.deleteEmbeddedDocuments("Item", [ item.id ], { render:true });
    });
  }

  _onFocusIn(event) {
    $(event.currentTarget).select();
  }

  async _onItemStateUpdate(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const item = this.actor.items.get(div.data('itemId'));

    if (item === null || item === undefined) {
      return;
    }
    let data;
    switch (item.system.state) {
      case 'active':
        data = { _id: item.id, id: item.id, 'system.state': 'equipped' };
        break;
      case 'equipped':
        data = { _id: item.id, id: item.id, 'system.state': 'other' };
        break;
      default:
        data = { _id: item.id, id: item.id, 'system.state': 'active' };
        break;
    }    
    
    this.actor.updateEmbeddedDocuments("Item", [data]); // Used to have render:false    
  }

  async _prepareActivateAbility(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const ability = this.actor.items.get(div.data('itemId'));
    await this.actor.usePower(ability);
  }

  async _prepareRollWeapon(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    const weapon = this.actor.items.get(div.data('itemId'));
    await this.actor.rollWeapon(weapon);
  }
}
