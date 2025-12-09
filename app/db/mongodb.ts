import dotenv from "dotenv";
dotenv.config();

import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DATABASE!;

const client = new MongoClient(uri);

export async function connectDB(): Promise<Db> {
  await client.connect();
  return client.db(dbName);
}
