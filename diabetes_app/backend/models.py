from pydantic import BaseModel
from typing import Literal

class DiabetesInput(BaseModel):
    gender: Literal['Male', 'Female', 'Other']
    age: float
    hypertension: bool
    heart_disease: bool
    smoking_history: Literal['never', 'former', 'current', 'not current', 'ever']
    bmi: float
    HbA1c_level: float
    blood_glucose_level: float

class PredictionOutput(BaseModel):
    prediction: int
    probability: float
    status: str