import { Controller, Get, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';
import { MobileService } from './mobile.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('Mobile')
@Controller('mobile')
export class MobileController {
  constructor(private readonly mobileService: MobileService) {}

  @Public()
  @Get('apk')
  @ApiOperation({ summary: 'Télécharger l\'APK Android' })
  async downloadApk(@Res() res: Response) {
    const { exists, path, message } = this.mobileService.getApkPath();
    if (!exists) {
      return res.status(404).json({
        success: false,
        message,
      });
    }
    return res.download(path!, 'MegaSupervision-v1.0.0.apk');
  }

  @Public()
  @Get('version')
  @ApiOperation({ summary: 'Vérifier la dernière version mobile' })
  getVersion() {
    return this.mobileService.getVersion();
  }
}
