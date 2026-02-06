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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MailService = void 0;
const common_1 = require("@nestjs/common");
const mailer_1 = require("@nestjs-modules/mailer");
const config_1 = require("@nestjs/config");
let MailService = class MailService {
    constructor(mailerService, configService) {
        this.mailerService = mailerService;
        this.configService = configService;
        this.frontendUrl = this.configService.get('FRONTEND_URL') || 'http://localhost:3000';
    }
    getEmailTemplate(content, title) {
        return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);">
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 32px 40px; border-radius: 16px 16px 0 0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td>
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">
                      ✨ Crousz
                    </h1>
                    <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                      Gestion de projets collaborative
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 16px 16px; border-top: 1px solid #e2e8f0;">
              <table role="presentation" style="width: 100%;">
                <tr>
                  <td style="text-align: center;">
                    <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px;">
                      Cet email a été envoyé automatiquement par Crousz.
                    </p>
                    <p style="margin: 0; color: #94a3b8; font-size: 12px;">
                      © ${new Date().getFullYear()} Crousz. Tous droits réservés.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
    }
    getButton(text, url) {
        return `
      <a href="${url}" style="display: inline-block; background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 14px; margin-top: 8px; box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);">
        ${text}
      </a>
    `;
    }
    async sendTestEmail(to) {
        await this.mailerService.sendMail({
            to,
            subject: '✅ Test email NestJS',
            html: `
        <h2>Test réussi 🎉</h2>
        <p>Ton application NestJS en local envoie des emails.</p>
        <p><b>Port :</b> localhost:3000</p>
      `,
        });
    }
    async sendGroupMemberAddedEmail(data) {
        const groupUrl = `${this.frontendUrl}/groups/${data.groupId}`;
        const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">👥</span>
        </div>
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px; font-weight: 700;">
          Bienvenue dans le groupe !
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          Vous avez été ajouté(e) à un nouveau groupe
        </p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Groupe</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.groupName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Ajouté par</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px;">${data.addedByName}</p>
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Bonjour <strong>${data.memberName}</strong>,<br><br>
        Vous faites maintenant partie du groupe <strong>${data.groupName}</strong>. 
        Vous pouvez désormais collaborer avec les autres membres, accéder aux projets et participer aux tâches du groupe.
      </p>
      
      <div style="text-align: center;">
        ${this.getButton('Accéder au groupe', groupUrl)}
      </div>
    `;
        await this.mailerService.sendMail({
            to: data.memberEmail,
            subject: `👥 Vous avez été ajouté(e) au groupe "${data.groupName}"`,
            html: this.getEmailTemplate(content, 'Nouveau membre de groupe'),
        });
    }
    async sendTaskAssignedEmail(data) {
        const taskUrl = `${this.frontendUrl}/groups/${data.groupId}/projects/${data.projectId}`;
        const dueDateHtml = data.dueDate
            ? `
        <tr>
          <td style="padding: 8px 0;">
            <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Date d'échéance</span>
            <p style="margin: 4px 0 0 0; color: #ef4444; font-size: 16px; font-weight: 600;">📅 ${data.dueDate}</p>
          </td>
        </tr>
      `
            : '';
        const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">📋</span>
        </div>
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px; font-weight: 700;">
          Nouvelle tâche assignée
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          Une tâche vous a été attribuée
        </p>
      </div>
      
      <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Tâche</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 18px; font-weight: 600;">${data.taskTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Projet</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px;">${data.projectName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Groupe</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px;">${data.groupName}</p>
            </td>
          </tr>
          ${dueDateHtml}
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #64748b; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Assigné par</span>
              <p style="margin: 4px 0 0 0; color: #1e293b; font-size: 16px;">${data.assignedByName}</p>
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Bonjour <strong>${data.assigneeName}</strong>,<br><br>
        <strong>${data.assignedByName}</strong> vous a assigné une nouvelle tâche dans le projet <strong>${data.projectName}</strong>. 
        Connectez-vous pour voir les détails et commencer à travailler dessus.
      </p>
      
      <div style="text-align: center;">
        ${this.getButton('Voir la tâche', taskUrl)}
      </div>
    `;
        await this.mailerService.sendMail({
            to: data.assigneeEmail,
            subject: `📋 Nouvelle tâche : "${data.taskTitle}"`,
            html: this.getEmailTemplate(content, 'Tâche assignée'),
        });
    }
    async sendTaskCompletedEmail(data) {
        const taskUrl = `${this.frontendUrl}/groups/${data.groupId}/projects/${data.projectId}`;
        const content = `
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="width: 80px; height: 80px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 40px;">✅</span>
        </div>
        <h2 style="margin: 0 0 8px 0; color: #1e293b; font-size: 24px; font-weight: 700;">
          Tâche terminée !
        </h2>
        <p style="margin: 0; color: #64748b; font-size: 16px;">
          Une tâche vient d'être complétée
        </p>
      </div>
      
      <div style="background-color: #f0fdf4; border: 1px solid #86efac; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <table role="presentation" style="width: 100%;">
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Tâche complétée</span>
              <p style="margin: 4px 0 0 0; color: #166534; font-size: 18px; font-weight: 600;">✓ ${data.taskTitle}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Projet</span>
              <p style="margin: 4px 0 0 0; color: #166534; font-size: 16px;">${data.projectName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Groupe</span>
              <p style="margin: 4px 0 0 0; color: #166534; font-size: 16px;">${data.groupName}</p>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0;">
              <span style="color: #166534; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Terminée par</span>
              <p style="margin: 4px 0 0 0; color: #166534; font-size: 16px;">🎉 ${data.completedByName}</p>
            </td>
          </tr>
        </table>
      </div>
      
      <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
        Bonjour <strong>${data.recipientName}</strong>,<br><br>
        Bonne nouvelle ! <strong>${data.completedByName}</strong> a terminé la tâche <strong>"${data.taskTitle}"</strong> 
        dans le projet <strong>${data.projectName}</strong>. 
        L'équipe avance bien ! 🚀
      </p>
      
      <div style="text-align: center;">
        ${this.getButton('Voir le projet', taskUrl)}
      </div>
    `;
        await this.mailerService.sendMail({
            to: data.recipientEmail,
            subject: `✅ Tâche terminée : "${data.taskTitle}"`,
            html: this.getEmailTemplate(content, 'Tâche terminée'),
        });
    }
};
exports.MailService = MailService;
exports.MailService = MailService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService,
        config_1.ConfigService])
], MailService);
//# sourceMappingURL=mail.service.js.map