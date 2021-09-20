
export function sendDevMessage() 
{
    if( game.user.isGM ) {
        let jqxhr = $.getJSON( "https://raw.githubusercontent.com/pwatson100/symbaroum/master/msgdata/data.json", function(data) 
        {                    
            let latestVersion = game.settings.get('symbaroum', 'symbaroumDevMessageVersionNumber');
            if(isNaN(latestVersion)) {
                latestVersion = 0;
            }
            if(data.messages === undefined || data.messages === null || data.messages.length === undefined) {
                return;
            }

            for(let i = 0; i < data.messages.length; i++)
            {
                let msgenvelope = data.messages[i];
                if( msgenvelope.version > latestVersion )
                {
                    ChatMessage.create(
                    {
                        speaker: ChatMessage.getSpeaker({alias: "Symbaroum News"}),
                        whisper: [game.user], // ChatMessage.getWhisperRecipients('GM'),
                        content: msgenvelope.message        
                    });        
                }
                latestVersion = Math.max(latestVersion, msgenvelope.version);
            }
            console.info("latestVersion after "+latestVersion);
            game.settings.set('symbaroum', 'symbaroumDevMessageVersionNumber', latestVersion);
        })
        .fail(function(data) {
            console.error("Could not retreive Symbaroum news Message:"+JSON.stringify(data));
        });
    }    
}