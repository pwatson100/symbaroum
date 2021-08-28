export class SymbaroumItemSheet extends ItemSheet {
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    html.find('.power-delete').click((ev) => this._onPowerDelete(ev));
    html.find('.power-create').click((ev) => this._onPowerCreate(ev));
  }

  getData() {
    return { 
      id:this.item.id,
      item:foundry.utils.deepClone(this.item.data),
      data: foundry.utils.deepClone(this.item.data.data)
    };
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

  async _onPowerDelete(event) {
    console.log("Deleting power");
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
    console.log(update);
    this.item.update(update);
  }

  async _onPowerCreate(event) {
    console.log("Adding power");
    let arr = this.item.data.data.power;
    let keys = Object.keys(arr);
    arr[keys.length] = {"name": "", "description": "", "action": "", "corruption": ""};
    let update = { 
      _id:this.item.id,
      "data.power": arr
    };
    console.log(update);
    this.item.update(update);
  }


  async _prepareRegisterAbility(event) {
    event.preventDefault();
    const ability = this.object;
    await ability.affectReference();
  }
  
  async _prepareActivateAbility(event) {
    event.preventDefault();
    const ability = this.object;
    if(ability.data.data?.script) ability.data.data?.script(ability, ability.parent);
  }
}