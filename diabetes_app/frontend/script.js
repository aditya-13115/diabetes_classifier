document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('diabetesForm');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const resultDiv = document.getElementById('predictionResult');
    const submitBtn = form.querySelector('button[type="submit"]');

    // Validate number inputs on blur
    document.querySelectorAll('input[type="number"]').forEach(input => {
        input.addEventListener('blur', function() {
            const min = parseFloat(this.min);
            const max = parseFloat(this.max);
            const value = parseFloat(this.value);
            
            if (isNaN(value)) {
                this.value = '';
                return;
            }
            
            if (value < min) this.value = min;
            if (value > max) this.value = max;
        });
    });

    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        // Reset UI
        errorMessage.style.display = 'none';
        resultDiv.style.display = 'none';
        submitBtn.disabled = true;
        loadingIndicator.style.display = 'block';
        
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
            if (!formData.gender) errors.push("Gender is required");
            if (!formData.age) errors.push("Age is required");
            if (!formData.smoking_history) errors.push("Smoking history is required");
            if (!formData.bmi) errors.push("BMI is required");
            if (!formData.HbA1c_level) errors.push("HbA1c level is required");
            if (!formData.blood_glucose_level) errors.push("Blood glucose level is required");
            
            // Numeric ranges
            if (formData.age && (formData.age < 0 || formData.age > 120)) 
                errors.push("Age must be between 0-120");
            if (formData.bmi && (formData.bmi < 10 || formData.bmi > 70))
                errors.push("BMI must be between 10-70");
            if (formData.HbA1c_level && (formData.HbA1c_level < 3 || formData.HbA1c_level > 20))
                errors.push("HbA1c must be between 3-20%");
            if (formData.blood_glucose_level && (formData.blood_glucose_level < 50 || formData.blood_glucose_level > 500))
                errors.push("Blood glucose must be between 50-500 mg/dL");
            
            if (errors.length > 0) {
                throw new Error(errors.join(". "));
            }
            
            // Prepare API data
            const apiData = {
                ...formData,
                age: parseFloat(formData.age),
                bmi: parseFloat(formData.bmi),
                HbA1c_level: parseFloat(formData.HbA1c_level),
                blood_glucose_level: parseFloat(formData.blood_glucose_level)
            };
            
            // Call API
            const response = await fetch('http://localhost:8000/predict', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(apiData)
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Prediction failed. Please try again.');
            }
            
            const data = await response.json();
            
            // Display results
            resultDiv.innerHTML = `
                <h2>Prediction Result</h2>
                <p><strong>Risk Level:</strong> <span class="risk-level">${
                    data.prediction ? 'High Risk' : 'Low Risk'
                }</span></p>
                <p><strong>Probability:</strong> ${(data.probability * 100).toFixed(2)}%</p>
                <p class="recommendation">${
                    data.prediction 
                        ? 'Based on your inputs, you may be at risk for diabetes. Please consult with a healthcare professional.'
                        : 'Based on your inputs, your diabetes risk appears to be low. Maintain healthy habits!'
                }</p>
            `;
            
            resultDiv.className = `result ${data.prediction ? 'high-risk' : 'low-risk'}`;
            resultDiv.style.display = 'block';
            
            // Smooth scroll to results
            resultDiv.scrollIntoView({ behavior: 'smooth' });
            
        } catch (error) {
            errorMessage.textContent = error.message;
            errorMessage.style.display = 'block';
            console.error('Prediction error:', error);
        } finally {
            loadingIndicator.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
});