import { autobind } from "../decorators/autobind";
import { DragTarget } from "../models/drag-drop";
import { Project, ProjectStatus } from "../models/project";
import { projectState } from "../state/project-state";
import { Component } from "./base-component";
import { ProjectItem } from "./project-item";

export class ProjectList extends Component<HTMLDivElement, HTMLElement> implements DragTarget{
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