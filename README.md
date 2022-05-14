# Obsidian State Switcher

This plugin allow you switch value of specific field within custom value set, so you won't make mistake.

## Demo

![demo](https://raw.githubusercontent.com/lijyze/obsidian-state-switcher/main/assets/demo.gif)

## Usage

- First config your custom setting in setting tab.
- Config hotkey in hotkey setting tab. Default hotkey is `Cmd + Shift + S` with Mac and `Ctrl + Shift + S` with Windows.
- In edit mode, press hotkey or select `State Switcher: Switch state` in command palette.
- Select field name and field value in order.

## Notice

This plugin only switch value of field which is placed in yaml front matter, if no front matter was founded, it will create one then insert the key-value pair just selected into it.

## Manually installing the plugin

- Copy over `main.js`, `styles.css`, `manifest.json` to your vault `VaultFolder/.obsidian/plugins/your-plugin-id/`.

## Donating

<a href="https://www.buymeacoffee.com/lijyze" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-red.png" alt="Buy Me A Coffee" style="height: 40px !important;width: 160px !important;" ></a>
