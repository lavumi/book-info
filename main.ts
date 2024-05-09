import {App, Modal, Notice, Plugin, PluginSettingTab, Setting} from 'obsidian';
import { getBook } from "src/getBook";
import {FolderSuggest} from "./suggesters/folderSuggester";


interface BookInfoSetting {
	bookFolder: string
}

const DEFAULT_SETTINGS: BookInfoSetting = {
	bookFolder: "/",
};
class InputModal extends Modal {
	result: string;
	onSubmit: (result: string) => void;

	constructor(app: App, onSubmit: (result: string) => void) {
		super(app);
		this.onSubmit = onSubmit;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.createEl("h1", { text: "책 이름을 입력해주세요" });
		new Setting(contentEl)
			.setName("Title")
			.addText((text) =>
				text.onChange((value) => {
					this.result = value
				}));

		new Setting(contentEl)
			.addButton((btn) =>
				btn
					.setButtonText("Find")
					.setCta()
					.onClick(() => {
						this.close();
						this.onSubmit(this.result);
					}));
	}

	onClose() {
		let { contentEl } = this;
		contentEl.empty();
	}
}

class BookInfoSettingTab extends PluginSettingTab {
	plugin : BookInfo;

	constructor(app: App, plugin: BookInfo) {
		super(app, plugin);
		this.plugin = plugin
	}

	display(): any {
		let {containerEl} = this;
		containerEl.empty();

		containerEl.createEl('h2', {text: 'Settings for my awesome plugin'});

		new Setting(this.containerEl)
			.setName("Book Folder Location")
			.setDesc("Folder to save book info.")
			.addSearch((cb) => {
				new FolderSuggest(cb.inputEl);
				cb.setPlaceholder("Example: folder1/folder2")
					.setValue(this.plugin.settings.bookFolder)
					.onChange((new_folder) => {
						this.plugin.settings.bookFolder = new_folder;
						console.log(new_folder);
						this.plugin.saveSettings().then(r => {new Notice("Saved")});
					});
			});
	}

}

export default class BookInfo extends Plugin {

	settings : BookInfoSetting;

	async addBookInfoToActiveFile( bookTitle : string) {
		try {
			const {
				ok,
				book,
				error,
			} = await getBook(bookTitle);

			if (!ok && !!error ) {
				throw error;
			}
			if (!book){
				throw new Error("Book not found")
			}
			new Notice("Loading...");
			const {title, main} = book;

			const regExp = /[{}\[\]\/?.,;:|)*~`!^\-+<>@#$%&\\=('"]/gi;

			const fileName = title.replace(regExp, "");

			await this.app.vault.create(`/${this.settings.bookFolder}/${fileName}.md`, main);

			new Notice(`Success!`);
		}
		catch (e){
			new Notice(e);
		}
		return;
	}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	async onload() {
		await this.loadSettings();
		this.addRibbonIcon(
			"book",
			"Add Book Info",
			async (_: MouseEvent) => {
				new InputModal(this.app, this.addBookInfoToActiveFile.bind(this)).open();
			}
		);

		this.addSettingTab(new BookInfoSettingTab(this.app, this));
	}

}

