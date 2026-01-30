# Sidebar Component - Refactored Structure

## 📁 Cấu trúc thư mục

```
Sidebar/
├── index.tsx                    # Main orchestrator component
├── types.ts                     # TypeScript interfaces & types
├── constants.ts                 # Configuration constants (phases, API URLs)
├── README.md                    # Documentation (file này)
│
├── hooks/
│   ├── useSidebarState.ts      # State management hook
│   └── useSidebarApi.ts        # API calls hook (fetchTools, callAgent)
│
├── components/
│   ├── PhaseSelector.tsx       # Project phase buttons
│   ├── UserInput.tsx           # User input textarea
│   ├── FileUpload.tsx          # File upload với drag & drop
│   ├── ActiveTools.tsx         # Tools grid selection
│   ├── KnowledgeBase.tsx       # Knowledge base files list
│   ├── RunAgentButton.tsx      # Run discovery agent button
│   └── UserSection.tsx         # Bottom user info & logout
│
└── utils/
    └── helpers.ts              # Helper functions (getInitials, etc.)
```

## 🎯 Nguyên tắc thiết kế

### Single Responsibility Principle
Mỗi file/component chỉ có 1 trách nhiệm duy nhất:
- **types.ts**: Định nghĩa types
- **constants.ts**: Chứa constants
- **hooks/**: Business logic & API calls
- **components/**: UI components thuần túy
- **utils/**: Helper functions

### Component Composition
`index.tsx` là orchestrator, kết hợp các sub-components:
```tsx
<Sidebar>
  <PhaseSelector />
  <UserInput />
  <FileUpload />
  <ActiveTools />
  <KnowledgeBase />
  <RunAgentButton />
  <UserSection />
</Sidebar>
```

## 🔧 Cách sử dụng

### Import component
```tsx
import Sidebar, { User } from '@/app/components/Sidebar';
// hoặc
import Sidebar, { User } from '@/app/components/Sidebar/index';
```

### Props
```tsx
interface SidebarProps {
  activePhase: PhaseId;
  onPhaseChange: (phase: PhaseId) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  user: User | null;
  onLogout: () => void;
  onSendMessage: any;
  handleAIResponse: any;
}
```

## 📝 Chi tiết các module

### 1. **types.ts**
- `User`: User interface
- `SidebarProps`: Main component props
- `Phase`: Phase configuration
- `SelectedToolItem`: Selected tool structure

### 2. **constants.ts**
- `API_URL`: Backend API endpoint
- `TIME_OUT`: Agent timeout duration
- `phases`: Array of phase configurations

### 3. **hooks/useSidebarState.ts**
Quản lý tất cả local state:
- Tool selection state
- File upload state
- Loading states
- Modal states

### 4. **hooks/useSidebarApi.ts**
Xử lý API calls:
- `fetchTools()`: Load tools từ backend
- `callAgent()`: Gọi agent để xử lý request

### 5. **components/**
Các UI components độc lập, reusable:
- Mỗi component nhận props cần thiết
- Không có business logic phức tạp
- Dễ test và maintain

### 6. **utils/helpers.ts**
Helper functions thuần túy:
- `getInitials()`: Extract initials từ email

## 🔄 Migration từ code cũ

File `app/components/Sidebar.tsx` cũ giờ chỉ là wrapper:
```tsx
export { default, type User } from './Sidebar/index';
```

**Backward compatible**: Tất cả imports hiện tại vẫn hoạt động bình thường!

## ✅ Lợi ích

1. **Dễ maintain**: Mỗi file nhỏ, tập trung vào 1 nhiệm vụ
2. **Dễ test**: Components và hooks độc lập
3. **Dễ mở rộng**: Thêm features mới không ảnh hưởng code cũ
4. **Reusable**: Components có thể tái sử dụng
5. **Type-safe**: TypeScript types tập trung ở 1 nơi
6. **Clean code**: Logic tách biệt khỏi UI

## 🚀 Phát triển tiếp

Khi cần thêm features mới:
1. Thêm types vào `types.ts`
2. Thêm constants vào `constants.ts`
3. Tạo component mới trong `components/`
4. Thêm logic vào hooks nếu cần
5. Import và sử dụng trong `index.tsx`

## 📚 Best Practices

- ✅ Giữ components nhỏ và focused
- ✅ Sử dụng TypeScript types đầy đủ
- ✅ Comment code rõ ràng
- ✅ Tách business logic khỏi UI
- ✅ Sử dụng custom hooks cho logic phức tạp
- ✅ Props drilling tối thiểu (dùng context nếu cần)

## 🐛 Debugging

Nếu gặp lỗi import:
1. Check path imports có đúng không
2. Verify exports trong các files
3. Check circular dependencies
4. Clear Next.js cache: `rm -rf .next`

---

**Refactored by**: BA Agent Team  
**Date**: 2026-01-18  
**Version**: 2.0
