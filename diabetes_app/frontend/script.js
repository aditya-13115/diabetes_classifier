document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('diabetesForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const resultDiv = document.getElementById('predictionResult');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Add input validation and formatting
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', function() {
            const min = parseFloat(this.min);
            const max = parseFloat(this.max);
            let value = parseFloat(this.value);
            
            if (isNaN(value)) {
                this.value = '';
                return;
            }
            
            // Round to appropriate decimal places
            if (this.id === 'bmi' || this.id === 'HbA1c_level') {
                value = Math.round(value * 10) / 10;
            } else {
                value = Math.round(value);
            }
            
            if (value < min) value = min;
            if (value > max) value = max;
            
            this.value = value;
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset UI
        errorMessage.style.display = 'none';
        resultDiv.style.display = 'none';
        submitBtn.disabled = true;
        loadingIndicator.style.display = 'flex';
        
        try {
            // Get form values
            const formData = {
                gender: form.gender.value,
                age: form.age.value,
                hypertension: form.hypertension.checked,
                heart_disease: form.heart_disease.checked,
                smoking_history: form.smoking_history.value,
                bmi: form.bmi.value,
                HbA1c_level: form.HbA1c_level.value,
                blood_glucose_level: form.blood_glucose_level.value
            };
            
            // Validate all fields
            const errors = [];
            
            // Required fields
            if (!formData.gender) errors.push("Please select your gender");
            if (!formData.age) errors.push("Age is required");
            if (!formData.smoking_history) errors.push("Please select your smoking history");
            if (!formData.bmi) errors.push("BMI is required");
            if (!formData.HbA1c_level) errors.push("HbA1c level is required");
            if (!formData.blood_glucose_level) errors.push("Blood glucose level is required");
            
            // Numeric ranges
            if (formData.age && (formData.age < 0 || formData.age > 120)) 
                errors.push("Age must be between 0-120 years");
            if (formData.bmi && (formData.bmi < 10 || formData.bmi > 70))
                errors.push("BMI must be between 10-70");
            if (formData.HbA1c_level && (formData.HbA1c_level < 3 || formData.HbA1c_level > 20))
                errors.push("HbA1c must be between 3-20%");
            if (formData.blood_glucose_level && (formData.blood_glucose_level < 50 || formData.blood_glucose_level > 500))
                errors.push("Blood glucose must be between 50-500 mg/dL");
            
            if (errors.length > 0) {
                throw new Error(errors.join("\n"));
            }
            
            // Prepare API data
            const apiData = {
                ...formData,
                age: parseFloat(formData.age),
                bmi: parseFloat(formData.bmi),
                HbA1c_level: parseFloat(formData.HbA1c_level),
                blood_glucose_level: parseFloat(formData.blood_glucose_level)
            };
            
            // Call API with timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000);
            
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || 'The prediction service is currently unavailable. Please try again later.');
            }
            
            const data = await response.json();
            
            // Display results
            resultDiv.className = `result-card ${data.prediction ? 'high-risk-card' : 'low-risk-card'}`;
            resultDiv.innerHTML = `
                <h2><i class="fas fa-${data.prediction ? 'exclamation-triangle' : 'check-circle'}"></i> Prediction Result</h2>
                <div class="result-content">
                    <p><strong>Risk Level:</strong> <span class="risk-level">${
                        data.prediction ? 'High Risk' : 'Low Risk'
                    }</span></p>
                    <p><strong>Probability:</strong> <span class="probability-value">${(data.probability * 100).toFixed(1)}%</span></p>
                    <div class="recommendation">
                        <p>${
                            data.prediction 
                                ? 'Our analysis suggests you may be at risk for diabetes. We strongly recommend consulting with a healthcare professional for further evaluation and personalized advice.'
                                : 'Our analysis indicates your diabetes risk appears to be low. Maintain your healthy lifestyle with balanced nutrition and regular physical activity.'
                        }</p>
                        ${data.prediction ? '<p><i class="fas fa-phone-alt"></i> Consider scheduling a check-up with your doctor soon.</p>' : ''}
                    </div>
                </div>
            `;
            
            resultDiv.style.display = 'block';
            
            // Smooth scroll to results
            resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
        } catch (error) {
            errorMessage.innerHTML = error.message.replace(/\n/g, '<br>');
            errorMessage.style.display = 'block';
            console.error('Prediction error:', error);
            
            // Scroll to error message
            errorMessage.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } finally {
            loadingIndicator.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});