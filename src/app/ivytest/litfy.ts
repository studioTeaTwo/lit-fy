import {
  Component, Injectable, IterableDiffers, NgModule, defineInjector,
  ɵNgOnChangesFeature as NgOnChangesFeature,
  ɵdefineComponent as defineComponent,
  ɵdefineDirective as defineDirective,
  ɵdirectiveInject as directiveInject,
  ɵinjectTemplateRef as injectTemplateRef,
  ɵinjectViewContainerRef as injectViewContainerRef,
  ɵrenderComponent as renderComponent,
  ɵE as elementStart,
  ɵe as elementEnd,
  ɵT as text,
  ɵp as property,
  ɵL as listener,
  ɵi1 as interpolate,
  ɵRenderFlags as RenderFlags,
} from '@angular/core';
import {
  TemplateResult,
  Template,
  TemplateInstance,
  Part,
  TemplatePart,
  AttributePart,
  TemplateContainer,
  defaultTemplateFactory,
  defaultPartCallback,
} from 'lit-html';
import {
  PropertyPart
} from 'lit-html/lib/lit-extended';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_FRAGMENT_NODE = 11;

export class Litfy {
  static litToIvy(renderFlag, component) {
    console.log('initial', renderFlag, component);

    // Create a nodeList from lit-html.
    const templateResult = component.render();
    const nodeList = nodeFactory(templateResult);

    // tslint:disable-next-line:no-bitwise
    if (renderFlag & RenderFlags.Create) {
      let index = 0;
      // First render, create a virtual node of ivy from nodeList.
      const apply = (_nodeList) => _nodeList.forEach((node: Node) => {
        console.log(_nodeList, node);
        if (node.nodeType === ELEMENT_NODE) {
          const element = node as Element;
          const attrs = getAttribute(element);
          console.log('elementStart', index, element.nodeName, attrs);
          elementStart(index, element.nodeName, attrs);
          index++;
          // if (node.) {
          //   listener();
          // }
          // Recur if having childNodes.
          if (element.hasChildNodes()) {
            apply(element.childNodes);
          }
          // Close a tag
          console.log('elemntClose');
          elementEnd();
        } else if (node.nodeType === TEXT_NODE) {
          if (node.textContent !== '') {
            console.log('text(textContent)', index, node.textContent);
            text(index, node.textContent);
            index++;
          }
        }
      });
      apply(nodeList);
    }
  }
}

function nodeFactory(templateResult: TemplateResult): NodeList {
  const template = defaultTemplateFactory(templateResult);
  const instance = new TemplateInstance(template, templateResult.partCallback, defaultTemplateFactory);
  const fragment = instance._clone();
  // const fragment = instance.template.element.content.cloneNode(true);
  // instance.update(templateResult.values);
  console.log(templateResult, template, instance, fragment);
  return fragment.childNodes;
}

function getAttribute(element: Element): string[] {
  const attrs: string[] = [];
  if (element.hasAttributes()) {
    for (let i = 0; i < element.attributes.length; i++) {
      attrs.push(element.attributes[i].nodeName);
      attrs.push(element.attributes[i].nodeValue);
    }
  }
  return attrs;
}

function extractTagName(str: string): string | string[] {
  return str.match(/(?:<)(.*)(?:[\b|>])/);
}

function findTagClose(str: string): number {
  const close = str.lastIndexOf('>');
  console.log('>', str, close);
  const open = str.indexOf('<', close + 1);
  console.log('<', str, close);
  return open > -1 ? str.length : close;
}

const extendedPartCallback =
    (instance: TemplateInstance, templatePart: TemplatePart, node: Node):
        Part => {
          if (templatePart.type === 'attribute') {
            if (templatePart.rawName!.substr(0, 3) === 'on-') {
              // const eventName = templatePart.rawName!.slice(3);
              // return new EventPart(instance, node as Element, eventName);
            }
            const lastChar = templatePart.name!.substr(templatePart.name!.length - 1);
            if (lastChar === '$') {
              // const name = templatePart.name!.slice(0, -1);
              // return new AttributePart(
              //     instance, node as Element, name, templatePart.strings!);
            }
            if (lastChar === '?') {
              // const name = templatePart.name!.slice(0, -1);
              // return new BooleanAttributePart(
              //     instance, node as Element, name, templatePart.strings!);
            }
            return new PropertyPart(
                instance,
                node as Element,
                templatePart.rawName!,
                templatePart.strings!);
          }
          return defaultPartCallback(instance, templatePart, node);
        };

export { TemplateResult } from 'lit-html';
export const html = (strings: TemplateStringsArray, ...values: any[]) =>
    new TemplateResult(strings, values, 'html', extendedPartCallback);
