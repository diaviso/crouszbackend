import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { PrismaService } from '../prisma/prisma.service';

interface MemberProfile {
  id: string;
  name: string;
  jobTitle: string | null;
  specialty: string | null;
  skills: string[];
  bio: string | null;
}

interface GeneratedTask {
  title: string;
  description: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  priority: number;
  assigneeIds: string[];
}

interface GeneratedProject {
  name: string;
  description: string;
  tasks: GeneratedTask[];
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private llm: ChatOpenAI;

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

  async generateProject(
    prompt: string,
    groupId: string,
    userId: string,
  ): Promise<{ project: any; tasksCount: number }> {
    // 1. Fetch all group members with their professional profiles
    const members = await this.getGroupMembers(groupId);

    // 2. Call LLM to generate project structure with task assignments
    const generated = await this.callLLM(prompt, members);

    // 3. Build a set of valid member IDs for validation
    const validMemberIds = new Set(members.map((m) => m.id));

    // 4. Create project in DB
    const project = await this.prisma.project.create({
      data: {
        name: generated.name,
        description: generated.description,
        groupId,
      },
    });

    // 5. Create all tasks with smart assignments
    const tasks = await Promise.all(
      generated.tasks.map((task) => {
        // Filter to only valid member IDs, fallback to creator if none valid
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
      }),
    );

    // 6. Return full project with tasks
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

  private async getGroupMembers(groupId: string): Promise<MemberProfile[]> {
    const group = await this.prisma.group.findUnique({
      where: { id: groupId },
      include: {
        admin: true,
        members: {
          include: { user: true },
        },
      },
    });

    if (!group) return [];

    // Collect all unique members (admin + members)
    const membersMap = new Map<string, MemberProfile>();

    // Add admin
    membersMap.set(group.admin.id, {
      id: group.admin.id,
      name: group.admin.name || 'Sans nom',
      jobTitle: group.admin.jobTitle,
      specialty: group.admin.specialty,
      skills: group.admin.skills || [],
      bio: group.admin.bio,
    });

    // Add group members
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

  private async callLLM(
    prompt: string,
    members: MemberProfile[],
  ): Promise<GeneratedProject> {
    // Build members description for the LLM
    const membersDescription = members
      .map((m) => {
        const parts = [`- ID: "${m.id}", Nom: "${m.name}"`];
        if (m.jobTitle) parts.push(`  Poste: ${m.jobTitle}`);
        if (m.specialty) parts.push(`  Spécialité: ${m.specialty}`);
        if (m.skills.length > 0) parts.push(`  Compétences: ${m.skills.join(', ')}`);
        if (m.bio) parts.push(`  Bio: ${m.bio}`);
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
        new SystemMessage(systemPrompt),
        new HumanMessage(prompt),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      // Clean potential markdown code blocks
      const cleaned = content
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed: GeneratedProject = JSON.parse(cleaned);

      // Validate structure
      if (!parsed.name || !parsed.description || !Array.isArray(parsed.tasks)) {
        throw new Error('Invalid project structure from LLM');
      }

      // Ensure all tasks have TODO status and assigneeIds is an array
      parsed.tasks = parsed.tasks.map((task) => ({
        ...task,
        status: 'TODO' as const,
        assigneeIds: Array.isArray(task.assigneeIds) ? task.assigneeIds : [],
      }));

      this.logger.log(
        `Generated project "${parsed.name}" with ${parsed.tasks.length} tasks for ${members.length} members`,
      );

      return parsed;
    } catch (error) {
      this.logger.error('Failed to generate project from LLM', error);
      throw new Error(
        `Impossible de générer le projet. Veuillez reformuler votre description. Détail: ${error.message}`,
      );
    }
  }
}
