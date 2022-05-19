import { App, ButtonComponent, PluginSettingTab, Setting } from "obsidian";

import FileStateSwitcherPlugin from "./main";
import { itemMove, itemAdd, itemDelete } from "./util";

interface FieldType {
	id: string;
	key: string;
	values: string[];
}

export interface StateSwitcherSettings {
	stateMaps: FieldType[];
}

export const DEFAULT_SETTINGS: StateSwitcherSettings = {
	stateMaps: [
		{ id: '0', key: "state", values: ["waiting", "ongoing", "completed"] }
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
							id: '' + Date.now(),
							key: "",
							values: [""],
						});
						this.plugin.saveSettings();
						this.display();
					});
			});

		this.plugin.settings.stateMaps.forEach((field, fieldIndex, fields) => {
			const s = new Setting(this.containerEl);
			s.controlEl.addClass("fss-setting-control");
			s.infoEl.remove();

			const fieldContainer = s.controlEl.createDiv();
			fieldContainer.addClass("fss-field");

			const valueContainer = s.controlEl.createDiv();
			valueContainer.addClass("fss-values");

			/**
			 * Delete field key
			 */
			s.addExtraButton((button) => {
				button
					.setIcon("cross")
					.setTooltip("Delete key")
					.onClick(() => {
						itemDelete(fields, fieldIndex);
						this.plugin.saveSettings();
						this.display();
					});
			});
			fieldContainer.appendChild(s.controlEl.lastChild);

			/**
			 * Define field key
			 */
			s.addText((text) => {
				text.setPlaceholder("Field")
					.setValue(field.key)
					.onChange((newField) => {
						field.key = newField;
						this.plugin.saveSettings();
					});
			});
			fieldContainer.appendChild(s.controlEl.lastChild);

			field.values.forEach((value, valueIndex, values) => {
				/**
				 * Define field value
				 */
				s.addText((text) => {
					text.setPlaceholder(`Value${valueIndex + 1}`)
						.setValue(value)
						.onChange((newValue) => {
							values[valueIndex] = newValue;
							this.plugin.saveSettings();
						});
				});
				valueContainer.appendChild(s.controlEl.lastChild);

				/**
				 * Move field value up
				 */
				s.addExtraButton((cb) => {
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
				valueContainer.appendChild(s.controlEl.lastChild);

				/**
				 * Move field value down
				 */
				s.addExtraButton((cb) => {
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
				valueContainer.appendChild(s.controlEl.lastChild);

				/**
				 * Add new field value
				 */
				s.addExtraButton((cb) => {
					cb.setIcon('plus')
						.setTooltip("Add")
						.onClick(() => {
							itemAdd(values, valueIndex + 1, '');

							this.plugin.saveSettings();
							this.display();
						});
				});
				valueContainer.appendChild(s.controlEl.lastChild);

				/**
				 * Delete field value
				 */
				s.addExtraButton((cb) => {
					cb.setIcon("cross")
						.setTooltip("Delete")
						.onClick(() => {
							if (values.length === 1) {
								itemDelete(fields, fieldIndex)
							} else {
								itemDelete(values, valueIndex)
							}

							this.plugin.saveSettings();
							this.display();
						});
				});
				valueContainer.appendChild(s.controlEl.lastChild);
			});
		});
	}
}
