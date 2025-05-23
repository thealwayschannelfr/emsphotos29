import React, { useState, useRef, useEffect } from 'react';
import { Download, ArrowDown, Check, Edit2, Type, Move, ZoomIn } from 'lucide-react';
import { ProcessedImage, TextOptions, FileData } from '../types';
import TextOptionsPanel from './TextOptions';
import { downloadAsZip } from '../utils/imageProcessor';
import TransformableImage from './TransformableImage';

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
  const [selectedSide, setSelectedSide] = useState<'left' | 'right' | null>(null);

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
    link.download = `${image.name}_combined.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadedIndices(prev => [...prev, index]);
  };

  const handleTransformUpdate = (side: 'left' | 'right', transform: any) => {
    if (selectedImage === null) return;
    
    const updatedImage = {
      ...processedImages[selectedImage],
      transform: {
        ...processedImages[selectedImage].transform,
        [side]: transform
      }
    };
    onImageUpdate(selectedImage, updatedImage);
  };

  const handleTextOptionsChange = (newOptions: TextOptions) => {
    if (selectedImage === null) return;
    
    const updatedImage = {
      ...processedImages[selectedImage],
      textOptions: newOptions
    };
    onImageUpdate(selectedImage, updatedImage);
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
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4 flex bg-gray-100">
            <div 
              className={`w-1/2 h-full relative ${selectedSide === 'left' ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => setSelectedSide(prev => prev === 'left' ? null : 'left')}
            >
              <TransformableImage
                src={processedImages[selectedImage].leftPhoto}
                isSelected={selectedSide === 'left'}
                transform={processedImages[selectedImage].transform?.left}
                onTransformChange={(transform) => handleTransformUpdate('left', transform)}
              />
            </div>
            <div 
              className={`w-1/2 h-full relative ${selectedSide === 'right' ? 'ring-2 ring-indigo-500' : ''}`}
              onClick={() => setSelectedSide(prev => prev === 'right' ? null : 'right')}
            >
              <TransformableImage
                src={processedImages[selectedImage].rightPhoto}
                isSelected={selectedSide === 'right'}
                transform={processedImages[selectedImage].transform?.right}
                onTransformChange={(transform) => handleTransformUpdate('right', transform)}
              />
            </div>
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
              options={processedImages[selectedImage].textOptions || {
                ...textOptions,
                text: processedImages[selectedImage].name,
                enabled: false
              }}
              onChange={handleTextOptionsChange}
              compact={true}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSection;