import { loadData, saveData } from "../store";
import { detectDuplicates, gatherItemMetas } from "../screening/screening";
import {
  type Concept,
  type Extraction,
  type Finding,
  type PluginData,
  type Project,
  type ProjectSources,
  type QualityAssessment,
  type ScreeningRecord,
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

  // --- Baustein 5/6: Fundstellen ----------------------------------------

  async setFindings(projectId: string, findings: Finding[]): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project) {
      return;
    }
    project.findings = findings;
    project.lastRun = new Date().toISOString();
    await saveData(this.data);
  }

  async listFindings(projectId: string): Promise<Finding[]> {
    const project = await this.get(projectId);
    return project?.findings ?? [];
  }

  async updateFinding(
    projectId: string,
    findingId: string,
    patch: Partial<Finding>,
  ): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    const finding = project?.findings?.find((f) => f.findingId === findingId);
    if (!finding) {
      return;
    }
    Object.assign(finding, patch);
    await saveData(this.data);
  }

  // --- Phase 3: Screening --------------------------------------------------

  /** Builds/refreshes screening records from the project's collections,
   *  preserving existing decisions. Returns the number of records. */
  async syncScreening(projectId: string): Promise<number> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project) return 0;

    const metas = gatherItemMetas(project);
    const existing = new Map(
      (project.screening ?? []).map((r) => [r.itemKey, r]),
    );
    project.screening = metas.map((m) => {
      const prev = existing.get(m.itemKey);
      return {
        itemKey: m.itemKey,
        title: m.title,
        creator: m.creator,
        year: m.year,
        doi: m.doi,
        decision: prev?.decision ?? "undecided",
        stage: prev?.stage ?? "title-abstract",
        exclusionReason: prev?.exclusionReason,
        note: prev?.note,
        isDuplicate: prev?.isDuplicate,
        duplicateOf: prev?.duplicateOf,
        updatedAt: prev?.updatedAt,
      } as ScreeningRecord;
    });
    await saveData(this.data);
    return project.screening.length;
  }

  async listScreening(projectId: string): Promise<ScreeningRecord[]> {
    const project = await this.get(projectId);
    return project?.screening ?? [];
  }

  async updateScreening(
    projectId: string,
    itemKey: string,
    patch: Partial<ScreeningRecord>,
  ): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    const rec = project?.screening?.find((r) => r.itemKey === itemKey);
    if (!rec) return;
    Object.assign(rec, patch, { updatedAt: new Date().toISOString() });
    await saveData(this.data);
  }

  /** Runs duplicate detection over the screening records. Returns count. */
  async runDuplicateDetection(projectId: string): Promise<number> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project?.screening) return 0;
    const count = detectDuplicates(project.screening);
    await saveData(this.data);
    return count;
  }

  // --- Phase 4: Extraktion ------------------------------------------------

  async listExtractions(projectId: string): Promise<Extraction[]> {
    const project = await this.get(projectId);
    return project?.extractions ?? [];
  }

  async getExtraction(
    projectId: string,
    itemKey: string,
  ): Promise<Extraction | undefined> {
    const project = await this.get(projectId);
    return project?.extractions?.find((e) => e.itemKey === itemKey);
  }

  async upsertExtraction(
    projectId: string,
    extraction: Extraction,
  ): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project) return;
    if (!project.extractions) project.extractions = [];
    const idx = project.extractions.findIndex(
      (e) => e.itemKey === extraction.itemKey,
    );
    const withTime = { ...extraction, updatedAt: new Date().toISOString() };
    if (idx >= 0) project.extractions[idx] = withTime;
    else project.extractions.push(withTime);
    await saveData(this.data);
  }

  // --- Phase 4: Qualitätsbewertung ----------------------------------------

  async listQuality(projectId: string): Promise<QualityAssessment[]> {
    const project = await this.get(projectId);
    return project?.qualityAssessments ?? [];
  }

  async getQuality(
    projectId: string,
    itemKey: string,
  ): Promise<QualityAssessment | undefined> {
    const project = await this.get(projectId);
    return project?.qualityAssessments?.find((q) => q.itemKey === itemKey);
  }

  async upsertQuality(
    projectId: string,
    quality: QualityAssessment,
  ): Promise<void> {
    await this.ensureLoaded();
    const project = this.data.projects.find((p) => p.projectId === projectId);
    if (!project) return;
    if (!project.qualityAssessments) project.qualityAssessments = [];
    const idx = project.qualityAssessments.findIndex(
      (q) => q.itemKey === quality.itemKey,
    );
    const withTime = { ...quality, updatedAt: new Date().toISOString() };
    if (idx >= 0) project.qualityAssessments[idx] = withTime;
    else project.qualityAssessments.push(withTime);
    await saveData(this.data);
  }
}
