import { MikroORM } from "@mikro-orm/core";
import { __port__, __prod__ } from "./constants";
import options from "./mikro-orm.config";
import express from "express";
import * as dotenv from "dotenv";
import { ApolloServer } from "@apollo/server";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import { MyContext } from "./types";

import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import { ApolloServerPluginLandingPageGraphQLPlayground } from "@apollo/server-plugin-landing-page-graphql-playground";
import { ApolloServerPluginLandingPageDisabled } from "@apollo/server/plugin/disabled";
import http from "http";
import cors from "cors";
import { json } from "body-parser";

import session from "express-session";
import { createClient } from "redis";
import connectRedis from "connect-redis";

const main = async () => {
  dotenv.config();
  const orm = await MikroORM.init(options);
  await orm.getMigrator().up();

  const app = express();

  const redisClient = createClient({
    legacyMode: true,
    socket: {
      port: Number(process.env.REDIS_PORT),
      host: process.env.REDIS_HOST
    }
  });
  await redisClient.connect();
  const RedisStore = connectRedis(session);

  app.use(
    session({
      name: "cookie_id",
      store: new RedisStore({ client: redisClient, disableTouch: true, disableTTL: true }),
      cookie: {
        maxAge: 3600000 * 24 * 3650, // 10 years to expire
        httpOnly: true, // client's JS wont be able to access the cookie
        secure: __prod__, // cookie only works under HTTPS
        sameSite: "lax" // better protection against CSRF attacks
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET as string,
      resave: false,
    })
  );

  const httpServer = http.createServer(app);
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false
    }),
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
      __prod__
        ? ApolloServerPluginLandingPageDisabled()
        : ApolloServerPluginLandingPageGraphQLPlayground(),
    ],
  });
  await apolloServer.start();

  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req, res }): Promise<MyContext> => ({
        em: orm.em, req, res
      }),
    }),
  );

  app.listen(__port__, () => {
    console.log(`🚀 server started at http://localhost:${__port__}`);
  });
}

main().catch(err => { console.error(err) });