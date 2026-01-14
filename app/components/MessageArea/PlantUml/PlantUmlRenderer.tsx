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
    <div className="border border-gray-200 rounded p-4 bg-white overflow-auto">
      {/* Hiển thị ảnh SVG */}
      <img 
        src={imageUrl} 
        alt="PlantUML Diagram" 
        style={{ maxWidth: '100%', height: 'auto' }} 
      />
    </div>
  );
};

export default PlantUMLRenderer;