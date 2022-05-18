export class SymbaroumItemSheet extends ItemSheet {
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    html.find('.power-delete').click((ev) => this._onPowerDelete(ev));
    html.find('.power-create').click((ev) => this._onPowerCreate(ev));
  }

  getData() {
    let data = { 
      id:this.item.id,
      item: this.item.data,
      data: foundry.utils.deepClone(this.item.data.data),
      cssClass : this.isEditable ? "editable" : "locked",
      editable : this.isEditable
    };

    data.symbaroumOptions = {
      isGM: game.user.isGM,
      allowShowReference:  game.settings.get('symbaroum', 'allowShowReference')
    };
    return data;
  }

  _getHeaderButtons() {
    let buttons = super._getHeaderButtons();
    buttons = [
      {
        label: game.i18n.localize("BUTTON.POST_ITEM"),
        class: "item-post",
        icon: "fas fa-comment",
        onclick: (ev) => this.item.sendToChat(),
      }
    ].concat(buttons);
    return buttons;
  }


  updateOutstandingMCEValues()
  {
    let upDate = this.item.data;
    const editors = Object.values(this.editors).filter((editor) => editor.active);
    for (const editor of editors) {
      if(editor.mce)
        setProperty(upDate, editor.target, editor.mce.getContent());
    }    
  }

  async _onPowerDelete(event) {
    this.updateOutstandingMCEValues();

    const div = $(event.currentTarget).parents('.power-n');
    let powerId = parseInt(div.data("powerId"));        
    if( isNaN(powerId) ) { 
      return;
    }
    let arr = this.item.data.data.power;
    delete arr[powerId];
    let vals = Object.values(arr);
    let newArr = {};
    for(let i = 0; i<vals.length; i++) {
      newArr[i] = vals[i];
    }
    let update = { _id:this.item.id};
    update["data.power"] = newArr;
    update["data.power.-="+vals.length] = null;
    await this.item.update(update);
  }

  async _onPowerCreate(event) {
    this.updateOutstandingMCEValues();
    // Lets check editors
    let arr = this.item.data.data.power;
    let keys = Object.keys(arr);
    arr[keys.length] = {"name": "", "description": "", "action": "", "corruption": ""};
    let update = { 
      _id:this.item.id,
      "data.power": arr
    };
    
    this.item.update(update);
  }


  async _prepareRegisterAbility(event) {
    event.preventDefault();
    const ability = this.object;
    await ability.affectReference();
  }
  
  async _prepareActivateAbility(event) {
    event.preventDefault();
    if(!this.item.isOwned ) {
      return;
    }
    this.item.actor.usePower(this.item);
  }
}