import { Resolver, Query, Ctx, Arg, Int, Mutation, InputType, Field, ObjectType } from "type-graphql";
import { User } from "../entities/User";
import { MyContext } from "../types";
import argon2 from "argon2";

@InputType()
class UsernamePasswordInput {
  @Field(type => String)
  username!: string;

  @Field(type => String)
  password!: string;
}

@ObjectType()
class FieldError {
  @Field(type => String)
  field!: string;

  @Field(type => String)
  message!: string;
}

@ObjectType()
class UserResponse {
  @Field(type => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(type => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver  {
  @Mutation(returns => UserResponse)
  async register(
    @Arg("options", type => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    // little validation
    if (options.username.length <= 2) return {
      errors: [{
        field: "username",
        message: "the username must be at least 3 characters long"
      }]
    };
    if (options.password.length <= 3) return {
      errors: [{
        field: "password",
        message: "the password must be at least 4 characters long"
      }]
    };
    const hashedPassword = await argon2.hash(options.password);
    const user = em.create(User, { username: options.username, password: hashedPassword });
    try {
      await em.persistAndFlush(user);
    } catch (error: any) {
      if (error.code == "23505") return {
        errors: [{
          field: "username",
          message: "username already exists"
        }]
      };
      console.error(error);
    }
    return { user };
  }

  @Mutation(returns => UserResponse)
  async login(
    @Arg("options", type => UsernamePasswordInput) options: UsernamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const user = await em.findOne(User, { username: options.username });
    if (!user) return {
      errors: [{
        field: "username",
        message: "the username does not exist"
      }]
    };
    const valid = await argon2.verify(user.password, options.password);
    if (!valid) return {
      errors: [{
        field: "password",
        message: "incorrect password"
      }]
    };
    return { user };
  }
}