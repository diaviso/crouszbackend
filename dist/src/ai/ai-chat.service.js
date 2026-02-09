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
var AiChatService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiChatService = exports.CROUSZ_AI_BOT_NAME = exports.CROUSZ_AI_BOT_ID = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
const prisma_service_1 = require("../prisma/prisma.service");
exports.CROUSZ_AI_BOT_ID = 'crouszai-bot';
exports.CROUSZ_AI_BOT_NAME = 'CrouszAI';
let AiChatService = AiChatService_1 = class AiChatService {
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(AiChatService_1.name);
        this.botUserId = '';
        this.llm = new openai_1.ChatOpenAI({
            openAIApiKey: this.configService.get('OPENAI_API_KEY'),
            modelName: this.configService.get('OPENAI_MODEL') || 'gpt-4.1',
            temperature: 0.7,
        });
    }
    async onModuleInit() {
        try {
            const botUser = await this.prisma.user.upsert({
                where: { email: 'crouszai@crousz.sn' },
                update: {},
                create: {
                    email: 'crouszai@crousz.sn',
                    name: exports.CROUSZ_AI_BOT_NAME,
                    googleId: 'crouszai-bot-internal',
                    jobTitle: 'Assistant IA',
                    avatar: null,
                },
            });
            this.botUserId = botUser.id;
            this.logger.log(`CrouszAI bot user initialized: ${this.botUserId}`);
        }
        catch (error) {
            this.logger.error('Failed to initialize bot user', error);
        }
    }
    getBotUserId() {
        return this.botUserId;
    }
    isBotMentioned(mentions, content) {
        if (mentions.includes(exports.CROUSZ_AI_BOT_ID))
            return true;
        const lowerContent = content.toLowerCase();
        if (lowerContent.includes('@crouszai') || lowerContent.includes('@[crouszai]')) {
            return true;
        }
        return false;
    }
    async generateResponse(groupId, messageContent, authorName) {
        try {
            const [group, recentMessages, groupProjects] = await Promise.all([
                this.getGroupContext(groupId),
                this.getRecentMessages(groupId, 15),
                this.getGroupProjects(groupId),
            ]);
            const systemPrompt = this.buildSystemPrompt(group, groupProjects);
            const chatHistory = this.buildChatHistory(recentMessages);
            const response = await this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                ...chatHistory,
                new messages_1.HumanMessage(`${authorName}: ${this.cleanMentions(messageContent)}`),
            ]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            return content.trim();
        }
        catch (error) {
            this.logger.error('Failed to generate AI chat response', error);
            return 'Désolé, je rencontre un problème technique. Veuillez réessayer dans un instant. 🤖';
        }
    }
    async getGroupContext(groupId) {
        return this.prisma.group.findUnique({
            where: { id: groupId },
            include: {
                admin: { select: { name: true, jobTitle: true } },
                members: {
                    include: {
                        user: { select: { name: true, jobTitle: true, specialty: true, skills: true } },
                    },
                },
            },
        });
    }
    async getRecentMessages(groupId, count) {
        return this.prisma.message.findMany({
            where: { groupId },
            include: { author: { select: { name: true } } },
            orderBy: { createdAt: 'desc' },
            take: count,
        });
    }
    async getGroupProjects(groupId) {
        return this.prisma.project.findMany({
            where: { groupId },
            include: {
                tasks: {
                    include: {
                        assignees: {
                            include: { user: { select: { name: true } } },
                        },
                    },
                },
            },
        });
    }
    buildSystemPrompt(group, projects) {
        let prompt = `Tu es CrouszAI, l'assistant intelligent du Centre Régional des Œuvres Universitaires Sociales de Ziguinchor (CROUSZ).
Tu participes aux discussions de groupe comme un collègue serviable et compétent.

Règles :
- Réponds de manière concise, professionnelle mais amicale
- Tu peux utiliser des émojis avec modération
- Tu as accès au contexte du groupe et de ses projets
- Si on te pose une question hors de ton contexte, réponds honnêtement que tu ne sais pas
- Réponds dans la langue de la question (français par défaut)
- Ne révèle jamais que tu es un modèle de langage, tu es CrouszAI du CROUSZ
- Tu peux aider avec : la planification, l'analyse de tâches, les conseils de gestion, la rédaction, etc.

`;
        if (group) {
            prompt += `\nContexte du groupe :
- Nom : ${group.name}
- Description : ${group.description || 'Aucune'}
- Admin : ${group.admin?.name} (${group.admin?.jobTitle || 'N/A'})
- Membres : ${group.members?.map((m) => `${m.user.name} (${m.user.jobTitle || 'N/A'})`).join(', ')}
`;
        }
        if (projects && projects.length > 0) {
            prompt += `\nProjets du groupe :`;
            for (const project of projects) {
                const totalTasks = project.tasks.length;
                const doneTasks = project.tasks.filter((t) => t.status === 'DONE').length;
                const inProgressTasks = project.tasks.filter((t) => t.status === 'IN_PROGRESS').length;
                const todoTasks = project.tasks.filter((t) => t.status === 'TODO').length;
                prompt += `\n- "${project.name}" : ${totalTasks} tâches (${doneTasks} terminées, ${inProgressTasks} en cours, ${todoTasks} à faire)`;
                if (project.tasks.length > 0) {
                    prompt += `\n  Tâches : ${project.tasks.map((t) => `"${t.title}" [${t.status}] → ${t.assignees?.map((a) => a.user.name).join(', ') || 'non assignée'}`).join('; ')}`;
                }
            }
        }
        return prompt;
    }
    buildChatHistory(messages) {
        const ordered = [...messages].reverse();
        const botName = exports.CROUSZ_AI_BOT_NAME;
        return ordered.map((msg) => {
            const content = `${msg.author.name}: ${msg.content}`;
            if (msg.author.name === botName) {
                return new messages_1.AIMessage(msg.content);
            }
            return new messages_1.HumanMessage(content);
        });
    }
    cleanMentions(content) {
        return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
    }
};
exports.AiChatService = AiChatService;
exports.AiChatService = AiChatService = AiChatService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], AiChatService);
//# sourceMappingURL=ai-chat.service.js.map