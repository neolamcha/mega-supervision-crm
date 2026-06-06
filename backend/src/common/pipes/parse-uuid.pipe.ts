import {
  PipeTransform,
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { isUUID } from 'class-validator';

@Injectable()
export class ParseUUIDPipe implements PipeTransform<string> {
  transform(value: string): string {
    if (!value || !isUUID(value)) {
      throw new BadRequestException(
        `Paramètre invalide: "${value}" n'est pas un UUID valide`,
      );
    }
    return value;
  }
}
