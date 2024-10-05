import { App, debounce, Platform, PluginSettingTab, Setting } from "obsidian";
import CanvasMindMap from "./canvasMindMap";

type ModifierKey = "Alt" | "Mod" | "Shift";

function supportModifierKey() {
	return ["Alt", "Mod", "Shift"];
}

export interface MindMapSettings {
	navigate: {
		useNavigate: boolean;
		modifierKey: string[];
	};
	create: {
		createFloat: boolean;
		childDirection: string;
		siblingWidth: number;
		siblingHeight: number;
	};
	layout: {
		direction: "TB" | "BT" | "LR" | "RL";
		autoHeight: boolean;
		autoLayout: boolean;
		autoLayoutDirection: "TB" | "BT" | "LR" | "RL";
	};
	advanced: {
		transferToCommands: boolean;
	};
}

export const DEFAULT_SETTINGS: MindMapSettings = {
	navigate: {
		useNavigate: true,
		modifierKey: ["Alt"],
	},
	create: {
		createFloat: true,
		childDirection: "right",
		siblingWidth: 200,
		siblingHeight: 100,
	},
	layout: {
		direction: "LR",
		autoLayout: true,
		autoLayoutDirection: "LR",
		autoHeight: true,
	},
	advanced: {
		transferToCommands: false,
	},
};

export class MindMapSettingTab extends PluginSettingTab {
	plugin: CanvasMindMap;

	updateSettings(key: any, value: any): void {
		this.plugin.settings = {
			...this.plugin.settings,
			[key.split(".")[0]]: {
				// @ts-ignore
				...this.plugin.settings[key.split(".")[0]],
				[key.split(".")[1]]: value,
			},
		};
		this.applySettingsUpdate();
	}

	applySettingsUpdate = debounce(
		async () => {
			await this.plugin.saveSettings();
			console.log("debounce");
		},
		300,
		true
	);

	constructor(app: App, plugin: CanvasMindMap) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		containerEl.createEl("h2", { text: "Canvas MindMap" });

		this.useNavigateHotkeySetting(containerEl, this.plugin.settings);
		this.createHotkeySetting(containerEl, this.plugin.settings);
	}

	useNavigateHotkeySetting(
		containerEl: HTMLElement,
		setting: MindMapSettings
	) {
		new Setting(containerEl)
			.setName("Use Navigate Hotkey")
			.setDesc("Use the hotkey to navigate the mind map")
			.addToggle((toggle) => {
				toggle.setValue(setting.navigate.useNavigate);
				toggle.onChange((value) => {
					this.updateSettings("navigate.useNavigate", value);

					setTimeout(() => {
						this.display();
					}, 700);
				});
			});
	}

	private createHotkeySetting(
		containerEl: HTMLElement,
		setting: MindMapSettings
	) {
		new Setting(containerEl)
			.setName("Create Float")
			.setDesc("Create a float node")
			.addToggle((toggle) => {
				toggle.setValue(setting.create.createFloat);
				toggle.onChange((value) => {
					this.updateSettings("create.createFloat", value);
				});
			});
	}
}
