class VolumeKnob {
  constructor(canvas) {
    if (!canvas) {
      console.error('Canvas element not found');
      return;
    }

    canvas.__volumeKnob = this;
    this.canvasWidth = parseInt(document.getElementById('knobCanvasWidth')?.value || 200);
    this.canvasHeight = parseInt(document.getElementById('knobCanvasHeight')?.value || 200);

    // Add custom skin properties
    this.customSkin = null;
    this.useCustomSkin = false;

    // Initialize layer settings with default values (for each layer include new Edge Segments properties)
    this.defaultSettings = {
      layerSettings: {
        1: {
          enabled: true,
          stretchEnabled: false,
          extensionValue: 90,
          indicatorSize: 8,
          indicatorOffset: 70, // Default Radial Offset (reset to 70 on reset)
          indicatorShape: 'circle',
          edgeStrokeEnabled: true, // Default Edge Stroke ticked
          edgeStrokeThickness: 2,  // Keep default at 2, but max will be 4
          edgeStrokeColor: '#808080',
          edgeStrokeOffset: 0,
          baseColor: '#343434',
          fillColor: '#808080',
          edgeSegmentsEnabled: false,
          edgeSegmentType: 'dot',
          edgeSegmentAmount: 5,
          innerFillSize: 100,
          useCustomSkin: false,
          customSkinImage: null,
          bevelEmboss: 0,
          innerShadow: 0
        },
        2: {
          enabled: false,
          stretchEnabled: false,
          extensionValue: 90,
          indicatorSize: 8,
          indicatorOffset: 70,
          indicatorShape: 'circle',
          edgeStrokeEnabled: true,
          edgeStrokeThickness: 2,  // Keep default at 2, but max will be 4
          edgeStrokeColor: '#808080',
          edgeStrokeOffset: 0,
          baseColor: '#343434',
          fillColor: '#808080',
          edgeSegmentsEnabled: false,
          edgeSegmentType: 'dot',
          edgeSegmentAmount: 5,
          innerFillSize: 100,
          useCustomSkin: false,
          customSkinImage: null,
          bevelEmboss: 0,
          innerShadow: 0
        },
        3: {
          enabled: false,
          stretchEnabled: false,
          extensionValue: 90,
          indicatorSize: 8,
          indicatorOffset: 70,
          indicatorShape: 'circle',
          edgeStrokeEnabled: true,
          edgeStrokeThickness: 2,  // Keep default at 2, but max will be 4
          edgeStrokeColor: '#808080',
          edgeStrokeOffset: 0,
          baseColor: '#343434',
          fillColor: '#808080',
          edgeSegmentsEnabled: false,
          edgeSegmentType: 'dot',
          edgeSegmentAmount: 5,
          innerFillSize: 100,
          useCustomSkin: false,
          customSkinImage: null,
          bevelEmboss: 0,
          innerShadow: 0
        }
      },
      knobFrames: 127,
      knobCanvasWidth: 200,
      knobCanvasHeight: 200
    };
    this.layerSettings = JSON.parse(JSON.stringify(this.defaultSettings.layerSettings));

    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isAnimating = true;
    this.animationDelay = 100;
    this.lastFrameTime = null;
    this.frameCount = 0; // Initialize frameCount to ensure correct animation start

    // Use volume-specific IDs for universal indicator colors
    this.knobColor = document.getElementById('volume_baseColor')?.value || "#343434";
    this.strokeColor = document.getElementById('volume_fillColor')?.value || "#808080";
    this.strokeEdgeColor = document.getElementById('volume_edgeStrokeColor')?.value || "#808080";
    this.totalFrames = parseInt(document.getElementById('knobFrames')?.value || 127);

    // Updated Animation: Start at -140° and end at +140° (Total 280° span)
    this.degreesPerFrame = 280 / this.totalFrames; // Animation from -140° to +140°
    this.initialAngle = -140; // Starting angle at -140 degrees
    this.angle = this.initialAngle;

    // Add manual rotation properties
    this.isDragging = false;
    this.dragStartAngle = 0;
    this.dragStartPosition = { x: 0, y: 0 };
    this.manualRotation = false;

    // Save current settings as defaults
    localStorage.setItem("volumeKnobDefaultSettings", JSON.stringify(this.defaultSettings));

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.init());
    } else {
      this.init();
    }
  }

  init() {
    this.loadSettings();

    // Setup event listeners after DOM is loaded
    this.setupEventListeners();
    this.setupLayerEventListeners();
    this.setupActiveLayerEventListeners();
    this.setupUniversalControlEventListeners();

    // Ensure the universal controls show the settings for the current active layer on load
    this.updateUniversalControls(this.getActiveLayer());

    // Add manual rotation event listeners
    this.setupManualRotationListeners();

    this.draw();

    this.animate = this.animate.bind(this);
    this.animationId = requestAnimationFrame(this.animate);
  }

  getActiveLayer() {
    const activeRadio = document.querySelector('input[name="activeVolumeLayer"]:checked');
    return activeRadio ? activeRadio.value : '1';
  }

  setupActiveLayerEventListeners() {
    const radios = document.querySelectorAll('input[name="activeVolumeLayer"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        this.updateUniversalControls(radio.value);
      });
    });
  }

  setupUniversalControlEventListeners() {
    const edgeSegmentsEnabledEl = document.getElementById('volume_edgeSegmentsEnabled');
    if (edgeSegmentsEnabledEl) {
      edgeSegmentsEnabledEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeSegmentsEnabled = e.target.checked;
        const edgeSegControls = document.getElementById('edgeSegmentsControls');
        if (edgeSegControls)
          edgeSegControls.style.display = e.target.checked ? 'block' : 'none';
        this.saveSettings();
        this.draw();
      });
    }

    const edgeSegmentTypeEl = document.getElementById('volume_edgeSegmentType');
    if (edgeSegmentTypeEl) {
      edgeSegmentTypeEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeSegmentType = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const edgeSegmentAmountEl = document.getElementById('volume_edgeSegmentAmount');
    if (edgeSegmentAmountEl) {
      edgeSegmentAmountEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeSegmentAmount = parseInt(e.target.value);
        const edgeSegAmountVal = document.getElementById('volume_edgeSegmentAmountValue');
        if (edgeSegAmountVal) edgeSegAmountVal.textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const stretchCheckbox = document.getElementById('volume_stretchEnabled');
    if (stretchCheckbox) {
      stretchCheckbox.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].stretchEnabled = e.target.checked;
        this.saveSettings();
        this.draw();
      });
    }

    const radialExtensionInput = document.getElementById('volume_radialExtension');
    if (radialExtensionInput) {
      radialExtensionInput.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].extensionValue = parseInt(e.target.value);
        const radialExtVal = document.getElementById('volume_radialExtensionValue');
        if (radialExtVal) radialExtVal.textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const baseColorEl = document.getElementById('volume_baseColor');
    if (baseColorEl) {
      baseColorEl.addEventListener('input', (e) => {
        this.knobColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const fillColorEl = document.getElementById('volume_fillColor');
    if (fillColorEl) {
      fillColorEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].fillColor = e.target.value;
        this.strokeColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
    if (edgeStrokeColorEl) {
      edgeStrokeColorEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeStrokeColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const edgeStrokeEnabledEl = document.getElementById('volume_edgeStrokeEnabled');
    if (edgeStrokeEnabledEl) {
      edgeStrokeEnabledEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeStrokeEnabled = e.target.checked;
        this.saveSettings();
        this.draw();
      });
    }

    const edgeStrokeThicknessEl = document.getElementById('volume_edgeStrokeThickness');
    if (edgeStrokeThicknessEl) {
      edgeStrokeThicknessEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].edgeStrokeThickness = Math.min(parseInt(e.target.value), 4);
        document.getElementById('volume_edgeStrokeThicknessValue').textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const knobFramesEl = document.getElementById('knobFrames');
    if (knobFramesEl) {
      knobFramesEl.addEventListener('input', (e) => {
        this.totalFrames = parseInt(e.target.value);
        this.degreesPerFrame = 280 / this.totalFrames;
        this.saveSettings();
      });
    }

    const knobCanvasWidthEl = document.getElementById('knobCanvasWidth');
    if (knobCanvasWidthEl) {
      knobCanvasWidthEl.addEventListener('input', (e) => {
        this.canvasWidth = parseInt(e.target.value);
        this.canvas.width = this.canvasWidth;
        this.saveSettings();
        this.draw();
      });
    }

    const knobCanvasHeightEl = document.getElementById('knobCanvasHeight');
    if (knobCanvasHeightEl) {
      knobCanvasHeightEl.addEventListener('input', (e) => {
        this.canvasHeight = parseInt(e.target.value);
        this.canvas.height = this.canvasHeight;
        this.saveSettings();
        this.draw();
      });
    }

    // Add circle size control
    const indicatorSizeEl = document.getElementById('volume_indicatorSize');
    if (indicatorSizeEl) {
      indicatorSizeEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].indicatorSize = parseInt(e.target.value);
        document.getElementById('volume_indicatorSizeValue').textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    // Add radial offset control
    const indicatorOffsetEl = document.getElementById('volume_indicatorOffset');
    if (indicatorOffsetEl) {
      indicatorOffsetEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].indicatorOffset = parseInt(e.target.value);
        document.getElementById('volume_indicatorOffsetValue').textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    const innerFillSizeEl = document.getElementById('volume_innerFillSize');
    if (innerFillSizeEl) {
      innerFillSizeEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].innerFillSize = parseInt(e.target.value);
        document.getElementById('volume_innerFillSizeValue').textContent = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }

    // Add custom skin upload event listener
    const customSkinUploadEl = document.getElementById('volume_customSkinUpload');
    if (customSkinUploadEl) {
      customSkinUploadEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        const file = e.target.files[0];
        
        if (file) {
          const reader = new FileReader();
          reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
              this.layerSettings[activeLayer].customSkinImage = img;
              // Show the image name in the label
              const customSkinLabel = document.getElementById('customSkinLabel');
              if (customSkinLabel) {
                customSkinLabel.textContent = file.name;
              }
              // Enable use custom skin checkbox
              const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
              if (useCustomSkinEl) {
                useCustomSkinEl.disabled = false;
                useCustomSkinEl.checked = true;
                this.layerSettings[activeLayer].useCustomSkin = true;
              }
              this.saveSettings();
              this.draw();
            };
            img.src = event.target.result;
          };
          reader.readAsDataURL(file);
        }
      });
    }

    const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
    if (useCustomSkinEl) {
      useCustomSkinEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].useCustomSkin = e.target.checked;
        this.saveSettings();
        this.draw();
      });
    }

    const clearCustomSkinEl = document.getElementById('clearCustomSkin');
    if (clearCustomSkinEl) {
      clearCustomSkinEl.addEventListener('click', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].customSkinImage = null;
        this.layerSettings[activeLayer].useCustomSkin = false;
        
        // Reset the file input
        const customSkinUploadEl = document.getElementById('volume_customSkinUpload');
        if (customSkinUploadEl) {
          customSkinUploadEl.value = '';
        }
        
        // Reset the label
        const customSkinLabel = document.getElementById('customSkinLabel');
        if (customSkinLabel) {
          customSkinLabel.textContent = 'No file chosen';
        }
        
        // Disable the checkbox
        const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
        if (useCustomSkinEl) {
          useCustomSkinEl.checked = false;
          useCustomSkinEl.disabled = true;
        }
        
        this.saveSettings();
        this.draw();
      });
    }

    const indicatorShapeEl = document.getElementById('volume_indicatorShape');
    if (indicatorShapeEl) {
      indicatorShapeEl.addEventListener('change', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].indicatorShape = e.target.value;
        this.saveSettings();
        this.draw();
      });
    }
    
    const bevelEl = document.getElementById('volume_bevelEmboss');
    if (bevelEl) {
      bevelEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].bevelEmboss = parseInt(e.target.value);
        this.saveSettings();
        this.draw();
      });
    }

    const innerShadowEl = document.getElementById('volume_innerShadow');
    if (innerShadowEl) {
      innerShadowEl.addEventListener('input', (e) => {
          const activeLayer = this.getActiveLayer();
          const value = parseFloat(e.target.value).toFixed(1); // Handle decimal values
          this.layerSettings[activeLayer].innerShadow = parseFloat(value);
          const innerShadowValueEl = document.getElementById('volume_innerShadowValue');
          if (innerShadowValueEl) innerShadowValueEl.textContent = value;
          this.saveSettings();
          this.draw();
      });
    }
  }

  setupEventListeners() {
    const baseColorEl = document.getElementById('volume_baseColor');
    if (baseColorEl) {
      baseColorEl.addEventListener('input', (e) => {
        this.knobColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    } else {
      console.error('Element volume_baseColor not found in setupEventListeners');
    }

    const fillColorEl = document.getElementById('volume_fillColor');
    if (fillColorEl) {
      fillColorEl.addEventListener('input', (e) => {
        const activeLayer = this.getActiveLayer();
        this.layerSettings[activeLayer].fillColor = e.target.value;
        this.strokeColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    } else {
      console.error('Element volume_fillColor not found in setupEventListeners');
    }

    const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
    if (edgeStrokeColorEl) {
      edgeStrokeColorEl.addEventListener('input', (e) => {
        this.strokeEdgeColor = e.target.value;
        this.saveSettings();
        this.draw();
      });
    } else {
      console.error('Element volume_edgeStrokeColor not found in setupEventListeners');
    }

    const knobFramesEl = document.getElementById('knobFrames');
    if (knobFramesEl) {
      knobFramesEl.addEventListener('input', (e) => {
        this.totalFrames = parseInt(e.target.value);
        this.degreesPerFrame = 280 / this.totalFrames;
        this.saveSettings();
      });
    } else {
      console.error('Element knobFrames not found in setupEventListeners');
    }

    const knobCanvasWidthEl = document.getElementById('knobCanvasWidth');
    if (knobCanvasWidthEl) {
      knobCanvasWidthEl.addEventListener('input', (e) => {
        this.canvasWidth = parseInt(e.target.value);
        this.canvas.width = this.canvasWidth;
        this.saveSettings();
        this.draw();
      });
    } else {
      console.error('Element knobCanvasWidth not found in setupEventListeners');
    }

    const knobCanvasHeightEl = document.getElementById('knobCanvasHeight');
    if (knobCanvasHeightEl) {
      knobCanvasHeightEl.addEventListener('input', (e) => {
        this.canvasHeight = parseInt(e.target.value);
        this.canvas.height = this.canvasHeight;
        this.saveSettings();
        this.draw();
      });
    } else {
      console.error('Element knobCanvasHeight not found in setupEventListeners');
    }
  }

  updateUniversalControls(layer) {
    const settings = this.layerSettings[layer];
    // Update base and fill colors
    const baseColorEl = document.getElementById('volume_baseColor');
    if (baseColorEl) baseColorEl.value = settings.baseColor || this.knobColor || '#343434';
    const fillColorEl = document.getElementById('volume_fillColor');
    if (fillColorEl) fillColorEl.value = settings.fillColor || this.strokeColor || '#808080';
    
    // Update stretch and extension controls
    const stretchCheckbox = document.getElementById('volume_stretchEnabled');
    if (stretchCheckbox) stretchCheckbox.checked = settings.stretchEnabled;
    const radialExtensionEl = document.getElementById('volume_radialExtension');
    if (radialExtensionEl) radialExtensionEl.value = settings.extensionValue;
    const radialExtensionValueEl = document.getElementById('volume_radialExtensionValue');
    if (radialExtensionValueEl) radialExtensionValueEl.textContent = settings.extensionValue;
    // Update indicator controls
    const indicatorSizeEl = document.getElementById('volume_indicatorSize');
    const indicatorSizeValueEl = document.getElementById('volume_indicatorSizeValue');
    if (indicatorSizeEl && indicatorSizeValueEl) {
      indicatorSizeEl.value = settings.indicatorSize;
      indicatorSizeValueEl.textContent = settings.indicatorSize;
    }
    const indicatorOffsetEl = document.getElementById('volume_indicatorOffset');
    const indicatorOffsetValueEl = document.getElementById('volume_indicatorOffsetValue');
    if (indicatorOffsetEl && indicatorOffsetValueEl) {
      indicatorOffsetEl.value = settings.indicatorOffset;
      indicatorOffsetValueEl.textContent = settings.indicatorOffset;
    }
    const indicatorShapeEl = document.getElementById('volume_indicatorShape');
    if (indicatorShapeEl) indicatorShapeEl.value = settings.indicatorShape || 'circle';
    // Update Edge Stroke controls (they are not hidden)
    const edgeStrokeEnabledEl = document.getElementById('volume_edgeStrokeEnabled');
    if (edgeStrokeEnabledEl) edgeStrokeEnabledEl.checked = settings.edgeStrokeEnabled;
    const edgeStrokeThicknessEl = document.getElementById('volume_edgeStrokeThickness');
    if (edgeStrokeThicknessEl) {
      edgeStrokeThicknessEl.value = settings.edgeStrokeThickness;
      document.getElementById('volume_edgeStrokeThicknessValue').textContent = settings.edgeStrokeThickness;
    }
    const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
    if (edgeStrokeColorEl) edgeStrokeColorEl.value = settings.edgeStrokeColor || '#808080';
    // Update Edge Segments controls
    const edgeSegmentsEnabledEl = document.getElementById('volume_edgeSegmentsEnabled');
    if (edgeSegmentsEnabledEl) edgeSegmentsEnabledEl.checked = settings.edgeSegmentsEnabled;
    const edgeSegmentTypeEl = document.getElementById('volume_edgeSegmentType');
    if (edgeSegmentTypeEl) edgeSegmentTypeEl.value = settings.edgeSegmentType;
    const edgeSegmentAmountEl = document.getElementById('volume_edgeSegmentAmount');
    if (edgeSegmentAmountEl) edgeSegmentAmountEl.value = settings.edgeSegmentAmount;
    const edgeSegmentAmountValueEl = document.getElementById('volume_edgeSegmentAmountValue');
    if (edgeSegmentAmountValueEl) edgeSegmentAmountValueEl.textContent = settings.edgeSegmentAmount;
    // Show or hide edge segments extra controls based on checkbox status
    const edgeSegmentsControls = document.getElementById('edgeSegmentsControls');
    if (edgeSegmentsControls) {
      edgeSegmentsControls.style.display = settings.edgeSegmentsEnabled ? 'block' : 'none';
    }
    // Update inner fill size control
    const innerFillSizeEl = document.getElementById('volume_innerFillSize');
    const innerFillSizeValueEl = document.getElementById('volume_innerFillSizeValue');
    if (innerFillSizeEl && innerFillSizeValueEl) {
      innerFillSizeEl.value = settings.innerFillSize;
      innerFillSizeValueEl.textContent = settings.innerFillSize;
    }
    // Update custom skin controls
    const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
    if (useCustomSkinEl) {
      useCustomSkinEl.checked = settings.useCustomSkin || false;
      useCustomSkinEl.disabled = !(settings.customSkinImage instanceof Image);
    }
    
    const customSkinLabel = document.getElementById('customSkinLabel');
    if (customSkinLabel) {
      if (settings.customSkinImage instanceof Image) {
        customSkinLabel.textContent = 'Custom skin loaded';
      } else {
        customSkinLabel.textContent = 'No file chosen';
      }
    }
    
    const bevelEl = document.getElementById('volume_bevelEmboss');
    const bevelValueEl = document.getElementById('volume_bevelEmbossValue');
    if (bevelEl && bevelValueEl) {
      bevelEl.value = (settings.bevelEmboss !== undefined) ? settings.bevelEmboss : 0;
      bevelValueEl.textContent = bevelEl.value;
    }
    
    const innerShadowEl = document.getElementById('volume_innerShadow');
    const innerShadowValueEl = document.getElementById('volume_innerShadowValue');
    if (innerShadowEl && innerShadowValueEl) {
      innerShadowEl.value = settings.innerShadow;
      innerShadowValueEl.textContent = settings.innerShadow;
    }
  }

  loadSettings() {
    const saved = localStorage.getItem("volumeKnobSettings");
    const defaults = localStorage.getItem("volumeKnobDefaultSettings");

    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.layerSettings) {
          this.layerSettings = s.layerSettings;
          Object.entries(this.layerSettings).forEach(([layer, settings]) => {
            const checkbox = document.querySelector(`input[name="volumeLayer"][value="${layer}"]`);
            if (checkbox) checkbox.checked = settings.enabled;
            if (settings.indicatorSize) {
              document.getElementById('volume_indicatorSize').value = settings.indicatorSize;
              document.getElementById('volume_indicatorSizeValue').textContent = settings.indicatorSize;
            }
            if (settings.indicatorOffset) {
              document.getElementById('volume_indicatorOffset').value = settings.indicatorOffset;
              document.getElementById('volume_indicatorOffsetValue').textContent = settings.indicatorOffset;
            }
            if (settings.edgeStrokeColor) {
              const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
              if (edgeStrokeColorEl) edgeStrokeColorEl.value = settings.edgeStrokeColor;
            }
            
            // Check if there's a customSkinImage stored as string and convert it to Image
            if (settings.customSkinImage && typeof settings.customSkinImage === 'string') {
              const img = new Image();
              img.onload = () => {
                this.layerSettings[layer].customSkinImage = img;
                this.draw();
              };
              img.src = settings.customSkinImage;
              // Clear string value to avoid problems until image is loaded
              this.layerSettings[layer].customSkinImage = null;
            }
          });
        }
        const baseColorEl = document.getElementById('volume_baseColor');
        if (baseColorEl) baseColorEl.value = s.knobColor || '#343434';
        const fillColorEl = document.getElementById('volume_fillColor');
        if (fillColorEl) fillColorEl.value = s.strokeColor || '#808080';
        const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
        if (edgeStrokeColorEl) edgeStrokeColorEl.value = s.strokeEdgeColor || '#808080';

        // Update the class properties
        this.knobColor = s.knobColor || '#343434';
        this.strokeColor = s.strokeColor || '#808080';
        this.strokeEdgeColor = s.strokeEdgeColor || '#808080';

        // Rest of the loadSettings code...
        const knobFramesEl = document.getElementById('knobFrames');
        if (knobFramesEl) knobFramesEl.value = s.knobFrames;
        if (s.knobCanvasWidth) {
          const knobCanvasWidthEl = document.getElementById('knobCanvasWidth');
          if (knobCanvasWidthEl) {
            knobCanvasWidthEl.value = s.knobCanvasWidth;
            this.canvas.width = parseInt(s.knobCanvasWidth);
          }
        }
        if (s.knobCanvasHeight) {
          const knobCanvasHeightEl = document.getElementById('knobCanvasHeight');
          if (knobCanvasHeightEl) {
            knobCanvasHeightEl.value = s.knobCanvasHeight;
            this.canvas.height = parseInt(s.knobCanvasHeight);
          }
        }
      } catch (e) {
        console.error("Error parsing volumeKnobSettings:", e);
      }
    } else if (defaults) {
      try {
        const d = JSON.parse(defaults);
        if (d.layerSettings) {
          this.layerSettings = d.layerSettings;
          Object.entries(this.layerSettings).forEach(([layer, settings]) => {
            const checkbox = document.querySelector(`input[name="volumeLayer"][value="${layer}"]`);
            if (checkbox) checkbox.checked = settings.enabled;
            if (settings.indicatorSize) {
              document.getElementById('volume_indicatorSize').value = settings.indicatorSize;
              document.getElementById('volume_indicatorSizeValue').textContent = settings.indicatorSize;
            }
            if (settings.indicatorOffset) {
              document.getElementById('volume_indicatorOffset').value = settings.indicatorOffset;
              document.getElementById('volume_indicatorOffsetValue').textContent = settings.indicatorOffset;
            }
          });
        }
        const baseColorEl = document.getElementById('volume_baseColor');
        if (baseColorEl) baseColorEl.value = d.knobColor;
        const fillColorEl = document.getElementById('volume_fillColor');
        if (fillColorEl) fillColorEl.value = d.strokeColor;
        const edgeStrokeColorEl = document.getElementById('volume_edgeStrokeColor');
        if (edgeStrokeColorEl) edgeStrokeColorEl.value = d.strokeEdgeColor;
        const knobFramesEl = document.getElementById('knobFrames');
        if (knobFramesEl) knobFramesEl.value = d.knobFrames;
        if (d.knobCanvasWidth) {
          const knobCanvasWidthEl = document.getElementById('knobCanvasWidth');
          if (knobCanvasWidthEl) {
            knobCanvasWidthEl.value = d.knobCanvasWidth;
            this.canvas.width = parseInt(d.knobCanvasWidth);
          }
        }
        if (d.knobCanvasHeight) {
          const knobCanvasHeightEl = document.getElementById('knobCanvasHeight');
          if (knobCanvasHeightEl) {
            knobCanvasHeightEl.value = d.knobCanvasHeight;
            this.canvas.height = parseInt(d.knobCanvasHeight);
          }
        }
      } catch (e) {
        console.error("Error parsing volumeKnobDefaultSettings:", e);
      }
    }
    
    // After loading settings, check if custom skin images need to be re-loaded from localStorage
    if (saved) {
      try {
        const s = JSON.parse(saved);
        if (s.layerSettings) {
          // Handle custom skin images
          Object.entries(s.layerSettings).forEach(([layer, settings]) => {
            if (settings.customSkinImage && typeof settings.customSkinImage === 'string') {
              const img = new Image();
              img.onload = () => {
                this.layerSettings[layer].customSkinImage = img;
                this.draw();
              };
              img.src = settings.customSkinImage;
            }
          });
        }
      } catch (e) {
        console.error("Error processing custom skin images:", e);
      }
    }
  }

  saveSettings() {
    const settings = {
      knobColor: document.getElementById('volume_baseColor')?.value,
      strokeColor: document.getElementById('volume_fillColor')?.value,
      strokeEdgeColor: document.getElementById('volume_edgeStrokeColor')?.value,
      knobFrames: document.getElementById('knobFrames')?.value,
      knobCanvasWidth: document.getElementById('knobCanvasWidth')?.value,
      knobCanvasHeight: document.getElementById('knobCanvasHeight')?.value,
      layerSettings: {}
    };

    // Deep clone the layer settings without Image objects
    Object.keys(this.layerSettings).forEach(layer => {
      settings.layerSettings[layer] = { ...this.layerSettings[layer] };
      const layerSettings = settings.layerSettings[layer];
      layerSettings.fillColor = document.getElementById('volume_fillColor')?.value || '#808080';
      layerSettings.indicatorSize = parseInt(document.getElementById('volume_indicatorSize')?.value || '8');
      layerSettings.indicatorOffset = parseInt(document.getElementById('volume_indicatorOffset')?.value || '70');
      layerSettings.edgeStrokeColor = document.getElementById('volume_edgeStrokeColor')?.value || '#808080';
      
      // Convert Image object to data URL if exists
      if (this.layerSettings[layer].customSkinImage instanceof Image) {
        try {
          // Create a temporary canvas to get the data URL
          const tempCanvas = document.createElement('canvas');
          const tempCtx = tempCanvas.getContext('2d');
          tempCanvas.width = this.layerSettings[layer].customSkinImage.width;
          tempCanvas.height = this.layerSettings[layer].customSkinImage.height;
          tempCtx.drawImage(this.layerSettings[layer].customSkinImage, 0, 0);
          layerSettings.customSkinImage = tempCanvas.toDataURL('image/png');
        } catch (e) {
          console.error('Error converting image to data URL:', e);
          layerSettings.customSkinImage = null;
        }
      } else {
        layerSettings.customSkinImage = null;
      }
      if (document.getElementById('volume_bevelEmboss')) {
        layerSettings.bevelEmboss = parseInt(document.getElementById('volume_bevelEmboss').value);
      }
      layerSettings.innerShadow = parseInt(document.getElementById('volume_innerShadow')?.value || '0');
    });

    localStorage.setItem("volumeKnobSettings", JSON.stringify(settings));
  }

  setupLayerEventListeners() {
    document.querySelectorAll('input[name="volumeLayer"]').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const layer = checkbox.value;
        this.layerSettings[layer].enabled = checkbox.checked;
        if (checkbox.checked) {
          this.updateUniversalControls(layer);
        }
        this.saveSettings();
        this.draw();
      });
    });
  }

  setupManualRotationListeners() {
    // Add mouse/touch events for manually rotating the knob
    this.canvas.addEventListener('mousedown', this.handleDragStart.bind(this));
    document.addEventListener('mousemove', this.handleDragMove.bind(this));
    document.addEventListener('mouseup', this.handleDragEnd.bind(this));
    
    // Touch events for mobile
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.handleDragStart(e.touches[0]);
    });
    document.addEventListener('touchmove', (e) => {
      e.preventDefault();
      this.handleDragMove(e.touches[0]);
    });
    document.addEventListener('touchend', this.handleDragEnd.bind(this));

    // Add manual rotation toggle button event listener
    const manualRotationBtn = document.getElementById('manualRotationBtn');
    if (manualRotationBtn) {
      manualRotationBtn.addEventListener('click', () => {
        this.toggleManualRotation();
      });
    }
  }

  toggleManualRotation() {
    this.manualRotation = !this.manualRotation;
    const manualRotationBtn = document.getElementById('manualRotationBtn');
    
    if (this.manualRotation) {
      // Stop automatic animation
      this.isAnimating = false;
      cancelAnimationFrame(this.animationId);
      manualRotationBtn.classList.add('active');
      manualRotationBtn.textContent = "Exit Manual Mode";
      
      // Stop progress bar animation too
      const progressBar = document.querySelector('#progressBarSVG').progressBarInstance;
      if (progressBar) {
        progressBar.isAnimating = false;
        cancelAnimationFrame(progressBar.animationId);
      }
      
      // Update play/pause button to show play icon
      const playPauseBtn = document.getElementById('playPauseButton');
      const svg = playPauseBtn.querySelector('svg');
      if (svg) {
        svg.innerHTML = '<path d="M8 5v14l11-7z"/>';
      }
    } else {
      // Reset to automatic animation state
      manualRotationBtn.classList.remove('active');
      manualRotationBtn.textContent = "Manual Rotation";
    }
  }

  handleDragStart(event) {
    if (!this.manualRotation) return;
    
    this.isDragging = true;
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + this.canvas.width / 2;
    const centerY = rect.top + this.canvas.height / 2;
    
    // Calculate starting angle
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    this.dragStartAngle = Math.atan2(y, x) * 180 / Math.PI;
    this.dragStartPosition = { x, y };
    
    // Store current angle
    this.startAngle = this.angle;
  }

  handleDragMove(event) {
    if (!this.isDragging || !this.manualRotation) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.left + this.canvas.width / 2;
    const centerY = rect.top + this.canvas.height / 2;
    
    // Calculate current angle
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const currentAngle = Math.atan2(y, x) * 180 / Math.PI;
    
    // Calculate angle difference, adjust by -85° to account for initial rotation
    let angleDiff = currentAngle - this.dragStartAngle;
    
    // Calculate new angle considering the -85° global rotation
    this.angle = this.startAngle + angleDiff;
    
    // Clamp angle to the range [-140, 140]
    this.angle = Math.max(-140, Math.min(140, this.angle));
    
    // Update frame count for display consistency
    const progress = (this.angle - this.initialAngle) / 280;
    this.frameCount = Math.round(progress * this.totalFrames);
    
    // Draw with new angle
    this.draw();
    
    // Update progress bar to match knob progress
    this.updateProgressBar(progress);
  }

  updateProgressBar(progress) {
    const progressBar = document.querySelector('#progressBarSVG').progressBarInstance;
    if (progressBar) {
      let strokeOffset = progressBar.barEdgeThickness || 0;
      const fillHeight = (progressBar.svgHeight - (progressBar.barEdgeThickness * 2)) * progress;
      progressBar.fillRect.setAttribute('y', progressBar.svgHeight - strokeOffset - fillHeight);
      progressBar.fillRect.setAttribute('height', fillHeight);
    }
  }

  handleDragEnd() {
    this.isDragging = false;
  }

  animate(timestamp) {
    if (!this.isAnimating || this.manualRotation) return;
    if (!timestamp) timestamp = performance.now();
    if (!this.lastFrameTime) this.lastFrameTime = timestamp;
    const elapsed = timestamp - this.lastFrameTime;
    if (elapsed < this.animationDelay) {
      this.animationId = requestAnimationFrame(this.animate.bind(this));
      return;
    }
    this.lastFrameTime = timestamp;

    this.frameCount++;
    this.angle = this.initialAngle + (this.degreesPerFrame * (this.frameCount % this.totalFrames));
    this.draw();
    this.animationId = requestAnimationFrame(this.animate.bind(this));
  }

  toggleAnimation() {
    // Exit manual rotation mode if active
    if (this.manualRotation) {
      this.toggleManualRotation();
    }
    
    this.isAnimating = !this.isAnimating;
    const playPauseBtn = document.getElementById('playPauseButton');
    const svg = playPauseBtn.querySelector('svg');

    if (this.isAnimating) {
      svg.innerHTML = '<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>';
      this.lastFrameTime = null;
      this.animationId = requestAnimationFrame(this.animate);
    } else {
      svg.innerHTML = '<path d="M8 5v14l11-7z"/>';
      cancelAnimationFrame(this.animationId);
      this.frameCount = 0;
      this.angle = this.initialAngle;
      this.draw();
      const progressBar = document.querySelector('#progressBarSVG').progressBarInstance;
      if (progressBar) {
        progressBar.isAnimating = false;
        cancelAnimationFrame(progressBar.animationId);
        progressBar.frameCount = 0;
        progressBar.fillRect.setAttribute('y', progressBar.svgHeight - (progressBar.barEdgeThickness || 0));
        progressBar.fillRect.setAttribute('height', '0');
      }
    }

    const progressBar = document.querySelector('#progressBarSVG').progressBarInstance;
    if (progressBar) {
      if (this.isAnimating) {
        progressBar.isAnimating = true;
        progressBar.lastFrameTime = null;
        progressBar.animationId = requestAnimationFrame(progressBar.animate);
      } else {
        progressBar.isAnimating = false;
        cancelAnimationFrame(progressBar.animationId);
        progressBar.frameCount = 0;
        progressBar.fillRect.setAttribute('y', progressBar.svgHeight - (progressBar.barEdgeThickness || 0));
        progressBar.fillRect.setAttribute('height', '0');
      }
    }
  }

  stopAnimation() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }

  reset() {
    // Reset to default settings
    this.layerSettings = JSON.parse(JSON.stringify(this.defaultSettings.layerSettings));

    // Reset layer checkboxes
    document.querySelectorAll('input[name="volumeLayer"]').forEach(checkbox => {
      const layer = checkbox.value;
      checkbox.checked = this.layerSettings[layer].enabled;
    });

    // Reset canvas dimensions
    this.canvasWidth = this.defaultSettings.knobCanvasWidth;
    this.canvasHeight = this.defaultSettings.knobCanvasHeight;
    this.canvas.width = this.canvasWidth;
    this.canvas.height = this.canvasHeight;

    // Reset frames
    const knobFramesEl = document.getElementById('knobFrames');
    if (knobFramesEl) knobFramesEl.value = this.defaultSettings.knobFrames;
    this.totalFrames = this.defaultSettings.knobFrames;
    this.degreesPerFrame = 280 / this.totalFrames;

    // Update all controls to reflect default values
    this.updateUniversalControls('1');
    const indicatorOffsetEl = document.getElementById('volume_indicatorOffset');
    const indicatorOffsetValueEl = document.getElementById('volume_indicatorOffsetValue');
    if (indicatorOffsetEl && indicatorOffsetValueEl) {
      indicatorOffsetEl.value = this.defaultSettings.layerSettings['1'].indicatorOffset;
      indicatorOffsetValueEl.textContent = this.defaultSettings.layerSettings['1'].indicatorOffset;
    }
    const edgeStrokeEnabledEl = document.getElementById('volume_edgeStrokeEnabled');
    if (edgeStrokeEnabledEl) edgeStrokeEnabledEl.checked = this.defaultSettings.layerSettings['1'].edgeStrokeEnabled;
    const edgeSegmentsEnabledEl = document.getElementById('volume_edgeSegmentsEnabled');
    if (edgeSegmentsEnabledEl) edgeSegmentsEnabledEl.checked = this.defaultSettings.layerSettings['1'].edgeSegmentsEnabled;
    const edgeSegmentsControls = document.getElementById('edgeSegmentsControls');
    if (edgeSegmentsControls)
      edgeSegmentsControls.style.display = this.defaultSettings.layerSettings['1'].edgeSegmentsEnabled ? 'block' : 'none';

    // Reset custom skin controls
    const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
    if (useCustomSkinEl) {
      useCustomSkinEl.checked = false;
      useCustomSkinEl.disabled = true;
    }
    
    const customSkinLabel = document.getElementById('customSkinLabel');
    if (customSkinLabel) {
      customSkinLabel.textContent = 'No file chosen';
    }
    
    const customSkinUploadEl = document.getElementById('volume_customSkinUpload');
    if (customSkinUploadEl) {
      customSkinUploadEl.value = '';
    }
    
    // Redraw with new settings
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);

    // Apply global rotation: rotate the whole volume knob -87° anticlockwise about its center
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(-87 * Math.PI / 180);
    ctx.translate(-width / 2, -height / 2);

    const minDimension = Math.max(50, Math.min(width, height));
    const radius = Math.max(5, minDimension / 2 - 10);

    if (radius <= 0) {
      console.warn('Canvas too small to draw knob');
      ctx.restore();
      return;
    }

    // Draw layers in reverse order (3 -> 1)
    const layerOrder = ['3', '2', '1'];
    layerOrder.forEach(layer => {
      const settings = this.layerSettings[layer];
      if (settings.enabled) {
        ctx.save();
        const centerX = width / 2;
        const centerY = height / 2;
        // Calculate effectiveRadius: if edge stroke is enabled, subtract the offset; otherwise use full radius.
        const effectiveRadius = settings.edgeStrokeEnabled ? Math.max(0, radius - settings.edgeStrokeOffset) : radius;

        // Draw Edge Stroke if enabled
        if (settings.edgeStrokeEnabled && effectiveRadius > 0) {
          ctx.strokeStyle = settings.edgeStrokeColor || '#808080';
          ctx.lineWidth = settings.edgeStrokeThickness;
          ctx.beginPath();
          ctx.arc(centerX, centerY, effectiveRadius, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Draw Edge Segments - now always visible with varying intensity
        if (settings.edgeSegmentsEnabled && effectiveRadius > 0) {
          // Fixed 5° adjustment to align segments with indicator position
          const angleAdjustment = -5 * Math.PI / 180;  
          const startAngle = (-140 + angleAdjustment) * Math.PI / 180; 
          const endAngle = (140 + angleAdjustment) * Math.PI / 180;    
          let totalAngle = endAngle - startAngle;
          if (totalAngle <= 0) {
            totalAngle += 2 * Math.PI;
          }
          
          // Calculate progress from 0 to 1 based on current angle relative to the total span (280°)
          const progress = (this.angle - this.initialAngle) / 280;
          
          // Get the number of segments from user input (+2 for fixed start and end)
          const segmentCount = settings.edgeSegmentAmount || 5;
          const actualSegmentCount = segmentCount + 2; // Add start and end fixed points
          const segmentType = settings.edgeSegmentType || "dot";
          
          // Draw all segments including fixed start and end
          for (let i = 0; i < actualSegmentCount; i++) {
            // Calculate segment position (0 is start, actualSegmentCount-1 is end)
            const segmentProgress = i / (actualSegmentCount - 1);
            
            // Intensity increases with progress, minimum intensity 0.2 (20%) increasing to full intensity when active
            const intensity = segmentProgress <= progress ? 1 : 0.2;
            
            let segmentAngle = startAngle + totalAngle * segmentProgress;
            
            // Convert edge stroke color to RGB for opacity manipulation
            const baseColor = settings.edgeStrokeColor || '#808080';
            const r = parseInt(baseColor.substr(1,2), 16);
            const g = parseInt(baseColor.substr(3,2), 16);
            const b = parseInt(baseColor.substr(5,2), 16);
            
            if (segmentType === "dot") {
              const dotRadius = settings.edgeStrokeThickness / 2;
              const x = centerX + effectiveRadius * Math.cos(segmentAngle);
              const y = centerY + effectiveRadius * Math.sin(segmentAngle);
              ctx.beginPath();
              ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
              ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
              ctx.fill();
            } else if (segmentType === "line") {
              const segmentSpan = totalAngle / (actualSegmentCount - 1);
              const segmentStart = segmentAngle - (segmentSpan * 0.3);
              const segmentEnd = segmentAngle + (segmentSpan * 0.3);
              ctx.beginPath();
              ctx.arc(centerX, centerY, effectiveRadius, segmentStart, segmentEnd);
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
              ctx.lineWidth = settings.edgeStrokeThickness;
              ctx.stroke();
            } else if (segmentType === "vertical-line") {
              // Calculate the points for a small vertical line
              const x = centerX + effectiveRadius * Math.cos(segmentAngle);
              const y = centerY + effectiveRadius * Math.sin(segmentAngle);
              
              // Calculate a line perpendicular to the radius
              const innerPoint = {
                x: centerX + (effectiveRadius - settings.edgeStrokeThickness * 2) * Math.cos(segmentAngle),
                y: centerY + (effectiveRadius - settings.edgeStrokeThickness * 2) * Math.sin(segmentAngle)
              };
              const outerPoint = {
                x: centerX + (effectiveRadius + settings.edgeStrokeThickness * 2) * Math.cos(segmentAngle),
                y: centerY + (effectiveRadius + settings.edgeStrokeThickness * 2) * Math.sin(segmentAngle)
              };
              
              ctx.beginPath();
              ctx.moveTo(innerPoint.x, innerPoint.y);
              ctx.lineTo(outerPoint.x, outerPoint.y);
              ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${intensity})`;
              ctx.lineWidth = settings.edgeStrokeThickness;
              ctx.stroke();
            }
          }
        }

        // Draw the base (inner fill) with adjusted size
        const innerFillRadius = radius * (settings.innerFillSize / 100);
        
        // Check if using custom skin
        if (settings.useCustomSkin && settings.customSkinImage instanceof Image) {
          // Draw custom skin image instead of fill color
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, innerFillRadius, 0, Math.PI * 2);
          ctx.clip();
          
          // Calculate drawing dimensions to center the image
          const imgWidth = settings.customSkinImage.width;
          const imgHeight = settings.customSkinImage.height;
          const scale = Math.max(innerFillRadius * 2 / imgWidth, innerFillRadius * 2 / imgHeight);
          const scaledWidth = imgWidth * scale;
          const scaledHeight = imgHeight * scale;
          const imgX = centerX - scaledWidth / 2;
          const imgY = centerY - scaledHeight / 2;
          
          ctx.drawImage(settings.customSkinImage, imgX, imgY, scaledWidth, scaledHeight);
          ctx.restore();
        } else {
          // Use regular color fill
          ctx.fillStyle = settings.baseColor || this.knobColor;
          ctx.beginPath();
          ctx.arc(centerX, centerY, innerFillRadius, 0, Math.PI * 2);
          ctx.fill();
        }

        // Draw the indicator dot/line with the same 5° alignment adjustment
        if (settings.indicatorSize > 0) {
          ctx.translate(centerX, centerY);
          // Apply 5° alignment adjustment to match segments
          const angleAdjustment = -5 * Math.PI / 180;
          const rad = (this.angle * Math.PI / 180) + angleAdjustment;
          ctx.rotate(rad);
          const effectiveOffset = settings.indicatorOffset + (settings.stretchEnabled ? settings.extensionValue : 0);
          const x = effectiveOffset;
          const y = 0;
          
          // Fix: Use indicator fill color properly
          ctx.fillStyle = settings.fillColor || this.strokeColor;
          ctx.strokeStyle = settings.fillColor || this.strokeColor;

          if (settings.stretchEnabled && settings.extensionValue > 0) {
            ctx.beginPath();
            ctx.lineWidth = settings.indicatorSize * 2;
            ctx.lineCap = 'round';
            ctx.moveTo(0, 0);
            ctx.lineTo(settings.extensionValue, 0);
            ctx.stroke();
          } else {
            // Draw indicator shape with Bevel/Emboss FX if enabled
            const shape = settings.indicatorShape || 'circle'; // Add fallback
            const bevel = settings.bevelEmboss || 0;
            ctx.save();
            if (bevel > 0) {
              ctx.shadowColor = "rgba(0,0,0,0.5)";
              ctx.shadowBlur = bevel;
              ctx.shadowOffsetX = bevel / 2;
              ctx.shadowOffsetY = -bevel / 2;
            }
            if (shape === 'circle') {
              ctx.beginPath();
              ctx.arc(x, y, settings.indicatorSize, 0, Math.PI * 2);
              ctx.fill();
            } else if (shape === 'rectangle') {
              const size = settings.indicatorSize * 2;
              ctx.fillRect(x - size/2, y - size/2, size, size);
            }
            ctx.restore();
            
            if (settings.innerShadow > 0) {
              ctx.save();
              ctx.beginPath();
              if (shape === 'circle') {
                ctx.arc(x, y, settings.indicatorSize, 0, Math.PI * 2);
              } else if (shape === 'rectangle') {
                const size = settings.indicatorSize * 2;
                ctx.rect(x - size/2, y - size/2, size, size);
              }
              ctx.clip();
              
              // Create a more gradual shadow effect with improved sensitivity
              const shadowStrength = Math.min(settings.innerShadow / 25, 1); // Convert 0-25 range to 0-1
              const shadowOpacity = 0.15 + (shadowStrength * 0.25); // More gradual opacity from 0.15 to 0.4
              const shadowBlur = Math.max(1, settings.innerShadow * 0.75); // Adjusted blur calculation
              
              ctx.shadowColor = `rgba(0,0,0,${shadowOpacity})`;
              ctx.shadowBlur = shadowBlur;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              // Draw multiple shadow layers for smoother transition
              for (let i = 0; i < 3; i++) {
                const layerOpacity = shadowOpacity * (1 - i * 0.2);
                ctx.fillStyle = `rgba(0,0,0,${layerOpacity})`;
                if (shape === 'circle') {
                  ctx.arc(x, y, settings.indicatorSize + i, 0, Math.PI * 2);
                } else if (shape === 'rectangle') {
                  const size = settings.indicatorSize * 2 + i * 2;
                  ctx.fillRect(x - size/2, y - size/2, size, size);
                }
                ctx.fill();
              }
              
              ctx.restore();
            }
          }
        }
        
        ctx.restore();
      }
    });

    // Restore global rotation transformation
    ctx.restore();
  }

  drawRotated(sourceCanvas, degrees) {
    const rotatedCanvas = document.createElement('canvas');
    if (degrees === 90 || degrees === -90) {
      rotatedCanvas.width = sourceCanvas.height;
      rotatedCanvas.height = sourceCanvas.width;
    } else {
      rotatedCanvas.width = sourceCanvas.width;
      rotatedCanvas.height = sourceCanvas.height;
    }
    const ctx = rotatedCanvas.getContext('2d');
    ctx.save();
    if (degrees === 90) {
      ctx.translate(rotatedCanvas.width, 0);
    } else if (degrees === -90) {
      ctx.translate(0, rotatedCanvas.height);
    }
    ctx.rotate(degrees * Math.PI / 180);
    ctx.drawImage(sourceCanvas, 0, 0);
    ctx.restore();
    return rotatedCanvas;
  }
}

// Move initialization function outside the class
const initVolumeKnob = () => {
  const canvas = document.getElementById('volumeKnobCanvas');
  if (canvas) {
    new VolumeKnob(canvas);
  } else {
    console.error('Volume Knob Canvas not found');
  }
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initVolumeKnob);
} else {
  initVolumeKnob();
}