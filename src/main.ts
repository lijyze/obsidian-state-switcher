import { Editor, MarkdownView, Notice, Plugin } from 'obsidian';

import { StateSwitcherSettings, FileStateSwitcherSettingTab, DEFAULT_SETTINGS, KeyArrayData } from './setting';
import Suggester from './suggester';
import BulkUpdateModal from './bulkUpdateModal';
import { replace, insert, remove, getObjectYaml, bulkUpdate } from './util';
import { makeCompatible } from './version';

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
					selectionResult = await this.getUserSelection(editor, source);
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
					selectionResult = await this.getUserSelection(editor, source, 'insert');
				} catch (error) {
					console.log(error);
				}

				if (!selectionResult) return ;

				const {selectedKey, selectedValue} = selectionResult;
				const shouldFlat = this.getFlatFields().includes(selectedKey);

				insert(selectedKey, selectedValue, shouldFlat, editor);
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
					selectionResult = await this.getUserSelection(editor, source, 'remove');
				} catch (error) {
					console.log(error);
				}

				if (!selectionResult) return ;

				const {selectedKey, selectedValue} = selectionResult;

				const shouldFlat = this.getFlatFields().includes(selectedKey);

				remove(selectedKey, selectedValue, shouldFlat, editor)
			}
		})

		// bulk update yaml front matter
		this.addCommand({
			id: 'bulkUpdate',
			name: 'bulk update',
			editorCallback: async (editor: Editor, view: MarkdownView) => {
				const currentFrontmatter = getObjectYaml(editor);
				let updateDatas: Record<string, unknown>;
				try {
					updateDatas = await BulkUpdateModal.Generate(this.app, this.settings.stateMaps, currentFrontmatter);
				} catch(error) {
					console.log(error);
				}

				if (!updateDatas) return;

				const removeDatas = this.settings.stateMaps.flatMap((field) => {
					return updateDatas[field.key]? []: [field.key];
				})

				const flatFields = this.getFlatFields().filter((key) => key in updateDatas);

				bulkUpdate(updateDatas, removeDatas, flatFields, editor);
			}
		})

		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new FileStateSwitcherSettingTab(this.app, this));
	}

	onunload() {

	}

	async loadSettings() {
		const settings: StateSwitcherSettings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());

		this.settings = makeCompatible(settings);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async getUserSelection(editor: Editor, source?: StateSwitcherSettings['stateMaps'], action?: 'insert' | 'remove'): Promise<{selectedKey: string, selectedValue: string}> {
		source = source ?? this.settings.stateMaps;
		const currentFrontmatter = getObjectYaml(editor)
		const nonEmptyField = action === 'remove'
			? source.filter((map) => map.key && currentFrontmatter[map.key])
			: source.filter((map) => map.key);

		if (!nonEmptyField.length) {
			action === 'remove'
				? new Notice('Nothing can be removed')
				: new Notice('No map founded, please check your config');
			return ;
		}

		const keys = nonEmptyField.map((field) => field.key);

		try {
			const selectedKey = await Suggester.Suggest(this.app, keys, keys);
			let values = nonEmptyField.find((field) => field.key === selectedKey).values.filter((values) => values);

			if (action) {
				const currentValues = currentFrontmatter[selectedKey];
	
				if (currentValues) {
					if (action === 'insert') values = values.filter((value) => !currentValues.includes(value))
					if (action === 'remove') values = values.filter((value) => currentValues.includes(value))
				}
			}
			values.push(this.constants.turnBack);

			const selectedValue = await Suggester.Suggest(this.app, values, values);
	
			if (selectedValue === this.constants.turnBack) return await this.getUserSelection(editor, source, action);

			return {selectedKey, selectedValue}
		} catch (error) {
			console.log(error)
		}
	}

	getFlatFields() {
		return this.settings.stateMaps
			.filter((setting) => (setting as KeyArrayData).format === 'flat')
			.map((setting) => setting.key);
	}
}

