import { ObjectId } from "mongodb";

export interface MentionDB {
    _id?: ObjectId;
    label: string;
    description: string;
    type: string;
    fileId?: string;
    phaseId?: string;
    toolId?: string;
    
}