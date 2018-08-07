import {
  Component, Injectable, IterableDiffers, NgModule, defineInjector, ChangeDetectorRef,
  ɵNgOnChangesFeature as NgOnChangesFeature,
  ɵdefineComponent as defineComponent,
  ɵdefineDirective as defineDirective,
  ɵdirectiveInject as directiveInject,
  ɵinjectTemplateRef as injectTemplateRef,
  ɵinjectViewContainerRef as injectViewContainerRef,
  ɵrenderComponent as renderComponent,
  ɵE as elementStart,
  ɵe as elementEnd,
  ɵa as elementAttribute,
  ɵp as elementProperty,
  ɵT as text,
  ɵt as textBinding,
  ɵp as property,
  ɵL as listener,
  ɵld as load,
  ɵi1 as interpolate,
  ɵRenderFlags as RenderFlags,
  ɵC as container,
  ɵcR as containerRefreshStart,
  ɵcr as containerRefreshEnd,
  ɵV as embeddedViewStart,
  ɵv as embeddedViewEnd,
  ɵQ as query,
  ɵmarkDirty as markDirty,
  ɵinjectChangeDetectorRef as injectChangeDetectorRef,
} from '@angular/core';
import {
  TemplateResult,
  TemplateInstance,
  Part,
  AttributePart,
  defaultTemplateFactory,
  NodePart,
} from './lit-html/src/core';
import {
  IvyEventPart,
} from './lit-extended-for-ivy';

interface SyntaxTree {
  nodeList: NodeList;
  instance: TemplateInstance;
}

interface Attr {
  name: string;
  value: string;
}

const ELEMENT_NODE = 1;
const TEXT_NODE = 3;
const COMMENT_NODE = 8;
const DOCUMENT_FRAGMENT_NODE = 11;

let _instance;
let serialViewNumber = 0;


export class Litfy {
  static litToIvy(renderFlag, component) {
    console.log('initial', renderFlag, component);

    // Create a nodeList from lit-html.
    const templateResult = component.render();
    const { nodeList, instance } = nodeFactory(templateResult);

    if (renderFlag & RenderFlags.Create) {
      instance.update(templateResult.values);
      console.log('create', nodeList, instance);
      createNode(nodeList, instance, component);
    } else if (renderFlag & RenderFlags.Update) {
      instance.update(templateResult.values);
      console.log('update', nodeList, _instance, instance, load(0));
      if (instance._parts.length > 0) {
        updateNode(nodeList, instance, component, templateResult);
      }
    }
  }
}


// First render, create a virtual node of ivy from nodeList.
const createNode = (nodeList: NodeList, instance: TemplateInstance, component: Component): void => {
  let index = 0;
  const apply = (_nodeList) => _nodeList.forEach(node => {

    if (node.nodeType === ELEMENT_NODE) {
      const element = node as Element;

      // Open a tag
      const attrs = getInitialAttribute(element);
      console.log('elementStart', index, element.nodeName, attrs);
      elementStart(index, element.nodeName, attrs);
      const eventListeners = instance._parts.length > 0 ? getListeners(element, instance._parts) : [];
      if (eventListeners.length > 0) {
        for (const eventListener of eventListeners) {
          console.log('listener', eventListener.eventName, eventListener.listenerFn);
          listener(eventListener.eventName, eventListener.listenerFn);
        }
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

      // Create a container, and skip to next node without creating the node.
      const childView = isChildTemplate(node, instance._parts);
      if (childView) {
        console.log('container', index);
        container(index);
        index++;
        markDirty(component);
        return;
      }

      // Create a text
      if (node.textContent !== '') {
        console.log('text(raw)', index, node.textContent);
        text(index, node.textContent);
        index++;
      }
    }
  });
  apply(nodeList);
  console.log('finish', load(0));
};

// Update the virtual node of ivy, or Refresh a container.
const updateNode = (nodeList: NodeList, instance: TemplateInstance, component: Component, templateResult: TemplateResult): void => {
  let index = 0;
  let childTemplateCount = 0;
  const apply = (_nodeList) => _nodeList.forEach(node => {
    if (node.nodeType === ELEMENT_NODE) {
      const element = node as Element;

      // Update a elment.
      const updatedAttrs = instance._parts.length > 0 ? getUpdatedAttribute(element, instance._parts) : [];
      if (updatedAttrs.length > 0) {
        for (const attr of updatedAttrs) {
          console.log('attribute', index, attr.name, attr.value);
          elementAttribute(index, attr.name, attr.value);
        }
      }
      index++;

      // Recur if having childNodes.
      if (element.hasChildNodes()) {
        apply(element.childNodes);
      }
    } else if (node.nodeType === TEXT_NODE) {

      // Create a child template. Notice to make new every time.
      if (isContainer(index)) {
        console.log('containerRefreshStart', index);
        containerRefreshStart(index);
        index++;
        const rf0 = embeddedViewStart(serialViewNumber);
        serialViewNumber++;

        // Create a node in child template.
        const result = nodeFactoryOfChildTemplate(node, instance._parts);
        if (result && result.nodeList.length > 0) {
          const values = getChildTemplateResult(templateResult, childTemplateCount);
          childTemplateCount++;
          result.instance.update(values, true);
          console.log('embeddedCreate', result.nodeList, result.instance, templateResult.values);
          createNode(result.nodeList, result.instance, component);
        } else {
          // Delete embedded view
        }

        // Close a container.
        console.log('embeddedEnd');
        embeddedViewEnd();
        containerRefreshEnd();
        return;
      }

      // Update a text
      console.log('text(raw)', index, node.textContent);
      textBinding(index, node.textContent);
      index++;
    }
  });
  apply(nodeList);
};

const nodeFactory = (templateResult: TemplateResult): SyntaxTree => {
  const template = defaultTemplateFactory(templateResult);
  const instance = new TemplateInstance(template, templateResult.partCallback, defaultTemplateFactory);
  const nodeList = instance._clone().childNodes;
  console.log(templateResult, template, instance, nodeList, instance._parts.length);
  return {nodeList, instance};
};

const nodeFactoryOfChildTemplate = (node: Node, parts: Part[]): SyntaxTree => {
  const childTemplate: NodePart = parts.find(part =>
    part instanceof NodePart && part.startNode === node && part._previousValue instanceof TemplateInstance
  ) as NodePart;
  console.log(childTemplate);
  return childTemplate ? {
    nodeList: (childTemplate._previousValue as TemplateInstance)._clone().childNodes,
    instance: childTemplate._previousValue as TemplateInstance
   } : undefined;
};

const getChildTemplateResult = (templateResult: TemplateResult, number: number): any[] => {
  const values: TemplateResult[] = templateResult.values.filter(value => value instanceof TemplateResult);
  return values[number].values;
};

const getInitialAttribute = (element: Element): string[] => {
  const attrs: string[] = [];
  if (element.hasAttributes()) {
    for (let i = 0; i < element.attributes.length; i++) {
      attrs.push(element.attributes[i].nodeName);
      attrs.push(element.attributes[i].nodeValue);
    }
  }
  return attrs;
};

const getUpdatedAttribute = (element: Element, parts: Part[]): Attr[] => {
  const attrs: Attr[] = [];
  const seek = (_parts: Part[]) => {
    for (const part of _parts) {
      if (part instanceof AttributePart && part.element === element) {
        for (let i = 0; i < element.attributes.length; i++) {
          attrs.push({
            name: element.attributes[i].nodeName,
            value: element.attributes[i].nodeValue
          });
        }
      }
      if (part instanceof NodePart && part._previousValue instanceof TemplateInstance) {
        seek(part._previousValue._parts);
      }
    }
  };
  seek(parts);
  return attrs;
};

const getListeners = (element: Element, parts: Part[]): IvyEventPart[] => {
  const results: IvyEventPart[] = [];
  const seek = (_parts: Part[]) => {
    for (const part of _parts) {
      if (part instanceof IvyEventPart && part.element === element) {
        results.push(part);
      }
      if (part instanceof NodePart && part._previousValue instanceof TemplateInstance) {
        seek(part._previousValue._parts);
      }
    }
  };
  seek(parts);
  return results;
};

const isChildTemplate = (node: Node, parts: Part[]): boolean => {
  return parts.some(part =>
    part instanceof NodePart && part.startNode === node && part._previousValue instanceof TemplateInstance
  );
};

const isContainer = (index): boolean => {
  const node: any = load(index);
  // FIXME: how to judge container.
  return !!node.data;
};
