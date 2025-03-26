import { Test, TestingModule } from '@nestjs/testing';
import {
    ExecutionContext,
    INestApplication,
    UnauthorizedException,
    UnprocessableEntityException,
} from '@nestjs/common';
import * as request from 'supertest';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@shared/guards/auth.guard';
import { AuthController } from '../auth.controller';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;

  const mockAuthService = {
    register: jest.fn(),
    login: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
        Reflector,
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = { id: '61e44e48a0f61c5246ab1727', email: 'test@example.com' }; // Simulate authenticated user
          return true;
        },
      })
      .compile();

    app = module.createNestApplication();
    await app.init();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/signup', () => {
    it('should register a new user and return a success response', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'test user',
      };

      const mockResponse = {
        _id: "61e44e48a0f61c5246ab1727",
        email: registerDto.email,
        name: registerDto.name,
        token: 'generatedToken',
      };

      jest.spyOn(authService, 'register').mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(registerDto)
        .expect(201);

      expect(response.body).toEqual({
        data: mockResponse,
        message: 'user is registered successfully',
        status: true,
      });
    });

    it('should return 422 if email already exists', async () => {
      const registerDto: RegisterDto = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'test user',
      };

      jest
        .spyOn(authService, 'register')
        .mockRejectedValue(new UnprocessableEntityException('already exists'));

      const response = await request(app.getHttpServer())
        .post('/auth/signup')
        .send(registerDto)
        .expect(422);

      expect(response.body.message).toBe('already exists');
    });
  });

  describe('POST /auth/login', () => {
    it('should login a user and return a success response', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'Password123!',
      };

      const mockResponse = {
        _id: '61e44e48a0f61c5246ab1727',
        email: loginDto.email,
        name: 'test user',
        token: 'generatedToken',
      };

      jest.spyOn(authService, 'login').mockResolvedValue(mockResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(201);

      expect(response.body).toEqual({
        data: mockResponse,
        message: 'user is logged in successfully',
        status: true,
      });
    });

    it('should return 401 if credentials are invalid', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      jest
        .spyOn(authService, 'login')
        .mockRejectedValue(new UnauthorizedException('wrong credentials'));

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toBe('wrong credentials');
    });
  });

  describe('GET /auth/logout', () => {
    it('should logout a user and return a success response', async () => {
      const response = await request(app.getHttpServer())
        .get('/auth/logout')
        .expect(200);

      expect(response.body.message).toEqual('user is logged out successfully');
    });
  });
});
