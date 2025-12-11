import { ObjectId } from "mongodb";

export interface Account{
    _id?: ObjectId;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
}