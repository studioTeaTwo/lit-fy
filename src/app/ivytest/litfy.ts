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
  ɵt as textBinding,
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
  getValue,
  NodePart,
} from 'lit-html';
import {
  EventPart,
  PropertyPart
} from 'lit-html/lib/lit-extended';

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_FRAGMENT_NODE = 11;

let _instance;

export class Litfy {
  static litToIvy(renderFlag, component) {
    console.log('initial', renderFlag, component);

    // Create a nodeList from lit-html.
    const templateResult = component.render();
    const { nodeList, instance } = nodeFactory(templateResult);

    // tslint:disable-next-line:no-bitwise
    if (renderFlag & RenderFlags.Create) {
      _instance = instance;
      instance.update(templateResult.values);
      console.log('create', instance);
      let index = 0;
      // First render, create a virtual node of ivy from nodeList.
      const apply = (_nodeList) => _nodeList.forEach(node => {
        // console.log(_nodeList, node);
        if (node.nodeType === ELEMENT_NODE) {
          const element = node as Element;
          const attrs = getAttribute(element);
          console.log('elementStart', index, element.nodeName, attrs);
          elementStart(index, element.nodeName, attrs);
          const eventListener = instance._parts.length > 0 ? getListener(element, instance._parts) : null;
          if (eventListener) {
            console.log('listener', eventListener.eventName, eventListener.listenerFn);
            listener(eventListener.eventName, eventListener.listenerFn);
          }
          const textBind = getTextBinding(element, instance._parts);
          if (textBind) {
            console.log('text(binding)', index, textBind._previousValue, _nodeList);
            textBinding(index, textBind._previousValue);
          }
          index++;
          // Recur if having childNodes.
          if (element.hasChildNodes()) {
            apply(element.childNodes);
          }
          // Close a tag
          console.log('elemntClose');
          elementEnd();
        } else if (node.nodeType === TEXT_NODE) {
          if (node.textContent !== '') {
            console.log('text(raw)', index, node.textContent, _nodeList, getTextBinding(node.parentElement, instance._parts));
            text(index, node.textContent);
            index++;
          }
        }
      });
      apply(nodeList);
    // tslint:disable-next-line:no-bitwise
    } else if (renderFlag & RenderFlags.Update) {
      instance.update(templateResult.values);
      console.log('update', nodeList, instance);
      if (instance._parts.length > 0) {
        updateNode(nodeList, instance);
      }
      _instance = instance;
    }
  }
}

const nodeFactory = (templateResult: TemplateResult): {
  nodeList: NodeList;
  instance: TemplateInstance;
} => {
  const template = defaultTemplateFactory(templateResult);
  const instance = new TemplateInstance(template, templateResult.partCallback, defaultTemplateFactory);
  const nodeList = instance._clone().childNodes;
  console.log(templateResult, template, instance, instance._parts.length);
  return {nodeList, instance};
};

const getAttribute = (element: Element): string[] => {
  const attrs: string[] = [];
  if (element.hasAttributes()) {
    for (let i = 0; i < element.attributes.length; i++) {
      attrs.push(element.attributes[i].nodeName);
      attrs.push(element.attributes[i].nodeValue);
    }
  }
  return attrs;
};

const getListener = (element: Element, parts: Part[]): IvyEventPart => {
  return parts.find(part =>
    part instanceof IvyEventPart && part.element === element
  ) as IvyEventPart;
};

const getTextBinding = (element: Element, parts: Part[]): NodePart => {
  return parts.find(part =>
    part instanceof NodePart && part.startNode.parentElement === element
  ) as NodePart;
};

const updateNode = (nodeList: NodeList, instance) => {
  let index = 0;
  const apply = (_nodeList) => _nodeList.forEach(node => {
    // console.log(_nodeList, node);
    if (node.nodeType === ELEMENT_NODE) {
      const element = node as Element;
      // const attrs = getAttribute(element);
      // console.log('elementStart', index, element.nodeName, attrs);
      // elementStart(index, element.nodeName, attrs);
      const eventListener = instance._parts.length > 0 ? getListener(element, instance._parts) : null;
      if (eventListener) {
        console.log('listener', eventListener.eventName, eventListener.listenerFn);
        // listener(eventListener.eventName, eventListener.listenerFn);
      }
      const textBind = getTextBinding(element, instance._parts);
      if (textBind) {
        console.log('text(binding)', index, textBind._previousValue);
        textBinding(index, textBind._previousValue);
      }
      index++;
      // Recur if having childNodes.
      if (element.hasChildNodes()) {
        apply(element.childNodes);
      }
      // Close a tag
      // console.log('elemntClose');
      // elementEnd();
    } else if (node.nodeType === TEXT_NODE) {
      if (node.textContent !== '' && (!node.parentElement || !getTextBinding(node.parentElement, instance._parts))) {
        console.log('text(raw)', index, node.textContent, getTextBinding(node.parentElement, instance._parts));
        // text(index, node.textContent);
        index++;
      }
    }
  });
  apply(nodeList);
};

const deepFreeze = (o) => {
  let prop, propKey;
  Object.freeze(o); // はじめにオブジェクトを凍結します
  // tslint:disable-next-line:forin
  for (propKey in o) {
    prop = o[propKey];
    if (!o.hasOwnProperty(propKey) || !(typeof prop === 'object') || Object.isFrozen(prop)) {
      // オブジェクトがプロトタイプ上にある、オブジェクトではない、すでに凍結されているのいずれかに当てはまる場合は
      // スキップします。凍結されていないオブジェクトを含む凍結されたオブジェクトがすでにある場合には、
      // どこかに凍結されていない参照を残す可能性があることに注意してください。
      continue;
    }

    deepFreeze(prop); // deepFreeze を再帰呼び出しします
  }
};

class IvyEventPart implements Part {
  instance: TemplateInstance;
  element: Element;
  eventName: string;
  listenerFn: any;

  constructor(instance: TemplateInstance, element: Element, eventName: string) {
    this.instance = instance;
    this.element = element;
    this.eventName = eventName;
  }

  setValue(value: any): void {
    this.listenerFn = getValue(this, value);
  }
}

const IvyExtendedPartCallback =
  (instance: TemplateInstance, templatePart: TemplatePart, node: Node): Part => {
    if (templatePart.type === 'attribute') {
      if (templatePart.rawName!.substr(0, 3) === 'on-') {
        const eventName = templatePart.rawName!.slice(3);
        return new IvyEventPart(instance, node as Element, eventName);
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
    new TemplateResult(strings, values, 'html', IvyExtendedPartCallback);
