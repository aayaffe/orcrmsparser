import axios from 'axios';
import { EventData, ClassRow, RaceRow, FleetRow, OrcscFile } from '../types/orcsc';

const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
});

export interface OrcscFileInfo {
  name: string;
  path: string;
  size: number;
  modified: number;
}

export const orcscApi = {
  createNewFile: async (data: {
    event: EventData;
    classes: ClassRow[];
    races: RaceRow[];
    boats?: FleetRow[];
  }) => {
    const response = await api.post('/api/files/new', data);
    return response.data;
  },

  getFile: async (filePath: string): Promise<OrcscFile> => {
    const response = await api.get(`/api/files/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  updateFile: async (fileId: string, data: any) => {
    const response = await api.put(`/files/${fileId}`, data);
    return response.data;
  },

  addRaces: async (fileId: string, races: RaceRow[]) => {
    const response = await api.post(`/files/${fileId}/races`, { races });
    return response.data;
  },

  addBoats: async (fileId: string, boats: FleetRow[]) => {
    const response = await api.post(`/files/${fileId}/boats`, { boats });
    return response.data;
  },

  listFiles: async (): Promise<OrcscFileInfo[]> => {
    const response = await api.get('/api/files');
    return response.data.files;
  },

  uploadFile: async (file: File): Promise<{ filename: string; path: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
}; 