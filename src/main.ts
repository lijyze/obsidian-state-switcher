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
			id: 'launch',
			name: 'Switch state',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const nonEmptyField = this.settings.stateMaps.filter((map) => map.key);
				const ids = nonEmptyField.map((field) => '' + field.id);
				const keys = nonEmptyField.map((field) => field.key);

				const selectedId = await Suggester.Suggest(this.app, keys, ids);
				const selectedKey = nonEmptyField.find((field) => field.id === selectedId).key;

				const values = nonEmptyField.find((field) => field.id === selectedId).values.filter((values) => values);
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
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

