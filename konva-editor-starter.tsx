import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';
import Konva from 'konva';
import { Stage, Layer, Text, Image as KonvaImage, Transformer, Rect, Circle, RegularPolygon } from 'react-konva';

// Custom hook for loading images
const useImage = (src: string) => {
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const img = new window.Image();
    img.src = src;
    img.onload = () => setImage(img);
  }, [src]);

  return [image];
};

interface KonvaObject {
  id: string;
  type: 'text' | 'image' | 'rect' | 'circle' | 'triangle';
  x: number;
  y: number;
  width?: number;
  height?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  src?: string;
  sides?: number;
  radius?: number;
}

export default function KonvaEditorStarter() {
  const [objects, setObjects] = useState<KonvaObject[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showProperties, setShowProperties] = useState(true);
  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  // Handle stage click (deselect)
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.target === e.target.getStage()) {
      setSelectedId(null);
    }
  }, []);

  // Handle object selection
  const handleObjectClick = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  // Update transformer when selection changes
  useEffect(() => {
    if (transformerRef.current && stageRef.current) {
      if (selectedId) {
        const selectedNode = stageRef.current.findOne(`#${selectedId}`);
        if (selectedNode) {
          transformerRef.current.nodes([selectedNode]);
        }
      } else {
        transformerRef.current.nodes([]);
      }
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  // Add text object
  const addText = useCallback(() => {
    const newText: KonvaObject = {
      id: `text_${Date.now()}`,
      type: 'text',
      x: Math.random() * 400 + 50,
      y: Math.random() * 300 + 50,
      text: 'Click to edit',
      fontSize: 24,
      fontFamily: 'Arial',
      fill: '#000000',
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setObjects(prev => [...prev, newText]);
    setSelectedId(newText.id);
  }, []);

  // Add image from URL
  const addImage = useCallback((src: string) => {
    const newImage: KonvaObject = {
      id: `image_${Date.now()}`,
      type: 'image',
      x: Math.random() * 300 + 50,
      y: Math.random() * 200 + 50,
      width: 200,
      height: 150,
      src,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    };
    setObjects(prev => [...prev, newImage]);
    setSelectedId(newImage.id);
  }, []);

  // Add shape
  const addShape = useCallback((shapeType: 'rect' | 'circle' | 'triangle') => {
    let newShape: KonvaObject;

    switch (shapeType) {
      case 'rect':
        newShape = {
          id: `rect_${Date.now()}`,
          type: 'rect',
          x: Math.random() * 400 + 50,
          y: Math.random() * 300 + 50,
          width: 100,
          height: 80,
          fill: '#3B82F6',
          stroke: '#1E40AF',
          strokeWidth: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };
        break;
      case 'circle':
        newShape = {
          id: `circle_${Date.now()}`,
          type: 'circle',
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          radius: 50,
          fill: '#8B5CF6',
          stroke: '#6D28D9',
          strokeWidth: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };
        break;
      case 'triangle':
        newShape = {
          id: `triangle_${Date.now()}`,
          type: 'triangle',
          x: Math.random() * 400 + 100,
          y: Math.random() * 300 + 100,
          sides: 3,
          radius: 50,
          fill: '#10B981',
          stroke: '#059669',
          strokeWidth: 2,
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
        };
        break;
    }

    setObjects(prev => [...prev, newShape]);
    setSelectedId(newShape.id);
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        addImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    // Reset input
    e.target.value = '';
  }, [addImage]);

  // Update object properties
  const updateObject = useCallback((id: string, updates: Partial<KonvaObject>) => {
    setObjects(prev => prev.map(obj =>
      obj.id === id ? { ...obj, ...updates } : obj
    ));
  }, []);

  // Delete selected object
  const deleteSelected = useCallback(() => {
    if (selectedId) {
      setObjects(prev => prev.filter(obj => obj.id !== selectedId));
      setSelectedId(null);
    }
  }, [selectedId]);

  // Get selected object
  const selectedObject = objects.find(obj => obj.id === selectedId);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Left Toolbar */}
      <div className="w-16 bg-gray-800 text-white flex flex-col items-center py-4 space-y-4">
        {/* Add Text */}
        <button
          onClick={addText}
          className="w-12 h-12 bg-blue-500 hover:bg-blue-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Text"
        >
          <span className="text-xl font-bold">T</span>
        </button>

        {/* Upload Image */}
        <label className="w-12 h-12 bg-green-500 hover:bg-green-600 rounded-lg flex items-center justify-center cursor-pointer transition-colors">
          <span className="text-xl">📷</span>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>

        {/* Add Rectangle */}
        <button
          onClick={() => addShape('rect')}
          className="w-12 h-12 bg-purple-500 hover:bg-purple-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Rectangle"
        >
          <span className="text-xl">▬</span>
        </button>

        {/* Add Circle */}
        <button
          onClick={() => addShape('circle')}
          className="w-12 h-12 bg-pink-500 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Circle"
        >
          <span className="text-xl">○</span>
        </button>

        {/* Add Triangle */}
        <button
          onClick={() => addShape('triangle')}
          className="w-12 h-12 bg-teal-500 hover:bg-teal-600 rounded-lg flex items-center justify-center transition-colors"
          title="Add Triangle"
        >
          <span className="text-xl">△</span>
        </button>

        {/* Divider */}
        <div className="w-8 h-px bg-gray-600"></div>

        {/* Delete */}
        <button
          onClick={deleteSelected}
          className="w-12 h-12 bg-red-500 hover:bg-red-600 rounded-lg flex items-center justify-center transition-colors"
          title="Delete Selected"
        >
          <span className="text-xl">🗑️</span>
        </button>
      </div>

      {/* Main Canvas */}
      <div className="flex-1 flex justify-center items-center relative overflow-hidden">
        <div className="bg-white shadow-lg rounded-lg">
          <Stage
            ref={stageRef}
            width={800}
            height={600}
            onMouseDown={handleStageClick}
            className="border border-gray-300 rounded-lg"
          >
            <Layer>
              {objects.map((obj) => {
                if (obj.type === 'text') {
                  return (
                    <Text
                      key={obj.id}
                      id={obj.id}
                      x={obj.x}
                      y={obj.y}
                      text={obj.text}
                      fontSize={obj.fontSize}
                      fontFamily={obj.fontFamily}
                      fill={obj.fill}
                      rotation={obj.rotation}
                      scaleX={obj.scaleX}
                      scaleY={obj.scaleY}
                      draggable
                      onClick={() => handleObjectClick(obj.id)}
                    />
                  );
                } else if (obj.type === 'image') {
                  const [image] = useImage(obj.src || '');
                  return (
                    <KonvaImage
                      key={obj.id}
                      id={obj.id}
                      x={obj.x}
                      y={obj.y}
                      width={obj.width}
                      height={obj.height}
                      image={image}
                      rotation={obj.rotation}
                      scaleX={obj.scaleX}
                      scaleY={obj.scaleY}
                      draggable
                      onClick={() => handleObjectClick(obj.id)}
                    />
                  );
                } else if (obj.type === 'rect') {
                  return (
                    <Rect
                      key={obj.id}
                      id={obj.id}
                      x={obj.x}
                      y={obj.y}
                      width={obj.width}
                      height={obj.height}
                      fill={obj.fill}
                      stroke={obj.stroke}
                      strokeWidth={obj.strokeWidth}
                      rotation={obj.rotation}
                      scaleX={obj.scaleX}
                      scaleY={obj.scaleY}
                      draggable
                      onClick={() => handleObjectClick(obj.id)}
                    />
                  );
                } else if (obj.type === 'circle') {
                  return (
                    <Circle
                      key={obj.id}
                      id={obj.id}
                      x={obj.x}
                      y={obj.y}
                      radius={obj.radius}
                      fill={obj.fill}
                      stroke={obj.stroke}
                      strokeWidth={obj.strokeWidth}
                      rotation={obj.rotation}
                      scaleX={obj.scaleX}
                      scaleY={obj.scaleY}
                      draggable
                      onClick={() => handleObjectClick(obj.id)}
                    />
                  );
                } else if (obj.type === 'triangle') {
                  return (
                    <RegularPolygon
                      key={obj.id}
                      id={obj.id}
                      x={obj.x}
                      y={obj.y}
                      sides={obj.sides}
                      radius={obj.radius}
                      fill={obj.fill}
                      stroke={obj.stroke}
                      strokeWidth={obj.strokeWidth}
                      rotation={obj.rotation}
                      scaleX={obj.scaleX}
                      scaleY={obj.scaleY}
                      draggable
                      onClick={() => handleObjectClick(obj.id)}
                    />
                  );
                }
                return null;
              })}

              {/* Transformer */}
              <Transformer
                ref={transformerRef}
                rotateEnabled={true}
                enabledAnchors={[
                  'top-left', 'top-right', 'bottom-left', 'bottom-right',
                  'middle-left', 'middle-right', 'top-center', 'bottom-center'
                ]}
                boundBoxFunc={(oldBox, newBox) => {
                  if (newBox.width < 20) newBox.width = 20;
                  if (newBox.height < 20) newBox.height = 20;
                  return newBox;
                }}
              />
            </Layer>
          </Stage>
        </div>
      </div>

      {/* Properties Panel */}
      {showProperties && (
        <div className="w-80 bg-white border-l border-gray-200 flex flex-col">
          {/* Header */}
          <div className="bg-gray-50 border-b border-gray-200 p-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-700">Properties</h2>
            <button
              onClick={() => setShowProperties(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto">
            {selectedObject ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type: {selectedObject.type}
                  </label>
                </div>

                {/* Position */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">X</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.x)}
                      onChange={(e) => updateObject(selectedObject.id, { x: +e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Y</label>
                    <input
                      type="number"
                      value={Math.round(selectedObject.y)}
                      onChange={(e) => updateObject(selectedObject.id, { y: +e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    />
                  </div>
                </div>

                {/* Size (for applicable objects) */}
                {(selectedObject.type === 'image' || selectedObject.type === 'rect') && (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Width</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.width || 0)}
                        onChange={(e) => updateObject(selectedObject.id, { width: +e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Height</label>
                      <input
                        type="number"
                        value={Math.round(selectedObject.height || 0)}
                        onChange={(e) => updateObject(selectedObject.id, { height: +e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                )}

                {/* Text Properties */}
                {selectedObject.type === 'text' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Text</label>
                      <input
                        type="text"
                        value={selectedObject.text}
                        onChange={(e) => updateObject(selectedObject.id, { text: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedObject.fontSize}
                        onChange={(e) => updateObject(selectedObject.id, { fontSize: +e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Font Family</label>
                      <select
                        value={selectedObject.fontFamily}
                        onChange={(e) => updateObject(selectedObject.id, { fontFamily: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Helvetica">Helvetica</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Courier New">Courier New</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="color"
                        value={selectedObject.fill}
                        onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>
                  </>
                )}

                {/* Shape Properties */}
                {(selectedObject.type === 'rect' || selectedObject.type === 'circle' || selectedObject.type === 'triangle') && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fill Color</label>
                      <input
                        type="color"
                        value={selectedObject.fill}
                        onChange={(e) => updateObject(selectedObject.id, { fill: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Color</label>
                      <input
                        type="color"
                        value={selectedObject.stroke}
                        onChange={(e) => updateObject(selectedObject.id, { stroke: e.target.value })}
                        className="w-full h-10 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stroke Width</label>
                      <input
                        type="number"
                        value={selectedObject.strokeWidth}
                        onChange={(e) => updateObject(selectedObject.id, { strokeWidth: +e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center text-gray-500 mt-8">
                <p>Select an object to edit its properties</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toggle Properties Panel */}
      {!showProperties && (
        <button
          onClick={() => setShowProperties(true)}
          className="fixed right-4 top-1/2 transform -translate-y-1/2 bg-blue-500 text-white p-2 rounded-l-md shadow-lg hover:bg-blue-600 transition-colors"
          title="Show Properties"
        >
          ‹
        </button>
      )}
    </div>
  );
}
