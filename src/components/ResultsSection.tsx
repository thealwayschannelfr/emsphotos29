import React, { useState } from 'react';
import { Download, ArrowDown, Check, Edit2, Type, Move, ZoomIn } from 'lucide-react';
import { ProcessedImage, TextOptions, FileData } from '../types';
import TextOptionsPanel from './TextOptions';
import { downloadAsZip } from '../utils/imageProcessor';

interface ResultsSectionProps {
  processedImages: ProcessedImage[];
  onImageUpdate: (index: number, updatedImage: ProcessedImage) => void;
  textOptions: TextOptions;
}

const ResultsSection: React.FC<ResultsSectionProps> = ({
  processedImages,
  onImageUpdate,
  textOptions
}) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(
    processedImages.length > 0 ? 0 : null
  );
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadedIndices, setDownloadedIndices] = useState<number[]>([]);
  const [editingPhoto, setEditingPhoto] = useState<'left' | 'right' | null>(null);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });

  const handleDownloadAll = async () => {
    setDownloadingAll(true);
    await downloadAsZip(processedImages);
    setDownloadingAll(false);
    setDownloadedIndices([...Array(processedImages.length).keys()]);
  };

  const downloadImage = async (index: number) => {
    const image = processedImages[index];
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `combined_${image.name}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedIndices(prev => [...prev, index]);
  };

  const handlePhotoClick = (side: 'left' | 'right') => {
    setEditingPhoto(side);
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!editingPhoto) return;
    setIsDragging(true);
    setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !editingPhoto) return;
    const newX = e.clientX - startPos.x;
    const newY = e.clientY - startPos.y;
    setPosition({ x: newX, y: newY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleScaleChange = (newScale: number) => {
    setScale(newScale);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fadeIn">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Processed Images</h2>
        <button
          onClick={handleDownloadAll}
          disabled={downloadingAll}
          className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {downloadingAll ? (
            <>
              <ArrowDown className="h-4 w-4 mr-2 animate-bounce" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Download All (ZIP)
            </>
          )}
        </button>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-8">
        {processedImages.map((image, index) => (
          <div
            key={index}
            className={`relative aspect-video rounded-lg overflow-hidden cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
              selectedImage === index ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={image.dataUrl}
              alt={`Combined ${image.name}`}
              className="w-full h-full object-cover"
            />
            {downloadedIndices.includes(index) && (
              <div className="absolute top-2 right-2 bg-green-500 text-white p-1 rounded-full">
                <Check className="h-3 w-3" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      {selectedImage !== null && (
        <div className="flex flex-col items-center">
          <div 
            className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 flex"
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <div 
              className="w-1/2 h-full cursor-pointer relative"
              onMouseDown={handleMouseDown}
              onDoubleClick={() => handlePhotoClick('left')}
              style={{
                transform: editingPhoto === 'left' ? `scale(${scale}) translate(${position.x}px, ${position.y}px)` : 'none'
              }}
            >
              <img
                src={processedImages[selectedImage].leftPhoto}
                alt="Left photo"
                className="w-full h-full object-cover"
              />
            </div>
            <div 
              className="w-1/2 h-full cursor-pointer relative"
              onMouseDown={handleMouseDown}
              onDoubleClick={() => handlePhotoClick('right')}
              style={{
                transform: editingPhoto === 'right' ? `scale(${scale}) translate(${position.x}px, ${position.y}px)` : 'none'
              }}
            >
              <img
                src={processedImages[selectedImage].rightPhoto}
                alt="Right photo"
                className="w-full h-full object-cover"
              />
            </div>
            
            {editingPhoto && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white rounded-lg shadow-lg p-4 flex items-center space-x-4">
                <div className="flex items-center">
                  <ZoomIn className="h-4 w-4 mr-2" />
                  <input
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={scale}
                    onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
                    className="w-32"
                  />
                </div>
                <button
                  onClick={() => setEditingPhoto(null)}
                  className="px-3 py-1 text-sm bg-indigo-600 text-white rounded-md"
                >
                  Apply
                </button>
              </div>
            )}
          </div>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => downloadImage(selectedImage)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </button>
          </div>
          
          <div className="w-full max-w-md">
            <TextOptionsPanel
              options={{
                ...textOptions,
                text: processedImages[selectedImage].name.replace(/_/g, ' ')
              }}
              onChange={(newOptions) => {
                const updatedImage = {
                  ...processedImages[selectedImage],
                  textOptions: newOptions
                };
                onImageUpdate(selectedImage, updatedImage);
              }}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSection;