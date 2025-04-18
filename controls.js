// This script ensures that slider and number inputs update their corresponding display spans in real time.
document.addEventListener('DOMContentLoaded', () => {
  const rangeInputs = document.querySelectorAll('input[type="range"]');
  rangeInputs.forEach(input => {
    const span = document.getElementById(input.id + 'Value');
    if (span) {
      span.textContent = input.value;
      input.addEventListener('input', () => {
        span.textContent = input.value;
      });
    }
  });

  const numberInputs = document.querySelectorAll('input[type="number"]');
  numberInputs.forEach(input => {
    const span = document.getElementById(input.id + 'Value');
    if (span) {
      span.textContent = input.value;
      input.addEventListener('input', () => {
        span.textContent = input.value;
      });
    }
  });

  // Layer switching for controls
  document.querySelectorAll('.layer-selector').forEach(selector => {
    const controlType = selector.getAttribute('data-control');
    if (!controlType) return;
    const radios = selector.querySelectorAll('input[type="checkbox"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const selectedLayer = radio.value;
        const parent = selector.parentElement;
        parent.querySelectorAll('.layer-content').forEach(contentDiv => {
          if (contentDiv.getAttribute('data-layer') === selectedLayer) {
            contentDiv.style.display = '';
          } else {
            contentDiv.style.display = 'none';
          }
        });
      });
    });
  });

  // Update volume knob canvas cursor when in manual rotation mode
  const manualRotationBtn = document.getElementById('manualRotationBtn');
  const volumeKnobCanvas = document.getElementById('volumeKnobCanvas');
  
  if (manualRotationBtn && volumeKnobCanvas) {
    manualRotationBtn.addEventListener('click', () => {
      volumeKnobCanvas.classList.toggle('manual-rotation');
    });
  }

  // Add reset button functionality
  document.getElementById('resetButton').addEventListener('click', () => {
    // Reset volume knob
    const volumeKnob = document.getElementById('volumeKnobCanvas').__volumeKnob;
    if (volumeKnob) {
      volumeKnob.reset();
    }

    // Reset progress bar
    const progressBar = document.getElementById('progressBarSVG').progressBarInstance;
    if (progressBar) {
      progressBar.reset();
    }
  });
});