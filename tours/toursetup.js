import { SymbaroumTour } from "./SymbaroumTour.js";

export async function tourSetup()
{
    try {        
        game.symbaroum.log("Loading tours");
        const {files} = await foundry.applications.apps.FilePicker.browse("data", 'systems/symbaroum/tours');
        for(let i = 0; i < files.length; i++) {
            if(!files[i].endsWith(".json")) {
                continue;
            }
            let tour = await SymbaroumTour.fromJSON(files[i]);
            if(tour.config.permission?.GM && !game.user.isGM) {
                continue;
            }
            game.tours.register(game.symbaroum.config.namespace,tour.id,tour);
        }
        game.symbaroum.log("Tours all set-up");
    } catch(err) {
        return game.symbaroum.error(`Issues with SymbaroumTour`,err);
    }
    game.symbaroum.api.tourLink = tourLink;

    document.addEventListener("click", (e) => {
        
        if(e.target.parentNode?.classList?.contains('symbaroum-tour') ) {
            tourLink(e);
        }
    });
} // game.symbaroum.tourLink(this);

async function tourLink(event) {
    event.preventDefault();
    let currentNode = event.target.parentNode;
    game.symbaroum.log("tourLink",currentNode);
    let tourId = currentNode.getAttribute("data-tour-id");
    if(!tourId.includes('.')) {
        tourId = `symbaroum.${ tourId}`;
    }
    let tour = game.tours.get(tourId);
    tour?.start();
}