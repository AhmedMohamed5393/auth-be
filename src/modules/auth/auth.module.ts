import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SharedModule } from '@shared/shared.module';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    SharedModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
