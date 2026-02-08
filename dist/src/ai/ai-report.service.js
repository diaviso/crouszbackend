"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var AiReportService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiReportService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const prisma_service_1 = require("../prisma/prisma.service");
let AiReportService = AiReportService_1 = class AiReportService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AiReportService_1.name);
        this.llm = new openai_1.ChatOpenAI({
            openAIApiKey: this.configService.get('OPENAI_API_KEY'),
            modelName: this.configService.get('OPENAI_MODEL') || 'gpt-4.1',
            temperature: 0.3,
        });
    }
    async generateGroupReport(groupId) {
        const [group, projects, members] = await Promise.all([
            this.getGroupDetails(groupId),
            this.getGroupProjects(groupId),
            this.getGroupMembers(groupId),
        ]);
        if (!group)
            throw new Error('Group not found');
        const stats = this.computeStats(projects, members);
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
                        status: 'danger',
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
    async generateProjectReport(projectId) {
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
        if (!project)
            throw new Error('Project not found');
        const totalTasks = project.tasks.length;
        const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
        const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
        const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;
        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
        const now = new Date();
        const overdueTasks = project.tasks.filter((t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'DONE');
        const memberMap = new Map();
        for (const task of project.tasks) {
            for (const assignee of task.assignees) {
                const key = assignee.user.id;
                if (!memberMap.has(key)) {
                    memberMap.set(key, { name: assignee.user.name, total: 0, done: 0 });
                }
                const entry = memberMap.get(key);
                entry.total++;
                if (task.status === 'DONE')
                    entry.done++;
            }
        }
        const taskDetails = project.tasks.map((t) => ({
            title: t.title,
            status: t.status,
            assignees: t.assignees.map((a) => a.user.name).join(', '),
            dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString('fr-FR') : 'Non définie',
        }));
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
    async getGroupDetails(groupId) {
        return this.prisma.group.findUnique({
            where: { id: groupId },
            include: { admin: { select: { name: true, jobTitle: true } } },
        });
    }
    async getGroupProjects(groupId) {
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
    async getGroupMembers(groupId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                admin: { select: { id: true, name: true, jobTitle: true } },
                members: {
                    include: { user: { select: { id: true, name: true, jobTitle: true } } },
                },
            },
        });
        if (!group)
            return [];
        const all = [
            { id: group.admin.id, name: group.admin.name, jobTitle: group.admin.jobTitle },
            ...group.members.map((m) => ({ id: m.user.id, name: m.user.name, jobTitle: m.user.jobTitle })),
        ];
        const seen = new Set();
        return all.filter((m) => {
            if (seen.has(m.id))
                return false;
            seen.add(m.id);
            return true;
        });
    }
    computeStats(projects, members) {
        let totalTasks = 0, doneTasks = 0, inProgressTasks = 0, todoTasks = 0;
        const now = new Date();
        const overdueTasks = [];
        const projectStats = projects.map((p) => {
            const total = p.tasks.length;
            const done = p.tasks.filter((t) => t.status === 'DONE').length;
            const inProgress = p.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
            const todo = p.tasks.filter((t) => t.status === 'TODO').length;
            totalTasks += total;
            doneTasks += done;
            inProgressTasks += inProgress;
            todoTasks += todo;
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
        const memberTaskMap = new Map();
        for (const m of members) {
            memberTaskMap.set(m.id, { name: m.name, totalTasks: 0, completedTasks: 0 });
        }
        for (const p of projects) {
            for (const t of p.tasks) {
                for (const a of t.assignees) {
                    const entry = memberTaskMap.get(a.user.id);
                    if (entry) {
                        entry.totalTasks++;
                        if (t.status === 'DONE')
                            entry.completedTasks++;
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
    async generateAIAnalysis(group, stats) {
        const prompt = `Analyse les données suivantes du groupe "${group.name}" du CROUSZ (Centre Régional des Œuvres Universitaires Sociales de Ziguinchor) et génère un rapport.

Statistiques :
- ${stats.totalMembers} membres, ${stats.totalProjects} projets, ${stats.totalTasks} tâches
- Taux de complétion global : ${stats.completionRate}%
- Tâches : ${stats.doneTasks} terminées, ${stats.inProgressTasks} en cours, ${stats.todoTasks} à faire
- Tâches en retard : ${stats.overdueTasks.length}

Projets :
${stats.projectStats.map((p) => `- "${p.name}" : ${p.completionRate}% (${p.done}/${p.total})`).join('\n')}

Productivité membres :
${stats.memberStats.map((m) => `- ${m.name} : ${m.completedTasks}/${m.totalTasks} (${m.completionRate}%)`).join('\n')}

Tâches en retard :
${stats.overdueTasks.length > 0 ? stats.overdueTasks.map((t) => `- "${t.title}" (${t.projectName}) — échéance : ${t.dueDate}`).join('\n') : 'Aucune'}

Réponds en JSON strict :
{
  "summary": "Résumé exécutif en 2-3 phrases",
  "analysis": "Analyse détaillée avec recommandations concrètes (3-5 paragraphes)",
  "predictions": "Prédictions de retard et risques identifiés avec suggestions (2-3 paragraphes)"
}`;
        try {
            const response = await this.llm.invoke([
                new messages_1.SystemMessage('Tu es un analyste de gestion de projet expert. Réponds uniquement en JSON valide, sans backticks markdown.'),
                new messages_1.HumanMessage(prompt),
            ]);
            const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        }
        catch (error) {
            this.logger.error('AI analysis failed', error);
            return {
                summary: `Le groupe "${group.name}" compte ${stats.totalProjects} projets avec un taux de complétion de ${stats.completionRate}%.`,
                analysis: 'L\'analyse IA n\'a pas pu être générée. Veuillez consulter les statistiques ci-dessus pour une vue d\'ensemble.',
                predictions: 'Les prédictions ne sont pas disponibles pour le moment.',
            };
        }
    }
    async generateProjectAIAnalysis(project, taskDetails, completionRate) {
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
                new messages_1.SystemMessage('Tu es un analyste de gestion de projet expert. Réponds uniquement en JSON valide, sans backticks markdown.'),
                new messages_1.HumanMessage(prompt),
            ]);
            const content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
            const cleaned = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
            return JSON.parse(cleaned);
        }
        catch (error) {
            this.logger.error('Project AI analysis failed', error);
            return {
                summary: `Le projet "${project.name}" a un taux de complétion de ${completionRate}%.`,
                analysis: 'L\'analyse IA n\'a pas pu être générée.',
            };
        }
    }
};
exports.AiReportService = AiReportService;
exports.AiReportService = AiReportService = AiReportService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AiReportService);
//# sourceMappingURL=ai-report.service.js.map