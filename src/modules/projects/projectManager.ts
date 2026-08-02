import { loadData, saveData } from "../store";
import {
  type Concept,
  type PluginData,
  type Project,
  type ProjectSources,
} from "../types";

/**
 * Baustein 2 (Logik) – Projektverwaltung.
 * CRUD für Rechercheprojekte auf Basis des lokalen Datenspeichers.
 */

/** Review types (Konzept Kap. 3.1). */
export const REVIEW_TYPES: { id: string; label: string }[] = [
  { id: "systematic-review", label: "Systematisches Literaturreview" },
  { id: "scoping-review", label: "Scoping Review" },
  { id: "rapid-review", label: "Rapid Review" },
  { id: "narrative-review", label: "Narrative Literaturübersicht" },
  { id: "structured-search", label: "Strukturierte Literaturrecherche" },
  { id: "thematic-analysis", label: "Thematische Literaturanalyse" },
  { id: "exploratory", label: "Explorative Recherche" },
];

export function reviewTypeLabel(id: string): string {
  return REVIEW_TYPES.find((t) => t.id === id)?.label ?? id;
}

/** Fields the user can edit; the rest is managed automatically. */
export type ProjectInput = Omit<
  Project,
  "projectId" | "createdAt" | "version" | "sources" | "concepts"
>;

/** Concept fields the user can edit. */
export type ConceptInput = Omit<Concept, "conceptId">;

function newId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export class ProjectManager {
  private data: PluginData = { schemaVersion: 1, projects: [] };
  private loaded = false;

  private async ensureLoaded(): Promise<void> {
    if (!this.loaded) {
      this.data = await loadData();
      this.loaded = true;
    }
  }

  async list(): Promise<Project[]> {
    await this.ensureLoaded();
    return this.data.projects;
  }

  async get(id: string): Promise<Project | undefined> {
    await this.ensureLoaded();
    return this.data.projects.find((p) => p.projectId === id);
  }

  async create(input: ProjectInput): Promise<Project> {
    await this.ensureLoaded();
    const project: Project = {
      ...input,
      projectId: newId("project"),
      createdAt: today(),
      version: 1,
    };
    this.data.projects.push(project);
    await saveData(this.data);
    return project;
  }

  async update(id: string, input: ProjectInput): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === id);
    if (!project) {
      return;
    }
    Object.assign(project, input, { version: (project.version ?? 1) + 1 });
    await saveData(this.data);
  }

  async remove(id: string): Promise<void> {
    await this.ensureLoaded();
    this.data.projects = this.data.projects.filter((p) => p.projectId !== id);
    await saveData(this.data);
  }

  /** Baustein 3 – assign selected Zotero collections to a project. */
  async setSources(id: string, sources: ProjectSources): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === id);
    if (!project) {
      return;
    }
    project.sources = sources;
    project.version = (project.version ?? 1) + 1;
    await saveData(this.data);
  }

  // --- Baustein 4: Suchkonzepte -----------------------------------------

  async listConcepts(projectId: string): Promise<Concept[]> {
    const project = await this.get(projectId);
    return project?.concepts ?? [];
  }

  async getConcept(
    projectId: string,
    conceptId: string,
  ): Promise<Concept | undefined> {
    const project = await this.get(projectId);
    return project?.concepts?.find((c) => c.conceptId === conceptId);
  }

  async addConcept(projectId: string, input: ConceptInput): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project) {
      return;
    }
    if (!project.concepts) {
      project.concepts = [];
    }
    project.concepts.push({ ...input, conceptId: newId("concept") });
    project.version = (project.version ?? 1) + 1;
    await saveData(this.data);
  }

  async updateConcept(
    projectId: string,
    conceptId: string,
    input: ConceptInput,
  ): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    const concept = project?.concepts?.find((c) => c.conceptId === conceptId);
    if (!concept) {
      return;
    }
    Object.assign(concept, input);
    project!.version = (project!.version ?? 1) + 1;
    await saveData(this.data);
  }

  async removeConcept(projectId: string, conceptId: string): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project?.concepts) {
      return;
    }
    project.concepts = project.concepts.filter(
      (c) => c.conceptId !== conceptId,
    );
    project.version = (project.version ?? 1) + 1;
    await saveData(this.data);
  }
}
