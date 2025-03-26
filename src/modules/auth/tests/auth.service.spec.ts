import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { PasswordService } from '@shared/services/password.service';
import { JWTAuthService } from '@shared/services/jwt-auth.service';
import { RegisterDto, LoginDto } from '../dto/index.dto';
import { UserDocument } from '../schemas/user.schema';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';

describe('AuthService', () => {
    let authService: AuthService;
    let userModel:  Model<UserDocument>;
    let passwordService: PasswordService;
    let jwtAuthService: JWTAuthService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
        providers: [
            AuthService,
            {
              provide: getModelToken('User'),
              useValue: {
                save: jest.fn(),
                findOne: jest.fn(),
              },
            },
            {
              provide: PasswordService,
              useValue: {
                  hashPassword: jest.fn(),
                  compareHash: jest.fn(),
              },
            },
            {
              provide: JWTAuthService,
              useValue: {
                  generateToken: jest.fn(),
              },
            },
        ],
        }).compile();

        authService = module.get<AuthService>(AuthService);
        userModel = module.get<Model<UserDocument>>(Model<UserDocument>);
        passwordService = module.get<PasswordService>(PasswordService);
        jwtAuthService = module.get<JWTAuthService>(JWTAuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('register', () => {
        it('should register a new user successfully', async () => {
            const registerDto: RegisterDto = {
                email: 'test@example.com',
                password: 'Password123!',
                name: 'test user',
            };
            
            const hashedPassword = 'hashedPassword123';
            const token = 'generatedToken';

            const newUser = new userModel({
              email: registerDto.email,
              name: registerDto.name,
              password: hashedPassword,
            });
            
            jest.spyOn(userModel, 'findOne').mockResolvedValue(false);
            jest.spyOn(passwordService, 'hashPassword').mockResolvedValue(hashedPassword);
            jest.spyOn(jwtAuthService, 'generateToken').mockResolvedValue(token);
            
            const result = await authService.register(registerDto);
            
            expect(userModel.findOne).toHaveBeenCalledWith({ email: registerDto.email });
            expect(passwordService.hashPassword).toHaveBeenCalledWith(registerDto.password);
            expect(newUser.save).toHaveBeenCalled();

            expect(jwtAuthService.generateToken).toHaveBeenCalledWith({ id: newUser._id });
            expect(result).toEqual({
                _id: "61e44e48a0f61c5246ab1727",
                email: newUser.email,
                name: newUser.name,
                token: token,
            });
        });

        it('should throw UnprocessableEntityException if email already exists', async () => {
            const registerDto: RegisterDto = {
              email: 'test@example.com',
              password: 'Password123!',
              name: 'test user',
            };
          
            jest.spyOn(userModel, 'findOne').mockResolvedValue(true);
          
            await expect(authService.register(registerDto)).rejects.toThrow(UnprocessableEntityException);
        });
    });

    describe('login', () => {
        it('should login a user successfully', async () => {
            const loginDto: LoginDto = {
              email: 'test@example.com',
              password: 'Password123!',
            };
          
            const user = {
              _id: "61e44e48a0f61c5246ab1727",
              email: loginDto.email,
              password: 'hashedPassword123',
              name: 'test user',
            };
          
            const token = 'generatedToken';
          
            jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
            jest.spyOn(passwordService, 'compareHash').mockResolvedValue(true);
            jest.spyOn(jwtAuthService, 'generateToken').mockResolvedValue(token);
          
            const result = await authService.login(loginDto);
          
            expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
            expect(passwordService.compareHash).toHaveBeenCalledWith(loginDto.password, user.password);
            expect(jwtAuthService.generateToken).toHaveBeenCalledWith({ id: user._id });
            expect(result).toEqual({
              _id: user._id,
              email: user.email,
              name: user.name,
              token: token,
            });
        });

        it('should throw UnauthorizedException if user is not found', async () => {
            const loginDto: LoginDto = {
              email: 'test@example.com',
              password: 'Password123!',
            };
          
            jest.spyOn(userModel, 'findOne').mockResolvedValue(null);
          
            await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });

        it('should throw UnauthorizedException if password is incorrect', async () => {
            const loginDto: LoginDto = {
              email: 'test@example.com',
              password: 'WrongPassword123!',
            };
          
            const user = {
              _id: '61e44e48a0f61c5246ab1727',
              email: loginDto.email,
              password: 'hashedPassword123',
              name: 'test user',
            };
          
            jest.spyOn(userModel, 'findOne').mockResolvedValue(user);
            jest.spyOn(passwordService, 'compareHash').mockResolvedValue(false);
          
            await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);
        });
    });
});
