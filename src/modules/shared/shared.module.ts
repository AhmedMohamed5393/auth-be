import { Global, Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JWTAuthService } from './services/jwt-auth.service';
import { PasswordService } from './services/password.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../auth/schemas/user.schema';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRE_IN');
        return {
          secret: jwtSecret,
          signOptions: { expiresIn },
        };
      },
    }),
    ConfigModule.forRoot(), // Loads environment variables
    MongooseModule.forRoot(process.env.DATABASE_URL),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  exports: [
    JWTAuthService,
    PasswordService,
  ],
  providers: [
    JWTAuthService,
    JwtService,
    PasswordService,
  ],
})
export class SharedModule {}
