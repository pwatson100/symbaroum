const { HandlebarsApplicationMixin: HandlebarsApplicationMixin$5, Application: Application$2 } = foundry.applications.api;
export class SymbaroumConfig extends HandlebarsApplicationMixin$5(Application$2) {
	// export class SymbaroumConfig extends FormApplication {
	static get getDefaults() {
		return {
			addMenuButton: true,
		};
	}

	static DEFAULT_OPTIONS = {
		classes: ['form'],
		form: {
			// handler: SymbaroumConfig.#updateObject,
			closeOnSubmit: true,
			submitOnChange: false,
		},
		position: {
			width: 700,
			// height: 'auto',
		},
		timeout: null,
		tag: 'form',
		window: {
			contentClasses: ['standard-form'],
			// title: game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL'),
		},

		actions: {
			submit: this.#updateObject,
			resetPC: this._onResetPC,
			resetNPC: this._onResetNPC,
			resetTitle: this._onResetTitle,
			resetEditable: this._onResetEditable,
			resetNonEditable: this._onResetNonEditable,
			resetAll: this._onResetAll,
		},
	};

	// /* -------------------------------------------------- */

	// /**
	//  * Stored form data.
	//  * @type {object|null}
	//  */
	// #config = null;

	// /* -------------------------------------------------- */

	// /**
	//  * Stored form data.
	//  * @type {object|null}
	//  */
	// get config() {
	// 	return this.#config;
	// }

	// /**
	//  * Handle form submission. The basic usage of this function is to set `#config`
	//  * when the form is valid and submitted, thus returning `config: null` when
	//  * cancelled, or non-`null` when successfully submitted. The `#config` property
	//  * should not be used to store data across re-renders of this application.
	//  * @this {DSApplication}
	//  * @param {SubmitEvent} event           The submit event.
	//  * @param {HTMLFormElement} form        The form element.
	//  * @param {FormDataExtended} formData   The form data.
	//  */
	// static #submitHandler(event, form, formData) {
	// 	this.#config = this._processFormData(event, form, formData);
	// }

	// static get defaultOptions() {
	// 	return foundry.utils.mergeObject(super.defaultOptions, {
	// 		classes: ['form'],
	// 		title: game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL'),
	// 		id: 'symbaroumSettings',
	// 		icon: 'fas fa-cogs',
	// 		template: 'systems/symbaroum/template/symbaroumSettings.hbs',
	// 		width: 700,
	// 		closeOnSubmit: true,
	// 		submitOnClose: false,
	// 		submitOnChange: false,
	// 	});
	// }

	/* -------------------------------------------- */

	/** @override */
	static PARTS = {
		main: {
			template: 'systems/symbaroum/template/symbaroumSettings.hbs',
			scrollable: [''],
		},
	};

	_prepareContext(options) {
		const newData = {
			charBGChoice: game.settings.get('symbaroum', 'charBGChoice'),
			npcBGChoice: game.settings.get('symbaroum', 'npcBGChoice'),
			titleBGChoice: game.settings.get('symbaroum', 'titleBGChoice'),
			editableChoice: game.settings.get('symbaroum', 'editableChoice'),
			noneditableChoice: game.settings.get('symbaroum', 'nonEditableChoice'),
			chatBGChoice: game.settings.get('symbaroum', 'chatBGChoice'),
		};
		if (game.settings.get('symbaroum', 'charBGChoice') === 'none') {
			newData['charBGColour'] = game.settings.get('symbaroum', 'switchCharBGColour');
		} else {
			newData['charBGColour'] = '#000000';
		}
		if (game.settings.get('symbaroum', 'npcBGChoice') === 'none') {
			newData['npcBGColour'] = game.settings.get('symbaroum', 'switchNpcBGColour');
		} else {
			newData['npcBGColour'] = '#000000';
		}
		if (game.settings.get('symbaroum', 'titleBGChoice') === 'none') {
			newData['titleBGColour'] = game.settings.get('symbaroum', 'switchTitleColour');
		} else {
			newData['titleBGColour'] = '#000000';
		}
		if (game.settings.get('symbaroum', 'editableChoice') === 'none') {
			newData['editableColour'] = game.settings.get('symbaroum', 'switchEditableColour');
		} else {
			newData['editableColour'] = '#000000';
		}
		if (game.settings.get('symbaroum', 'nonEditableChoice') === 'none') {
			newData['noneditableColour'] = game.settings.get('symbaroum', 'switchNoNEditableColour');
		} else {
			newData['noneditableColour'] = '#000000';
		}
		if (game.settings.get('symbaroum', 'chatBGChoice').startsWith('#')) {
			newData['chatBGColour'] = game.settings.get('symbaroum', 'chatBGChoice');
		} else {
			newData['chatBGColour'] = '#burlywood';
		}
		return foundry.utils.mergeObject(newData);
	}

	static async #submitHandler(event, form, formData) {
		const settings = foundry.utils.expandObject(formData.object);
		await game.settings.set('symbaroum', 'charBGChoice', formData.charBGImage);
		await game.settings.set('symbaroum', 'npcBGChoice', formData.npcBGImage);
		await game.settings.set('symbaroum', 'titleBGChoice', formData.titleBGImage);
		await game.settings.set('symbaroum', 'editableChoice', formData.editableImage);
		await game.settings.set('symbaroum', 'nonEditableChoice', formData.nonEditableImage);
		await game.settings.set('symbaroum', 'chatBGChoice', formData.chatBGImage === 'none' ? formData.chatBGColour : formData.chatBGImage);

		// return Promise.all(Object.entries(settings).map(([key, value]) => game.settings.set('symbaroum', key, value)));
		return;
	}

	// getData(options) {
	// 	const newData = {
	// 		charBGChoice: game.settings.get('symbaroum', 'charBGChoice'),
	// 		npcBGChoice: game.settings.get('symbaroum', 'npcBGChoice'),
	// 		titleBGChoice: game.settings.get('symbaroum', 'titleBGChoice'),
	// 		editableChoice: game.settings.get('symbaroum', 'editableChoice'),
	// 		noneditableChoice: game.settings.get('symbaroum', 'nonEditableChoice'),
	// 		chatBGChoice: game.settings.get('symbaroum', 'chatBGChoice'),
	// 	};
	// 	if (game.settings.get('symbaroum', 'charBGChoice') === 'none') {
	// 		newData['charBGColour'] = game.settings.get('symbaroum', 'switchCharBGColour');
	// 	} else {
	// 		newData['charBGColour'] = '#000000';
	// 	}
	// 	if (game.settings.get('symbaroum', 'npcBGChoice') === 'none') {
	// 		newData['npcBGColour'] = game.settings.get('symbaroum', 'switchNpcBGColour');
	// 	} else {
	// 		newData['npcBGColour'] = '#000000';
	// 	}
	// 	if (game.settings.get('symbaroum', 'titleBGChoice') === 'none') {
	// 		newData['titleBGColour'] = game.settings.get('symbaroum', 'switchTitleColour');
	// 	} else {
	// 		newData['titleBGColour'] = '#000000';
	// 	}
	// 	if (game.settings.get('symbaroum', 'editableChoice') === 'none') {
	// 		newData['editableColour'] = game.settings.get('symbaroum', 'switchEditableColour');
	// 	} else {
	// 		newData['editableColour'] = '#000000';
	// 	}
	// 	if (game.settings.get('symbaroum', 'nonEditableChoice') === 'none') {
	// 		newData['noneditableColour'] = game.settings.get('symbaroum', 'switchNoNEditableColour');
	// 	} else {
	// 		newData['noneditableColour'] = '#000000';
	// 	}
	// 	if (game.settings.get('symbaroum', 'chatBGChoice').startsWith('#')) {
	// 		newData['chatBGColour'] = game.settings.get('symbaroum', 'chatBGChoice');
	// 	} else {
	// 		newData['chatBGColour'] = '#burlywood';
	// 	}
	// 	return foundry.utils.mergeObject(newData);
	// }

	// activateListeners(html) {
	_onRender(context, options) {
		document.getElementById('charBGImage').addEventListener('change', (ev) => this._showColOption(ev, '#pcColPanel', charBGImage.value));
		document.getElementById('npcBGImage').addEventListener('change', (ev) => this._showColOption(ev, '#npcColPanel', npcBGImage.value));
		document.getElementById('titleBGImage').addEventListener('change', (ev) => this._showColOption(ev, '#titleColPanel', titleBGImage.value));
		document.getElementById('editableImage').addEventListener('change', (ev) => this._showColOption(ev, '#editableColPanel', editableImage.value));
		document.getElementById('nonEditableImage').addEventListener('change', (ev) => this._showColOption(ev, '#noneditableColPanel', nonEditableImage.value));
		document.getElementById('chatBGImage').addEventListener('change', (ev) => this._showColOption(ev, '#chatColPanel', chatBGImage.value));

		document.getElementById('charBGImage').value = game.settings.get('symbaroum', 'charBGChoice');
		document.getElementById('npcBGImage').value = game.settings.get('symbaroum', 'npcBGChoice');
		document.getElementById('titleBGImage').value = game.settings.get('symbaroum', 'titleBGChoice');
		document.getElementById('editableImage').value = game.settings.get('symbaroum', 'editableChoice');
		document.getElementById('nonEditableImage').value = game.settings.get('symbaroum', 'nonEditableChoice');
		document.getElementById('chatBGImage').value = game.settings.get('symbaroum', 'chatBGChoice').startsWith('#')
			? 'none'
			: game.settings.get('symbaroum', 'chatBGChoice');

		if (game.settings.get('symbaroum', 'charBGChoice') === 'none') {
			document.getElementById('pcColPanel').style.display = 'block';
		}
		if (game.settings.get('symbaroum', 'npcBGChoice') === 'none') {
			document.getElementById('npcColPanel').style.display = 'block';
		}
		if (game.settings.get('symbaroum', 'titleBGChoice') === 'none') {
			document.getElementById('titleColPanel').style.display = 'block';
		}
		if (game.settings.get('symbaroum', 'editableChoice') === 'none') {
			document.getElementById('editableColPanel').style.display = 'block';
		}
		if (game.settings.get('symbaroum', 'nonEditableChoice') === 'none') {
			document.getElementById('noneditableColPanel').style.display = 'block';
		}
		if (game.settings.get('symbaroum', 'chatBGChoice')?.startsWith('#')) {
			document.getElementById('chatColPanel').style.display = 'block';
		}
	}

	static async _onResetPC() {
		game.settings.set('symbaroum', 'charBGChoice', 'url(../asset/image/background/green_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'switchCharBGColour', 'url(../asset/image/background/green_flower_light.webp) repeat');
		location.reload();
	}

	static async _onResetNPC() {
		game.settings.set('symbaroum', 'npcBGChoice', 'url(../asset/image/background/purple_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'switchNpcBGColour', 'url(../asset/image/background/purple_flower_light.webp) repeat');
		location.reload();
	}

	static async _onResetTitle() {
		game.settings.set('symbaroum', 'titleBGChoice', 'url(../asset/image/background/title.webp)');
		game.settings.set('symbaroum', 'switchTitleColour', 'url(../asset/image/background/title.webp)');
		location.reload();
	}

	static async _onResetEditable() {
		game.settings.set('symbaroum', 'editableChoice', 'url(../asset/image/background/editable.webp)');
		game.settings.set('symbaroum', 'switchEditableColour', 'url(../asset/image/background/editable.webp)');
		location.reload();
	}
	static async _onResetNonEditable() {
		game.settings.set('symbaroum', 'nonEditableChoice', 'url(../asset/image/background/not-editable.webp)');
		game.settings.set('symbaroum', 'switchNoNEditableColour', 'url(../asset/image/background/not-editable.webp)');
		location.reload();
	}

	static async _onResetAll() {
		game.settings.set('symbaroum', 'charBGChoice', 'url(../asset/image/background/green_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'switchCharBGColour', 'url(../asset/image/background/green_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'npcBGChoice', 'url(../asset/image/background/purple_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'switchNpcBGColour', 'url(../asset/image/background/purple_flower_light.webp) repeat');
		game.settings.set('symbaroum', 'titleBGChoice', 'url(../asset/image/background/title.webp)');
		game.settings.set('symbaroum', 'switchTitleColour', 'url(../asset/image/background/title.webp)');
		game.settings.set('symbaroum', 'editableChoice', 'url(../asset/image/background/editable.webp)');
		game.settings.set('symbaroum', 'switchEditableColour', 'url(../asset/image/background/editable.webp)');
		game.settings.set('symbaroum', 'nonEditableChoice', 'url(../asset/image/background/not-editable.webp)');
		game.settings.set('symbaroum', 'switchNoNEditableColour', 'url(../asset/image/background/not-editable.webp)');
		game.settings.set('symbaroum', 'chatBGChoice', 'url(../asset/image/background/editable.webp)');
		location.reload();
	}

	static async #updateObject(event, formData) {
		await game.settings.set('symbaroum', 'charBGChoice', charBGImage.value);
		await game.settings.set('symbaroum', 'npcBGChoice', npcBGImage.value);
		await game.settings.set('symbaroum', 'titleBGChoice', titleBGImage.value);
		await game.settings.set('symbaroum', 'editableChoice', editableImage.value);
		await game.settings.set('symbaroum', 'nonEditableChoice', nonEditableImage.value);
		await game.settings.set('symbaroum', 'chatBGChoice', chatBGImage.value === 'none' ? chatBGColour.value : chatBGImage.value);

		if (charBGImage.value === 'none') {
			if (formData.charBGColour.length > 0 && formData.charBGColour[0] != '#') {
				formData.charBGColour = '#000000';
			}
			await game.settings.set('symbaroum', 'switchCharBGColour', formData.charBGColour);
		} else {
			await game.settings.set('symbaroum', 'switchCharBGColour', formData.charBGImage);
		}

		if (npcBGImage.value === 'none') {
			if (formData.npcBGColour.length > 0 && formData.npcBGColour[0] != '#') {
				formData.npcBGColour = '#000000';
			}
			await game.settings.set('symbaroum', 'switchNpcBGColour', formData.npcBGColour);
		} else {
			await game.settings.set('symbaroum', 'switchNpcBGColour', formData.npcBGImage);
		}
		if (titleBGImage.value === 'none') {
			if (formData.titleBGColour.length > 0 && formData.titleBGColour[0] != '#') {
				formData.titleBGColour = '#000000';
			}
			await game.settings.set('symbaroum', 'switchTitleColour', formData.titleBGColour);
		} else {
			await game.settings.set('symbaroum', 'switchTitleColour', formData.titleBGImage);
		}

		if (editableImage.value === 'none') {
			if (formData.editableColour.length > 0 && formData.editableColour[0] != '#') {
				formData.editableColour = '#000000';
			}
			await game.settings.set('symbaroum', 'switchEditableColour', formData.editableColour);
		} else {
			await game.settings.set('symbaroum', 'switchEditableColour', formData.editableImage);
		}

		if (nonEditableImage.value === 'none') {
			if (formData.noneditableColour.length > 0 && formData.noneditableColour[0] != '#') {
				formData.noneditableColour = '#000000';
			}
			await game.settings.set('symbaroum', 'switchNoNEditableColour', formData.noneditableColour);
		} else {
			await game.settings.set('symbaroum', 'switchNoNEditableColour', formData.nonEditableImage);
		}

		/*
    if (chatBGImage.value === 'none') {
      if (formData.chatBGColour.length > 0 && formData.chatBGColour[0] != '#') {
        formData.chatBGColour = '';
      }
      await game.settings.set('symbaroum', 'chatBGChoice', formData.chatBGColour);
    } else {
      await game.settings.set('symbaroum', 'chatBGChoice', formData.chatBGImage);
    }
    */
		location.reload();
	}

	close() {
		super.close();
	}

	async _showColOption(event, mChild, iValue) {
		event.preventDefault();
		let li = $(event.currentTarget).parents('.tab-active');
		let li2 = li.children(mChild);
		let tHeight = parseInt(li[0].offsetParent.style.height.replace(/[^0-9]/g, ''));
		if (li2[0].style.display === 'none' && iValue === 'none') {
			tHeight = tHeight + 30;
			li[0].offsetParent.style.height = tHeight.toString() + 'px';
			li2[0].style.display = 'block';
		} else if (li2[0].style.display != 'none') {
			tHeight = tHeight - 30;
			li[0].offsetParent.style.height = tHeight.toString() + 'px';
			li2[0].style.display = 'none';
		}
	}

	// * Creates or removes the quick access config button
	// * @param  {Boolean} shown true to add, false to remove

	static toggleConfigButton(shown) {
		const button = $('#SymbaroumButton');
		if (button) button.remove();

		if (shown) {
			const title = game.i18n.localize('SYMBAROUM.OPTIONAL_CONFIG_MENULABEL');
			// Find the settings Selection

			let findConfigButton = document.getElementById('settings').children[1];

			// Create the new button
			let newButton = document.createElement('button');
			newButton.id = 'SymbaroumButton';
			newButton.setAttribute('data-tooltip', `${title}`);
			newButton.setAttribute('data-roll-button', 'push');
			newButton.innerHTML = `<i class="fas fa-palette"></i> ${title}`;

			findConfigButton.appendChild(newButton);

			// Now listen for the new button
			const SymbaroumConfigButton = document.getElementById('SymbaroumButton');
			SymbaroumConfigButton.addEventListener('click', async (ev) => {
				ev.preventDefault();
				ev.stopPropagation();
				const menu = game.settings.menus.get('symbaroum.symbaroumSettings');
				if (!menu) return ui.notifications.error('No submenu found for the provided key');
				const app = new menu.type();
				return app.render(true);
			});
		}
	}
}
