"use client";

import React, { useState, useEffect } from 'react';
import plantumlEncoder from 'plantuml-encoder';
import { set, string } from 'zod/v4';
import { Code2, EyeOff } from 'lucide-react';

// --- 1. MOCK DATA: Dữ liệu mẫu PlantUML chuẩn cho 3 loại ---
const MOCK_DATA = {
    usecase: `@startuml
left to right direction
skinparam packageStyle rectangle

actor "Khách hàng" as user
actor "Nhân viên ngân hàng" as admin

rectangle "Hệ thống Internet Banking" {
  usecase "Đăng nhập" as UC1
  usecase "Kiểm tra số dư" as UC2
  usecase "Chuyển tiền" as UC3
  usecase "Thanh toán hóa đơn" as UC4
  usecase "Quản lý người dùng" as UC5
}

user --> UC1
user --> UC2
user --> UC3
user --> UC4

admin --> UC1
admin --> UC5

UC3 ..> UC1 : <<include>>
UC4 ..> UC2 : <<include>>
@enduml`,

    sequence: `@startuml
autonumber

participant "User" as U
participant "Frontend (App)" as FE
participant "Auth Service" as Auth
database "Database" as DB

U -> FE: Nhập Username/Password
activate FE

FE -> Auth: POST /api/login
activate Auth

Auth -> DB: Tìm kiếm User theo Username
activate DB
DB --> Auth: Trả về thông tin User (Hash Pass)
deactivate DB

Auth -> Auth: So sánh Hash Password

alt Mật khẩu đúng
    Auth --> FE: 200 OK + JWT Token
else Mật khẩu sai
    Auth --> FE: 401 Unauthorized
end

deactivate Auth

FE --> U: Chuyển hướng vào trang chủ
deactivate FE
@enduml`,

    class: `@startuml
class User {
  - String id
  - String username
  - String password
  + login()
  + logout()
}

class Customer {
  - String email
  - String phone
  + viewBalance()
}

class Admin {
  - String role
  + manageUser()
}

class Account {
  - String accountNumber
  - Double balance
  + deposit(amount)
  + withdraw(amount)
}

User <|-- Customer
User <|-- Admin

Customer "1" *-- "many" Account : sở hữu
@enduml`
};

type DiagramType = 'usecase' | 'sequence' | 'class';


interface PlantUMLCompoentProps {
    aiResponse: any;
}

export default function PlantUMLCompoent({ aiResponse }: PlantUMLCompoentProps) {
    const [activeTab, setActiveTab] = useState<number>(0);
    const [code, setCode] = useState('');
    const [imageUrl, setImageUrl] = useState('');
    const [titleList, setTitleList] = useState<string[]>([]);
    const [codeList, setCodeList] = useState<string[]>([]);
    const [isCodeEdited, setIsCodeEdited] = useState(false);

    // --- 2. LOGIC RENDER: Encode text thành URL ảnh ---
    useEffect(() => {
        try {
            // Encode đoạn code PlantUML
            const encoded = plantumlEncoder.encode(code);

            // Tạo URL đến server public của PlantUML (Hoặc thay bằng server riêng của bạn)
            // Dùng SVG để ảnh sắc nét khi zoom
            const url = `http://www.plantuml.com/plantuml/svg/${encoded}`;

            setImageUrl(url);
        } catch (error) {
            console.error("Lỗi encode:", error);
        }
    }, [code]);

    useEffect(() => {
        const data = aiResponse?.data;
        if (data) {
            const title = data.map((item: any) => item.title);
            const plantUmlCode = data.map((item: any) => item.code.replace(/\\n/g, '\n').trim());
            console.log('PlantUmlComponent - Extracted Titles:', title);
            console.log('PlantUmlComponent - Extracted Codes:', plantUmlCode);
            setTitleList(title);
            setCodeList(plantUmlCode);
            setCode(plantUmlCode[0] || '');
        }
    }, [aiResponse]);
    // Hàm chuyển tab
    const handleTabChange = (index: number) => {
        setActiveTab(index);
        setCode(codeList[index]);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', fontFamily: 'sans-serif' }}>

            {/* HEADER & TABS */}
            <div style={{ padding: '15px', borderBottom: '1px solid #ddd', background: '#f9f9f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <h3 style={{ margin: 0, marginRight: '20px' }}>📊 Diagrams</h3>
                {
                    titleList && titleList.map((title, index) => (
                        <button
                            key={index}
                            onClick={() => handleTabChange(index)}
                            style={getTabStyle(activeTab === index)}
                        >
                            {title}
                        </button>
                    ))
                }

                {/* --- BUTTON VIEW CODE (Sử dụng Lucide Icon + Tailwind) --- */}
<button
    onClick={() => setIsCodeEdited(!isCodeEdited)}
    className={`
        ml-auto flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm border
        ${isCodeEdited
            ? 'bg-gray-800 text-white border-gray-800 hover:bg-gray-700' // Active: Dark mode
            : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50 hover:text-gray-900 hover:border-gray-300' // Inactive: Light mode
        }
    `}
>
    {isCodeEdited ? (
        <EyeOff className="w-4 h-4" /> // Icon khi đang mở code (để bấm vào thì ẩn đi)
    ) : (
        <Code2 className="w-4 h-4" />  // Icon khi đang đóng code (để bấm vào thì mở ra)
    )}
    
    <span>{isCodeEdited ? 'Hide Code' : 'View Code'}</span>
</button>

            </div>

            {/* MAIN CONTENT: SPLIT VIEW */}
            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

                {/* CỘT TRÁI: CODE EDITOR (Mô phỏng AI Output) */}
                {
                    isCodeEdited && (
<div style={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: '1px solid #ddd' }}>
          <div style={{ padding: '10px', background: '#eee', fontSize: '12px', fontWeight: 'bold', borderBottom: '1px solid #ddd' }}>
            🛠️ PlantUML Code (AI Generated - Editable)
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={{ 
              flex: 1, 
              width: '100%', 
              padding: '15px', 
              fontFamily: 'monospace', 
              fontSize: '14px', 
              border: 'none', 
              outline: 'none', 
              resize: 'none',
              backgroundColor: '#282c34',
              color: '#abb2bf'
            }}
          />
        </div>

                    )
                }
                
                {/* CỘT PHẢI: DIAGRAM PREVIEW */}
                <div style={{ width: isCodeEdited ? '60%' : '100%', display: 'flex', flexDirection: 'column', backgroundColor: '#fff' }}>


                    <div style={{ flex: 1, overflow: 'auto', padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                        {imageUrl ? (
                            <img
                                src={imageUrl}
                                alt="PlantUML Diagram"
                                style={{ maxWidth: '100%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', border: '1px solid #eee' }}
                            />
                        ) : (
                            <p>Loading diagram...</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

const getTabStyle = (isActive: boolean): React.CSSProperties => ({
    padding: '6px 14px',           // Nhỏ gọn hơn
    fontSize: '13px',              // Chữ vừa vặn
    fontFamily: 'inherit',
    border: isActive ? '1px solid #0070f3' : '1px solid #e5e7eb', // Active: viền xanh, Inactive: viền xám nhạt
    borderRadius: '6px',           // Bo góc mềm mại
    cursor: 'pointer',
    background: isActive ? '#0070f3' : '#ffffff', // Active: nền xanh, Inactive: nền trắng
    color: isActive ? '#ffffff' : '#4b5563',      // Active: chữ trắng, Inactive: chữ xám đậm
    fontWeight: 500,
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: isActive ? '0 2px 4px rgba(0, 112, 243, 0.2)' : 'none', // Thêm shadow nhẹ khi active
    whiteSpace: 'nowrap'           // Chống xuống dòng nếu tên dài
});