import { Post } from "./entities/Post";
import { __prod__ } from "./constants";
import { Options } from "@mikro-orm/core";
import path from "path";
import * as dotenv from "dotenv";
dotenv.config();

const options: Options = {
  entities: [Post],
  migrations: {
    path: path.join(__dirname, "./migrations"),
    glob: "!(*.d).{js,ts}",
    disableForeignKeys: false // wrap statements with `set foreign_key_checks = 0` or equivalent
  },
  dbName: "reddit",
  type: "postgresql",
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  debug: !__prod__,
  logger: console.log.bind(console),
  allowGlobalContext: true,
};

export default options;