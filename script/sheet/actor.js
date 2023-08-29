export class SymbaroumActorSheet extends ActorSheet {
  // nbrOfFailedDeathRoll = 0;

  activateListeners(html) {
    super.activateListeners(html);
    html.find('.item-create').click((ev) => this._onItemCreate(ev));
    html.find('.item-edit').click((ev) => this._onItemEdit(ev));
    // html.find('.item-delete').click((ev) => this._onItemDelete(ev));
    html.find('input').focusin((ev) => this._onFocusIn(ev));
    html.find('.item-state').click(async (ev) => await this._onItemStateUpdate(ev));
    html.find('.activate-ability').click(async (ev) => await this._onPrepareActivateAbility(ev));


    // Drag events for macros.
    if (this.actor.owner) {
      let handler = ev => this._onDragStart(ev);
      // Find all items on the character sheet.
      html.find('li.trait').each((i, li) => {
        // Ignore for the header row.
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
      system:foundry.utils.deepClone(data)
    };
    
    this.actor.createEmbeddedDocuments('Item', [itemData], {render:true} ).then( item => {
      // Automatically render the item sheet we just created
      item[0].sheet.render(true);
    });

  }

  _onItemEdit(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    this._itemEdit(div);
  }

  _itemEdit(div)
  {
    const item = this.actor.items.get(div.data('itemId'));
    if (item) item.sheet.render(true);
  }

  _onItemDelete(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    this._itemDelete(div);
  }

  _itemDelete(div)
  {
    const item = this.actor.items.get(div.data('itemId'));
    if (item === null) {
      return;
    }
    let b = new Dialog({
      content: `${game.i18n.localize("TOOLTIP.DELETE_ITEM")} ${item.name}`,
      rejectClose: false,
      default: "no",
      buttons: { 
          yes: { 
              label: game.i18n.localize(`DIALOG.OK`),
              callback: (html) =>     div.slideUp(200, () => { this.actor.deleteEmbeddedDocuments("Item", [ item.id ], { render:true }); })          
          },
          no: {
              label: game.i18n.localize(`DIALOG.CANCEL`),
              callback: (html) => {}
          }
        }
        
    });
    b.options.width = 100;
    b.position.width = 100;
    b.render(true);
  }

  _onFocusIn(event) {
    $(event.currentTarget).select();
  }

  async _onItemStateUpdate(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    this._itemStateUpdate(div);
  }

  async _itemStateUpdate(div, newState)
  {
    const item = this.actor.items.get(div.data('itemId'));

    if (item === null || item === undefined || !item.system.isGear) {
      return;
    }
    let data;
    let currentState = newState ?? item.system.state;
    switch (currentState) {
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

  async _onPrepareActivateAbility(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    this._prepareActivateAbility(div);
  }

  async _prepareActivateAbility(div)
  {
    const ability = this.actor.items.get(div.data('itemId'));
    await this.actor.usePower(ability);
  }

  async _onPrepareRollWeapon(event) {
    event.preventDefault();
    const div = $(event.currentTarget).parents('.item');
    this._prepareRollWeapon(div);
  }

  async _prepareRollWeapon(div)
  {
    const weapon = this.actor.items.get(div.data('itemId'));
    this.actor.rollWeapon(weapon);
  }

  async _enrichTextFields(data, fieldNameArr) {
    for(let t = 0; t < fieldNameArr.length; t++ ) 
    {
      if(hasProperty(data,fieldNameArr[t])) {
        setProperty(data, fieldNameArr[t], await TextEditor.enrichHTML(getProperty(data,fieldNameArr[t]), { async:true}) );
      }
    }
  }
}
