/**
 * Camera Injury Scanner JavaScript
 * Handles image upload, analysis, and cure display
 */

let currentImageData = null;

// Handle Image Upload (Camera or File)
async function handleImageUpload(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
    }

    // Show image preview
    const reader = new FileReader();
    reader.onload = function (e) {
        currentImageData = e.target.result;

        // Display preview
        const previewImg = document.getElementById('previewImg');
        const imagePreview = document.getElementById('imagePreview');

        previewImg.src = currentImageData;
        imagePreview.style.display = 'block';

        // Hide instructions
        document.querySelector('.upload-instructions').style.display = 'none';

        // Automatically analyze after upload
        setTimeout(() => {
            analyzeInjury();
        }, 500);
    };

    reader.readAsDataURL(file);
}

// Remove Image
function removeImage() {
    currentImageData = null;
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('analysisSection').style.display = 'none';
    document.querySelector('.upload-instructions').style.display = 'block';

    // Reset file inputs
    document.getElementById('camera-input').value = '';
    document.getElementById('upload-input').value = '';
}

// Analyze Injury with AI
async function analyzeInjury() {
    if (!currentImageData) {
        alert('Please upload an image first');
        return;
    }

    // Show analysis section with loading
    const analysisSection = document.getElementById('analysisSection');
    const analysisLoading = document.getElementById('analysisLoading');
    const analysisResults = document.getElementById('analysisResults');

    analysisSection.style.display = 'block';
    analysisLoading.style.display = 'block';
    analysisResults.style.display = 'none';

    // Animate loading steps
    animateLoadingSteps();

    try {
        const response = await fetch('http://localhost:3000/api/analyze-injury-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                image: currentImageData,
                notes: ''
            })
        });

        const result = await response.json();

        if (result.success) {
            // Hide loading, show results
            setTimeout(() => {
                analysisLoading.style.display = 'none';
                displayAnalysisResults(result);
            }, 2000); // Wait for loading animation
        } else {
            analysisLoading.style.display = 'none';
            showError(result.error || 'Analysis failed');
        }

    } catch (error) {
        console.error('Analysis error:', error);
        analysisLoading.style.display = 'none';
        showError('Could not connect to server. Please ensure backend is running.');
    }
}

// Animate Loading Steps
function animateLoadingSteps() {
    const steps = document.querySelectorAll('.progress-steps .step');
    let currentStep = 0;

    const interval = setInterval(() => {
        if (currentStep < steps.length) {
            steps[currentStep].classList.add('active');
            currentStep++;
        } else {
            clearInterval(interval);
        }
    }, 600);
}

// Display Analysis Results
function displayAnalysisResults(result) {
    const resultsDiv = document.getElementById('analysisResults');

    // Build results HTML
    const resultsHTML = `
        <div class="result-card">
            <div class="result-header">
                <h2><i class="fas fa-check-circle"></i> Injury Analysis Complete</h2>
                <div class="confidence-badge">${result.confidence}% Confidence</div>
            </div>
            
            <div class="result-summary">
                <div class="summary-item">
                    <div class="summary-label">Injury Type</div>
                    <div class="summary-value injury-type-${result.injury_type}">
                        ${result.injury_type.toUpperCase()}
                    </div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">Severity</div>
                    <div class="summary-value severity-${result.severity}">
                        ${result.severity.toUpperCase()}
                    </div>
                </div>
                
                <div class="summary-item">
                    <div class="summary-label">Healing Time</div>
                    <div class="summary-value">${result.healing_time}</div>
                </div>
            </div>
            
            <div class="result-description">
                <h3><i class="fas fa-info-circle"></i> Description</h3>
                <p>${result.description}</p>
            </div>
            
            <div class="cure-process">
                <h3><i class="fas fa-heartbeat"></i> Cure Process</h3>
                <div class="cure-steps">
                    ${result.cure_steps.map((step, index) => `
                        <div class="cure-step">
                            <div class="step-number">${index + 1}</div>
                            <div class="step-content">
                                <p>${step}</p>
                            </div>
                            <button class="step-done-btn" onclick="markStepDone(this)">
                                <i class="fas fa-check"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="warning-signs">
                <h3><i class="fas fa-exclamation-triangle"></i> Warning Signs - Seek Medical Help If:</h3>
                <ul>
                    ${result.warning_signs.map(sign => `<li>${sign}</li>`).join('')}
                </ul>
            </div>
            
            <div class="do-not-section">
                <h3><i class="fas fa-ban"></i> Do NOT:</h3>
                <ul>
                    ${result.do_not.map(item => `<li>${item}</li>`).join('')}
                </ul>
            </div>
            
            <div class="medical-disclaimer">
                <i class="fas fa-shield-alt"></i>
                <p>${result.medical_advice}</p>
            </div>
            
            <div class="result-actions">
                <button class="btn-new-scan" onclick="removeImage()">
                    <i class="fas fa-camera"></i> Scan New Injury
                </button>
                <button class="btn-save-report">
                    <i class="fas fa-download"></i> Save Report
                </button>
            </div>
        </div>
    `;

    resultsDiv.innerHTML = resultsHTML;
    resultsDiv.style.display = 'block';

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Mark Step as Done
function markStepDone(button) {
    const step = button.closest('.cure-step');
    step.classList.toggle('completed');

    if (step.classList.contains('completed')) {
        button.innerHTML = '<i class="fas fa-check-double"></i>';
    } else {
        button.innerHTML = '<i class="fas fa-check"></i>';
    }
}

// Show Error
function showError(message) {
    const resultsDiv = document.getElementById('analysisResults');
    resultsDiv.innerHTML = `
        <div class="error-card">
            <i class="fas fa-exclamation-circle"></i>
            <h3>Analysis Error</h3>
            <p>${message}</p>
            <button onclick="removeImage()" class="btn-retry">Try Again</button>
        </div>
    `;
    resultsDiv.style.display = 'block';
}

// Export functions
window.handleImageUpload = handleImageUpload;
window.removeImage = removeImage;
window.analyzeInjury = analyzeInjury;
window.markStepDone = markStepDone;
