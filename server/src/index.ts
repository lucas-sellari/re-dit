import { MikroORM } from "@mikro-orm/core";
import options from "./mikro-orm.config";

import { Post } from "./entities/Post";

const main = async () => {
  const orm = await MikroORM.init(options);
  await orm.getMigrator().up();

  // const post = orm.em.create(Post, { title: "my first post!" });
  // await orm.em.persistAndFlush(post);

  // const myPost = await orm.em.find(Post,  {});
  // console.log(myPost)
}

main().catch(err => { console.error(err) });