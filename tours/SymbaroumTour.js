export class SymbaroumTour extends foundry.nue.Tour {

	constructor(config) {
		super(config);
	}
/*	get title() {
		return game.i18n.localize(this.config.title);
	}	
*/

	/**
	 * Wait for the given timeout.
	 * @param {number} timeout The time to wait in milliseconds
	 * @returns {Promise<void>} A promise that resolves after the given timeout
	 */
	wait(timeout) {
		return new Promise((resolve) => setTimeout(resolve, timeout));
	}

	/**
	 * Wait for a specific element to appear in the DOM.
	 * @param {string} selector The selector for the element to wait for
	 * @param {number} timeout The maximum time to wait
	 * @returns {Promise<Element>} A promise that resolves to the element, if it is found
	 */
	waitForElement(selector, timeout) {
		return new Promise((resolve, reject) => {
			if (document.querySelector(selector)) {
				return resolve(document.querySelector(selector));
			}

			const observer = new MutationObserver(() => {
				if (document.querySelector(selector)) {
					resolve(document.querySelector(selector));
					observer.disconnect();
				}
			});

			observer.observe(document.body, {
				childList: true,
				subtree: true,
			});

			this.wait(timeout).then(reject);
		});
	}

    async _preStep() {
        await super._preStep();
        await this.waitForElement(this.currentStep.selector, 5000);
    }


    async _postStep() {
        await super._postStep();
        if (this.stepIndex < 0 || !this.hasNext)
            return;

        if (!this.currentStep?.action)
            return;
		if(this.id.startsWith('charactersheet-tour') && !game.user.isGM && !game.actors.get('14xreF7lUoXqvHjh'))
		{
			return ui.notifications.error(game.i18n.localize("SYMBAROUM.TOUR_ACTOR_ERROR") );
		}
        let target = this.currentStep.target ? this.currentStep.target : this.currentStep.selector;
        switch (this.currentStep.action) {
            case "click":
                document.querySelector(target)?.click();
                break;
			case "click-delay":
				document.querySelector(target)?.click();
				await this.wait(300);
				break;				
            case "scrollIntoView":
                document.querySelector(target)?.scrollIntoView({ block: "start", inline: "nearest" });
                break;
			case "addActor":
				if(!game.actors.get('14xreF7lUoXqvHjh') ) {
					const data = await foundry.utils.fetchJsonWithTimeout('systems/symbaroum/tours/extdata/beremo.json', {}, { int:30000});					
					await Actor.create([data], { keepId: true});
				}
				break;
			case "deleteActor":
				// Warning, this do not work very well because Foundry fails to move to the next step
				// and to remove the tour-overlay - this action has been removed from the tour
				if(game.actors.get('14xreF7lUoXqvHjh')) {
					await game.actors.get('14xreF7lUoXqvHjh').delete();
				}
				break;
			}
    }
}
