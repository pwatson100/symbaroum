
export class SymbaroumCommsListener
{
    static async receiveData(data) 
    {
        if(game.user.isGM && data.type === "GMMessage")
        {
            const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.html");
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            let newMessage = await ChatMessage.create(chatData);
            await newMessage.setFlag(game.system.id, 'applyEffects', data.data);
        }
        else if(data.type === "ResistRoll" && data.data.targetUserId === game.user.data._id)
        {
            let templateData = {
                introText: data.data.introText,
                mainText: data.data.mainText
            }
            const html = await renderTemplate("systems/symbaroum/template/chat/resistButton.html", templateData);
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            let newMessage = await ChatMessage.create(chatData);
            await newMessage.setFlag(game.system.id, 'resistRoll', data.data);
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