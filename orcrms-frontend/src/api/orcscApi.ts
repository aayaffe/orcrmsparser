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
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    organizer: string;
    classes: string[];
  }) => {
    const response = await api.post('/api/files', {
      template_path: "orcsc/template.orcsc",
      event_data: {
        EventTitle: data.title,
        StartDate: data.startDate,
        EndDate: data.endDate,
        Venue: data.location,
        Organizer: data.organizer,
        Classes: data.classes.map(classId => ({
          ClassId: classId,
          ClassName: classId,
          YachtClass: "ORC",
          Discards: 0,
          DivFromOverall: false,
          TimeLimitFormulae: null,
          ResultScoring: 0,
          UseBoatIW: false,
          EnableA9: null,
          HeatState: null,
          DayNo: null
        }))
      }
    });
    return response.data;
  },

  getFile: async (filePath: string): Promise<OrcscFile> => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    const response = await api.get(`/api/files/get/${encodeURIComponent(filePath)}`);
    return response.data;
  },

  updateFile: async (fileId: string, data: any) => {
    const response = await api.put(`/api/files/${fileId}`, data);
    return response.data;
  },

  addRaces: async (filePath: string, races: Array<{
    RaceName: string;
    ClassId: string;
    StartTime: string;
    ScoringType: string;
  }>) => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    const response = await api.post(
      `/api/files/${encodeURIComponent(filePath)}/races`,
      { races }
    );
    return response.data;
  },

  addBoats: async (fileId: string, boats: FleetRow[]) => {
    const response = await api.post(`/api/files/${fileId}/boats`, { boats });
    return response.data;
  },

  addClass: async (filePath: string, classData: {
    ClassId: string;
    ClassName: string;
    YachtClass: string;
  }) => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    const response = await api.post(
      `/api/files/${encodeURIComponent(filePath)}/classes`,
      { class_data: classData }
    );
    return response.data;
  },

  listFiles: async (): Promise<OrcscFileInfo[]> => {
    try {
      const response = await api.get('/api/files');
      return response.data.files;
    } catch (error) {
      console.error('Error listing files:', error);
      throw new Error('Failed to load file list');
    }
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
  },

  downloadFile: async (filePath: string): Promise<void> => {
    if (!filePath) {
      throw new Error('File path is required');
    }

    // Extract just the filename from the path
    const filename = filePath.split(/[\\/]/).pop() || 'file.orcsc';
    
    try {
      const response = await api.get(`/api/files/download/${filename}`, {
        responseType: 'blob',
      });

      // Create a temporary link to download the file
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      throw error;
    }
  },

  getTemplates: async (): Promise<string[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  createFromTemplate: async (templatePath: string, newFileName: string): Promise<void> => {
    // Ensure the new file name has .orcsc extension
    if (!newFileName.endsWith('.orcsc')) {
        newFileName += '.orcsc';
    }
    
    // Construct the full path in the output directory
    const newFilePath = `orcsc/output/${newFileName}`;
    
    await api.post('/api/files', {
        template_path: templatePath,
        new_file_path: newFilePath
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });
  }
}; 