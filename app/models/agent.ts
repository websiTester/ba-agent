import { ObjectId } from "mongodb";

export interface Agent {
    _id?: ObjectId;
    agentName: string;
    instructions: string;
}
