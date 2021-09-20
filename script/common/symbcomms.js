
export class SymbaroumCommsListener
{
    static async receiveData(data) 
    {
        if(game.user.isGM && data["GMMessage"] !== null )
        {
            const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.html");
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:game.i18n.localize("DIALOG.SYSTEM_MESSAGE")}),
                whisper: [game.user],
                content: html
            };
            let newMessage = await ChatMessage.create(chatData);
            await newMessage.setFlag(game.system.id, 'abilityRoll', data.data);
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