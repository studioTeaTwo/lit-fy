import {
  ɵdefineComponent as defineComponent,
  ɵRenderFlags as RenderFlags,
  ɵEe as element,
} from '@angular/core';
import { renderToHtml } from '../test-utils/render_utils.spec';
import { Litfy, html, TemplateResult } from 'lib/public_api';

describe('static html template test', () => {

  class StaticHtmlTemplateComponent extends Litfy {

    static ngComponentDef = defineComponent({
      type: StaticHtmlTemplateComponent,
      selectors: [['basic-html-tag']],
      factory: () => new StaticHtmlTemplateComponent(),
      template: StaticHtmlTemplateComponent.litToIvy,
    });

    private header = html`<h1>Title</h1>`;

    constructor() {
      super();
    }

    render() {
      return html`
        ${this.header}
        <p>this is raw html tag</p>
      `;
    }
  }

  const defs = [StaticHtmlTemplateComponent];

  it('should render static html template', () => {
    function Template(rf: RenderFlags, ctx: any) {
      if (rf & RenderFlags.Create) {
        element(0, 'basic-html-tag');
      }
    }

    expect(renderToHtml(Template, null, defs)).toEqual('<h1>Title</h1><p>this is raw html tag</p>');
  });

});
