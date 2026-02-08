import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';

export interface ReportData {
  generatedAt: string;
  type: string;
  title: string;
  summary: string;
  sections: ReportSection[];
}

export interface ReportSection {
  title: string;
  content: string;
  metrics?: Record<string, string | number>;
  items?: ReportItem[];
}

export interface ReportItem {
  label: string;
  value: string | number;
  status?: 'good' | 'warning' | 'danger';
}

@Injectable()
export class AiReportService {
  private readonly logger = new Logger(AiReportService.name);
  private llm: ChatOpenAI;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1',
      temperature: 0.3,
    });
  }

  /**
   * Generate a full activity report for a group
   */
  async generateGroupReport(groupId: string): Promise<ReportData> {
    const [group, projects, members] = await Promise.all([
      this.getGroupDetails(groupId),
      this.getGroupProjects(groupId),
      this.getGroupMembers(groupId),
    ]);

    if (!group) throw new Error('Group not found');

    // Compute raw stats
    const stats = this.computeStats(projects, members);

    // Ask AI to analyze and generate insights
    const aiAnalysis = await this.generateAIAnalysis(group, stats);

    return {
      generatedAt: new Date().toISOString(),
      type: 'group_activity',
      title: `Rapport d'activité — ${group.name}`,
      summary: aiAnalysis.summary,
      sections: [
        {
          title: 'Vue d\'ensemble',
          content: `Groupe "${group.name}" avec ${stats.totalMembers} membres et ${stats.totalProjects} projets.`,
          metrics: {
            'Membres': stats.totalMembers,
            'Projets': stats.totalProjects,
            'Tâches totales': stats.totalTasks,
            'Tâches terminées': stats.doneTasks,
            'Tâches en cours': stats.inProgressTasks,
            'Tâches à faire': stats.todoTasks,
            'Taux de complétion': `${stats.completionRate}%`,
          },
        },
        {
          title: 'Avancement par projet',
          content: 'Détail de l\'avancement de chaque projet du groupe.',
          items: stats.projectStats.map((p) => ({
            label: p.name,
            value: `${p.completionRate}% (${p.done}/${p.total} tâches)`,
            status: p.completionRate >= 75 ? 'good' : p.completionRate >= 40 ? 'warning' : 'danger',
          })),
        },
        {
          title: 'Productivité par membre',
          content: 'Analyse de la contribution de chaque membre.',
          items: stats.memberStats.map((m) => ({
            label: m.name,
            value: `${m.completedTasks} terminées / ${m.totalTasks} assignées (${m.completionRate}%)`,
            status: m.completionRate >= 70 ? 'good' : m.completionRate >= 40 ? 'warning' : 'danger',
          })),
        },
        {
          title: 'Tâches en retard',
          content: stats.overdueTasks.length > 0
            ? `${stats.overdueTasks.length} tâche(s) en retard nécessitent une attention immédiate.`
            : 'Aucune tâche en retard. Bon travail ! 🎉',
          items: stats.overdueTasks.map((t) => ({
            label: t.title,
            value: `Échéance : ${t.dueDate} — Projet : ${t.projectName}`,
            status: 'danger' as const,
          })),
        },
        {
          title: 'Analyse IA & Recommandations',
          content: aiAnalysis.analysis,
        },
        {
          title: 'Prédictions de retard',
          content: aiAnalysis.predictions,
        },
      ],
    };
  }

  /**
   * Generate a report for a specific project
   */
  async generateProjectReport(projectId: string): Promise<ReportData> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: {
        group: true,
        tasks: {
          include: {
            assignees: {
              include: { user: { select: { id: true, name: true, jobTitle: true } } },
            },
          },
        },
      },
    });

    if (!project) throw new Error('Project not found');

    const totalTasks = project.tasks.length;
    const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
    const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;
    const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

    const now = new Date();
    const overdueTasks = project.tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE',
    );

    // Member contribution
    const memberMap = new Map<string, { name: string; total: number; done: number }>();
    for (const task of project.tasks) {
      for (const assignee of task.assignees) {
        const key = assignee.user.id;
        if (!memberMap.has(key)) {
          memberMap.set(key, { name: assignee.user.name, total: 0, done: 0 });
        }
        const entry = memberMap.get(key)!;
        entry.total++;
        if (task.status === 'DONE') entry.done++;
      }
    }

    const taskDetails = project.tasks.map((t) => ({
      title: t.title,
      status: t.status,
      assignees: t.assignees.map((a) => a.user.name).join(', '),
      dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-FR') : 'Non définie',
    }));

    // AI analysis
    const aiInsights = await this.generateProjectAIAnalysis(project, taskDetails, completionRate);

    return {
      generatedAt: new Date().toISOString(),
      type: 'project_activity',
      title: `Rapport de projet — ${project.name}`,
      summary: aiInsights.summary,
      sections: [
        {
          title: 'Vue d\'ensemble du projet',
          content: project.description || 'Aucune description.',
          metrics: {
            'Tâches totales': totalTasks,
            'Terminées': doneTasks,
            'En cours': inProgressTasks,
            'À faire': todoTasks,
            'Taux de complétion': `${completionRate}%`,
            'En retard': overdueTasks.length,
          },
        },
        {
          title: 'Détail des tâches',
          content: 'Liste de toutes les tâches du projet avec leur statut.',
          items: project.tasks.map((t) => ({
            label: t.title,
            value: `[${t.status}] → ${t.assignees.map((a) => a.user.name).join(', ') || 'Non assignée'}`,
            status: t.status === 'DONE' ? 'good' : t.status === 'IN_PROGRESS' ? 'warning' : 'danger',
          })),
        },
        {
          title: 'Contribution par membre',
          content: 'Répartition du travail entre les membres du projet.',
          items: Array.from(memberMap.values()).map((m) => ({
            label: m.name,
            value: `${m.done}/${m.total} tâches terminées (${m.total > 0 ? Math.round((m.done / m.total) * 100) : 0}%)`,
            status: (m.total > 0 ? Math.round((m.done / m.total) * 100) : 0) >= 70 ? 'good' : 'warning',
          })),
        },
        {
          title: 'Analyse IA & Recommandations',
          content: aiInsights.analysis,
        },
      ],
    };
  }

  // ===== Private helpers =====

  private async getGroupDetails(groupId: string) {
    return this.prisma.group.findUnique({
      where: { id: groupId },
      include: { admin: { select: { name: true, jobTitle: true } } },
    });
  }

  private async getGroupProjects(groupId: string) {
    return this.prisma.project.findMany({
      where: { groupId },
      include: {
        tasks: {
          include: {
            assignees: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });
  }

  private async getGroupMembers(groupId: string) {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        admin: { select: { id: true, name: true, jobTitle: true } },
        members: {
          include: { user: { select: { id: true, name: true, jobTitle: true } } },
        },
      },
    });
    if (!group) return [];

    const all = [
      { id: group.admin.id, name: group.admin.name, jobTitle: group.admin.jobTitle },
      ...group.members.map((m) => ({ id: m.user.id, name: m.user.name, jobTitle: m.user.jobTitle })),
    ];

    // Deduplicate
    const seen = new Set<string>();
    return all.filter((m) => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  }

  private computeStats(projects: any[], members: any[]) {
    let totalTasks = 0, doneTasks = 0, inProgressTasks = 0, todoTasks = 0;
    const now = new Date();
    const overdueTasks: { title: string; dueDate: string; projectName: string }[] = [];

    const projectStats = projects.map((p) => {
      const total = p.tasks.length;
      const done = p.tasks.filter((t: any) => t.status === 'DONE').length;
      const inProgress = p.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
      const todo = p.tasks.filter((t: any) => t.status === 'TODO').length;

      totalTasks += total;
      doneTasks += done;
      inProgressTasks += inProgress;
      todoTasks += todo;

      // Check overdue
      for (const t of p.tasks) {
        if (t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE') {
          overdueTasks.push({
            title: t.title,
            dueDate: new Date(t.dueDate).toLocaleDateString('fr-FR'),
            projectName: p.name,
          });
        }
      }

      return {
        name: p.name,
        total,
        done,
        inProgress,
        todo,
        completionRate: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    });

    // Member stats
    const memberTaskMap = new Map<string, { name: string; totalTasks: number; completedTasks: number }>();
    for (const m of members) {
      memberTaskMap.set(m.id, { name: m.name, totalTasks: 0, completedTasks: 0 });
    }

    for (const p of projects) {
      for (const t of p.tasks) {
        for (const a of t.assignees) {
          const entry = memberTaskMap.get(a.user.id);
          if (entry) {
            entry.totalTasks++;
            if (t.status === 'DONE') entry.completedTasks++;
          }
        }
      }
    }

    const memberStats = Array.from(memberTaskMap.values()).map((m) => ({
      ...m,
      completionRate: m.totalTasks > 0 ? Math.round((m.completedTasks / m.totalTasks) * 100) : 0,
    }));

    return {
      totalMembers: members.length,
      totalProjects: projects.length,
      totalTasks,
      doneTasks,
      inProgressTasks,
      todoTasks,
      completionRate: totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      projectStats,
      memberStats,
      overdueTasks,
    };
  }

  private async generateAIAnalysis(group: any, stats: any) {
    const prompt = `Analyse les données suivantes du groupe "${group.name}" du CROUSZ (Centre Régional des Œuvres Universitaires Sociales de Ziguinchor) et génère un rapport.

Statistiques :
- ${stats.totalMembers} membres, ${stats.totalProjects} projets, ${stats.totalTasks} tâches
- Taux de complétion global : ${stats.completionRate}%
- Tâches : ${stats.doneTasks} terminées, ${stats.inProgressTasks} en cours, ${stats.todoTasks} à faire
- Tâches en retard : ${stats.overdueTasks.length}

Projets :
${stats.projectStats.map((p: any) => `- "${p.name}" : ${p.completionRate}% (${p.done}/${p.total})`).join('\n')}

Productivité membres :
${stats.memberStats.map((m: any) => `- ${m.name} : ${m.completedTasks}/${m.totalTasks} (${m.completionRate}%)`).join('\n')}

Tâches en retard :
${stats.overdueTasks.length > 0 ? stats.overdueTasks.map((t: any) => `- "${t.title}" (${t.projectName}) — échéance : ${t.dueDate}`).join('\n') : 'Aucune'}

Réponds en JSON strict :
{
  "summary": "Résumé exécutif en 2-3 phrases",
  "analysis": "Analyse détaillée avec recommandations concrètes (3-5 paragraphes)",
  "predictions": "Prédictions de retard et risques identifiés avec suggestions (2-3 paragraphes)"
}`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage('Tu es un analyste de gestion de projet expert. Réponds uniquement en JSON valide, sans backticks markdown.'),
        new HumanMessage(prompt),
      ]);

      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('AI analysis failed', error);
      return {
        summary: `Le groupe "${group.name}" compte ${stats.totalProjects} projets avec un taux de complétion de ${stats.completionRate}%.`,
        analysis: 'L\'analyse IA n\'a pas pu être générée. Veuillez consulter les statistiques ci-dessus pour une vue d\'ensemble.',
        predictions: 'Les prédictions ne sont pas disponibles pour le moment.',
      };
    }
  }

  private async generateProjectAIAnalysis(project: any, taskDetails: any[], completionRate: number) {
    const prompt = `Analyse le projet "${project.name}" du CROUSZ :
Description : ${project.description || 'Non définie'}
Taux de complétion : ${completionRate}%
Tâches :
${taskDetails.map((t) => `- "${t.title}" [${t.status}] → ${t.assignees || 'Non assignée'} (échéance: ${t.dueDate})`).join('\n')}

Réponds en JSON strict :
{
  "summary": "Résumé en 2 phrases",
  "analysis": "Analyse et recommandations (2-3 paragraphes)"
}`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage('Tu es un analyste de gestion de projet expert. Réponds uniquement en JSON valide, sans backticks markdown.'),
        new HumanMessage(prompt),
      ]);

      const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
      const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.error('Project AI analysis failed', error);
      return {
        summary: `Le projet "${project.name}" a un taux de complétion de ${completionRate}%.`,
        analysis: 'L\'analyse IA n\'a pas pu être générée.',
      };
    }
  }
}
