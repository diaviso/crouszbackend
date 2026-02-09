import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';

export const CROUSZ_AI_BOT_ID = 'crouszai-bot';
export const CROUSZ_AI_BOT_NAME = 'CrouszAI';

@Injectable()
export class AiChatService implements OnModuleInit {
  private readonly logger = new Logger(AiChatService.name);
  private llm: ChatOpenAI;
  private botUserId: string = '';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1',
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
          name: CROUSZ_AI_BOT_NAME,
          googleId: 'crouszai-bot-internal',
          jobTitle: 'Assistant IA',
          avatar: null,
        },
      });
      this.botUserId = botUser.id;
      this.logger.log(`CrouszAI bot user initialized: ${this.botUserId}`);
    } catch (error) {
      this.logger.error('Failed to initialize bot user', error);
    }
  }

  getBotUserId(): string {
    return this.botUserId;
  }

  /**
   * Check if a message mentions the bot (no DB lookup needed)
   */
  isBotMentioned(mentions: string[], content: string): boolean {
    // Check if virtual bot ID is in mentions array
    if (mentions.includes(CROUSZ_AI_BOT_ID)) return true;

    // Also check for @CrouszAI or @crouszai in raw content
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('@crouszai') || lowerContent.includes('@[crouszai]')) {
      return true;
    }

    return false;
  }

  /**
   * Generate a response to a message in a group chat
   */
  async generateResponse(
    groupId: string,
    messageContent: string,
    authorName: string,
  ): Promise<string> {
    try {
      // Gather context
      const [group, recentMessages, groupProjects] = await Promise.all([
        this.getGroupContext(groupId),
        this.getRecentMessages(groupId, 15),
        this.getGroupProjects(groupId),
      ]);

      const systemPrompt = this.buildSystemPrompt(group, groupProjects);
      const chatHistory = this.buildChatHistory(recentMessages);

      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        ...chatHistory,
        new HumanMessage(`${authorName}: ${this.cleanMentions(messageContent)}`),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return content.trim();
    } catch (error) {
      this.logger.error('Failed to generate AI chat response', error);
      return 'Désolé, je rencontre un problème technique. Veuillez réessayer dans un instant. 🤖';
    }
  }

  private async getGroupContext(groupId: string) {
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

  private async getRecentMessages(groupId: string, count: number) {
    return this.prisma.message.findMany({
      where: { groupId },
      include: { author: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
      take: count,
    });
  }

  private async getGroupProjects(groupId: string) {
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

  private buildSystemPrompt(group: any, projects: any[]): string {
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
- Membres : ${group.members?.map((m: any) => `${m.user.name} (${m.user.jobTitle || 'N/A'})`).join(', ')}
`;
    }

    if (projects && projects.length > 0) {
      prompt += `\nProjets du groupe :`;
      for (const project of projects) {
        const totalTasks = project.tasks.length;
        const doneTasks = project.tasks.filter((t: any) => t.status === 'DONE').length;
        const inProgressTasks = project.tasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
        const todoTasks = project.tasks.filter((t: any) => t.status === 'TODO').length;

        prompt += `\n- "${project.name}" : ${totalTasks} tâches (${doneTasks} terminées, ${inProgressTasks} en cours, ${todoTasks} à faire)`;

        if (project.tasks.length > 0) {
          prompt += `\n  Tâches : ${project.tasks.map((t: any) => `"${t.title}" [${t.status}] → ${t.assignees?.map((a: any) => a.user.name).join(', ') || 'non assignée'}`).join('; ')}`;
        }
      }
    }

    return prompt;
  }

  private buildChatHistory(messages: any[]) {
    // Reverse to get chronological order
    const ordered = [...messages].reverse();
    const botName = CROUSZ_AI_BOT_NAME;

    return ordered.map((msg) => {
      const content = `${msg.author.name}: ${msg.content}`;
      if (msg.author.name === botName) {
        return new AIMessage(msg.content);
      }
      return new HumanMessage(content);
    });
  }

  private cleanMentions(content: string): string {
    // Remove mention syntax @[Name](id) → @Name
    return content.replace(/@\[([^\]]+)\]\([^)]+\)/g, '@$1');
  }
}
