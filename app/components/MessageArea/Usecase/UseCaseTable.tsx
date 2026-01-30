import React from 'react';

interface UseCaseTableProps {
  data?: any;
}

// Helper function to format property name (camelCase to Title Case with spaces)
const formatPropertyName = (key: string): string => {
  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

// Helper function to check if value is an array of objects
const isArrayOfObjects = (value: any): boolean => {
  return Array.isArray(value) && value.length > 0 && typeof value[0] === 'object' && value[0] !== null;
};

// Helper function to get object keys from first item in array
const getObjectKeys = (arr: any[]): string[] => {
  if (arr.length === 0) return [];
  return Object.keys(arr[0]);
};

// Component to render nested table for array of objects
const NestedTable: React.FC<{ items: any[] }> = ({ items }) => {
  if (!items || items.length === 0) return <span className="text-gray-400 italic">Empty</span>;
  
  const headers = getObjectKeys(items);
  
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-gray-200">
          {headers.map((header, idx) => (
            <th 
              key={idx} 
              className="px-4 py-2 bg-gray-100 text-left text-xs font-semibold text-gray-600 uppercase"
            >
              {formatPropertyName(header)}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {items.map((item: any, index: number) => (
          <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
            {headers.map((header, colIdx) => (
              <td 
                key={colIdx} 
                className="px-4 py-3 text-gray-600 border-b border-gray-100"
              >
                {renderCellValue(item[header])}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Helper function to render cell value
const renderCellValue = (value: any): React.ReactNode => {
  if (value === null || value === undefined) {
    return <span className="text-gray-400 italic">-</span>;
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    return <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{JSON.stringify(value, null, 2)}</pre>;
  }
  if (Array.isArray(value)) {
    if (isArrayOfObjects(value)) {
      return <NestedTable items={value} />;
    }
    return value.join(', ');
  }
  return String(value);
};

const UseCaseTable: React.FC<UseCaseTableProps> = ({ data }) => {
  if (!data) {
    return <div className="text-gray-500 italic p-4">No data available</div>;
  }

  // Get all keys except 'id' and 'name'
  const propertyKeys = Object.keys(data).filter(key => key !== 'id' && key !== 'name');

  return (
    <div className="w-full max-h-[100vh] overflow-auto">
      <div className="bg-white rounded-lg border border-gray-200">
        <table className="w-full border-collapse">
          {/* Header with ID and Name */}
          <thead>
            <tr className="border-b border-gray-200">
              <th className="w-1/5 px-6 py-4 text-left bg-gray-50 font-semibold text-gray-700">
                {data.id || 'N/A'}
              </th>
              <th className="px-6 py-4 text-left bg-gray-50 font-semibold text-gray-700">
                {data.name || 'Untitled'}
              </th>
            </tr>
          </thead>

          <tbody>
            {/* Dynamic rendering for all other properties */}
            {propertyKeys.map((key, index) => {
              const value = data[key];
              const isLast = index === propertyKeys.length - 1;
              
              // Skip if value is null/undefined
              if (value === null || value === undefined) return null;

              return (
                <tr 
                  key={key} 
                  className={!isLast ? 'border-b border-gray-200' : ''}
                >
                  <td className="px-6 py-4 bg-gray-50 font-semibold text-gray-700 align-top">
                    {formatPropertyName(key)}
                  </td>
                  <td className={isArrayOfObjects(value) ? 'p-0' : 'px-6 py-4 text-gray-600'}>
                    {isArrayOfObjects(value) ? (
                      <NestedTable items={value} />
                    ) : Array.isArray(value) ? (
                      <span className="italic">{value.join(', ')}</span>
                    ) : typeof value === 'object' ? (
                      <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    ) : (
                      <span className="italic">{String(value)}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UseCaseTable;
