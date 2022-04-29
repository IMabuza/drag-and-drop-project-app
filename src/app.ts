//Drag and drop interfaces
interface Draggable {
  dragStartHandler(event: DragEvent): void;
  dragEndHandler(event: DragEvent): void;
}

interface DragTarget {
  dragOverHandler(event: DragEvent): void;
  dropHandler(event: DragEvent): void;
  dragLeaveHandler(event: DragEvent): void;
}

enum ProjectStatus {
  Active,
  Finished,
}

// Project  class

class Project {
  constructor(
    public id: string,
    public title: string,
    public description: string,
    public people: number,
    public status: ProjectStatus
  ) {}
}
// Project state management

type Listener<T> = (items: T[]) => void;


class State<T> {
  protected listeners: Listener<T>[] = [];

  addListeners(listenersFn: Listener<T>) {
    this.listeners.push(listenersFn);
  }
}
class ProjectState  extends State<Project>{

  private projects: Project[] = [];
  private static instance: ProjectState;

  private constructor() {
    super();
  }

  static getInstance() {
    if (this.instance) {
      return this.instance;
    }

    this.instance = new ProjectState();
    return this.instance;
  }

  addProject(title: string, description: string, numOfPeople: number) {
    const newProject = new Project(
      Math.random().toString(),
      title,
      description,
      numOfPeople,
      ProjectStatus.Active
    );

    this.projects.push(newProject);

    this.updateListeners();
  }

  moveProject(projectId: string, newStatus: ProjectStatus){
    const project = this.projects.find(prj => prj.id === projectId);
    if(project && project.status !== newStatus){
      project.status = newStatus;
    }
    this.updateListeners();
  }

  private updateListeners(){
    for (const listenersFn of this.listeners) {
      listenersFn(this.projects.slice());
    }
  }
}

const projectState = ProjectState.getInstance();

// Validate

interface Validatable {
  value: string | number;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
}

function validate(validatableInput: Validatable) {
  let isValid = true;
  if (validatableInput.required) {
    isValid = isValid && validatableInput.value.toString().trim().length !== 0;
  }

  if (
    validatableInput.minLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length > validatableInput.minLength;
  }

  if (
    validatableInput.maxLength != null &&
    typeof validatableInput.value === "string"
  ) {
    isValid =
      isValid && validatableInput.value.length < validatableInput.maxLength;
  }

  if (
    validatableInput.min != null &&
    typeof validatableInput.min === "number"
  ) {
    isValid = isValid && validatableInput.value >= validatableInput.min;
  }

  if (
    validatableInput.max != null &&
    typeof validatableInput.max === "number"
  ) {
    isValid = isValid && validatableInput.value <= validatableInput.max;
  }

  return isValid;
}

// auto bind

function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    get() {
      const boundFn = originalMethod.bind(this);
      return boundFn;
    },
  };

  return adjDescriptor;
}

// Component base class

abstract class Component<T extends HTMLElement, U extends HTMLElement> {
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

//Project Item class

class ProjectItem extends Component<HTMLUListElement, HTMLLIElement> implements Draggable{

  private project: Project;

  get persons(){
    if(this.project.people === 1){
      return '1 person';
    }else{
      return `${this.project.people} people`
    }
  }

  constructor(hostId: string, project: Project){
    super('single-project', hostId, false, project.id);
    this.project = project;

    this.configure();
    this.renderContent();
  }

  @autobind
  dragStartHandler(event: DragEvent): void {
    event.dataTransfer!.setData('text/plain', this.project.id);
    event.dataTransfer!.effectAllowed = 'move';
    
  }

  dragEndHandler(_: DragEvent): void {
    console.log('DragEnd');
  }

  configure(){
    this.sectionElement.addEventListener('dragstart', this.dragStartHandler);
    this.sectionElement.addEventListener('dragend', this.dragEndHandler)
  };
  renderContent(){
    this.sectionElement.querySelector('h2')!.textContent = this.project.title;
    this.sectionElement.querySelector('h3')!.textContent = this.persons + ' assigned';
    this.sectionElement.querySelector('p')!.textContent = this.project.description;
  };
}

// Projcect list class

class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{
  assignedProjects: Project[];

  constructor(private type: "active" | "finished") {
    super('project-list', 'app', false, `${type}-projects`)
    this.assignedProjects = [];
    
    this.configure();
    this.renderContent();
  }

  @autobind
  dragOverHandler(event: DragEvent): void {
    if(event.dataTransfer && event.dataTransfer.types[0] === 'text/plain'){
      event.preventDefault();
      const listEl = this.sectionElement.querySelector('ul')!;
    listEl.classList.add('droppable');
    }
  }

  dropHandler(event: DragEvent): void {
    const prjId = event.dataTransfer!.getData('text/plain');
    projectState.moveProject(prjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
    
  }

  @autobind
  dragLeaveHandler(_: DragEvent): void {
    const listEl = this.sectionElement.querySelector('ul')!;
    listEl.classList.remove('droppable');
  }

  private renderPojects() {``
    const listEl = document.getElementById(`${this.type}-projects-list`)! as HTMLUListElement;
    listEl.innerHTML = "";
    for (const prjItem of this.assignedProjects) {
      new ProjectItem(this.sectionElement.querySelector('ul')!.id, prjItem);
    }
  }

  configure() { 

    this.sectionElement.addEventListener('dragover', this.dragOverHandler);
    this.sectionElement.addEventListener('dragleave', this.dragLeaveHandler);
    this.sectionElement.addEventListener('drop', this.dropHandler);
    
    projectState.addListeners((projects: Project[]) => {
    const relevantProjects = projects.filter((prj) => {
      if (this.type === "active") {
        return prj.status === ProjectStatus.Active;
      }
      return prj.status === ProjectStatus.Finished;
    });
    this.assignedProjects = relevantProjects;
    this.renderPojects();
  });
};

  renderContent() {
    const listId = `${this.type}-projects-list`;
    this.sectionElement.querySelector("ul")!.id = listId;
    this.sectionElement.querySelector("h2")!.textContent =
      this.type.toUpperCase() + " PROJECTS";
  }
}

class ProjectInput extends Component<HTMLDivElement, HTMLFormElement> {
  titleInputElement: HTMLInputElement;
  descInputElement: HTMLInputElement;
  peopleInputElement: HTMLInputElement;

  constructor() {
    super('project-input', 'app', true, 'user-input');

    this.titleInputElement = this.sectionElement.querySelector(
      "#title"
    ) as HTMLInputElement;
    this.descInputElement = this.sectionElement.querySelector(
      "#description"
    ) as HTMLInputElement;
    this.peopleInputElement = this.sectionElement.querySelector(
      "#people"
    ) as HTMLInputElement;
    this.configure();
  }

  private gatherUserInput(): [string, string, number] | void {
    const title = this.titleInputElement.value;
    const desc = this.descInputElement.value;
    const people = this.peopleInputElement.value;

    const titleValidatable: Validatable = {
      value: title,
      required: true,
    };

    const descValidatable: Validatable = {
      value: desc,
      required: true,
      minLength: 5,
      maxLength: 20,
    };

    const peopleValidatable: Validatable = {
      value: people,
      required: true,
      min: 1,
      max: 5,
    };

    if (
      !validate(titleValidatable) ||
      !validate(descValidatable) ||
      !validate(peopleValidatable)
    ) {
      alert("Ivalid input. Please try again");
    } else {
      return [title, desc, +people];
    }
  }

  private clearInputs() {
    this.titleInputElement.value = "";
    this.descInputElement.value = "";
    this.peopleInputElement.value = "";
  }

  @autobind
  private submitHandler(e: Event) {
    e.preventDefault();
    const userInput = this.gatherUserInput();
    if (Array.isArray(userInput)) {
      const [title, desc, people] = userInput;
      projectState.addProject(title, desc, people);
      console.log(title, desc, people);
    }
    this.clearInputs();
  }

  configure() {
    this.sectionElement.addEventListener("submit", this.submitHandler);
  }

  renderContent(){};
}

const prjInput = new ProjectInput();
const activePrjList = new ProjectList("active");
const finishedPrjList = new ProjectList("finished");
