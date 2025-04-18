class AnimationExporter {
  constructor() {
    this.setupEventListeners();
    this.orientations = {
      knob: 'vertical',
      progress: 'vertical'
    };
  }

  setupEventListeners() {
    const exportBtn = document.getElementById('exportButton');
    exportBtn.addEventListener('click', () => this.showOrientationModal());
    
    document.getElementById('confirmOrientation').addEventListener('click', () => {
      this.orientations.knob = document.querySelector('input[name="knobOrientation"]:checked').value;
      this.orientations.progress = document.querySelector('input[name="progressOrientation"]:checked').value;
      document.getElementById('orientationModal').style.display = 'none';
      this.handleExport();
    });

    document.getElementById('cancelOrientation').addEventListener('click', () => {
      document.getElementById('orientationModal').style.display = 'none';
    });
  }

  showOrientationModal() {
    const modal = document.getElementById('orientationModal');
    modal.style.display = 'block';
  }

  async handleExport() {
    const exportType = document.querySelector('input[name="exportType"]:checked')?.value;
    if (!exportType) {
      alert('Please select an export type (PNG Sequence or Sprite Sheet)');
      return;
    }

    const volumeKnob = document.getElementById('volumeKnobCanvas').__volumeKnob;
    const progressBar = document.getElementById('progressBarSVG').progressBarInstance;

    volumeKnob.stopAnimation();
    progressBar.stopAnimation();

    try {
      const zip = new JSZip();
      const now = new Date();
      const day = now.getDate();
      const month = this.getMonthName(now.getMonth());
      const year = now.getFullYear();
      const hour = String(now.getHours()).padStart(2, '0');
      const minute = String(now.getMinutes()).padStart(2, '0');
      const baseFileName = `Knob_Slider_${day}-${month}-${year}_${hour}${minute}`;

      const knobOrientation = this.orientations.knob;
      const progressOrientation = this.orientations.progress;

      const metadata = this.generateSpriteMetadata(volumeKnob, progressBar);
      metadata.knob.orientation = knobOrientation;
      metadata.progressBar.orientation = progressOrientation;

      if (exportType === 'pngSequence') {
        const { knobFrames, progressFrames } = await this.generateAnimationFrames(volumeKnob, progressBar);

        for (let i = 0; i < knobFrames.length; i++) {
          const canvas = knobFrames[i];
          const filename = `${baseFileName}_knob_${knobOrientation}_frame_${String(i).padStart(4, '0')}.png`;
          const imageData = this.canvasToBlob(canvas);
          zip.file(filename, imageData.split(',')[1], { base64: true });
        }

        for (let i = 0; i < progressFrames.length; i++) {
          const canvas = progressFrames[i];
          const filename = `${baseFileName}_progress_${progressOrientation}_frame_${String(i).padStart(4, '0')}.png`;
          const imageData = this.canvasToBlob(canvas);
          zip.file(filename, imageData.split(',')[1], { base64: true });
        }
      } else if (exportType === 'spriteSheet') {
        let knobSheetCanvas;
        let progressSheetCanvas;

        if (knobOrientation === 'vertical') {
          knobSheetCanvas = await this.generateKnobSpriteSheet(volumeKnob, false);
        } else {
          knobSheetCanvas = await this.generateKnobSpriteSheet(volumeKnob, true);
        }

        if (progressOrientation === 'vertical') {
          progressSheetCanvas = await this.generateProgressSpriteSheet(progressBar, false);
        } else {
          progressSheetCanvas = await this.generateProgressSpriteSheet(progressBar, true);
        }

        const knobSheetData = knobSheetCanvas.toDataURL('image/png');
        const progressSheetData = progressSheetCanvas.toDataURL('image/png');

        zip.file(`${baseFileName}_knob_${knobOrientation}_sprite_sheet.png`, knobSheetData.split(',')[1], { base64: true });
        zip.file(`${baseFileName}_progress_${progressOrientation}_sprite_sheet.png`, progressSheetData.split(',')[1], { base64: true });
      }

      zip.file(`${baseFileName}_sprite_strip_metadata.json`, JSON.stringify(metadata, null, 2));

      const content = await zip.generateAsync({ type: 'blob' });
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(content);
      downloadLink.download = `${baseFileName}.zip`;
      downloadLink.click();
      URL.revokeObjectURL(downloadLink.href);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please check console for details.');
    } finally {
      volumeKnob.animate();
      progressBar.animate();
    }
  }

  async generateAnimationFrames(volumeKnob, progressBar) {
    const knobFrames = [];
    const progressFrames = [];
    const totalKnobFrames = parseInt(document.getElementById('knobFrames').value);
    const knobCanvas = volumeKnob.canvas;
    const width = knobCanvas.width;
    const height = knobCanvas.height;

    const originalAngle = volumeKnob.angle;
    const originalFrameCount = volumeKnob.frameCount;

    const isKnobHorizontal = this.orientations.knob === 'horizontal';
    const isProgressHorizontal = this.orientations.progress === 'horizontal';

    for (let i = 0; i < totalKnobFrames; i++) {
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = width;
      frameCanvas.height = height;
      const ctx = frameCanvas.getContext('2d');

      volumeKnob.angle = volumeKnob.initialAngle + (volumeKnob.degreesPerFrame * i);
      volumeKnob.draw();

      ctx.drawImage(knobCanvas, 0, 0);

      if (isKnobHorizontal) {
        const rotatedCanvas = await volumeKnob.drawRotated(frameCanvas, 90);
        knobFrames.push(rotatedCanvas);
      } else {
        knobFrames.push(frameCanvas);
      }
    }

    volumeKnob.angle = originalAngle;
    volumeKnob.frameCount = originalFrameCount;
    volumeKnob.draw();

    const generatedProgressFrames = await progressBar.generateProgressAnimation();

    for (const frame of generatedProgressFrames) {
      progressFrames.push(frame);
    }

    return { knobFrames, progressFrames };
  }

  async generateKnobSpriteSheet(volumeKnob, horizontal = false) {
    const frames = await this.generateAnimationFrames(volumeKnob, {
      generateProgressAnimation: async () => []
    }).then(result => result.knobFrames);

    if (frames.length === 0) return document.createElement('canvas');

    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;
    const gap = 1;

    const sheetCanvas = document.createElement('canvas');

    if (horizontal) {
      sheetCanvas.width = frameWidth * frames.length + gap * (frames.length - 1);
      sheetCanvas.height = frameHeight;
    } else {
      sheetCanvas.width = frameWidth;
      sheetCanvas.height = frameHeight * frames.length + gap * (frames.length - 1);
    }

    const ctx = sheetCanvas.getContext('2d');

    frames.forEach((frameCanvas, index) => {
      if (horizontal) {
        const x = index * (frameWidth + gap);
        ctx.drawImage(frameCanvas, x, 0);
      } else {
        const y = index * (frameHeight + gap);
        ctx.drawImage(frameCanvas, 0, y);
      }
    });

    return sheetCanvas;
  }

  async generateProgressSpriteSheet(progressBar, horizontal = false) {
    const frames = await progressBar.generateProgressAnimation();
    if (frames.length === 0) return document.createElement('canvas');

    const frameWidth = frames[0].width;
    const frameHeight = frames[0].height;
    const gap = 2;
    const endPadding = 2;

    const sheetCanvas = document.createElement('canvas');
    if (horizontal) {
      sheetCanvas.width = frameWidth * frames.length + gap * (frames.length - 1) + endPadding;
      sheetCanvas.height = frameHeight;
    } else {
      sheetCanvas.width = frameWidth;
      sheetCanvas.height = frameHeight * frames.length + gap * (frames.length - 1) + endPadding;
    }

    const ctx = sheetCanvas.getContext('2d');

    for (let i = 0; i < frames.length; i++) {
      if (horizontal) {
        const x = i * (frameWidth + gap);
        ctx.drawImage(frames[i], x, 0);
      } else {
        const y = i * (frameHeight + gap);
        ctx.drawImage(frames[i], 0, y);
      }
    }
    
    return sheetCanvas;
  }

  generateSpriteMetadata(volumeKnob, progressBar) {
    const knobFrames = parseInt(document.getElementById('knobFrames').value);
    const progressFrames = parseInt(document.getElementById('progressFrames').value);
    const knobWidth = parseInt(document.getElementById('knobCanvasWidth').value);
    const knobHeight = parseInt(document.getElementById('knobCanvasHeight').value);
    const progressWidth = parseInt(document.getElementById('progressCanvasWidth').value);
    const progressHeight = parseInt(document.getElementById('progressCanvasHeight').value);

    return {
      knob: {
        frameWidth: knobWidth,
        frameHeight: knobHeight,
        frameCount: knobFrames,
        stripWidth: knobWidth * knobFrames,
        stripHeight: knobHeight
      },
      progressBar: {
        frameWidth: progressWidth,
        frameHeight: progressHeight,
        frameCount: progressFrames,
        stripWidth: progressWidth * progressFrames,
        stripHeight: progressHeight
      }
    };
  }

  getMonthName(month) {
    const monthNames = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ];
    return monthNames[month];
  }

  canvasToBlob(canvas) {
    return canvas.toDataURL('image/png');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AnimationExporter();
});