from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pickle
import pandas as pd
from typing import Literal

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and scaler
with open("random_forest_model.pkl", "rb") as f:
    model = pickle.load(f)
    
with open("minmax_scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

# Print expected feature names for verification
print("Model expects these features:")
print(model.feature_names_in_)

class DiabetesInput(BaseModel):
    gender: Literal['Male', 'Female', 'Other']
    age: float
    hypertension: bool
    heart_disease: bool
    smoking_history: Literal['never', 'former', 'current', 'not current', 'ever']
    bmi: float
    HbA1c_level: float
    blood_glucose_level: float

@app.post("/predict")
async def predict(input_data: DiabetesInput):
    try:
        # Create input dictionary
        input_dict = input_data.dict()
        
        # Create DataFrame with EXACTLY the same structure as training
        data = {
            'age': [input_dict['age']],
            'hypertension': [int(input_dict['hypertension'])],
            'heart_disease': [int(input_dict['heart_disease'])],
            'bmi': [input_dict['bmi']],
            'HbA1c_level': [input_dict['HbA1c_level']],
            'blood_glucose_level': [input_dict['blood_glucose_level']],
            # Gender dummies (exact names from pd.get_dummies)
            'Female': [1 if input_dict['gender'] == 'Female' else 0],
            'Male': [1 if input_dict['gender'] == 'Male' else 0],
            'Other': [1 if input_dict['gender'] == 'Other' else 0],
            # Smoking history dummies (exact names from pd.get_dummies)
            'current': [1 if input_dict['smoking_history'] == 'current' else 0],
            'ever': [1 if input_dict['smoking_history'] == 'ever' else 0],
            'former': [1 if input_dict['smoking_history'] == 'former' else 0],
            'never': [1 if input_dict['smoking_history'] == 'never' else 0],
            'not current': [1 if input_dict['smoking_history'] == 'not current' else 0],
            'No Info': [0]  # Added because your model might expect this
        }
        
        # Create DataFrame ensuring correct column order
        df = pd.DataFrame(data, columns=model.feature_names_in_)
        
        # Scale numerical features exactly like during training
        numerical_features = ['age', 'bmi', 'HbA1c_level', 'blood_glucose_level']
        df[numerical_features] = scaler.transform(df[numerical_features])
        
        # Make prediction
        prediction = model.predict(df)
        probability = model.predict_proba(df)[:, 1][0]
        
        return {
            "prediction": int(prediction[0]),
            "probability": float(probability),
            "status": "success"
        }
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Diabetes Prediction API"}