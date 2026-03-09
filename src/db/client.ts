import { Project, Post } from "../types/models.js";

// In-memory database for MVP
export const projects: Map<string, Project> = new Map();
export const posts: Map<string, Post[]> = new Map();

export const db = {
  project: {
    create: async (data: Omit<Project, "id" | "createdAt" | "updatedAt">): Promise<Project> => {
      const id = Math.random().toString(36).substring(7);
      const project: Project = {
        id,
        ...data,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      projects.set(id, project);
      return project;
    },
    findById: async (id: string): Promise<Project | null> => {
      return projects.get(id) || null;
    },
    update: async (id: string, data: Partial<Project>): Promise<Project | null> => {
      const project = projects.get(id);
      if (!project) return null;
      const updated = { ...project, ...data, updatedAt: new Date() };
      projects.set(id, updated);
      return updated;
    },
  },
  post: {
    create: async (data: Omit<Post, "id">): Promise<Post> => {
      const id = Math.random().toString(36).substring(7);
      const post: Post = { id, ...data };
      const projectPosts = posts.get(data.projectId) || [];
      projectPosts.push(post);
      posts.set(data.projectId, projectPosts);
      return post;
    },
    findByProjectId: async (projectId: string): Promise<Post[]> => {
      return posts.get(projectId) || [];
    },
  },
};
