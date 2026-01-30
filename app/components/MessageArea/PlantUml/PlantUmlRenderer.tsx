import React from 'react';
import plantumlEncoder from 'plantuml-encoder';

interface Props {
  plantUmlCode: string;
}

const PlantUMLRenderer: React.FC<Props> = ({ plantUmlCode }) => {
  // 1. Mã hoá đoạn text PlantUML
  const encoded = plantumlEncoder.encode(plantUmlCode);

  // 2. Tạo URL ảnh từ server công cộng (có thể dùng kroki.io hoặc plantuml.com)
  // Kroki hỗ trợ tốt hơn cho nhiều loại diagram
  const imageUrl = `https://kroki.io/plantuml/svg/${encoded}`; 
  // Hoặc server chính chủ: `http://www.plantuml.com/plantuml/svg/${encoded}`

  return (
    <div className="max-w-full max-h-[70vh] border border-orange-100 rounded-xl p-4 bg-gradient-to-br from-white to-orange-50/20 overflow-auto shadow-sm">
      {/* Hiển thị ảnh SVG */}
      <div className="flex justify-center items-start min-h-[200px]">
        <img 
          src={imageUrl} 
          alt="PlantUML Diagram" 
          className="max-w-full h-auto rounded-lg shadow-sm border border-orange-100/50"
        />
      </div>
    </div>
  );
};

export default PlantUMLRenderer;