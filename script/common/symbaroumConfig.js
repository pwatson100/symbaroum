export class SymbaroumConfig extends FormApplication {
  static get getDefaults() {
    return {
      addMenuButton: true,
    };
  }

  // * Creates or removes the quick access config button
  // * @param  {Boolean} shown true to add, false to remove

  static toggleConfigButton(shown) {
    const button = $('#SymbaroumButton');
    if (button) button.remove();

    if (shown) {
      const title = game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL');

      $(`<button id="SymbaroumButton" data-action="symbaroumConfig" title="${title}">
       <i class="fas fa-palette"></i> ${title}
     </button>`)
        .insertAfter('button[data-action="configure"]')
        .on('click', (event) => {
          const menu = game.settings.menus.get('symbaroum.symbaroumSettings');
          if (!menu) return ui.notifications.error('No submenu found for the provided key');
          const app = new menu.type();
          return app.render(true);
        });
    }
  }

  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL'),
      id: 'symbaroumSettings',
      icon: 'fas fa-cogs',
      template: 'systems/symbaroum/template/symbaroumSettings.html',
      width: 500,
      height: 246,
      closeOnSubmit: true,
    });
  }

  getData(options) {
    return foundry.utils.mergeObject({
      charBGChoice: game.settings.get('symbaroum', 'charBGChoice'),
      npcBGChoice: game.settings.get('symbaroum', 'npcBGChoice'),
      charBGColour: game.settings.get('symbaroum', 'switchCharBGColour'),
      npcBGColour: game.settings.get('symbaroum', 'switchNpcBGColour'),
    });
  }

  activateListeners(html) {
    super.activateListeners(html);
    html.find('#charBGImage').change(this._showPCColOption.bind(this));
    html.find('#npcBGImage').change(this._showNPCColOption.bind(this));
    html.find('button[name="resetPC"]').click(this.onResetPC.bind(this));
    html.find('button[name="resetNPC"]').click(this.onResetNPC.bind(this));

    document.getElementById('charBGImage').value = game.settings.get('symbaroum', 'charBGChoice');
    document.getElementById('npcBGImage').value = game.settings.get('symbaroum', 'npcBGChoice');

    if (game.settings.get('symbaroum', 'charBGChoice') === 'none') {
      document.getElementById('pcColPanel').style.display = 'block';
    }
    if (game.settings.get('symbaroum', 'npcBGChoice') === 'none') {
      document.getElementById('npcColPanel').style.display = 'block';
    }
  }

  onResetPC() {
    game.settings.set('symbaroum', 'switchCharBGColour', '#abff2e');
    this.render();
  }
  onResetNPC() {
    game.settings.set('symbaroum', 'switchNpcBGColour', '#abff2e');
    this.render();
  }

  async _updateObject(event, formData) {
    if (charBGImage.value === 'none') {
      await game.settings.set('symbaroum', 'switchCharBGColour', formData.charBGColour);
    } else {
      await game.settings.set('symbaroum', 'switchCharBGColour', formData.charBGImage);
    }

    await game.settings.set('symbaroum', 'charBGChoice', formData.charBGImage);
    await game.settings.set('symbaroum', 'npcBGChoice', formData.npcBGImage);

    if (npcBGImage.value === 'none') {
      await game.settings.set('symbaroum', 'switchNpcBGColour', formData.npcBGColour);
    } else {
      await game.settings.set('symbaroum', 'switchNpcBGColour', formData.npcBGImage);
    }
  }
  close() {
    super.close();
  }

  async _showPCColOption(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents('.tab-active');
    let li2 = li.children('#pcColPanel');

    if (li2[0].style.display === 'none' && charBGImage.value === 'none') {
      li2[0].style.display = 'block';
    } else {
      li2[0].style.display = 'none';
    }
  }
  async _showNPCColOption(event) {
    event.preventDefault();
    let li = $(event.currentTarget).parents('.tab-active');
    let li2 = li.children('#npcColPanel');

    if (li2[0].style.display === 'none' && npcBGImage.value === 'none') {
      li2[0].style.display = 'block';
    } else {
      li2[0].style.display = 'none';
    }
  }
}
