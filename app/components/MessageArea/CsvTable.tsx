'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import Papa from 'papaparse';

// 1. IMPORT MODULE VÀ THEME MỚI (KHÔNG IMPORT CSS NỮA)
import { ModuleRegistry, AllCommunityModule, themeQuartz } from 'ag-grid-community';
import { ActionMenuRenderer } from './ActionMenu';
import { useAppState } from '@/app/store';
import { stat } from 'fs';
import { set } from 'zod/v4';

// 2. ĐĂNG KÝ MODULE
ModuleRegistry.registerModules([AllCommunityModule]);

interface RequirementRow {
  [key: string]: string;
}

interface CsvTableProps {
  aiResponse: any;
  onDataChange?: (updatedData: any[]) => void;
  onTriggerAction?: (action: string, rowData: RequirementRow) => void;
}

export default function CsvTable({ aiResponse, onDataChange }: CsvTableProps) {

  const [rowData, setRowData] = useState<RequirementRow[]>([]);
  const [colDefs, setColDefs] = useState<any[]>([]);
  const setIsOpenPromptModal = useAppState(state => state.setIsOpenPromptModal);
  const setInitialContextData = useAppState(state => state.setInitialContextData);
  const setTemplateId = useAppState(state => state.setTemplateId);

  const defaultColDef = useMemo(() => {
    return {
      editable: true,
      filter: true,
      sortable: true,
      resizable: true,
      flex: 1,
      wrapText: true,
      autoHeight: true,
      cellDataType: 'text',
      cellStyle: {
        lineHeight: '1.4',
        paddingTop: '8px',
        paddingBottom: '8px',
        wordBreak: 'normal'
      }
    };
  }, []);

  const onTriggerAction = (action: string, rowData: RequirementRow) => {
    console.log('Action triggered:', action);
    setIsOpenPromptModal(true);
    setInitialContextData(rowData);
    setTemplateId(action);
  }


  useEffect(() => {
    if (aiResponse && aiResponse.data) {
      const cleanCsvData = aiResponse.data.replace(/\\n/g, '\n').trim();


      Papa.parse(cleanCsvData, {
        header: true,   // Lấy dòng đầu tiên trong cleanCsvData là header
        skipEmptyLines: true,
        complete: (results) => {

          //result là object chứa data và errors
          //data là mảng các object đại diện cho từng dòng
          if (results.data && results.data.length > 0) {

            const rows = results.data as RequirementRow[];
            const firstRow = rows[0];

            // --- 1. TẠO CÁC CỘT DỮ LIỆU TỰ ĐỘNG ---
            //Ngoài defaultColDef, với 1 số cột đặc biệt ta sẽ thêm cấu hình riêng
            const dataColumns = Object.keys(firstRow).map((key) => {

              if (key.toLowerCase() === 'section') {
                return {
                  field: key,
                  headerName: 'Section',

                  // --- THÊM CẤU HÌNH COMMUNITY ---
                  pinned: 'left',      // Ghim chặt sang trái để làm tiêu đề
                  width: 180,          // Độ rộng vừa đủ
                  sort: 'asc',         // QUAN TRỌNG: Tự động sắp xếp A-Z để các section nằm cạnh nhau
                  sortIndex: 0,        // Ưu tiên sắp xếp cột này trước tiên
                  editable: false,   // Không cho sửa cột Section
                };
              }

              const isIdCol = key.toLowerCase() === 'id';
              const isLongText = key.toLowerCase().includes('description') || key.toLowerCase().includes('rationale');

              //Thêm config cho các cột bình thường
              return {
                field: key,
                headerName: key.charAt(0).toUpperCase() + key.slice(1),
                editable: !isIdCol,   //nếu là cột ID thì không cho sửa
                cellEditor: isLongText ? 'agLargeTextCellEditor' : 'agTextCellEditor',
                cellEditorPopup: isLongText,
                minWidth: isLongText ? 250 : 100,
                flex: isLongText ? 1.5 : 1,
              };
            });

            // --- 2. TẠO VÀ CẤU HÌNH CỘT ACTION MỚI ---
            if (aiResponse.agent_source === 'requirement_analysis') {
              const actionColumn = {
                headerName: '',
                field: 'actions',
                editable: false,
                sortable: false,
                filter: false,
                pinned: 'left', // Ghim phải
                width: 50,
                minWidth: 50,
                maxWidth: 60,
                flex: 0,
                cellRenderer: ActionMenuRenderer,
                cellStyle: {
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0
                }
              };

              setColDefs([actionColumn, ...dataColumns]);
            } else {
              setColDefs(dataColumns);
            }



            setRowData(rows);
          }
        },
      });
    }
  }, [aiResponse]);

  const onCellValueChanged = (event: any) => {
    if (onDataChange) {
      const allData: any[] = [];
      event.api.forEachNode((node: any) => allData.push(node.data));
      onDataChange(allData);
    }
  };

  return (
    <>
    <div style={{ height: '100%', width: '100%' }}>
      <AgGridReact
        // 4. TRUYỀN THEME VÀO PROP CỦA COMPONENT
        theme={themeQuartz}
        rowData={rowData}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        pagination={true}
        paginationPageSize={10}
        onCellValueChanged={onCellValueChanged}
        context={{
          onTriggerAction: onTriggerAction
        }}
      />
    </div>
    </>
  );
};

