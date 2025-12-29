import { connectDB } from "./mongodb";
import { MentionDB } from "../models/mentionDB";



const COLLECTION_NAME = "mentions";
export async function getMentionsCollection() {
    const db = await connectDB();
    return db.collection<MentionDB>(COLLECTION_NAME);
}


export async function getAllMentions(){
    const collection = await getMentionsCollection();
    return collection.find({}).toArray();
}


export async function createMention(mention: MentionDB) {
    const collection = await getMentionsCollection();
    return collection.insertOne(mention);
}

export async function getMentionByLabel(label: string) {
    const collection = await getMentionsCollection();
    return collection.findOne({ label });
}


export async function deleteMentionByFileId(fileId: string) {
    const collection = await getMentionsCollection();
    return collection.deleteOne({ fileId });
}

