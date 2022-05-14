import { App, FuzzyMatch, FuzzySuggestModal } from "obsidian";

export default class Suggester extends FuzzySuggestModal<string> {
  public promise: Promise<string>
  private resolvePromise: (value: string) => void;
  private rejectPromise: (reason?: string) => void;
  private state: 'pending' | 'resolved' | 'rejected' = 'pending';

  public static Suggest(app: App, displayItems: string[], items: string[]) {
    const suggester = new Suggester(app, displayItems, items);
    return suggester.promise;
  }

  constructor(app: App, private displayItems: string[], private items: string[]) {
    super(app)

    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = (value: string) => {
        this.state = 'resolved';
        resolve(value);
      };
      this.rejectPromise = (reason?: string) => {
        this.state = 'rejected';
        reject(reason);
      };
    })

    this.open()
  }
  
  getItems(): string[] {
    return this.items;
  }

  getItemText(item: string): string {
    return this.displayItems[this.items.indexOf(item)]
  }

  onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {}

  selectSuggestion(value: FuzzyMatch<string>, evt: MouseEvent | KeyboardEvent): void {
    this.resolvePromise(value.item);

    super.selectSuggestion(value, evt);
  }

  onClose(): void {
    if (this.state !== 'resolved') this.rejectPromise('Nothing selected');

    super.onClose();
  }
}