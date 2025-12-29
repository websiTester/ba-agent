'use client';
import React, { useEffect, useState } from 'react';
import mermaid from 'mermaid';

// 1. Khởi tạo cấu hình Mermaid (giữ nguyên)
mermaid.initialize({
  startOnLoad: false,
  theme: 'default',
  securityLevel: 'loose',
});

// 2. Định nghĩa kiểu dữ liệu (Interface) cho Props
interface MermaidProps {
  chart: string;
}

// 3. Áp dụng kiểu MermaidProps vào component
const Mermaid = ({ chart }: MermaidProps) => {
  const [svg, setSvg] = useState<string>(''); // Khai báo state là string

  useEffect(() => {
    const renderChart = async () => {
      try {
        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        
        // mermaid.render trả về Promise, kết quả là object { svg: string }
        const { svg } = await mermaid.render(id, chart);
        setSvg(svg);
      } catch (error) {
        console.error('Mermaid render error:', error);
        // Khi lỗi, hiển thị text báo lỗi
        setSvg('<p class="text-red-500 text-xs p-2">Invalid Mermaid syntax</p>');
      }
    };

    if (chart) {
      renderChart();
    }
  }, [chart]);

  return (
    <div 
      className="flex justify-center my-4 overflow-x-auto bg-white p-2 rounded" 
      dangerouslySetInnerHTML={{ __html: svg }} 
    />
  );
};

export default Mermaid;