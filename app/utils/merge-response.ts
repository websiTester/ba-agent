// --- HÀM XỬ LÝ ---
export function mergeData(oldList: any, newList:any) {

  
  console.log(`Old response: ${oldList.length}`);
  console.log(`New response: ${newList.length}`);
  // 1. Tạo Map từ dữ liệu cũ để truy xuất nhanh theo agent_source
  // Map sẽ có dạng: { 1 => {object_1}, 2 => {object_2} }
  const dataMap = new Map(oldList.map((item:any) => [item.agent_source, item]));

  // 2. Duyệt qua dữ liệu mới
  newList.forEach((newItem:any) => {
    // Nếu agent_source đã tồn tại -> Lấy cái cũ merge với cái mới (cái mới đè lên)
    // Nếu agent_source chưa tồn tại -> Thêm mới luôn
    const existingItem = dataMap.get(newItem.agent_source) || {};
    
    dataMap.set(newItem.agent_source, { ...existingItem, ...newItem });
  });

  // 3. Chuyển Map ngược lại thành Array
  return Array.from(dataMap.values());
}