# Obsidian State Switcher

This plugin allow you switch value of specific field within custom value set, so you won't make mistake.

## Demo

![demo](https://raw.githubusercontent.com/lijyze/obsidian-state-switcher/main/assets/demo.gif)

## Usage

- First config your custom setting in setting tab.
- In edit mode
  - select `State Switcher: Value update` in command palette to update `key-value` field.
  - select `State Switcher: Array insert` or `State Switcher: Array remove` to insert item to `key-array` field or remove item from `key-array` field.
- Select field name and field value in order.

## Notice

This plugin only switch value of field which is placed in yaml front matter, if no front matter was founded, it will create one then insert the key-value pair just selected into it.

## Working on

1. Make it support more data structure, such as key-object.
2. A new interaction method to bulk write yaml.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-state-switcher/`.

## Release

### 1.1.0
You may need to reset hotkey to call this plugin if you have set ever.

1. Key-array structure supported
2. Add return option to sub menu

## Donating

<a href="https://www.buymeacoffee.com/lijyze" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 160px !important;" ></a>
