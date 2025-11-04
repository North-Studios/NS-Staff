import { promises as fs } from 'fs';
import path from 'path';
import type { StaffMember, Project, ProjectsConfig } from '@shared/schema';

export interface IStorage {
  getAllStaff(): Promise<StaffMember[]>;
  getStaffByEndpoint(endpoint: string): Promise<StaffMember | undefined>;
  getAllProjects(): Promise<Project[]>;
  getProjectByEndpoint(endpoint: string): Promise<Project | undefined>;
  getStaffPhotoPath(endpoint: string, photoNum: number): string;
  getProjectPicturePath(endpoint: string): Promise<string | undefined>;
}

class FileStorage implements IStorage {
  private staffCache: Map<string, StaffMember> = new Map();
  private projectsCache: Map<string, Project> = new Map();
  private initialized = false;

  private async initialize() {
    if (this.initialized) return;

    try {
      // Auto-discover staff: scan data/staff/*/values.json
      const staffRoot = path.join(process.cwd(), 'data', 'staff');
      let staffDirs: string[] = [];
      try {
        const entries = await fs.readdir(staffRoot, { withFileTypes: true });
        staffDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
      } catch (error) {
        console.error('Failed to read staff directory:', error);
        staffDirs = [];
      }

      for (const dirName of staffDirs) {
        try {
          const staffPath = path.join(staffRoot, dirName, 'values.json');
          const staffData = await fs.readFile(staffPath, 'utf-8');
          const staff: StaffMember = JSON.parse(staffData);
          // Prefer explicit endpoint from values.json; fallback to directory name
          const endpointKey = staff.endpoint || dirName;
          this.staffCache.set(endpointKey, staff);
        } catch (error) {
          // Skip directories without valid values.json
          continue;
        }
      }

      // Load projects config
      const projectsConfigPath = path.join(process.cwd(), 'data', 'projects.json');
      const projectsConfigData = await fs.readFile(projectsConfigPath, 'utf-8');
      const projectsConfig: ProjectsConfig = JSON.parse(projectsConfigData);

      // Load all projects
      for (const projectEndpoint of projectsConfig.project_endpoints) {
        try {
          const projectPath = path.join(process.cwd(), 'data', 'projects', 'values', `${projectEndpoint}.json`);
          const projectData = await fs.readFile(projectPath, 'utf-8');
          const project: Project = JSON.parse(projectData);
          this.projectsCache.set(projectEndpoint, project);
        } catch (error) {
          console.error(`Failed to load project ${projectEndpoint}:`, error);
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize storage:', error);
      throw error;
    }
  }

  async getAllStaff(): Promise<StaffMember[]> {
    await this.initialize();
    return Array.from(this.staffCache.values());
  }

  async getStaffByEndpoint(endpoint: string): Promise<StaffMember | undefined> {
    await this.initialize();
    return this.staffCache.get(endpoint);
  }

  async getAllProjects(): Promise<Project[]> {
    await this.initialize();
    return Array.from(this.projectsCache.values());
  }

  async getProjectByEndpoint(endpoint: string): Promise<Project | undefined> {
    await this.initialize();
    return this.projectsCache.get(endpoint);
  }

  getStaffPhotoPath(endpoint: string, photoNum: number): string {
    return path.join(process.cwd(), 'data', 'staff', endpoint, `${photoNum}.png`);
  }

  async getProjectPicturePath(endpoint: string): Promise<string | undefined> {
    const basePath = path.join(process.cwd(), 'data', 'projects', 'pictures', endpoint);
    
    // Try different extensions
    const extensions = ['.jpg', '.png', '.jpeg', '.webp'];
    for (const ext of extensions) {
      const fullPath = basePath + ext;
      try {
        await fs.access(fullPath);
        return fullPath;
      } catch {
        continue;
      }
    }
    
    return undefined;
  }
}

export const storage = new FileStorage();
