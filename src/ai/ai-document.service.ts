import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

@Injectable()
export class AiDocumentService {
  private readonly logger = new Logger(AiDocumentService.name);
  private llm: ChatOpenAI;

  constructor(private configService: ConfigService) {
    this.llm = new ChatOpenAI({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
      modelName: this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1',
      temperature: 0.5,
      maxTokens: 16000,
    });
  }

  /**
   * Generate document content in rich HTML from a prompt
   */
  async generateDocument(prompt: string, context?: string): Promise<string> {
    const systemPrompt = `Tu es un rédacteur professionnel expert du CROUSZ (Centre Régional des Œuvres Universitaires Sociales de Ziguinchor).
Tu génères des documents professionnels en HTML riche et bien structuré.

RÈGLES DE FORMATAGE STRICTES :
- Utilise des balises HTML riches : <h1>, <h2>, <h3>, <p>, <ul>, <ol>, <li>, <table>, <thead>, <tbody>, <tr>, <th>, <td>, <blockquote>, <strong>, <em>, <u>, <s>, <code>, <pre>, <hr>
- Structure toujours le document avec des titres et sous-titres clairs
- Utilise des tableaux quand c'est pertinent (données comparatives, plannings, etc.)
- Utilise des listes à puces ou numérotées pour les énumérations
- Ajoute des paragraphes bien rédigés et professionnels
- Les tableaux doivent avoir des en-têtes (<thead>) et un corps (<tbody>)
- Ne mets JAMAIS de balises <html>, <head>, <body> — uniquement le contenu du document
- Écris en français par défaut sauf si demandé autrement
- Sois exhaustif et détaillé — les documents peuvent être longs
- Utilise un ton professionnel et institutionnel adapté au contexte universitaire

RÈGLES CRITIQUES POUR LES LISTES :
- Dans les <li>, mets le texte DIRECTEMENT sans balise <p> à l'intérieur. Exemple correct : <li>Mon texte</li>. Exemple INCORRECT : <li><p>Mon texte</p></li>
- Ne laisse JAMAIS de <li> vides
- Pour les listes numérotées <ol>, chaque <li> doit contenir du texte
- Ne mélange JAMAIS le format Markdown avec le HTML

RÈGLES POUR LES TABLEAUX :
- Utilise TOUJOURS la structure complète : <table><thead><tr><th>...</th></tr></thead><tbody><tr><td>...</td></tr></tbody></table>
- Ne génère JAMAIS de tableaux en format texte avec des | (pipes)

IMPORTANT : Retourne UNIQUEMENT du HTML brut. Pas de blocs de code markdown (\`\`\`html), pas de commentaires, juste le HTML pur.

TYPES DE DOCUMENTS QUE TU PEUX GÉNÉRER :
- Rapports d'activité, rapports de réunion, comptes-rendus
- Notes de service, notes d'information, circulaires
- Plans d'action, feuilles de route
- Analyses, études, synthèses
- Procès-verbaux, délibérations
- Lettres administratives, correspondances
- Tout autre document professionnel`;

    const userPrompt = context
      ? `Contexte additionnel :\n${context}\n\nDemande :\n${prompt}`
      : prompt;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return this.cleanHtmlResponse(content);
    } catch (error) {
      this.logger.error('Document generation failed', error);
      throw new Error('Échec de la génération du document. Veuillez réessayer.');
    }
  }

  /**
   * Strip markdown code fences and clean up AI HTML output
   */
  private cleanHtmlResponse(raw: string): string {
    let html = raw.trim();
    // Remove ```html ... ``` or ``` ... ``` wrappers
    html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
    // Remove empty <li> tags
    html = html.replace(/<li>\s*<\/li>/gi, '');
    // Remove <p> inside <li>: <li><p>text</p></li> -> <li>text</li>
    html = html.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/gi, '<li>$1</li>');
    return html.trim();
  }

  /**
   * Rewrite/improve selected text
   */
  async rewriteText(text: string, instruction: string): Promise<string> {
    const systemPrompt = `Tu es un assistant de rédaction expert. On te donne un texte et une instruction de modification.
Applique l'instruction au texte et retourne UNIQUEMENT le texte modifié en HTML riche.
Ne mets pas de balises <html>, <head>, <body>. Retourne uniquement le contenu HTML modifié.
Conserve la structure HTML existante (titres, listes, tableaux) et améliore-la si nécessaire.`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(`Texte original :\n${text}\n\nInstruction :\n${instruction}`),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return this.cleanHtmlResponse(content);
    } catch (error) {
      this.logger.error('Text rewrite failed', error);
      throw new Error('Échec de la réécriture. Veuillez réessayer.');
    }
  }

  /**
   * Continue writing from existing content
   */
  async continueWriting(existingContent: string, instruction?: string): Promise<string> {
    const systemPrompt = `Tu es un rédacteur professionnel. On te donne le contenu existant d'un document.
Continue la rédaction de manière cohérente et naturelle en HTML riche.
Ne répète PAS le contenu existant — génère UNIQUEMENT la suite.
Conserve le même style, ton et niveau de formalité.
Ne mets pas de balises <html>, <head>, <body>.`;

    const userMsg = instruction
      ? `Contenu existant :\n${existingContent}\n\nInstruction pour la suite :\n${instruction}`
      : `Contenu existant :\n${existingContent}\n\nContinue la rédaction de manière naturelle.`;

    try {
      const response = await this.llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userMsg),
      ]);

      const content = typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

      return this.cleanHtmlResponse(content);
    } catch (error) {
      this.logger.error('Continue writing failed', error);
      throw new Error('Échec de la continuation. Veuillez réessayer.');
    }
  }
}
