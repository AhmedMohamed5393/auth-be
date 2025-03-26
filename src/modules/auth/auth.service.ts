import { Injectable, UnauthorizedException, UnprocessableEntityException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { LoginDto, RegisterDto } from './dto/index.dto';
import { PasswordService } from '@shared/services/password.service';
import { JWTAuthService } from '@shared/services/jwt-auth.service';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly passwordService: PasswordService,
    private readonly jwtAuthService: JWTAuthService,
  ) {}

  public async register(registerDto: RegisterDto): Promise<any> {
    // check the existence of another user with this email
    const user = await this.userModel.findOne({ email: registerDto.email });
    if (user) {
      throw new UnprocessableEntityException('already exists');
    }

    // if not exists then hash the user password during the registration
    const password = await this.passwordService.hashPassword(registerDto.password);

    // create the user
    const newUser = new this.userModel({
      email: registerDto.email,
      name: registerDto.name,
      password: password,
    });
    const createdUser = await newUser.save();

    // generate jwt for registered user
    return await this.getEssentialResponse(createdUser);
  }

  public async login(loginDto: LoginDto): Promise<any> {
    // check existence of user by given email and password
    const user = await this.userModel.findOne({ email: loginDto.email });
    
    const unauthorizedExceptionInstance = new UnauthorizedException('wrong credentials');
    if (!user) {
      throw unauthorizedExceptionInstance;
    }
    const isMatched = await this.passwordService.compareHash(loginDto.password, user.password);
    if (!isMatched) {
      throw unauthorizedExceptionInstance;
    }

    // generate jwt for logging in
    return await this.getEssentialResponse(user);
  }

  private async getEssentialResponse(user: Partial<UserDocument>) {
    const { _id, name, email } = user;
    const token = await this.jwtAuthService.generateToken({ id: _id as string });

    return { _id, email, name, token };
  }
} 
