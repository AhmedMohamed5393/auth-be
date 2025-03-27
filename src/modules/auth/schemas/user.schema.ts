import { v4 as uuidv4 } from "uuid";
import { Prop, SchemaFactory, Schema } from "@nestjs/mongoose";

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, default: () => uuidv4() })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
