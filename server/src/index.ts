import { MikroORM } from "@mikro-orm/core";
import { __port__ } from "./constants";
import options from "./mikro-orm.config";
import express from "express";
import { ApolloServer } from "@apollo/server";
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";


import { expressMiddleware } from "@apollo/server/express4";
import { ApolloServerPluginDrainHttpServer } from "@apollo/server/plugin/drainHttpServer";
import http from "http";
import cors from "cors";
import { json } from "body-parser";

const main = async () => {
  const orm = await MikroORM.init(options);
  await orm.getMigrator().up();

  const app = express();
  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver],
      validate: false
    })
  });
  await apolloServer.start();
  app.use(
      "/graphql",
      cors<cors.CorsRequest>(),
      json(),
      expressMiddleware(apolloServer, {
        context: async ({ req }) => ({ token: req.headers.token }),
      }),
    );

  app.listen(__port__, () => {
    console.log(`🚀 server started at http://localhost:${__port__}`);
  });
}

main().catch(err => { console.error(err) });