import { FileData, ProcessedImage, TextOptions } from '../types';
import JSZip from 'jszip';

export const processImages = async (
  babyPhotos: FileData[],
  currentPhotos: FileData[],
  onProgress: (progress: number) => void
): Promise<ProcessedImage[]> => {
  const results: ProcessedImage[] = [];
  const totalImages = Math.min(babyPhotos.length, currentPhotos.length);
  
  const sortedBabyPhotos = [...babyPhotos].sort((a, b) => a.name.localeCompare(b.name));
  const sortedCurrentPhotos = [...currentPhotos].sort((a, b) => a.name.localeCompare(b.name));
  
  for (let i = 0; i < totalImages; i++) {
    const babyName = sortedBabyPhotos[i].name.split('_01')[0];
    const currentName = sortedCurrentPhotos[i].name.split('_02')[0];
    
    const result = await createCombinedImage(
      sortedBabyPhotos[i],
      sortedCurrentPhotos[i],
      babyName
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
        // Apply crops if specified
        const drawImage = (img: HTMLImageElement, file: FileData, x: number) => {
          if (file.crop) {
            const scale = 960 / file.crop.width;
            const height = file.crop.height * scale;
            ctx.drawImage(
              img,
              file.crop.x,
              file.crop.y,
              file.crop.width,
              file.crop.height,
              x,
              (canvas.height - height) / 2,
              960,
              height
            );
          } else {
            const scale = 960 / img.width;
            const height = img.height * scale;
            let y = (canvas.height - height) / 2;
            
            if (height < canvas.height) {
              const additionalScale = canvas.height / height;
              const newWidth = 960 * additionalScale;
              const newHeight = height * additionalScale;
              ctx.drawImage(img, x, 0, newWidth, newHeight);
            } else {
              ctx.drawImage(img, x, y, 960, height);
            }
          }
        };

        drawImage(leftImg, leftFile, 0);
        drawImage(rightImg, rightFile, canvas.width / 2);

        // Add text if enabled
        if (textOptions?.enabled) {
          ctx.font = `${textOptions.size}px ${textOptions.font}`;
          ctx.fillStyle = '#000000';
          
          const text = textOptions.text || name.replace('_', ' ');
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
  
  images.forEach((image, index) => {
    const fileName = `combined_${image.name}.jpg`;
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