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
var AiDocumentService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiDocumentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const openai_1 = require("@langchain/openai");
const messages_1 = require("@langchain/core/messages");
let AiDocumentService = AiDocumentService_1 = class AiDocumentService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(AiDocumentService_1.name);
        this.llm = new openai_1.ChatOpenAI({
            openAIApiKey: this.configService.get('OPENAI_API_KEY'),
            modelName: this.configService.get('OPENAI_MODEL') || 'gpt-4.1',
            temperature: 0.5,
            maxTokens: 16000,
        });
    }
    async generateDocument(prompt, context) {
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
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userPrompt),
            ]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            return this.cleanHtmlResponse(content);
        }
        catch (error) {
            this.logger.error('Document generation failed', error);
            throw new Error('Échec de la génération du document. Veuillez réessayer.');
        }
    }
    cleanHtmlResponse(raw) {
        let html = raw.trim();
        html = html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
        html = html.replace(/<li>\s*<\/li>/gi, '');
        html = html.replace(/<li>\s*<p>(.*?)<\/p>\s*<\/li>/gi, '<li>$1</li>');
        return html.trim();
    }
    async rewriteText(text, instruction) {
        const systemPrompt = `Tu es un assistant de rédaction expert. On te donne un texte et une instruction de modification.
Applique l'instruction au texte et retourne UNIQUEMENT le texte modifié en HTML riche.
Ne mets pas de balises <html>, <head>, <body>. Retourne uniquement le contenu HTML modifié.
Conserve la structure HTML existante (titres, listes, tableaux) et améliore-la si nécessaire.`;
        try {
            const response = await this.llm.invoke([
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(`Texte original :\n${text}\n\nInstruction :\n${instruction}`),
            ]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            return this.cleanHtmlResponse(content);
        }
        catch (error) {
            this.logger.error('Text rewrite failed', error);
            throw new Error('Échec de la réécriture. Veuillez réessayer.');
        }
    }
    async continueWriting(existingContent, instruction) {
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
                new messages_1.SystemMessage(systemPrompt),
                new messages_1.HumanMessage(userMsg),
            ]);
            const content = typeof response.content === 'string'
                ? response.content
                : JSON.stringify(response.content);
            return this.cleanHtmlResponse(content);
        }
        catch (error) {
            this.logger.error('Continue writing failed', error);
            throw new Error('Échec de la continuation. Veuillez réessayer.');
        }
    }
};
exports.AiDocumentService = AiDocumentService;
exports.AiDocumentService = AiDocumentService = AiDocumentService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AiDocumentService);
//# sourceMappingURL=ai-document.service.js.map