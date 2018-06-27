import { ɵdefineComponent as defineComponent } from '@angular/core';
import { Litfy, html, TemplateResult } from './litfy';

export class IvytestComponent extends Litfy {
  private name = 'Hello, ivy';
  private class = 'classname';
  private color = 'red';
  private title = 'Lit-fy';
  private value = 'initial';

  private header = html`<h1>${this.title}</h1>`;

  // render(): TemplateResult {
  //   return html`
  //     <input type="text" on-change=${(e) => {
  //       console.log(e.target.value, this.value);
  //       this.value = e.target.value;
  //     }}>
  //     <button type="button" on-click=${(e) => window.alert('clicked')}>Click Me</button>
  //     <p>${this.value}</p>
  //   `;
  // }

  render(): TemplateResult {
    return html`
      ${this.header}
      <div test test2>
        テキスト
        <!-- コメント -->
        <span class="test ${this.class}" style="color: ${this.color};">${this.name}テキスト2</span>
        <input type="text" on-change=${(e) => this.value = e.target.value}>
        <button type="button" on-click=${(e) => window.alert('clicked')}>Click Me</button>
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
