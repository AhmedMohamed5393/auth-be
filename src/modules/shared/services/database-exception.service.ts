import { InternalServerErrorException } from '@nestjs/common';

export class DatabaseExceptionService {
  constructor(message: string) {
    return new InternalServerErrorException({ message });
  }
}
