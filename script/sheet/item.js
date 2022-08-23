export class SymbaroumItemSheet extends ItemSheet {
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".activate-ability").click(async ev => await this._prepareActivateAbility(ev));
    html.find('.power-delete').click((ev) => this._onPowerDelete(ev));
    html.find('.power-create').click((ev) => this._onPowerCreate(ev));
  }

  async enrichAllFields(data)
  {
    let enrichedFields = [ 
        "system.description",
        "system.novice.description",
        "system.adept.description",
        "system.master.description",
    ];

    if(hasProperty(data,"system.power")) {
      for(let key in data.system.power) {
        enrichedFields.push(`system.power.${key}.description`);
      }
    }

    await this._enrichTextFields(data,enrichedFields);    

  }

  async getData() {
    let data = { 
      id:this.item.id,
      item: this.item,
      isOwned: this.item.isOwned,
      system: foundry.utils.deepClone(this.item.system),
      cssClass : this.isEditable ? "editable" : "locked",
      editable : this.isEditable
    };
    await this.enrichAllFields(data);
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
        onclick: (ev) => this.sendToChat(),
      }
    ].concat(buttons);
    return buttons;
  }


  updateOutstandingMCEValues()
  {
    let upDate = this.item;
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
    let arr = this.item.system.power;
    delete arr[powerId];
    let vals = Object.values(arr);
    let newArr = {};
    for(let i = 0; i<vals.length; i++) {
      newArr[i] = vals[i];
    }
    let update = { _id:this.item.id};
    update["system.power"] = newArr;
    update["system.power.-="+vals.length] = null;
    await this.item.update(update);
  }

  async _onPowerCreate(event) {
    this.updateOutstandingMCEValues();
    // Lets check editors
    let arr = this.item.system.power;
    let keys = Object.keys(arr);
    arr[keys.length] = {"name": "", "description": "", "action": "", "corruption": ""};
    let update = { 
      _id:this.item.id,
      "system.power": arr
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

  async sendToChat() {
    const itemData = {};
    itemData.system = duplicate(this.item.system);
    game.symbaroum.log("sendToChat data:",itemData);
    itemData.img = this.item.img;
    itemData.name = this.item.name;
    itemData.enrichedName = `@Item[${this.item.name}]`;
    if (itemData.img.includes("/unknown")) {
        itemData.img = null;
    }
    await this.enrichAllFields(itemData);
    await this._enrichTextFields(itemData,["enrichedName"]);

    const html = await renderTemplate("systems/symbaroum/template/chat/item.html", itemData);
    const chatData = {
        user: game.user.id,
        speaker: ChatMessage.getSpeaker({ 
            alias: this.item.actor?.name ?? game.user.name,
            actor: this.item.actor?.id
        }),            
        rollMode: game.settings.get("core", "rollMode"),
        content: html,
    };
    if (["gmroll", "blindroll"].includes(chatData.rollMode)) {
        chatData.whisper = ChatMessage.getWhisperRecipients("GM");
    } else if (chatData.rollMode === "selfroll") {
        chatData.whisper = [game.user];
    }
    ChatMessage.create(chatData);
}


  async _enrichTextFields(data, fieldNameArr) {
    for(let t = 0; t < fieldNameArr.length; t++ ) 
    {
      if(hasProperty(data,fieldNameArr[t])) {
        setProperty(data, fieldNameArr[t], await TextEditor.enrichHTML(getProperty(data,fieldNameArr[t]), { async:true}) );
      }
    };
  }
}