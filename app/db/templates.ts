import { ObjectId } from "mongodb";
import { connectDB } from "./mongodb";

// Interface cho mỗi cặp header-content
export interface Pair {
  header: string;
  content: string;
}

// Interface cho Template document
export interface Template {
  _id?: ObjectId;
  agentId: string;
  templateName: string;
  isDefault: boolean;
  pair: Pair[];
  createdBy?: string; // Email của người tạo/cập nhật template
  updatedAt?: Date;
}

const COLLECTION_NAME = "templates";

// Lấy collection templates
export async function getTemplatesCollection() {
  const db = await connectDB();
  return db.collection<Template>(COLLECTION_NAME);
}

// Tạo template mới
export async function createTemplate(template: Omit<Template, "_id">) {
  const collection = await getTemplatesCollection();
  return collection.insertOne(template);
}

// Lấy tất cả templates
export async function getAllTemplates() {
  const collection = await getTemplatesCollection();
  return collection.find({}).toArray();
}

// Lấy tất cả templates theo agentId
export async function getTemplatesByAgentId(agentId: string) {
  const collection = await getTemplatesCollection();
  return collection.find({ agentId }).toArray();
}

// Lấy template theo ID
export async function getTemplateById(id: string) {
  const collection = await getTemplatesCollection();
  return collection.findOne({ _id: new ObjectId(id) });
}



// Cập nhật template
export async function updateTemplate(id: string, update: Partial<Template>) {
  const collection = await getTemplatesCollection();
  return collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: update }
  );
}

// Xóa template
export async function deleteTemplate(id: string) {
  const collection = await getTemplatesCollection();
  return collection.deleteOne({ _id: new ObjectId(id) });
}

// Set template làm default (và bỏ default của template cũ)
export async function setDefaultTemplate(id: string) {
  const collection = await getTemplatesCollection();
  
  // Bỏ isDefault của template đang default hiện tại
  await collection.updateMany(
    { isDefault: true },
    { $set: { isDefault: false } }
  );
  
  

  // Set isDefault = true cho template được chọn
  return collection.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isDefault: true } }
  );
}