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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiController = void 0;
const common_1 = require("@nestjs/common");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const ai_service_1 = require("./ai.service");
const ai_report_service_1 = require("./ai-report.service");
const ai_document_service_1 = require("./ai-document.service");
const generate_project_dto_1 = require("./dto/generate-project.dto");
let AiController = class AiController {
    constructor(aiService, aiReportService, aiDocumentService) {
        this.aiService = aiService;
        this.aiReportService = aiReportService;
        this.aiDocumentService = aiDocumentService;
    }
    async generateProject(dto, user) {
        return this.aiService.generateProject(dto.prompt, dto.groupId, user.id);
    }
    async generateGroupReport(groupId) {
        return this.aiReportService.generateGroupReport(groupId);
    }
    async generateProjectReport(projectId) {
        return this.aiReportService.generateProjectReport(projectId);
    }
    async generateDocument(body) {
        const html = await this.aiDocumentService.generateDocument(body.prompt, body.context);
        return { html };
    }
    async rewriteText(body) {
        const html = await this.aiDocumentService.rewriteText(body.text, body.instruction);
        return { html };
    }
    async continueWriting(body) {
        const html = await this.aiDocumentService.continueWriting(body.content, body.instruction);
        return { html };
    }
};
exports.AiController = AiController;
__decorate([
    (0, common_1.Post)('generate-project'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [generate_project_dto_1.GenerateProjectDto, Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateProject", null);
__decorate([
    (0, common_1.Get)('report/group/:groupId'),
    __param(0, (0, common_1.Param)('groupId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateGroupReport", null);
__decorate([
    (0, common_1.Get)('report/project/:projectId'),
    __param(0, (0, common_1.Param)('projectId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateProjectReport", null);
__decorate([
    (0, common_1.Post)('document/generate'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "generateDocument", null);
__decorate([
    (0, common_1.Post)('document/rewrite'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "rewriteText", null);
__decorate([
    (0, common_1.Post)('document/continue'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AiController.prototype, "continueWriting", null);
exports.AiController = AiController = __decorate([
    (0, common_1.Controller)('ai'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [ai_service_1.AiService,
        ai_report_service_1.AiReportService,
        ai_document_service_1.AiDocumentService])
], AiController);
//# sourceMappingURL=ai.controller.js.map