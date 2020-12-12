export class SymbaroumItem extends Item {
    static async create(data, options) {
        if (!data.img) {
            if (data.type === "trait") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "ability") {
                data.img = "systems/symbaroum/asset/image/ability.png";
            } else if (data.type === "mysticalPower") {
                data.img = "systems/symbaroum/asset/image/mysticalPower.png";
            } else if (data.type === "ritual") {
                data.img = "systems/symbaroum/asset/image/ritual.png";
            } else if (data.type === "burden") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "boon") {
                data.img = "systems/symbaroum/asset/image/trait.png";
            } else if (data.type === "weapon") {
                data.img = "systems/symbaroum/asset/image/weapon.png";
            } else if (data.type === "armor") {
                data.img = "systems/symbaroum/asset/image/armor.png";
            } else if (data.type === "equipment") {
                data.img = "systems/symbaroum/asset/image/equipment.png";
            } else if (data.type === "artifact") {
                data.img = "systems/symbaroum/asset/image/artifact.png";
            } else {
                data.img = "systems/symbaroum/asset/image/unknown-item.png";
            }
        }
        super.create(data, options);
    }

    async sendToChat() {
        const itemData = duplicate(this.data);
        if (itemData.img.includes("/unknown")) {
            itemData.img = null;
        }
        itemData.isTrait = itemData.type === "trait";
        itemData.isAbility = itemData.type === "ability";
        itemData.isMysticalPower = itemData.type === "mysticalPower";
        itemData.isRitual = itemData.type === "ritual";
        itemData.isWeapon = itemData.type === "weapon";
        itemData.isArmor = itemData.type === "armor";
        itemData.isEquipment = itemData.type === "equipment";
        itemData.isArtifact = itemData.type === "artifact";
        const html = await renderTemplate("systems/symbaroum/template/chat/item.html", itemData);
        const chatData = {
            user: game.user._id,
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
}