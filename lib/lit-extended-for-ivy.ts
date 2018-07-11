import {
  TemplateResult,
  TemplateInstance,
  Part,
  TemplatePart,
  AttributePart,
  defaultPartCallback,
  getValue,
} from './lit-html/src/lit-html';

export class IvyEventPart implements Part {
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

export const IvyExtendedPartCallback =
  (instance: TemplateInstance, templatePart: TemplatePart, node: Node): Part => {
    if (templatePart.type === 'attribute') {
      if (templatePart.rawName!.substr(0, 3) === 'on-') {
        const eventName = templatePart.rawName!.slice(3);
        return new IvyEventPart(instance, node as Element, eventName);
      }
      return new AttributePart(
        instance,
        node as Element,
        templatePart.name!,
        templatePart.strings!
      );
    }
    return defaultPartCallback(instance, templatePart, node);
  };

export const html = (strings: TemplateStringsArray, ...values: any[]) =>
  new TemplateResult(strings, values, 'html', IvyExtendedPartCallback);
