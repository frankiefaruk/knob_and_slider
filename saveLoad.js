class AppStateManager {
  constructor() {
    this.setupEventListeners();
    this.savedStates = this.loadSavedStatesList();
  }

  setupEventListeners() {
    const saveStateBtn = document.getElementById('saveStateButton');
    const loadStateBtn = document.getElementById('loadStateButton');
    
    saveStateBtn.addEventListener('click', () => this.showSaveModal());
    loadStateBtn.addEventListener('click', () => this.showLoadModal());
    
    document.getElementById('confirmSaveLoad').addEventListener('click', () => {
      const modalTitle = document.getElementById('saveLoadModalTitle');
      if (modalTitle.textContent === 'Save Current Design') {
        this.saveCurrentState();
      } else {
        this.loadSelectedState();
      }
      document.getElementById('saveLoadModal').style.display = 'none';
    });

    document.getElementById('cancelSaveLoad').addEventListener('click', () => {
      document.getElementById('saveLoadModal').style.display = 'none';
    });
  }

  showSaveModal() {
    const modal = document.getElementById('saveLoadModal');
    const modalTitle = document.getElementById('saveLoadModalTitle');
    const confirmBtn = document.getElementById('confirmSaveLoad');
    const designNameInput = document.getElementById('designName');
    const savedStatesList = document.getElementById('savedStatesList');
    
    modalTitle.textContent = 'Save Current Design';
    confirmBtn.textContent = 'Save';
    designNameInput.value = `Design ${new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}`;
    designNameInput.style.display = 'block';
    savedStatesList.style.display = 'none';
    
    modal.style.display = 'block';
  }

  showLoadModal() {
    const modal = document.getElementById('saveLoadModal');
    const modalTitle = document.getElementById('saveLoadModalTitle');
    const confirmBtn = document.getElementById('confirmSaveLoad');
    const designNameInput = document.getElementById('designName');
    const savedStatesList = document.getElementById('savedStatesList');
    
    modalTitle.textContent = 'Load Saved Design';
    confirmBtn.textContent = 'Load';
    designNameInput.style.display = 'none';
    savedStatesList.style.display = 'block';
    
    // Populate the saved states list
    this.populateSavedStatesList();
    
    modal.style.display = 'block';
  }

  populateSavedStatesList() {
    const savedStatesList = document.getElementById('savedStatesList');
    savedStatesList.innerHTML = '';
    
    if (this.savedStates.length === 0) {
      savedStatesList.innerHTML = '<p>No saved designs found.</p>';
      return;
    }
    
    this.savedStates.forEach((state, index) => {
      const item = document.createElement('div');
      item.className = 'saved-state-item';
      item.dataset.index = index;
      
      const nameSpan = document.createElement('span');
      nameSpan.className = 'saved-state-item-name';
      nameSpan.textContent = state.name;
      
      const dateSpan = document.createElement('span');
      dateSpan.className = 'saved-state-item-date';
      dateSpan.textContent = new Date(state.date).toLocaleString();
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'saved-state-item-delete';
      deleteBtn.innerHTML = '&times;';
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.deleteState(index);
      });
      
      item.appendChild(nameSpan);
      item.appendChild(dateSpan);
      item.appendChild(deleteBtn);
      
      item.addEventListener('click', () => {
        document.querySelectorAll('.saved-state-item').forEach(el => {
          el.classList.remove('selected');
        });
        item.classList.add('selected');
      });
      
      savedStatesList.appendChild(item);
    });
  }

  saveCurrentState() {
    const designName = document.getElementById('designName').value || 'Unnamed Design';
    
    // Get the volume knob state
    const volumeKnob = document.getElementById('volumeKnobCanvas').__volumeKnob;
    
    // Create a deep copy of layer settings, converting Image objects to data URLs
    const volumeKnobLayerSettings = JSON.parse(JSON.stringify(volumeKnob.layerSettings));
    
    // Process custom skin images
    for (const layer in volumeKnobLayerSettings) {
      if (volumeKnob.layerSettings[layer].customSkinImage instanceof Image) {
        // Create a temporary canvas to get the data URL
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = volumeKnob.layerSettings[layer].customSkinImage.width;
        tempCanvas.height = volumeKnob.layerSettings[layer].customSkinImage.height;
        tempCtx.drawImage(volumeKnob.layerSettings[layer].customSkinImage, 0, 0);
        volumeKnobLayerSettings[layer].customSkinImage = tempCanvas.toDataURL('image/png');
      }
    }
    
    const volumeKnobState = {
      knobColor: document.getElementById('volume_baseColor').value,
      strokeColor: document.getElementById('volume_fillColor').value,
      strokeEdgeColor: document.getElementById('volume_edgeStrokeColor').value,
      knobFrames: document.getElementById('knobFrames').value,
      knobCanvasWidth: document.getElementById('knobCanvasWidth').value,
      knobCanvasHeight: document.getElementById('knobCanvasHeight').value,
      layerSettings: volumeKnobLayerSettings
    };
    
    // Get the progress bar state
    const progressBar = document.getElementById('progressBarSVG').progressBarInstance;
    const progressBarState = {
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
    
    // Build the complete state object
    const appState = {
      name: designName,
      date: new Date().toISOString(),
      volumeKnob: volumeKnobState,
      progressBar: progressBarState
    };
    
    // Add to saved states
    this.savedStates.push(appState);
    this.saveSavedStatesList();
    
    alert(`Design "${designName}" saved successfully!`);
  }

  loadSelectedState() {
    const selectedItem = document.querySelector('.saved-state-item.selected');
    if (!selectedItem) {
      alert('Please select a design to load.');
      return;
    }
    
    const index = parseInt(selectedItem.dataset.index);
    const state = this.savedStates[index];
    
    if (!state) {
      alert('Error loading design.');
      return;
    }
    
    // Load volume knob state
    const volumeKnob = document.getElementById('volumeKnobCanvas').__volumeKnob;
    if (state.volumeKnob) {
      document.getElementById('volume_baseColor').value = state.volumeKnob.knobColor;
      document.getElementById('volume_fillColor').value = state.volumeKnob.strokeColor;
      document.getElementById('volume_edgeStrokeColor').value = state.volumeKnob.strokeEdgeColor;
      document.getElementById('knobFrames').value = state.volumeKnob.knobFrames;
      document.getElementById('knobCanvasWidth').value = state.volumeKnob.knobCanvasWidth;
      document.getElementById('knobCanvasHeight').value = state.volumeKnob.knobCanvasHeight;
      
      volumeKnob.knobColor = state.volumeKnob.knobColor;
      volumeKnob.strokeColor = state.volumeKnob.strokeColor;
      volumeKnob.strokeEdgeColor = state.volumeKnob.strokeEdgeColor;
      volumeKnob.totalFrames = parseInt(state.volumeKnob.knobFrames);
      volumeKnob.degreesPerFrame = 280 / volumeKnob.totalFrames;
      volumeKnob.canvasWidth = parseInt(state.volumeKnob.knobCanvasWidth);
      volumeKnob.canvasHeight = parseInt(state.volumeKnob.knobCanvasHeight);
      volumeKnob.canvas.width = volumeKnob.canvasWidth;
      volumeKnob.canvas.height = volumeKnob.canvasHeight;
      
      if (state.volumeKnob.layerSettings) {
        // Process each layer and handle custom skin images
        for (const layer in state.volumeKnob.layerSettings) {
          // If there's a custom skin image stored as data URL, convert it back to Image
          if (state.volumeKnob.layerSettings[layer].customSkinImage) {
            const img = new Image();
            img.onload = () => {
              volumeKnob.layerSettings[layer].customSkinImage = img;
              volumeKnob.draw();
            };
            img.src = state.volumeKnob.layerSettings[layer].customSkinImage;
          }
        }
        
        volumeKnob.layerSettings = JSON.parse(JSON.stringify(state.volumeKnob.layerSettings));
        
        // Update layer checkboxes
        Object.entries(volumeKnob.layerSettings).forEach(([layer, settings]) => {
          const checkbox = document.querySelector(`input[name="volumeLayer"][value="${layer}"]`);
          if (checkbox) checkbox.checked = settings.enabled;
        });
        
        // Update the custom skin controls after loading
        const activeLayer = volumeKnob.getActiveLayer();
        const useCustomSkinEl = document.getElementById('volume_useCustomSkin');
        if (useCustomSkinEl) {
          useCustomSkinEl.checked = volumeKnob.layerSettings[activeLayer].useCustomSkin || false;
          useCustomSkinEl.disabled = !volumeKnob.layerSettings[activeLayer].customSkinImage;
        }
        
        const customSkinLabel = document.getElementById('customSkinLabel');
        if (customSkinLabel) {
          customSkinLabel.textContent = volumeKnob.layerSettings[activeLayer].customSkinImage ? 'Custom skin loaded' : 'No file chosen';
        }
      }
    }
    
    // Load progress bar state
    const progressBar = document.getElementById('progressBarSVG').progressBarInstance;
    if (state.progressBar) {
      document.getElementById('progress_baseColor').value = state.progressBar.barColor;
      document.getElementById('progress_fillColor').value = state.progressBar.fillColor;
      document.getElementById('progressEdgeColor').value = state.progressBar.progressEdgeColor;
      document.getElementById('progressEdgeStroke').checked = state.progressBar.progressEdgeStroke;
      document.getElementById('progressEdgeThickness').value = state.progressBar.progressEdgeThickness;
      document.getElementById('progressEdgeThicknessValue').textContent = state.progressBar.progressEdgeThickness;
      document.getElementById('progressFrames').value = state.progressBar.progressFrames;
      document.getElementById('progressCanvasWidth').value = state.progressBar.progressCanvasWidth;
      document.getElementById('progressCanvasHeight').value = state.progressBar.progressCanvasHeight;
      document.getElementById('barAutoRounded').checked = state.progressBar.autoBarRounded;
      
      progressBar.bgRect.setAttribute('fill', state.progressBar.barColor);
      progressBar.fillRect.setAttribute('fill', state.progressBar.fillColor);
      progressBar.svgWidth = parseInt(state.progressBar.progressCanvasWidth);
      progressBar.svgHeight = parseInt(state.progressBar.progressCanvasHeight);
      progressBar.svg.setAttribute('width', progressBar.svgWidth);
      progressBar.svg.setAttribute('height', progressBar.svgHeight);
    }
    
    // Update the visuals
    volumeKnob.draw();
    progressBar.updateSVGSize();
    progressBar.updateSVGAttributes();
    
    alert(`Design "${state.name}" loaded successfully!`);
  }

  deleteState(index) {
    if (confirm('Are you sure you want to delete this saved design?')) {
      this.savedStates.splice(index, 1);
      this.saveSavedStatesList();
      this.populateSavedStatesList();
    }
  }

  loadSavedStatesList() {
    const savedStatesJson = localStorage.getItem('appSavedStates');
    if (savedStatesJson) {
      try {
        return JSON.parse(savedStatesJson);
      } catch (e) {
        console.error('Error parsing saved states:', e);
        return [];
      }
    }
    return [];
  }

  saveSavedStatesList() {
    localStorage.setItem('appSavedStates', JSON.stringify(this.savedStates));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new AppStateManager();
});