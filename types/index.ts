export interface BotanicalCreation {
  id: string;
  imageUri: string;
  commonName: string;
  scientificName: string;
  description: string;
  createdAt: string;
  type: 'plant' | 'insect' | 'animal';
}

export interface AnalysisResult {
  type: 'plant' | 'insect' | 'animal';
  commonName: string;
  scientificName: string;
  characteristics: string;
  description: string;
}

