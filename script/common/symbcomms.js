
export class SymbaroumCommsListener
{
    static async receiveData(data) 
    {
        console.log("in receive data", data, game.user.isGM);
        if(game.user.isGM && data["GMMessage"] !== null )
        {
            console.log("in GMMessage", game.user.isGM)
            const html = await renderTemplate("systems/symbaroum/template/chat/applyEffectsButton.html");
            const chatData = {
                speaker: ChatMessage.getSpeaker({alias:"Symbaroum system message"}),
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
            console.log("In emit");
            game.socket.emit("system.symbaroum", data );
            SymbaroumCommsListener.receiveData(data);
        };
    }
}