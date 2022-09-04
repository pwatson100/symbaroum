
export class SymbaroumCommsListener
{
    static async receiveData(comData) 
    {
        if(game.user.isGM && comData.type === "GMMessage")
        {
            const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.html");
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            let newMessage = await ChatMessage.create(chatData);
            await newMessage.setFlag(game.system.id, 'applyEffects', comData.data);
        }
        else if(comData.type === "ResistRoll" && comData.data.targetUserId === game.userId)
        {
            let templateData = {
                introText: comData.data.introText,
                mainText: comData.data.mainText
            }
            const html = await renderTemplate("systems/symbaroum/template/chat/resistButton.html", templateData);
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            let newMessage = await ChatMessage.create(chatData);
            await newMessage.setFlag(game.system.id, 'resistRoll', comData.data);
        }
    }

    static async ready() {
        game.socket.on("system.symbaroum",SymbaroumCommsListener.receiveData);

        game.symbaroum.emit = (data) => {       
            game.socket.emit("system.symbaroum", data );
            SymbaroumCommsListener.receiveData(data);
        };
    }
}