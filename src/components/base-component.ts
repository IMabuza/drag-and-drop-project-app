export abstract class Component<T extends HTMLElement, U extends HTMLElement> {
  templateElement: HTMLTemplateElement;
  hostElement: T;
  sectionElement: U;

  constructor(
    templateId: string,
    hostElementId: string,
    insertBeforeStart: boolean,
    newElementId?: string
  ) {
    this.templateElement = document.getElementById(
      templateId
    ) as HTMLTemplateElement;
    this.hostElement = document.getElementById(hostElementId) as T;

    // get the content of the template
    const importedNode = document.importNode(
      this.templateElement.content,
      true
    );
    this.sectionElement = importedNode.firstElementChild as U;

    if (newElementId) {
      this.sectionElement.id = newElementId;
    }

    this.attach(insertBeforeStart);
  }

  private attach(insertBeforeStart: boolean) {
    this.hostElement.insertAdjacentElement(
      insertBeforeStart ? "afterbegin" : "beforeend",
      this.sectionElement
    );
  }

  abstract configure(): void;
  abstract renderContent(): void;
}
