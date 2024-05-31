
export class SymbaroumCommsListener
{
    static async receiveData(comData) 
    {
        if(game.user.isGM && comData.type === "GMMessage")
        {
            const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.hbs");
            const flagKey = `flags.${game.system.id}.applyEffects`;
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html             
            };
            chatData[flagKey] = comData.data;
            return ChatMessage.create(chatData);            
        }
        else if(comData.type === "ResistRoll" && comData.data.targetUserId === game.userId)
        {
            let templateData = {
                introText: comData.data.introText,
                mainText: comData.data.mainText
            }
            const html = await renderTemplate("systems/symbaroum/template/chat/resistButton.hbs", templateData);
            const flagKey = `flags.${game.system.id}.resistRoll`;
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            chatData[flagKey] = comData.data;
            return ChatMessage.create(chatData);        
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