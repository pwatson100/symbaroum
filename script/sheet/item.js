import { activateAbility } from "../common/item.js";

export class SymbaroumItemSheet extends ItemSheet {
  activateListeners(html) {
    super.activateListeners(html);
    html.find(".register-ability").click(async ev => await this._prepareRegisterAbility(ev));
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

  async _prepareRegisterAbility(event) {
    event.preventDefault();
    const ability = this.object;
    await activateAbility(ability, null);
  }
}