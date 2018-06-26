import { ɵdefineComponent as defineComponent } from '@angular/core';
import { Litfy, html, TemplateResult } from './litfy';

export class IvytestComponent extends Litfy {
  private name = 'Hello, ivy';
  private class = 'classname';
  private color = 'red';
  private title = 'Lit-fy';

  private header = html`<h1>${this.title}</h1>`;

  render(): TemplateResult {
    return html`
      ${this.header}
      <div test test2>
        テキスト
        <!-- コメント -->
        <span>${this.name}</span>
        <p class="test ${this.class}" style="color: ${this.color};">${this.name}</p>
      </div>
      <div>テキスト2</div>
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
