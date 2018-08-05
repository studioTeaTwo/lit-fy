/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */

import {stringifyElement} from '@angular/platform-browser/testing/src/browser_util';

import {Injector} from '@angular/core/src/di/injector';
import {CreateComponentOptions} from '@angular/core/src/render3/component';
import {extractDirectiveDef, extractPipeDef} from '@angular/core/src/render3/definition';
import {ComponentTemplate, ComponentType, DirectiveDefInternal, DirectiveType, PublicFeature, RenderFlags, defineComponent, defineDirective, renderComponent as _renderComponent, tick} from '@angular/core/src/render3';
import {NG_HOST_SYMBOL, renderTemplate} from '@angular/core/src/render3/instructions';
import {DirectiveDefList, DirectiveDefListOrFactory, DirectiveTypesOrFactory, PipeDefInternal, PipeDefList, PipeDefListOrFactory, PipeTypesOrFactory} from '@angular/core/src/render3/interfaces/definition';
import {LElementNode} from '@angular/core/src/render3/interfaces/node';
import {RElement, RText, Renderer3, RendererFactory3, domRendererFactory3} from '@angular/core/src/render3/interfaces/renderer';
import {Sanitizer} from '@angular/core/src/sanitization/security';
import {Type} from '@angular/core/src/type';

import {getRendererFactory2} from './imported_renderer2.spec';

export abstract class BaseFixture {
  hostElement: HTMLElement;

  constructor() {
    this.hostElement = document.createElement('div');
    this.hostElement.setAttribute('fixture', 'mark');
  }

  /**
   * Current state of rendered HTML.
   */
  get html(): string { return toHtml(this.hostElement as any as Element); }
}

function noop() {}
/**
 * Fixture for testing template functions in a convenient way.
 *
 * This fixture allows:
 * - specifying the creation block and update block as two separate functions,
 * - maintaining the template state between invocations,
 * - access to the render `html`.
 */
export class TemplateFixture extends BaseFixture {
  hostNode: LElementNode;
  private _directiveDefs: DirectiveDefList|null;
  private _pipeDefs: PipeDefList|null;
  private _sanitizer: Sanitizer|null;
  private _rendererFactory: RendererFactory3;

  /**
   *
   * @param createBlock Instructions which go into the creation block:
   *          `if (rf & RenderFlags.Create) { __here__ }`.
   * @param updateBlock Optional instructions which go into the update block:
   *          `if (rf & RenderFlags.Update) { __here__ }`.
   */
  constructor(
      private createBlock: () => void, private updateBlock: () => void = noop,
      directives?: DirectiveTypesOrFactory|null, pipes?: PipeTypesOrFactory|null,
      sanitizer?: Sanitizer|null, rendererFactory?: RendererFactory3) {
    super();
    this._directiveDefs = toDefs(directives, extractDirectiveDef);
    this._pipeDefs = toDefs(pipes, extractPipeDef);
    this._sanitizer = sanitizer || null;
    this._rendererFactory = rendererFactory || domRendererFactory3;
    this.hostNode = renderTemplate(this.hostElement, (rf: RenderFlags, ctx: any) => {
      if (rf & RenderFlags.Create) {
        this.createBlock();
      }
      if (rf & RenderFlags.Update) {
        this.updateBlock();
      }
    }, null !, this._rendererFactory, null, this._directiveDefs, this._pipeDefs, sanitizer);
  }

  /**
   * Update the existing template
   *
   * @param updateBlock Optional update block.
   */
  update(updateBlock?: () => void): void {
    renderTemplate(
        this.hostNode.native, updateBlock || this.updateBlock, null !, this._rendererFactory,
        this.hostNode, this._directiveDefs, this._pipeDefs, this._sanitizer);
  }
}


/**
 * Fixture for testing Components in a convenient way.
 */
export class ComponentFixture<T> extends BaseFixture {
  component: T;
  requestAnimationFrame: {(fn: () => void): void; flush(): void; queue: (() => void)[]; };

  constructor(
      private componentType: ComponentType<T>,
      opts: {injector?: Injector, sanitizer?: Sanitizer, rendererFactory?: RendererFactory3} = {}) {
    super();
    this.requestAnimationFrame = function(fn: () => void) {
      requestAnimationFrame.queue.push(fn);
    } as any;
    this.requestAnimationFrame.queue = [];
    this.requestAnimationFrame.flush = function() {
      while (requestAnimationFrame.queue.length) {
        requestAnimationFrame.queue.shift() !();
      }
    };

    this.component = _renderComponent(componentType, {
      host: this.hostElement,
      scheduler: this.requestAnimationFrame,
      injector: opts.injector,
      sanitizer: opts.sanitizer,
      rendererFactory: opts.rendererFactory || domRendererFactory3
    });
  }

  update(): void {
    tick(this.component);
    this.requestAnimationFrame.flush();
  }
}

///////////////////////////////////////////////////////////////////////////////////
// The methods below use global state and we should stop using them.
// Fixtures above are preferred way of testing Components and Templates
///////////////////////////////////////////////////////////////////////////////////

export const document = ((typeof global === 'object' && global || window) as any).document;
export let containerEl: HTMLElement = null !;
let host: LElementNode|null;
const isRenderer2 =
    typeof process === 'object' && process.argv[3] && process.argv[3] === '--r=renderer2';
// tslint:disable-next-line:no-console
console.log(`Running tests with ${!isRenderer2 ? 'document' : 'Renderer2'} renderer...`);
const testRendererFactory: RendererFactory3 =
    isRenderer2 ? getRendererFactory2(document) : domRendererFactory3;

export const requestAnimationFrame:
    {(fn: () => void): void; flush(): void; queue: (() => void)[]; } = function(fn: () => void) {
      requestAnimationFrame.queue.push(fn);
    } as any;
requestAnimationFrame.flush = function() {
  while (requestAnimationFrame.queue.length) {
    requestAnimationFrame.queue.shift() !();
  }
};

export function resetDOM() {
  requestAnimationFrame.queue = [];
  if (containerEl) {
    try {
      document.body.removeChild(containerEl);
    } catch (e) {
    }
  }
  containerEl = document.createElement('div');
  containerEl.setAttribute('host', '');
  document.body.appendChild(containerEl);
  host = null;
  // TODO: assert that the global state is clean (e.g. ngData, previousOrParentNode, etc)
}

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function renderToHtml(
    template: ComponentTemplate<any>, ctx: any, directives?: DirectiveTypesOrFactory | null,
    pipes?: PipeTypesOrFactory | null, providedRendererFactory?: RendererFactory3 | null) {
  host = renderTemplate(
      containerEl, template, ctx, providedRendererFactory || testRendererFactory, host,
      toDefs(directives, extractDirectiveDef), toDefs(pipes, extractPipeDef));
  return toHtml(containerEl);
}

function toDefs(
    types: DirectiveTypesOrFactory | undefined | null,
    mapFn: (type: Type<any>) => DirectiveDefInternal<any>): DirectiveDefList|null;
function toDefs(
    types: PipeTypesOrFactory | undefined | null,
    mapFn: (type: Type<any>) => PipeDefInternal<any>): PipeDefList|null;
function toDefs(
    types: PipeTypesOrFactory | DirectiveTypesOrFactory | undefined | null,
    mapFn: (type: Type<any>) => PipeDefInternal<any>| DirectiveDefInternal<any>): any {
  if (!types) { return null; }
  if (typeof types === 'function') {
    types = types();
  }
  return types.map(mapFn);
}

beforeEach(resetDOM);

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function renderComponent<T>(type: ComponentType<T>, opts?: CreateComponentOptions): T {
  return _renderComponent(type, {
    rendererFactory: opts && opts.rendererFactory || testRendererFactory,
    host: containerEl,
    scheduler: requestAnimationFrame,
    sanitizer: opts ? opts.sanitizer : undefined,
    hostFeatures: opts && opts.hostFeatures
  });
}

/**
 * @deprecated use `TemplateFixture` or `ComponentFixture`
 */
export function toHtml<T>(componentOrElement: T | RElement): string {
  const node = (componentOrElement as any)[NG_HOST_SYMBOL] as LElementNode;
  if (node) {
    return toHtml(node.native);
  } else {
    return stringifyElement(componentOrElement)
        .replace(/^<div host="">/, '')
        .replace(/^<div fixture="mark">/, '')
        .replace(/<\/div>$/, '')
        .replace(' style=""', '')
        .replace(/<!--container-->/g, '')
        .replace(/<!--ng-container-->/g, '');
  }
}

export function createComponent(
    name: string, template: ComponentTemplate<any>, directives: DirectiveTypesOrFactory = [],
    pipes: PipeTypesOrFactory = [],
    viewQuery: ComponentTemplate<any>| null = null): ComponentType<any> {
  return class Component {
    value: any;
    static ngComponentDef = defineComponent({
      type: Component,
      selectors: [[name]],
      factory: () => new Component,
      template: template,
      viewQuery: viewQuery,
      features: [PublicFeature],
      directives: directives,
      pipes: pipes
    });
  };
}

export function createDirective(
    name: string, {exportAs}: {exportAs?: string} = {}): DirectiveType<any> {
  return class Directive {
    static ngDirectiveDef = defineDirective({
      type: Directive,
      selectors: [['', name, '']],
      factory: () => new Directive(),
      features: [PublicFeature],
      exportAs: exportAs,
    });
  };
}


// Verify that DOM is a type of render. This is here for error checking only and has no use.
export const renderer: Renderer3 = null as any as Document;
export const element: RElement = null as any as HTMLElement;
export const text: RText = null as any as Text;
