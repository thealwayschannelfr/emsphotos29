import { FileData, ProcessedImage, TextOptions } from '../types';
import JSZip from 'jszip';

export const processImages = async (
  babyPhotos: FileData[],
  currentPhotos: FileData[],
  onProgress: (progress: number) => void,
  globalTextOptions: TextOptions
): Promise<ProcessedImage[]> => {
  const results: ProcessedImage[] = [];
  const totalImages = Math.min(babyPhotos.length, currentPhotos.length);
  
  const sortedBabyPhotos = [...babyPhotos].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCurrentPhotos = [...currentPhotos].sort((a, b) => a.name.localeCompare(b.name));
  
  for (let i = 0; i < totalImages; i++) {
    const babyName = sortedBabyPhotos[i].name.split('_01')[0].replace(/_/g, ' ');
    const currentName = sortedCurrentPhotos[i].name.split('_02')[0].replace(/_/g, ' ');
    
    if (babyName !== currentName) {
      console.warn(`Name mismatch: ${babyName} vs ${currentName}`);
    }

    const textOpts = {
      ...globalTextOptions,
      text: globalTextOptions.enabled ? (globalTextOptions.text || babyName) : ''
    };
    
    const result = await createCombinedImage(
      sortedBabyPhotos[i],
      sortedCurrentPhotos[i],
      babyName,
      textOpts
    );
    
    results.push(result);
    onProgress((i + 1) / totalImages * 100);
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return results;
};

const createCombinedImage = async (
  leftFile: FileData,
  rightFile: FileData,
  name: string,
  textOptions?: TextOptions
): Promise<ProcessedImage> => {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }
    
    // Set canvas to 16:9 aspect ratio
    canvas.width = 1920;
    canvas.height = 1080;
    
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    const leftImg = new Image();
    const rightImg = new Image();
    
    let leftLoaded = false;
    let rightLoaded = false;
    
    const checkBothLoaded = () => {
      if (leftLoaded && rightLoaded) {
        const drawImage = (img: HTMLImageElement, file: FileData, x: number) => {
          const targetWidth = canvas.width / 2;
          const targetHeight = canvas.height;
          
          let sourceX = 0;
          let sourceY = 0;
          let sourceWidth = img.width;
          let sourceHeight = img.height;
          
          if (file.crop) {
            sourceX = file.crop.x;
            sourceY = file.crop.y;
            sourceWidth = file.crop.width;
            sourceHeight = file.crop.height;
          }
          
          // Calculate scaling to maintain aspect ratio
          const scale = Math.max(targetWidth / sourceWidth, targetHeight / sourceHeight);
          const scaledWidth = sourceWidth * scale;
          const scaledHeight = sourceHeight * scale;
          
          // Center the image
          const drawX = x + (targetWidth - scaledWidth) / 2;
          const drawY = (targetHeight - scaledHeight) / 2;
          
          ctx.drawImage(
            img,
            sourceX,
            sourceY,
            sourceWidth,
            sourceHeight,
            drawX,
            drawY,
            scaledWidth,
            scaledHeight
          );
        };

        drawImage(leftImg, leftFile, 0);
        drawImage(rightImg, rightFile, canvas.width / 2);

        // Add text if enabled
        if (textOptions?.enabled && textOptions.text) {
          ctx.font = `${textOptions.size}px ${textOptions.font}`;
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 2;
          
          const text = textOptions.text;
          const metrics = ctx.measureText(text);
          const textHeight = textOptions.size;
          
          let textX = 0;
          let textY = 0;
          
          switch (textOptions.position) {
            case 'top-left':
              textX = 20;
              textY = textHeight + 20;
              break;
            case 'top-right':
              textX = canvas.width - metrics.width - 20;
              textY = textHeight + 20;
              break;
            case 'bottom-left':
              textX = 20;
              textY = canvas.height - 20;
              break;
            case 'bottom-right':
              textX = canvas.width - metrics.width - 20;
              textY = canvas.height - 20;
              break;
          }
          
          // Add white stroke for better visibility
          ctx.strokeText(text, textX, textY);
          ctx.fillText(text, textX, textY);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve({
          dataUrl,
          name,
          leftPhoto: leftFile.name,
          rightPhoto: rightFile.name,
          textOptions
        });
      }
    };
    
    leftImg.onload = () => {
      leftLoaded = true;
      checkBothLoaded();
    };
    
    rightImg.onload = () => {
      rightLoaded = true;
      checkBothLoaded();
    };
    
    leftImg.onerror = () => reject(new Error(`Failed to load left image: ${leftFile.name}`));
    rightImg.onerror = () => reject(new Error(`Failed to load right image: ${rightFile.name}`));
    
    leftImg.src = leftFile.preview;
    rightImg.src = rightFile.preview;
  });
};

export const downloadAsZip = async (images: ProcessedImage[]) => {
  const zip = new JSZip();
  
  images.forEach((image) => {
    //const fileName = `combined_${image.name}.jpg`;
    const fileName = `${image.name}_combined.jpg`;
    const data = image.dataUrl.split(',')[1];
    zip.file(fileName, data, { base64: true });
  });
  
  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = 'processed_images.zip';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
};