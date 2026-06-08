// TypeScript types mirroring the resume.json schema (see resume.example.json).

export interface ResumeMeta {
  version: string
  lastUpdated: string
  note?: string
}

export interface Contact {
  email: string
  phone: string
}

export interface Social {
  github: string
  linkedin: string
  repoUrl: string
}

export interface Summary {
  hero: string
  full: string
}

export interface Personal {
  name: string
  heroTitle: string
  heroSubtitle: string
  location: string
  contact: Contact
  social: Social
  summary: Summary
}

export interface SkillCategory {
  id: string
  category: string
  featured: boolean
  items: string[]
}

export interface ExperiencePeriod {
  start: string
  end: string
  display: string
}

export interface ExperienceItem {
  id: string
  company: string
  companyDescription: string
  companyGroup?: string
  title: string
  period: ExperiencePeriod
  current: boolean
  bullets: string[]
}

export interface ProjectItem {
  id: string
  title: string
  stack: string[]
  description: string
  bullets: string[]
}

export interface EducationItem {
  id: string
  degree: string
  institution: string
  year: string
  notes?: string
}

export interface Resume {
  meta: ResumeMeta
  personal: Personal
  skills: SkillCategory[]
  experience: ExperienceItem[]
  projects: ProjectItem[]
  education: EducationItem[]
}
