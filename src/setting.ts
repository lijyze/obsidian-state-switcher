import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";

import FileStateSwitcherPlugin from "./main";
import { itemMove, itemAdd, itemDelete } from "./util";

interface FieldType {
	key: string;
	structure: Exclude<keyof typeof structureSet, keyof []>;
	values: string[];
}

export interface StateSwitcherSettings {
	stateMaps: FieldType[];
}

const structureSet = ['key-value', 'key-array'] as const;

export const DEFAULT_SETTINGS: StateSwitcherSettings = {
	stateMaps: [
		{ key: "state", structure: '0', values: ["waiting", "ongoing", "completed"] }
	],
};

export class FileStateSwitcherSettingTab extends PluginSettingTab {

	constructor(app: App, private plugin: FileStateSwitcherPlugin) {
		super(app, plugin);
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "State Switcher Settings" });

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
							structure: '0',
							values: [""],
						});
						this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.stateMaps.forEach((field, fieldIndex, fields) => {
			const s = new Setting(this.containerEl);
			s.controlEl.addClass("fss-setting-control");

			const metaContainer = s.controlEl.createDiv();
			metaContainer.addClass("fss-meta");
			renderMeta.call(this, s, metaContainer, field)

			const fieldContainer = s.controlEl.createDiv();
			fieldContainer.addClass("fss-field");
			renderField.call(this, s, fieldContainer, fields, fieldIndex);

			const valueContainer = s.controlEl.createDiv();
			valueContainer.addClass("fss-values");
			renderValue.call(this, s, valueContainer, field.values, fields, fieldIndex);
		});
	}
}

function renderMeta(setting: Setting, container: HTMLDivElement, field: FieldType) {
	setting.setName('Structure').setDesc('Value structure of this key')
	container.appendChild(setting.infoEl);

	setting.addDropdown((cb) => {
		cb.addOptions(Object.fromEntries(structureSet.entries()))
			.setValue(field.structure ?? '0')
			.onChange((value) => {
				field.structure =  value as FieldType["structure"];
				this.plugin.saveSettings();
				this.display();
			})
	})
	container.appendChild(setting.controlEl.lastChild);
}

function renderField(setting: Setting, container: HTMLDivElement, keys: FieldType[], keyIdx: number) {
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

function renderValue(setting: Setting, container: HTMLDivElement, values : string[], keys: FieldType[], keyIdx: number) {
	values.forEach((value, valueIndex, values) => {
		const valueContainer = setting.controlEl.createDiv();
		valueContainer.addClass('fss-values-value');
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
						itemMove(values, valueIndex - 1, valueIndex)								
						
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
						itemMove(values, valueIndex, valueIndex + 1)								
						
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
			cb.setIcon('plus')
				.setTooltip("Add")
				.onClick(() => {
					itemAdd(values, valueIndex + 1, '');

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
						itemDelete(keys, keyIdx)
					} else {
						itemDelete(values, valueIndex)
					}

					this.plugin.saveSettings();
					this.display();
				});
		});
		valueContainer.appendChild(setting.controlEl.lastChild);
	});
}