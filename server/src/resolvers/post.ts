import { Resolver, Query, Ctx, Arg, Int, Mutation } from "type-graphql";
import { Post } from "../entities/Post";
import { MyContext } from "../types";

@Resolver()
export class PostResolver  {
  @Query(returns => [Post])
  posts(
    @Ctx() { em }: MyContext
  ): Promise<Post[]> {
    return em.find(Post, {});
  }

  @Query(returns  => Post, { nullable: true })
  post(
    @Arg("id", type => Int, { nullable: false }) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Post|null> {
    return em.findOne(Post, {
      id: id
    });
  }

  @Mutation(returns  => Post)
  async createPost(
    @Arg("title", type => String, { nullable: false }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post> {
    const post = em.create(Post, { title: title });
    await em.persistAndFlush(post);
    return post;
  }

  @Mutation(returns  => Post, { nullable: true })
  async updatePost(
    @Arg("id", type => Int, { nullable: false }) id: number,
    @Arg("title", type => String, { nullable: true }) title: string,
    @Ctx() { em }: MyContext
  ): Promise<Post|null> {
    const post = await em.findOne(Post, { id: id });
    if (!post) return null;
    if (typeof title != "undefined") {
      post.title = title;
      await em.persistAndFlush(post);
    }
    return post;
  }

  @Mutation(returns  => Boolean)
  async deletePost(
    @Arg("id", type => Int, { nullable: false }) id: number,
    @Ctx() { em }: MyContext
  ): Promise<Boolean> {
    try {
      await em.nativeDelete(Post, { id: id });
      return true;
    } catch {
      return false
    }
  }
}