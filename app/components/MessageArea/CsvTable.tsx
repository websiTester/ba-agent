/**
 * CsvTable Component
 * 
 * Component hiển thị dữ liệu dạng bảng sử dụng AG Grid Community Edition
 * 
 * @description
 * Hỗ trợ 2 format dữ liệu đầu vào:
 * 1. Array of objects (format mới) - Dữ liệu đã được parse sẵn từ backend
 *    Example: [{id: 'temp_1', type: 'FR', name: '...', _action: 'create'}, ...]
 * 
 * 2. CSV string (format cũ - legacy) - Cần parse bằng PapaParse
 *    Example: "id,type,name\ntemp_1,FR,Test\n..."
 * 
 * @features
 * - Editable cells (trừ ID và Section columns)
 * - Action menu dropdown cho requirement analysis (Generate Questions, etc.)
 * - Auto-height rows với text wrapping
 * - Pagination (10 rows per page)
 * - Sort & Filter capabilities
 * - Responsive column sizing
 * 
 * @author BA Agent Team
 * @version 2.0
 */

'use client';

import React, { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { AgGridReact } from 'ag-grid-react';

// AG Grid imports
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { ActionMenuRenderer } from './ActionMenu';
import { useAppState } from '@/app/store';
import DeleteAlert from './DeleteAlert';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

/**
 * CsvTable Component
 * 
 * Component hiển thị dữ liệu dạng bảng sử dụng AG Grid
 * Hỗ trợ 2 format dữ liệu:
 * 1. Array of objects (format mới)
 * 2. CSV string (format cũ - legacy)
 * 
 * Features:
 * - Editable cells (trừ ID và Section columns)
 * - Action menu cho requirement analysis
 * - Auto-height rows với text wrapping
 * - Pagination
 * - Sort & Filter
 */

interface RequirementRow {
  [key: string]: string;
}

interface CsvTableProps {
  aiResponse: any;                                              // Response từ AI agent
  onDataChange?: (updatedData: any[]) => void;                 // Callback khi data thay đổi
  onTriggerAction?: (action: string, rowData: RequirementRow) => void; // Callback cho actions
}

export default forwardRef(function CsvTable({ aiResponse, onDataChange }: CsvTableProps, ref) {

  // ============================================================
  // STATE MANAGEMENT
  // ============================================================
  const [rowData, setRowData] = useState<RequirementRow[]>([]); // Dữ liệu hiển thị trong grid
  const [colDefs, setColDefs] = useState<any[]>([]);            // Định nghĩa các columns
  const [showDeleteAlert, setShowDeleteAlert] = useState(false); // State cho delete alert
  const [rowToDelete, setRowToDelete] = useState<RequirementRow | null>(null); // Row cần xóa
  
  // Global state từ Zustand store
  const setIsOpenPromptModal = useAppState(state => state.setIsOpenPromptModal);
  const setInitialContextData = useAppState(state => state.setInitialContextData);
  const setTemplateId = useAppState(state => state.setTemplateId);

  // ============================================================
  // HELPER FUNCTIONS
  // ============================================================
  /**
   * Generate markdown content from table data
   * Converts rows to a formatted markdown table
   */
  const generateMarkdownFromData = (rows: RequirementRow[]): string => {
    if (!rows || rows.length === 0) return '';

    // Get all column headers (exclude internal fields starting with _)
    const headers = Object.keys(rows[0]).filter(key => !key.startsWith('_'));
    
    // Create markdown table header
    let markdown = `
**Role:** Act as a Senior Frontend Architect and Expert UI/UX Designer.

**Context:**I have a list of Functional Requirements (provided below). I need you to establish the project foundation, folder structure, and the main UI Shell (Home Page).

**Tech Stack:**
- Framework: Next.js 15 (App Router).
- Language: TypeScript.
- Styling: Tailwind CSS.
- Icons: Lucide React.
- UI Components: Use a style similar to Shadcn/UI (Radix UI primitives).
- State Management: React Context or Zustand (if necessary).

**Task 1: Project Architecture & Folder Structure**
Analyze the provided Functional Requirements to identify the core "Domains" or "Features" of the application.
- Propose a detailed **Feature-based** or **Domain-driven** folder structure within the \`src/\` directory.
- **Requirement:** Instead of grouping by file type (e.g., all components in one folder), group by feature (e.g., \`src/components/features/auth\`, \`src/components/features/dashboard\`, \`src/components/features/orders\`).
- Briefly explain the rationale behind your structure based on the specific requirements.

**Task 2: UI Shell & Home Page Implementation**
Generate the code for the App Shell (Layout) and the Home Page (\`page.tsx\`).
The UI must include:
1.  **Sidebar (Left):**
    - Logo and App Name.
    - Navigation Menu: The links must correspond to the functional modules you identified in the Requirements.
    - Responsive design (collapsible on mobile/desktop).
2.  **Header (Top):**
    - Search bar.
    - User Profile (Avatar/Name).
    - Notification bell or Theme toggle.
3.  **Footer (Bottom):**
    - Copyright and secondary links.
4.  **Main Content (Home Page):**
    - Create a **Summary Dashboard**.
    - Display distinct Cards/Widgets showing key metrics or quick actions relevant to the Requirements (e.g., "Recent Activity," "Pending Tasks," or specific domain stats).

**Coding Guidelines:**
- **Architecture:** Use Next.js App Router conventions. Implement the Sidebar, Header, and Footer in a root \`layout.tsx\` file so they persist across navigation.
- **Modularity:** Separate components into distinct files (e.g., \`Sidebar.tsx\`, \`Header.tsx\`) and import them.
- **Data:** Use **Mock Data** (const variables) to ensure the UI renders with realistic content immediately.
- **Styling:** Use Tailwind CSS for a modern, clean, and professional look (consistent spacing, rounded corners, subtle shadows).

---
**INPUT DATA (FUNCTIONAL REQUIREMENTS):**
    `;
    markdown += '\n\n';
    markdown += '## Requirements Table\n\n';
    
    // Add table headers
    markdown += '| ' + headers.join(' | ') + ' |\n';
    markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';
    
    // Add table rows
    rows.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] || '';
        // Escape pipe characters and newlines in cell content
        return String(value).replace(/\|/g, '\\|').replace(/\n/g, '<br>');
      });
      markdown += '| ' + values.join(' | ') + ' |\n';
    });
    
    return markdown;
  };

  // ============================================================
  // EXPOSE METHODS VIA REF
  // ============================================================
  useImperativeHandle(ref, () => ({
    addNewRow: () => {
      if (rowData.length === 0) return;
      
      // Create new empty row based on first row structure
      const firstRow = rowData[0];
      const newRow: RequirementRow = {};
      
      // Copy all keys from first row and set empty values
      Object.keys(firstRow).forEach(key => {
        if (!key.startsWith('_')) {
          if (key.toLowerCase() === 'id') {
            // Generate unique ID for new row
            newRow[key] = `new_${Date.now()}`;
          } else {
            newRow[key] = '';
          }
        }
      });
      
      // Add new row at the beginning
      const updatedRows = [newRow, ...rowData];
      setRowData(updatedRows);
      
      // Notify parent component
      if (onDataChange) {
        onDataChange(updatedRows);
      }
    },
    // Expose getRowData method to get current table data
    getRowData: () => {
      return rowData;
    }
  }));

  // ============================================================
  // GRID CONFIGURATION
  // ============================================================
  /**
   * Default column definition - áp dụng cho tất cả columns
   * Có thể override bằng cấu hình riêng cho từng column
   */
  const defaultColDef = useMemo(() => {
    return {
      editable: true,        // Cho phép edit cells
      filter: true,          // Bật filter
      sortable: true,        // Cho phép sort
      resizable: true,       // Cho phép resize column width
      flex: 1,               // Tự động điều chỉnh width
      wrapText: true,        // Wrap text trong cell
      autoHeight: true,      // Tự động điều chỉnh height theo content
      cellDataType: 'text',  // Kiểu dữ liệu mặc định
      cellStyle: {
        lineHeight: '1.4',
        paddingTop: '8px',
        paddingBottom: '8px',
        wordBreak: 'normal'
      }
    };
  }, []);

  // ============================================================
  // EVENT HANDLERS
  // ============================================================
  /**
   * Handler khi user trigger action từ action menu
   * Mở prompt modal với context data và template ID
   */
  const onTriggerAction = (action: string, rowData: RequirementRow) => {
    console.log('Action triggered:', action);
    setIsOpenPromptModal(true);        // Mở modal
    setInitialContextData(rowData);    // Set context data (row data)
    setTemplateId(action);             // Set template ID (action type)
  }

  /**
   * Cell Renderer cho nút Delete
   * Hiển thị nút X với UI chuyên nghiệp, subtle và elegant
   */
  const DeleteButtonRenderer = (props: any) => {
    const handleDelete = () => {
      // Mở custom delete alert thay vì window.confirm
      setRowToDelete(props.data);
      setShowDeleteAlert(true);
    };

    return (
      <div className="w-full h-full flex items-center justify-center">
        <button
          onClick={handleDelete}
          className="group relative w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-red-200"
          title="Delete row"
          aria-label="Delete row"
        >
          {/* X Icon với animation */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-transform duration-200 group-hover:scale-110"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
    );
  };

  /**
   * Handler để xác nhận xóa row
   * Được gọi khi user confirm trong DeleteAlert
   */
  const handleConfirmDelete = () => {
    if (rowToDelete) {
      const updatedRows = rowData.filter((row: RequirementRow) => row !== rowToDelete);
      setRowData(updatedRows);
      
      // Notify parent component
      if (onDataChange) {
        onDataChange(updatedRows);
      }

      // Reset state
      setRowToDelete(null);
    }
  };

  /**
   * Handler để hủy xóa
   */
  const handleCancelDelete = () => {
    setShowDeleteAlert(false);
    setRowToDelete(null);
  };


  /**
   * Effect hook để xử lý và hiển thị dữ liệu từ AI response
   * Hỗ trợ 2 format:
   * 1. Array of objects (format mới) - data đã được parse sẵn
   * 2. CSV string (format cũ) - cần parse bằng PapaParse
   */
  useEffect(() => {
    if (aiResponse && aiResponse.data) {
      
      // ============================================================
      // CASE 1: XỬ LÝ ARRAY OF OBJECTS (FORMAT MỚI)
      // ============================================================
      // Data format: [{id: 'temp_1', type: 'FR', name: '...', _action: 'create'}, ...]
      if (Array.isArray(aiResponse.data)) {
        const rows = aiResponse.data as RequirementRow[];
        
        if (rows.length > 0) {
          const firstRow = rows[0];

          // --- 1. TẠO CÁC CỘT DỮ LIỆU TỰ ĐỘNG ---
          // Lấy tất cả keys từ object đầu tiên để tạo columns
          // Filter out các field internal (bắt đầu bằng '_' như _action, _id, etc.)
          const dataColumns = Object.keys(firstRow)
            .filter(key => !key.startsWith('_')) // Loại bỏ internal fields
            .map((key) => {
              
              
              const isLongText = key.toLowerCase().includes('description') || 
                                 key.toLowerCase().includes('rationale');
              //editable: !isIdCol
              return {
                field: key,
                headerName: key.charAt(0).toUpperCase() + key.slice(1), // Capitalize first letter
                editable: true,   // ID column không cho edit
                // Long text columns sử dụng large text editor với popup
                cellEditor: isLongText ? 'agLargeTextCellEditor' : 'agTextCellEditor',
                cellEditorPopup: isLongText, // Hiển thị popup cho long text
                minWidth: isLongText ? 250 : 100,
                flex: isLongText ? 1.5 : 1, // Long text columns rộng hơn
              };
            });

          // --- 2. THÊM CỘT DELETE ---
          // Cột delete với nút X để xóa row - subtle và professional
          // Áp dụng cho tất cả các loại agent
          const deleteColumn = {
            headerName: '',
            field: 'delete',
            editable: false,
            sortable: false,
            filter: false,
            pinned: 'right',      // Ghim bên phải
            width: 45,            // Độ rộng compact
            minWidth: 45,
            maxWidth: 50,
            flex: 0,
            cellRenderer: DeleteButtonRenderer, // Custom renderer cho nút delete
            cellStyle: {
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              backgroundColor: '#fafafa', // Subtle background để phân biệt
              borderLeft: '1px solid #f0f0f0' // Subtle border
            },
            headerClass: 'delete-column-header'
          };

          // --- 3. THÊM CỘT ACTION (CHỈ CHO REQUIREMENT ANALYSIS) ---
          // Cột action chứa menu dropdown với các actions như "Generate Questions", etc.
          if (aiResponse.agent_source == 'requirement_analysis') {
            const actionColumn = {
              headerName: '',
              field: 'actions',
              editable: false,
              sortable: false,
              filter: false,
              pinned: 'left',       // Ghim bên trái, trước cột Section
              width: 50,            // Độ rộng compact cho icon menu
              minWidth: 50,
              maxWidth: 60,
              flex: 0,              // Không co giãn
              cellRenderer: ActionMenuRenderer, // Custom renderer cho action menu
              cellStyle: {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0
              }
            };

            // Action column đứng đầu, data columns ở giữa, delete column ở cuối
            setColDefs([actionColumn, ...dataColumns, deleteColumn]);
          } else {
            // Không có action column cho các agent khác, chỉ có data + delete columns
            setColDefs([...dataColumns, deleteColumn]);
          }

          // Set data cho grid
          setRowData(rows);
        }
      } 
      
      
    }
  }, [aiResponse]);

  /**
   * Handler khi cell value thay đổi
   * Gọi callback onDataChange với toàn bộ data mới
   */
  const onCellValueChanged = (event: any) => {
    if (onDataChange) {
      // Lấy tất cả data từ grid
      const allData: any[] = [];
      event.api.forEachNode((node: any) => allData.push(node.data));
      onDataChange(allData); // Notify parent component
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      {/* AG Grid Table */}
      <div style={{ height: '100%', width: '100%' }}>
        <AgGridReact
          // Theme configuration
          theme={themeQuartz}
          
          // Data
          rowData={rowData}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          
          // Pagination
          pagination={true}
          paginationPageSize={10}
          
          // Events
          onCellValueChanged={onCellValueChanged}
          
          // Context - pass functions to cell renderers
          context={{
            onTriggerAction: onTriggerAction
          }}
        />
      </div>

      {/* Delete Confirmation Alert */}
      <DeleteAlert
        isOpen={showDeleteAlert}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        itemName={rowToDelete?.id || rowToDelete?.name}
      />
    </>
  );
});

