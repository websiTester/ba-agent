// import { X, Save } from "lucide-react"


// interface TableModalProbs {
//     setIsModalOpen: any;

// }

// export default function TableModal({ setIsModalOpen }: TableModalProbs) {
//     return (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
//             <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
//                 <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
//                     <h3 className="font-bold text-gray-800">Add New Requirement</h3>
//                     <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
//                         <X size={20} />
//                     </button>
//                 </div>

//                 <div className="p-6 space-y-4">
//                     <div>
//                         <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Requirement Name <span className="text-red-500">*</span></label>
//                         <input
//                             type="text"
//                             value={newItem.name}
//                             onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
//                             placeholder="Ví dụ: Đăng nhập hệ thống"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Rationale (Tại sao cần?)</label>
//                         <input
//                             type="text"
//                             value={newItem.rationale}
//                             onChange={(e) => setNewItem({ ...newItem, rationale: e.target.value })}
//                             className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm"
//                             placeholder="Ví dụ: Để xác thực danh tính người dùng"
//                         />
//                     </div>

//                     <div>
//                         <label className="block text-xs font-semibold text-gray-600 uppercase mb-1.5">Detailed Description <span className="text-red-500">*</span></label>
//                         <textarea
//                             value={newItem.description}
//                             onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
//                             className="w-full h-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none text-sm resize-none"
//                             placeholder="Mô tả chi tiết luồng nghiệp vụ..."
//                         />
//                     </div>
//                 </div>

//                 <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
//                     <button
//                         onClick={() => setIsModalOpen(false)}
//                         className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
//                     >
//                         Hủy bỏ
//                     </button>
//                     <button
//                         onClick={handleAddItem}
//                         disabled={!newItem.name || !newItem.description}
//                         className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
//                     >
//                         <Save size={16} /> Lưu lại
//                     </button>
//                 </div>
//             </div>
//         </div>
//     )

// }