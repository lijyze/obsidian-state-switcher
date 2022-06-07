import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { StateSwitcherSettings, FileStateSwitcherSettingTab, DEFAULT_SETTINGS } from './setting';
import Suggester from './suggester';
import { replace } from './util';

export default class StateSwitcherPlugin extends Plugin {
	settings: StateSwitcherSettings ;
	constants = {
		turnBack: '⬅️ Back',
	}

	async onload() {
		console.log('Loading State Switcher');
		await this.loadSettings();

		// add command to launch action
		this.addCommand({
			id: 'launch',
			name: 'Switch state',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				let selectionResult;

				try {
					selectionResult = await this.getUserSelection();
				} catch (error) {
					console.log(error);
				}

				const {selectedKey, selectedValue} = selectionResult;
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

	async getUserSelection(): Promise<{selectedKey: string, selectedValue: string}> {
		const nonEmptyField = this.settings.stateMaps.filter((map) => map.key);

		if (!nonEmptyField.length) {
			new Notice('No map founded, please check your config');
			return ;
		}

		const keys = nonEmptyField.map((field) => field.key);

		let selectedKey: string;
		try {
			selectedKey = await Suggester.Suggest(this.app, keys, keys);
		} catch (error) {
			console.log(error)
		}

		const values = nonEmptyField.find((field) => field.key === selectedKey).values.filter((values) => values);
		values.push(this.constants.turnBack);

		let selectedValue: string;
		try {
			selectedValue = await Suggester.Suggest(this.app, values, values);
		} catch (error) {
			console.log(error)
		}

		if (selectedValue === this.constants.turnBack) return await this.getUserSelection();

		return {selectedKey, selectedValue}
	}
}

