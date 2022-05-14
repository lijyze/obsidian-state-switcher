import { Editor, MarkdownView, Plugin } from 'obsidian';

import { StateSwitcherSettings, FileStateSwitcherSettingTab, DEFAULT_SETTINGS } from './setting';
import Suggester from './suggester';
import { replace } from './util';

export default class StateSwitcherPlugin extends Plugin {
	settings: StateSwitcherSettings ;

	async onload() {
		console.log('Loading State Switcher');
		await this.loadSettings();

		// add command to launch action
		this.addCommand({
			id: 'file-state-switcher: launch',
			name: 'Switch state',
			hotkeys: [{
				modifiers: ['Mod', 'Shift'],
				key: 's'
			}],
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const nonEmptyField = this.settings.filter((map) => map.key);
				const ids = nonEmptyField.map((field) => '' + field.id);
				const keys = nonEmptyField.map((field) => field.key);
				const selectedId = await Suggester.Suggest(this.app, keys, ids);
				const selectedKey = nonEmptyField.find((field) => field.id === selectedId).key;

				const values = this.settings.find((field) => field.id === selectedId).values.filter((values) => values);
				const selectedValue = await Suggester.Suggest(this.app, values, values);

				replace(selectedKey, selectedValue, editor)
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FileStateSwitcherSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		const customData = await this.loadData();
		this.settings = customData ?? DEFAULT_SETTINGS;
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

