import { App, Modal } from 'obsidian';
import { FieldType } from './setting';

type Result = Record<string, unknown>;

interface ModalData<T extends FieldType['structure']> {
  key: string;
  values: string[];
  structure: T;
  apply: boolean;
  current: T extends 'keyValue'? string: Set<string>;
}

export default class BulkUpdateModal extends Modal {
  public promise: Promise<Result>;
  private resolvePromise: (value: Result) => void;
  private rejectPromise: (reason?: string) => void;
  private state: 'pending' | 'resolved' | 'rejected' = 'pending';
  private datas: (ModalData<'keyValue'> | ModalData<'keyArray'>)[];
  
  static async Generate(app: App, settings: FieldType[], currentFrontmatter: Record<string, unknown>) {
    const modal = new BulkUpdateModal(app, settings, currentFrontmatter)

    return modal.promise
  }

  constructor(app: App, settings: FieldType[], currentFrontmatter: Record<string, unknown>) {
    super(app);

    this.promise = new Promise((resolve, reject) => {
      this.resolvePromise = (value: Result) => {
        this.state = 'resolved';
        resolve(value);
      }

      this.rejectPromise = (reason?: string) => {
        this.state = 'rejected';
        reject(reason);
      }
    })

    this.generateData(settings, currentFrontmatter);

    this.renderModal()

    this.addConfirm();
    this.addClose()

    this.open();
  }

  renderModal() {
    const {modalEl, titleEl} = this;

    modalEl.classList.add('yaml_manager-bulk_update_modal')
    titleEl.setText('Yaml');

    this.renderModalContent();
  }

  renderModalContent() {
    const {contentEl} = this;
    contentEl.empty();

    this.datas.forEach((field) => {
      // field container
      const fieldContainer = contentEl.createDiv();
      fieldContainer.classList.add('field')

      // field key container      
      const fieldKeyContainer = fieldContainer.createDiv();
      fieldKeyContainer.classList.add('field_key_container');

      const applyFieldSwitcher = this.addCheckBox(fieldKeyContainer, {
        change: (event: Event) => {
          field.apply = !field.apply;
          this.renderModalContent();
        }
      });
      applyFieldSwitcher.checked = field.apply;
      fieldKeyContainer.appendText(field.key + ':');

      // field values container
      const fieldValuesContaienr = fieldContainer.createDiv()
      fieldValuesContaienr.classList.add('field_value_container')

      field.values.forEach((value) => {
        const label = fieldValuesContaienr.createEl('label');
        label.classList.add('field_value');

        let input;
        
        if (field.structure === 'keyValue') {
          input = this.addRadio(label, {
            change: (e: Event) => {
              field.current = (e.target as HTMLInputElement).value;
            }
          });
          input.checked = field.current === value? true: false;
        }
        
        if (field.structure === 'keyArray') {
          input = this.addCheckBox(label, {
            change: (e: Event) => {
              const value = (e.target as HTMLInputElement).value;
              field.current.has(value)? field.current.delete(value): field.current.add(value);
            }
          });
          input.checked = (field.current as Set<string>).has(value)? true: false;
        }

        if (!applyFieldSwitcher.checked) {
          input.disabled = true;
          input.classList.add('disabled');
        }

        input.name = field.key
        input.value = value;
        
        label.appendText(value)
      });
    })
  }

  generateData(settings: FieldType[], currentFrontmatter: Record<string, unknown>) {
    this.datas = [];

    settings.forEach(({key, values, structure}) => {
      const apply = currentFrontmatter[key]? true: false;
      let current: string | Set<string>;
      if (structure === 'keyValue') current = currentFrontmatter[key] as string || '' ;
      if (structure === 'keyArray') current = new Set(currentFrontmatter[key] as string[] || []);

      this.datas.push({key,values, apply, structure, current} as ModalData<'keyValue'> | ModalData<'keyArray'>)
    })
  }

  addCheckBox(container: HTMLElement, options?: {change?: (event?: Event) => void}) {
    return this.addInput(container, 'checkbox', options)
  }

  addRadio(container: HTMLElement, options?: {change?: (event?: Event) => void}) {
    return this.addInput(container, 'radio', options);
  }

  addInput(container: HTMLElement, type: string, options?: {change?: (event?: Event) => void}) {
    const input = container.createEl('input');
    input.type = type;

    options && Object.entries(options).forEach(([event, handler]) => {
      input.addEventListener(event, (e: Event) => {
        handler(e);
      })
    })

    return input
  }

  addConfirm() {
    const confirmBtn = this.addBtn('Confirm')

    confirmBtn.addEventListener('click', () => {
      this.onConfirm();
    })
  }

  addClose() {
    const closeBtn = this.addBtn('Close');

    closeBtn.addEventListener('click', () => {
      this.close();
    })
  }

  addBtn(text: string) {
    const {modalEl} = this;
    let container = modalEl.querySelector('.btn_container');
    if (!container) {
      container = modalEl.createDiv();
      container.addClass('btn_container');
    }

    const btn = container.createEl('button');
    btn.classList.add(`btn_${text.toLowerCase()}`)
    btn.setText(text);

    return btn
  }

  onConfirm() {
    const result: Result = {};
    this.datas.forEach((data) => {
      if (!data.apply) return;

      if (data.structure === 'keyValue') result[data.key] = data.current || undefined;
      if (data.structure === 'keyArray') result[data.key] = [...data.current];
    });

    this.resolvePromise(result);
    this.close();
  }

  onClose() {
    if (this.state === 'pending') {
      this.rejectPromise('Modal closed.');
    }
  }
}