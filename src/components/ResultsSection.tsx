import React, { useState } from 'react';
import { Download, ArrowDown, Check, Edit2, Type } from 'lucide-react';
import { ProcessedImage, TextOptions } from '../types';
import ImageEditor from './ImageEditor';
import TextOptionsPanel from './TextOptions';
import { downloadAsZip } from '../utils/imageProcessor';

interface ResultsSectionProps {
  processedImages: ProcessedImage[];
}

const ResultsSection: React.FC<ResultsSectionProps> = ({ processedImages }) => {
  const [selectedImage, setSelectedImage] = useState<number | null>(
    processedImages.length > 0 ? 0 : null
  );
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [downloadedIndices, setDownloadedIndices] = useState<number[]>([]);
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [showTextOptions, setShowTextOptions] = useState(false);
  const [textOptions, setTextOptions] = useState<TextOptions>({
    enabled: false,
    text: '',
    font: 'Arial',
    size: 36,
    position: 'top-left'
  });

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
    await new Promise(r => setTimeout(r, 100));
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
            className={`relative aspect-[9/16] rounded-lg overflow-hidden cursor-pointer transition-all duration-200 transform hover:scale-[1.02] ${
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
          <div className="relative w-full max-w-md aspect-[9/16] rounded-lg overflow-hidden mb-4">
            <img
              src={processedImages[selectedImage].dataUrl}
              alt={`Selected ${processedImages[selectedImage].name}`}
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex space-x-4 mb-4">
            <button
              onClick={() => setShowImageEditor(true)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
            >
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Image
            </button>
            
            <button
              onClick={() => setShowTextOptions(!showTextOptions)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
            >
              <Type className="h-4 w-4 mr-2" />
              Text Options
            </button>
            
            <button
              onClick={() => downloadImage(selectedImage)}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Selected
            </button>
          </div>
          
          {showTextOptions && (
            <div className="w-full max-w-md mb-4">
              <TextOptionsPanel
                options={textOptions}
                onChange={setTextOptions}
              />
            </div>
          )}
        </div>
      )}
      
      {showImageEditor && selectedImage !== null && (
        <ImageEditor
          image={processedImages[selectedImage]}
          onSave={(updatedImage) => {
            // Handle saving edited image
            setShowImageEditor(false);
          }}
          onClose={() => setShowImageEditor(false)}
        />
      )}
    </div>
  );
};

export default ResultsSection;