import { ObjectId } from "mongodb";
import { connectDB } from "./mongodb";
import { FileDocument } from "../models/file-document";



const COLLECTION_NAME = "files";

// Lấy collection files
export async function getFilesCollection() {
  const db = await connectDB();
  return db.collection<FileDocument>(COLLECTION_NAME);
}

// Tạo file mới
export async function createFile(file: Omit<FileDocument, "_id" | "createdAt">) {
  const collection = await getFilesCollection();
  const fileWithTimestamp = {
    ...file,
    createdAt: new Date()
  };
  return collection.insertOne(fileWithTimestamp);
}

// Lấy tất cả files theo phaseId
export async function getFilesByPhaseId(phaseId: string) {
  const collection = await getFilesCollection();
  return collection.find({ phaseId }).sort({ uploadedAt: -1 }).toArray();
}

// Lấy file theo ID
export async function getFileById(id: string) {
  const collection = await getFilesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}

// Xóa file
export async function deleteFile(id: string) {
  const collection = await getFilesCollection();
  return collection.deleteOne({ _id: new ObjectId(id) });
}

// Xóa tất cả files của một phase
export async function deleteFilesByPhaseId(phaseId: string) {
  const collection = await getFilesCollection();
  return collection.deleteMany({ phaseId });
}

