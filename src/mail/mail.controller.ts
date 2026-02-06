import { Controller } from '@nestjs/common';
import { MailService } from './mail.service';
import { Get } from '@nestjs/common';

@Controller('mail')
export class MailController {

     constructor(private readonly mailService: MailService) {}

  @Get()
  async testMail() {
    await this.mailService.sendTestEmail(
      'diavisonoo94@gmail.com',
    );
    return 'Email envoyé avec succès';
  }
}
