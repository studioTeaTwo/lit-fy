import { ɵdefineComponent as defineComponent } from '@angular/core';
import { Litfy, html, TemplateResult } from './litfy';

export class IvytestComponent extends Litfy {
  private name = 'Hello, ivy';
  private class = 'classname';
  private color = 'red';
  private title = 'Lit-fy';
  private value = 'initial';

  private header = html`<h1 style="color: ${this.color};">${this.title}</h1>`;

  constructor() {
    super();
    this.onChange = this.onChange.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  onChange(e) {
    this.value = e.target.value;
    this.color = 'black';
  }

  onKeyup(e) {
    // console.log('keyup', e.target.value);
  }

  onClick(msg) {
    console.log(msg);
    window.alert(msg);
  }

  render(): TemplateResult {
    return html`
      ${this.header}
      <div test test2>
        テキスト${this.name}
        <!-- コメント -->
        <span class="test" style="color: ${this.color};">テキスト2${this.name}</span>
        <input type="text" on-change=${this.onChange} on-keyup=${this.onKeyup}>
        <button type="button" on-click=${(e) => this.onClick('Clicked')}>Click Me</button>
      </div>
      <div>${this.value}</div>
      テキスト3
    `;
  }

  // tslint:disable-next-line:member-ordering
  static ngComponentDef = defineComponent({
    type: IvytestComponent,
    selectors: [['ivy-test']],
    factory: () => new IvytestComponent(),
    template: IvytestComponent.litToIvy,
    // inputs: { ponyModel: 'ponyModel' },
    // directives: () => [ImageComponent];
  });
}
