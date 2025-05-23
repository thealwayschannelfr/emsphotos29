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
    const nameParts = sortedBabyPhotos[i].name.split('_01')[0].split('_');
    const lastName = nameParts[0];
    const firstName = nameParts[1];
    const formattedName = `${firstName} ${lastName}`;
    
    const textOpts = {
      ...globalTextOptions,
      text: globalTextOptions.enabled ? (globalTextOptions.text || formattedName) : formattedName
    };
    
    const result = await createCombinedImage(
      sortedBabyPhotos[i],
      sortedCurrentPhotos[i],
      formattedName,
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
        const drawImage = (img: HTMLImageElement, transform: any, x: number) => {
          const targetWidth = canvas.width / 2;
          const targetHeight = canvas.height;
          
          const aspectRatio = img.width / img.height;
          let drawWidth = targetWidth;
          let drawHeight = targetHeight;
          
          if (aspectRatio > targetWidth / targetHeight) {
            drawHeight = targetWidth / aspectRatio;
          } else {
            drawWidth = targetHeight * aspectRatio;
          }
          
          const baseX = x + (targetWidth - drawWidth) / 2;
          const baseY = (targetHeight - drawHeight) / 2;
          
          ctx.save();
          
          // Apply transformations relative to the center of the image's space
          const centerX = x + targetWidth / 2;
          const centerY = targetHeight / 2;
          
          ctx.translate(centerX, centerY);
          
          if (transform) {
            // Apply scale
            ctx.scale(transform.scale, transform.scale);
            
            // Apply rotation (convert to radians)
            ctx.rotate((transform.rotation * Math.PI) / 180);
            
            // Apply position
            ctx.translate(transform.position.x / transform.scale, transform.position.y / transform.scale);
          }
          
          // Draw relative to center
          ctx.drawImage(
            img,
            -drawWidth / 2,
            -drawHeight / 2,
            drawWidth,
            drawHeight
          );
          
          ctx.restore();
        };

        // Draw left image with its transform
        drawImage(leftImg, leftFile.transform, 0);
        
        // Draw right image with its transform
        drawImage(rightImg, rightFile.transform, canvas.width / 2);

        // Draw text if enabled
        if (textOptions?.enabled && textOptions?.text) {
          const fontStyle = [];
          if (textOptions.bold) fontStyle.push('bold');
          if (textOptions.italic) fontStyle.push('italic');
          
          ctx.font = `${fontStyle.join(' ')} ${textOptions.size}px ${textOptions.font}`;
          ctx.fillStyle = textOptions.color || '#000000';
          
          const text = textOptions.text;
          const metrics = ctx.measureText(text);
          const textHeight = textOptions.size;
          
          let textX = 0;
          let textY = 0;
          
          const padding = 20;
          
          switch (textOptions.position) {
            case 'top-left':
              textX = padding;
              textY = textHeight + padding;
              break;
            case 'top-right':
              textX = canvas.width - metrics.width - padding;
              textY = textHeight + padding;
              break;
            case 'bottom-left':
              textX = padding;
              textY = canvas.height - padding;
              break;
            case 'bottom-right':
              textX = canvas.width - metrics.width - padding;
              textY = canvas.height - padding;
              break;
          }
          
          if (textOptions.stroke) {
            ctx.strokeStyle = textOptions.strokeColor || '#FFFFFF';
            ctx.lineWidth = textOptions.strokeWidth || 2;
            ctx.strokeText(text, textX, textY);
          }
          
          ctx.fillText(text, textX, textY);
        }
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        
        resolve({
          dataUrl,
          name,
          leftPhoto: leftFile.preview,
          rightPhoto: rightFile.preview,
          textOptions,
          transform: {
            left: leftFile.transform,
            right: rightFile.transform
          }
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