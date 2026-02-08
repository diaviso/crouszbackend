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
var AiService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const prisma_service_1 = require("../prisma/prisma.service");
let AiService = AiService_1 = class AiService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AiService_1.name);
        this.llm = new openai_1.ChatOpenAI({
            openAIApiKey: this.configService.get('OPENAI_API_KEY'),
            modelName: this.configService.get('OPENAI_MODEL') || 'gpt-4.1',
            temperature: 0.7,
        });
    }
    async generateProject(prompt, groupId, userId) {
        const members = await this.getGroupMembers(groupId);
        const generated = await this.callLLM(prompt, members);
        const validMemberIds = new Set(members.map((m) => m.id));
        const project = await this.prisma.project.create({
            data: {
                name: generated.name,
                description: generated.description,
                groupId,
            },
        });
        const tasks = await Promise.all(generated.tasks.map((task) => {
            let assigneeIds = task.assigneeIds.filter((id) => validMemberIds.has(id));
            if (assigneeIds.length === 0) {
                assigneeIds = [userId];
            }
            return this.prisma.task.create({
                data: {
                    title: task.title,
                    description: task.description,
                    status: task.status,
                    projectId: project.id,
                    assignees: {
                        create: assigneeIds.map((id) => ({ userId: id })),
                    },
                },
                include: {
                    assignees: {
                        include: { user: true },
                    },
                },
            });
        }));
        const fullProject = await this.prisma.project.findUnique({
            where: { id: project.id },
            include: {
                group: true,
                tasks: {
                    include: {
                        assignees: {
                            include: { user: true },
                        },
                    },
                    orderBy: { createdAt: 'asc' },
                },
                _count: {
                    select: { tasks: true, attachments: true },
                },
            },
        });
        return {
            project: fullProject,
            tasksCount: tasks.length,
        };
    }
    async getGroupMembers(groupId) {
        const group = await this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                admin: true,
                members: {
                    include: { user: true },
                },
            },
        });
        if (!group)
            return [];
        const membersMap = new Map();
        membersMap.set(group.admin.id, {
            id: group.admin.id,
            name: group.admin.name || 'Sans nom',
            jobTitle: group.admin.jobTitle,
            specialty: group.admin.specialty,
            skills: group.admin.skills || [],
            bio: group.admin.bio,
        });
        for (const member of group.members) {
            if (!membersMap.has(member.user.id)) {
                membersMap.set(member.user.id, {
                    id: member.user.id,
                    name: member.user.name || 'Sans nom',
                    jobTitle: member.user.jobTitle,
                    specialty: member.user.specialty,
                    skills: member.user.skills || [],
                    bio: member.user.bio,
                });
            }
        }
        return Array.from(membersMap.values());
    }
    async callLLM(prompt, members) {
        const membersDescription = members
            .map((m) => {
            const parts = [`- ID: "${m.id}", Nom: "${m.name}"`];
            if (m.jobTitle)
                parts.push(`  Poste: ${m.jobTitle}`);
            if (m.specialty)
                parts.push(`  Spécialité: ${m.specialty}`);
            if (m.skills.length > 0)
                parts.push(`  Compétences: ${m.skills.join(', ')}`);
            if (m.bio)
                parts.push(`  Bio: ${m.bio}`);
            return parts.join('\n');
        })
            .join('\n\n');
        const systemPrompt = `Tu es un assistant expert en gestion de projet. L'utilisateur va te décrire une idée de projet.
Tu dois générer un projet structuré avec :
- Un nom de projet clair et concis
- Une description détaillée du projet
- Une liste de tâches concrètes et actionnables pour réaliser ce projet

Voici les membres de l'équipe disponibles avec leurs profils professionnels :

${membersDescription}

Pour chaque tâche, tu dois :
- Donner un titre clair
- Donner une description détaillée expliquant ce qu'il faut faire
- Mettre le statut initial à "TODO"
- Donner une priorité (1 = plus urgent, ordre croissant)
- Assigner la tâche à un ou plusieurs membres en te basant sur leurs compétences, spécialité et poste.
  Utilise le champ "assigneeIds" avec les IDs exacts des membres.
  Si aucun membre ne correspond particulièrement, assigne la tâche au premier membre de la liste.

Génère entre 5 et 15 tâches selon la complexité du projet.
Ordonne les tâches par priorité logique d'exécution.

IMPORTANT: Tu dois répondre UNIQUEMENT avec un JSON valide, sans aucun texte avant ou après, sans backticks markdown. Le format exact est :
{
  "name": "Nom du projet",
  "description": "Description détaillée du projet",
  "tasks": [
    {
      "title": "Titre de la tâche",
      "description": "Description détaillée",
      "status": "TODO",
      "priority": 1,
      "assigneeIds": ["id-du-membre-1", "id-du-membre-2"]
    }
  ]
}`;
        try {
            const response = await this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(prompt),
            ]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            const cleaned = content
                .replace(/```json\s*/gi, '')
                .replace(/```\s*/g, '')
                .trim();
            const parsed = JSON.parse(cleaned);
            if (!parsed.name || !parsed.description || !Array.isArray(parsed.tasks)) {
                throw new Error('Invalid project structure from LLM');
            }
            parsed.tasks = parsed.tasks.map((task) => ({
                ...task,
                status: 'TODO',
                assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : [],
            }));
            this.logger.log(`Generated project "${parsed.name}" with ${parsed.tasks.length} tasks for ${members.length} members`);
            return parsed;
        }
        catch (error) {
            this.logger.error('Failed to generate project from LLM', error);
            throw new Error(`Impossible de générer le projet. Veuillez reformuler votre description. Détail: ${error.message}`);
        }
    }
};
exports.AiService = AiService;
exports.AiService = AiService = AiService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AiService);
//# sourceMappingURL=ai.service.js.map