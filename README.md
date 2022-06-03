# Obsidian State Switcher

This plugin allow you switch value of specific field within custom value set, so you won't make mistake.

## Demo

![demo](https://raw.githubusercontent.com/lijyze/obsidian-state-switcher/main/assets/demo.gif)

## Usage

- First config your custom setting in setting tab.
- In edit mode, press hotkey or select `State Switcher: Switch state` in command palette. You can give this command a hotkey in hotkey setting tab.
- Select field name and field value in order.

## Notice

This plugin only switch value of field which is placed in yaml front matter, if no front matter was founded, it will create one then insert the key-value pair just selected into it.

## Working on

1. Make it support more data structure, such as key-array, key-object, etc.
2. Make it able to handle multiple fields in one time.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/obsidian-state-switcher/`.

## Donating

<a href="https://www.buymeacoffee.com/lijyze" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 160px !important;" ></a>
