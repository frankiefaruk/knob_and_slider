class ProgressBar {
  constructor(svg) {
    this.svg = svg;
    svg.progressBarInstance = this;

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.initialize());
    } else {
      this.initialize();
    }

    // Store initial default settings
    this.defaultSettings = {
      barColor: "#343434",
      fillColor: "#808080",
      progressEdgeColor: "#808080",
      progressEdgeStroke: true,
      progressEdgeThickness: "2",
      progressFrames: "127",
      progressCanvasWidth: "20",
      progressCanvasHeight: "300",
      autoBarRounded: true
    };

    // Save current settings as defaults
    localStorage.setItem("progressBarDefaultSettings", JSON.stringify(this.defaultSettings));
  }

  initialize() {
    this.strokeRect = document.getElementById('progressStroke');
    this.fillRect = document.getElementById('progressFill'); 
    this.bgRect = document.getElementById('progressBg');

    if (!this.strokeRect || !this.fillRect || !this.bgRect) {
      console.error('Required SVG elements not found');
      return;
    }

    this.isAnimating = true;
    this.animationDelay = 100;
    this.lastFrameTime = null;

    const widthInput = document.getElementById('progressCanvasWidth');
    const heightInput = document.getElementById('progressCanvasHeight');

    this.svgWidth = widthInput ? parseInt(widthInput.value) : 20;
    this.svgHeight = heightInput ? parseInt(heightInput.value) : 300;

    this.updateSVGSize();

    this.barLength = 300;
    this.barThickness = 50;

    this.loadSettings();

    // Update universal controls to use progress-specific IDs
    this.progressEdgeColorPicker = document.getElementById('progressEdgeColor');
    this.progressEdgeThicknessInput = document.getElementById('progressEdgeThickness');
    this.progressEdgeStrokeCheckbox = document.getElementById('progressEdgeStroke');
    this.progressFramesInput = document.getElementById('progressFrames');

    if (this.progressEdgeThicknessInput && this.progressFramesInput) {
      this.barEdgeThickness = parseInt(this.progressEdgeThicknessInput.value);
    }

    this.barAutoRoundedCheckbox = document.getElementById('barAutoRounded');

    this.frameCount = 0;
    this.animationComplete = false;

    this.setupEventListeners();
    this.setupActiveLayerEventListeners();
    this.setupUniversalControlEventListeners();
    this.updateSVGAttributes();
    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }

  setupActiveLayerEventListeners() {
    const radios = document.querySelectorAll('input[name="activeProgressLayer"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
         console.log("Active progress layer changed to", radio.value);
      });
    });
  }

  loadSettings() {
    const saved = localStorage.getItem("progressBarSettings");
    const defaults = localStorage.getItem("progressBarDefaultSettings");

    if (saved) {
      try {
        const s = JSON.parse(saved);
        document.getElementById('progress_baseColor').value = s.barColor;
        document.getElementById('progress_fillColor').value = s.fillColor;
        document.getElementById('progressEdgeColor').value = s.progressEdgeColor;
        document.getElementById('progressEdgeStroke').checked = s.progressEdgeStroke;
        document.getElementById('progressEdgeThickness').value = s.progressEdgeThickness;
        document.getElementById('progressEdgeThicknessValue').textContent = s.progressEdgeThickness;
        document.getElementById('progressFrames').value = s.progressFrames;
        if (s.progressCanvasWidth) {
          document.getElementById('progressCanvasWidth').value = s.progressCanvasWidth;
          this.svg.setAttribute('width', s.progressCanvasWidth);
        }
        if (s.progressCanvasHeight) {
          document.getElementById('progressCanvasHeight').value = s.progressCanvasHeight;
          this.svg.setAttribute('height', s.progressCanvasHeight);
        }
        if (s.autoBarRounded !== undefined) {
          document.getElementById('barAutoRounded').checked = s.autoBarRounded;
        }
      } catch (e) {
        console.error("Error parsing progressBarSettings:", e);
      }
    } else if (defaults) {
      try {
        const d = JSON.parse(defaults);
        document.getElementById('progress_baseColor').value = d.barColor;
        document.getElementById('progress_fillColor').value = d.fillColor;
        document.getElementById('progressEdgeColor').value = d.progressEdgeColor;
        document.getElementById('progressEdgeStroke').checked = d.progressEdgeStroke;
        document.getElementById('progressEdgeThickness').value = d.progressEdgeThickness;
        document.getElementById('progressEdgeThicknessValue').textContent = d.progressEdgeThickness;
        document.getElementById('progressFrames').value = d.progressFrames;
        if (d.progressCanvasWidth) {
          document.getElementById('progressCanvasWidth').value = d.progressCanvasWidth;
          this.svg.setAttribute('width', d.progressCanvasWidth);
        }
        if (d.progressCanvasHeight) {
          document.getElementById('progressCanvasHeight').value = d.progressCanvasHeight;
          this.svg.setAttribute('height', d.progressCanvasHeight);
        }
        if (d.autoBarRounded !== undefined) {
          document.getElementById('barAutoRounded').checked = d.autoBarRounded;
        }
      } catch (e) {
        console.error("Error parsing progressBarDefaultSettings:", e);
      }
    }
  }

  saveSettings() {
    const settings = {
      barColor: document.getElementById('progress_baseColor').value,
      fillColor: document.getElementById('progress_fillColor').value,
      progressEdgeColor: document.getElementById('progressEdgeColor').value,
      progressEdgeStroke: document.getElementById('progressEdgeStroke').checked,
      progressEdgeThickness: document.getElementById('progressEdgeThickness').value,
      progressFrames: document.getElementById('progressFrames').value,
      progressCanvasWidth: document.getElementById('progressCanvasWidth').value,
      progressCanvasHeight: document.getElementById('progressCanvasHeight').value,
      autoBarRounded: document.getElementById('barAutoRounded').checked
    };
    localStorage.setItem("progressBarSettings", JSON.stringify(settings));
  }

  setupEventListeners() {
    this.progressEdgeStrokeCheckbox.addEventListener('change', () => {
      this.updateSVGAttributes();
      this.saveSettings();
    });
    this.progressEdgeThicknessInput.addEventListener('input', () => {
      const value = this.progressEdgeThicknessInput.value;
      document.getElementById('progressEdgeThicknessValue').textContent = value;
      this.updateSVGAttributes();
      this.saveSettings();
    });
    this.progressEdgeColorPicker.addEventListener('input', () => {
      this.updateSVGAttributes();
      this.saveSettings();
    });
    this.progressFramesInput.addEventListener('input', () => {
      this.totalFrames = parseInt(this.progressFramesInput.value);
      this.saveSettings();
    });

    document.getElementById('progressCanvasWidth').addEventListener('input', (e) => {
      this.svgWidth = parseInt(e.target.value);
      this.updateSVGSize();
      this.updateSVGAttributes();
    });

    document.getElementById('progressCanvasHeight').addEventListener('input', (e) => {
      this.svgHeight = parseInt(e.target.value);
      this.updateSVGSize();
      this.updateSVGAttributes();
    });

    this.barAutoRoundedCheckbox.addEventListener('change', () => {
      this.updateSVGAttributes();
      this.saveSettings();
    });
  }

  setupUniversalControlEventListeners() {
    document.getElementById('progress_baseColor').addEventListener('input', (e) => {
      this.bgRect.setAttribute('fill', e.target.value);
      this.saveSettings();
    });

    document.getElementById('progress_fillColor').addEventListener('input', (e) => {
      this.fillRect.setAttribute('fill', e.target.value);
      this.saveSettings();
    });
  }

  updateSVGSize() {
    if (!this.svg || !this.strokeRect || !this.bgRect || !this.fillRect) {
      console.error('Missing SVG elements in updateSVGSize.');
      return;
    }
    this.svg.setAttribute('width', this.svgWidth);
    this.svg.setAttribute('height', this.svgHeight);

    this.strokeRect.setAttribute('width', this.svgWidth);
    this.strokeRect.setAttribute('height', this.svgHeight);

    const strokeOffset = this.barEdgeThickness || 0;
    this.bgRect.setAttribute('x', strokeOffset);
    this.bgRect.setAttribute('y', strokeOffset);
    this.bgRect.setAttribute('width', this.svgWidth - (2 * strokeOffset));
    this.bgRect.setAttribute('height', this.svgHeight - (2 * strokeOffset));

    const progressDesign = document.getElementById('progressDesign');
    const totalHeight = this.svgHeight + 40;
    progressDesign.style.minHeight = `${totalHeight}px`;
    progressDesign.style.height = 'auto';

    this.fillRect.setAttribute('y', this.svgHeight - strokeOffset);
    this.fillRect.setAttribute('height', '0');
  }

  updateSVGAttributes() {
    let barRounded = 8;
    if (document.getElementById('barAutoRounded').checked) {
      barRounded = Math.min(10, Math.floor(this.svgWidth / 10));
    }
    this.barRounded = barRounded;

    this.svg.setAttribute('width', this.svgWidth);
    this.svg.setAttribute('height', this.svgHeight);

    this.strokeRect.setAttribute('width', this.svgWidth);
    this.strokeRect.setAttribute('height', this.svgHeight);
    this.strokeRect.setAttribute('rx', this.barRounded);
    this.strokeRect.setAttribute('ry', this.barRounded);
    let edgeEnabled = document.getElementById('progressEdgeStroke').checked;
    let edgeThickness = edgeEnabled ? parseInt(document.getElementById('progressEdgeThickness').value) : 0;
    this.barEdgeThickness = edgeThickness;

    this.strokeRect.setAttribute('fill',
      edgeThickness > 0 ?
      document.getElementById('progressEdgeColor').value :
      'transparent'
    );

    const strokeOffset = edgeThickness || 0;
    this.bgRect.setAttribute('x', strokeOffset);
    this.bgRect.setAttribute('y', strokeOffset);
    this.bgRect.setAttribute('width', this.svgWidth - (2 * strokeOffset));
    this.bgRect.setAttribute('height', this.svgHeight - (2 * strokeOffset));
    this.bgRect.setAttribute('rx', this.barRounded);
    this.bgRect.setAttribute('ry', this.barRounded);
    this.bgRect.setAttribute('fill', document.getElementById('progress_baseColor').value);

    this.fillRect.setAttribute('x', strokeOffset);
    this.fillRect.setAttribute('rx', this.barRounded);
    this.fillRect.setAttribute('ry', this.barRounded);
    this.fillRect.setAttribute('fill', document.getElementById('progress_fillColor').value);
    this.fillRect.setAttribute('width', this.svgWidth - (2 * strokeOffset));
  }

  async drawRotated(element, degrees = 90) {
    const tempCanvas = document.createElement('canvas');
    let width, height;
    if (element instanceof SVGElement) {
      width = parseInt(element.getAttribute('width'));
      height = parseInt(element.getAttribute('height'));
      if (degrees === 90 || degrees === -90) {
        tempCanvas.width = height;
        tempCanvas.height = width;
      } else {
        tempCanvas.width = width;
        tempCanvas.height = height;
      }
      const ctx = tempCanvas.getContext('2d');
      const svgString = new XMLSerializer().serializeToString(element);
      const blob = new Blob([svgString], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);
      const img = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = url;
      });
      ctx.save();
      if (degrees === 90) {
        ctx.translate(tempCanvas.width, 0);
      } else if (degrees === -90) {
        ctx.translate(0, tempCanvas.height);
      }
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(img, 0, 0);
      ctx.restore();
      URL.revokeObjectURL(url);
      return tempCanvas;
    } else if (element instanceof HTMLCanvasElement) {
      width = element.width;
      height = element.height;
      if (degrees === 90 || degrees === -90) {
        tempCanvas.width = height;
        tempCanvas.height = width;
      } else {
        tempCanvas.width = width;
        tempCanvas.height = height;
      }
      const ctx = tempCanvas.getContext('2d');
      ctx.save();
      if (degrees === 90) {
        ctx.translate(tempCanvas.width, 0);
      } else if (degrees === -90) {
        ctx.translate(0, tempCanvas.height);
      }
      ctx.rotate(degrees * Math.PI / 180);
      ctx.drawImage(element, 0, 0);
      ctx.restore();
      return tempCanvas;
    }
    return document.createElement('canvas');
  }

  async generateProgressAnimation() {
    const frames = [];
    const originalTotal = this.totalFrames;
    this.totalFrames = parseInt(document.getElementById('progressFrames').value);

    let strokeOffset = this.barEdgeThickness || 0;

    for(let frame = 0; frame < this.totalFrames; frame++) {
      const progress = frame / (this.totalFrames - 1);
      const fillHeight = (this.svgHeight - (this.barEdgeThickness * 2)) * progress;
      this.fillRect.setAttribute('y', this.svgHeight - strokeOffset - fillHeight);
      this.fillRect.setAttribute('height', fillHeight);

      const svgString = new XMLSerializer().serializeToString(this.svg);
      const blob = new Blob([svgString], {type: 'image/svg+xml'});
      const url = URL.createObjectURL(blob);

      const canvas = document.createElement('canvas');
      canvas.width = this.svgWidth;
      canvas.height = this.svgHeight;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, this.svgWidth, this.svgHeight);

      const img = await new Promise(resolve => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = url;
      });

      ctx.drawImage(img, 0, 0);
      frames.push(canvas);
      URL.revokeObjectURL(url);
    }

    this.totalFrames = originalTotal;
    return frames;
  }

  toggleAnimation() {
    this.isAnimating = !this.isAnimating;
    
    if (this.isAnimating) {
      this.lastFrameTime = null;
      this.animationId = requestAnimationFrame(this.animate.bind(this));
    } else {
      cancelAnimationFrame(this.animationId);
      this.frameCount = 0;
      this.fillRect.setAttribute('y', this.svgHeight - (this.barEdgeThickness || 0));
      this.fillRect.setAttribute('height', '0');
    }
  }

  animate(timestamp) {
    if (!this.isAnimating) return;
    if (!timestamp) timestamp = performance.now();
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < this.animationDelay) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
      return;
    }
    this.lastFrameTime = timestamp;

    this.frameCount++;
    const totalFrames = parseInt(document.getElementById('progressFrames').value);
    const progress = (this.frameCount % totalFrames) / (totalFrames - 1);
    let strokeOffset = this.barEdgeThickness || 0;
    const fillHeight = (this.svgHeight - (this.barEdgeThickness * 2)) * progress;
    this.fillRect.setAttribute('y', this.svgHeight - strokeOffset - fillHeight);
    this.fillRect.setAttribute('height', fillHeight);

    if (this.frameCount >= totalFrames) {
      this.frameCount = 0;
    }

    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  reset() {
    const settings = this.defaultSettings;
    
    // Reset all controls to default values
    document.getElementById('progress_baseColor').value = settings.barColor;
    document.getElementById('progress_fillColor').value = settings.fillColor;
    document.getElementById('progressEdgeColor').value = settings.progressEdgeColor;
    document.getElementById('progressEdgeStroke').checked = settings.progressEdgeStroke;
    document.getElementById('progressEdgeThickness').value = settings.progressEdgeThickness;
    document.getElementById('progressEdgeThicknessValue').textContent = settings.progressEdgeThickness;
    document.getElementById('progressFrames').value = settings.progressFrames;
    document.getElementById('progressCanvasWidth').value = settings.progressCanvasWidth;
    document.getElementById('progressCanvasHeight').value = settings.progressCanvasHeight;
    document.getElementById('barAutoRounded').checked = settings.autoBarRounded;

    // Update SVG dimensions
    this.svg.setAttribute('width', settings.progressCanvasWidth);
    this.svg.setAttribute('height', settings.progressCanvasHeight);
    
    // Update all visual elements
    this.updateSVGSize();
    this.updateSVGAttributes();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const svg = document.getElementById('progressBarSVG');
  if (svg) {
    new ProgressBar(svg);
  } else {
    console.error('Progress Bar SVG element not found');
  }
});