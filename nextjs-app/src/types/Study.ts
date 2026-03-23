export enum StudyIndication {
  Syncope = 'Syncope',
  Hypertension = 'Hypertension',
  PreOpEvaluation = 'Pre-op evaluation',
  Cardiomyopathy = 'Cardiomyopathy',
  ChestPain = 'Chest pain',
  PostMIAssessment = 'Post-MI assessment',
  Arrhythmia = 'Arrhythmia',
  Palpitations = 'Palpitations',
  FollowUp = 'Follow-up',
  ValveDisease = 'Valve disease',
  ShortnessOfBreath = 'Shortness of breath',
}

export enum StudyStatus {
  Pending = 'pending',
  Reviewed = 'reviewed',
}

export type Study = {
  "id": string;
  "patientName": string;
  "patientId": string;
  "studyDate": string;
  "indication": StudyIndication;
  "lvef": number;
  "status": StudyStatus;
  "thumbnailUrl": string;
};

export type StudySummary = Pick<
  Study,
  "id" | "patientName" | "patientId" | "studyDate" | "indication" | "lvef" | "status"
>;