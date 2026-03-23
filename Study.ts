export type Study = {
  "id": string;
  "patientName": string;
  "patientId": string;
  "studyDate": string;
  "indication": 'Syncope' | 'Hypertension' | 'Pre-op evaluation' | 'Cardiomyopathy' | 'Chest pain' | 'Post-MI assessment' | 'Arrhythmia' | 'Palpitations' | 'Follow-up' | 'Valve disease' | 'Shortness of breath';
  "lvef": number;
  "status": 'pending' | 'reviewed';
  "thumbnailUrl": string;
};
