import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { StateSwitcherSettings, FileStateSwitcherSettingTab, DEFAULT_SETTINGS } from './setting';
import Suggester from './suggester';
import { replace, insert, remove } from './util';

export default class StateSwitcherPlugin extends Plugin {
	settings: StateSwitcherSettings ;
	constants = {
		turnBack: '⬅️ Back',
	}

	async onload() {
		console.log('Loading State Switcher');
		await this.loadSettings();

		// add command to handle key-value update
		this.addCommand({
			id: 'keyValueUpdate',
			name: 'key-value update',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const source = this.settings.stateMaps.filter((field) => {
					return field.structure === 'keyValue';
				})
				let selectionResult;

				try {
					selectionResult = await this.getUserSelection(source);
				} catch (error) {
					console.log(error);
				}

				if (!selectionResult) return ;

				const {selectedKey, selectedValue} = selectionResult;
				replace(selectedKey, selectedValue, editor)
			}
		})

		// add command to handle key-array insert
		this.addCommand({
			id: 'keyArrayInsert',
			name: 'key-array insert',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const source = this.settings.stateMaps.filter((field) => {
					return field.structure === 'keyArray';
				})	
				let selectionResult;

				try {
					selectionResult = await this.getUserSelection(source, 'insert');
				} catch (error) {
					console.log(error);
				}

				if (!selectionResult) return ;

				const {selectedKey, selectedValue} = selectionResult;
				insert(selectedKey, selectedValue, editor);
			}
		})

		// add command to handle key-array remove
		this.addCommand({
			id: 'keyArrayRemove',
			name: 'key-array remove',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const source = this.settings.stateMaps.filter((field) => {
					return field.structure === 'keyArray';
				})	
				let selectionResult;

				try {
					selectionResult = await this.getUserSelection(source, 'remove');
				} catch (error) {
					console.log(error);
				}

				if (!selectionResult) return ;

				const {selectedKey, selectedValue} = selectionResult;
				remove(selectedKey, selectedValue, editor)
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

	async getUserSelection(source?: StateSwitcherSettings['stateMaps'], action?: 'insert' | 'remove'): Promise<{selectedKey: string, selectedValue: string}> {
		source = source ?? this.settings.stateMaps;
		const nonEmptyField = source.filter((map) => map.key);

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

		if (!selectedKey) return;

		const fileName = this.app.workspace.getActiveViewOfType(MarkdownView).file.name;
		const currentValues = this.app.metadataCache.getCache(fileName).frontmatter[selectedKey];
		let values = nonEmptyField.find((field) => field.key === selectedKey).values.filter((values) => values);
		if (currentValues && action) {
			if (action === 'insert') values = values.filter((value) => !currentValues.includes(value))
			if (action === 'remove') values = values.filter((value) => currentValues.includes(value))
		}
		values.push(this.constants.turnBack);

		let selectedValue: string;
		try {
			selectedValue = await Suggester.Suggest(this.app, values, values);
		} catch (error) {
			console.log(error)
		}

		if (!selectedValue) return;
		if (selectedValue === this.constants.turnBack) return await this.getUserSelection(source, action);

		return {selectedKey, selectedValue}
	}
}

