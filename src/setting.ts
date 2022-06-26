import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";

import FileStateSwitcherPlugin from "./main";
import { itemMove, itemAdd, itemDelete } from "./util";

export interface KeyValueData {
	key: string;
	values: string[];
	structure: 'keyValue';
}

export interface KeyArrayData {
	key: string;
	values: string[];
	structure: 'keyArray';
	format: 'stack' | 'flat';
}

export type FieldType = KeyValueData | KeyArrayData;

export interface StateSwitcherSettings {
	stateMaps: FieldType[];
}

const structureMap = {
	keyValue: "key-value",
	keyArray: "key-array",
} as const;

const formatMap = {
	stack: '- item',
	flat: '[item]'
}

export const DEFAULT_SETTINGS: StateSwitcherSettings = {
	stateMaps: [
		{
			key: "state",
			structure: "keyValue",
			values: ["waiting", "ongoing", "completed"],
		},
	],
};

export class FileStateSwitcherSettingTab extends PluginSettingTab {
	constructor(app: App, private plugin: FileStateSwitcherPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Yaml Manager Settings" });

		this.renderNewSettingItemButton(containerEl);

		this.plugin.settings.stateMaps.forEach((field, fieldIndex, fields) => {
			const s = new Setting(this.containerEl);
			s.controlEl.addClass("fss-setting-control");

			this.renderSettingItem(s, field, fieldIndex, fields);

			s.infoEl.remove();
		});
	}

	renderNewSettingItemButton(containerEl: HTMLElement) {
		new Setting(containerEl)
			.setName("Add map")
			.setDesc("Add new key-values map")
			.addButton((button: ButtonComponent) => {
				button
					.setTooltip("Add additional map")
					.setButtonText("+")
					.onClick(() => {
						this.plugin.settings.stateMaps.push({
							key: "",
							structure: "keyValue",
							values: [""],
						});
						this.plugin.saveSettings();
						this.display();
					});
			});
	}

	renderSettingItem(s: Setting, field: FieldType, fieldIndex: number, fields: FieldType[]) {
		const metaContainer = s.controlEl.createDiv();
		metaContainer.addClass("fss-meta");
		this.renderMeta(s, metaContainer, field);

		const fieldContainer = s.controlEl.createDiv();
		fieldContainer.addClass("fss-field");
		this.renderField(s, fieldContainer, fields, fieldIndex);

		const valueContainer = s.controlEl.createDiv();
		valueContainer.addClass("fss-values");
		this.renderValue(s, valueContainer, field.values, fields, fieldIndex);
	}

	renderMeta(setting: Setting, container: HTMLDivElement, field: FieldType) {
		const settingItemContainer = container.createDiv({cls: 'setting-item'});
		const infoContainer = settingItemContainer.createDiv({cls: 'setting-item-info'});
		infoContainer.createDiv({cls: 'setting-item-name', text: 'Structure'})
		infoContainer.createDiv({cls: 'setting-item-description', text: 'Value structure of this field'})

		setting.addDropdown((cb) => {
			cb.addOptions(structureMap)
				.setValue(field.structure ?? "keyValue")
				.onChange((value) => {
					if (value === 'keyValue') delete (field as KeyArrayData).format
					field.structure = value as FieldType["structure"];
					this.plugin.saveSettings();
					this.display();
				});
		});
		settingItemContainer.appendChild(setting.controlEl.lastChild);

		if (field.structure === 'keyArray') {
			const settingItemContainer = container.createDiv({cls: 'setting-item'});
			const infoContainer = settingItemContainer.createDiv({cls: 'setting-item-info'});
			infoContainer.createDiv({cls: 'setting-item-name', text: 'Format'});
			infoContainer.createDiv({cls: 'setting-item-description', text: 'Value format of this field'});

			setting.addDropdown((cb) => {
				cb.addOptions(formatMap)
					.setValue(field.format ?? 'stack')
					.onChange((value) => {
						field.format = value as KeyArrayData['format']
						this.plugin.saveSettings();
						this.display();
					})
			})
			settingItemContainer.appendChild(setting.controlEl.lastChild);
		}
	}

	renderField(setting: Setting, container: HTMLDivElement, keys: FieldType[], keyIdx: number) {
		/**
		 * Delete field key
		 */
		setting.addExtraButton((button) => {
			button
				.setIcon("cross")
				.setTooltip("Delete key")
				.onClick(() => {
					itemDelete(keys, keyIdx);
					this.plugin.saveSettings();
					this.display();
				});
		});
		container.appendChild(setting.controlEl.lastChild);

		/**
		 * Define field key
		 */
		setting.addText((text) => {
			text.setPlaceholder("Field")
				.setValue(keys[keyIdx].key)
				.onChange((newField) => {
					keys[keyIdx].key = newField;
					this.plugin.saveSettings();
				});
		});
		container.appendChild(setting.controlEl.lastChild);
	}

	renderValue(setting: Setting, container: HTMLDivElement, values: string[], keys: FieldType[], keyIdx: number) {
		values.forEach((value, valueIndex, values) => {
			const valueContainer = setting.controlEl.createDiv();
			valueContainer.addClass("fss-values-value");
			container.appendChild(valueContainer);

			/**
			 * Define field value
			 */
			setting.addText((text) => {
				text.setPlaceholder(`Value${valueIndex + 1}`)
					.setValue(value)
					.onChange((newValue) => {
						values[valueIndex] = newValue;
						this.plugin.saveSettings();
					});
			});
			valueContainer.appendChild(setting.controlEl.lastChild);

			/**
			 * Move field value up
			 */
			setting.addExtraButton((cb) => {
				cb.setIcon("up-chevron-glyph")
					.setTooltip("Move up")
					.onClick(() => {
						if (valueIndex !== 0) {
							itemMove(values, valueIndex - 1, valueIndex);

							this.plugin.saveSettings();
							this.display();
						}
					});
			});
			valueContainer.appendChild(setting.controlEl.lastChild);

			/**
			 * Move field value down
			 */
			setting.addExtraButton((cb) => {
				cb.setIcon("down-chevron-glyph")
					.setTooltip("Move down")
					.onClick(() => {
						if (valueIndex !== values.length - 1) {
							itemMove(values, valueIndex, valueIndex + 1);

							this.plugin.saveSettings();
							this.display();
						}
					});
			});
			valueContainer.appendChild(setting.controlEl.lastChild);

			/**
			 * Add new field value
			 */
			setting.addExtraButton((cb) => {
				cb.setIcon("plus")
					.setTooltip("Add")
					.onClick(() => {
						itemAdd(values, valueIndex + 1, "");

						this.plugin.saveSettings();
						this.display();
					});
			});
			valueContainer.appendChild(setting.controlEl.lastChild);

			/**
			 * Delete field value
			 */
			setting.addExtraButton((cb) => {
				cb.setIcon("cross")
					.setTooltip("Delete")
					.onClick(() => {
						if (values.length === 1) {
							itemDelete(keys, keyIdx);
						} else {
							itemDelete(values, valueIndex);
						}

						this.plugin.saveSettings();
						this.display();
					});
			});
			valueContainer.appendChild(setting.controlEl.lastChild);
		});
	}
}
