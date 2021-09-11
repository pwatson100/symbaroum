export class SymbaroumConfig extends FormApplication {
  static get getDefaults() {
    return {
      addMenuButton: true,
    };
  }
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      title: game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL'),
      id: 'symbaroumSettings',
      icon: 'fas fa-cogs',
      template: 'systems/symbaroum/template/symbaroumSettings.html',
      width: 500,
      closeOnSubmit: true,
    });
  }

  getData(options) {
    return foundry.utils.mergeObject({
      charBGColour: game.settings.get('symbaroum', 'switchCharBGColour'),
      npcBGColour: game.settings.get('symbaroum', 'switchNpcBGColour'),
      isGM: game.user.isGM,
    });
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find('button[name="resetPC"]').click(this.onResetPC.bind(this));
    html.find('button[name="resetNPC"]').click(this.onResetNPC.bind(this));
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
    await game.settings.set('symbaroum', 'switchCharBGColour', formData.charBGColour);
    await game.settings.set('symbaroum', 'switchNpcBGColour', formData.npcBGColour);
  }
  close() {
    super.close();
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
}
