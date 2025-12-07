from pydantic import BaseModel
from typing import List, Optional, Dict
from datetime import datetime

class PatientBase(BaseModel):
    name: str
    email: str
    phone: str

class PatientCreate(PatientBase):
    pass

class Patient(PatientBase):
    id: int
    class Config:
        orm_mode = True

class DoctorBase(BaseModel):
    name: str
    speciality: str
    working_hours: Dict[str, str]

class DoctorCreate(DoctorBase):
    pass

class Doctor(DoctorBase):
    id: int
    class Config:
        orm_mode = True

class AppointmentBase(BaseModel):
    patient_id: int
    doctor_id: int
    start_time: datetime
    end_time: datetime
    reason: str

class AppointmentCreate(AppointmentBase):
    pass

class Appointment(AppointmentBase):
    id: int
    status: str
    class Config:
        orm_mode = True

class TriageRequest(BaseModel):
    symptoms: str

class TriageResponse(BaseModel):
    intent: str
    symptoms: List[str]
    duration: Optional[str]
    severity: str
    triage_level: str
    explanation: str
