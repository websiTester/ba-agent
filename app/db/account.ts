import { ObjectId } from "mongodb";
import { connectDB } from "./mongodb";
import { Account } from "../models/account";



const COLLECTION_NAME = "accounts";
export async function getAccountsCollection() {
    const db = await connectDB();
    return db.collection<Account>(COLLECTION_NAME);
}


export async function createAccount(account: Account) {
    const collection = await getAccountsCollection();
    return collection.insertOne(account);
}

export async function getAccountByEmail(email: string) {
    const collection = await getAccountsCollection();
    return collection.findOne({ email });
}