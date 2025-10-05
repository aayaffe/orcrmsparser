import axios from 'axios';
import { FleetRow, OrcscFile } from '../types/orcsc';

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

export interface BackupInfo {
  path: string;
  timestamp: string;
  filename: string;
  change_summary: string;
}

export const orcscApi = {
  createNewFile: async (data: {
    title: string;
    startDate: string;
    endDate: string;
    location: string;
    organizer: string;
    classes: Array<{
      ClassId: string;
      ClassName: string;
      _class_enum: string;
      Discards: number;
      DivFromOverall: boolean;
      TimeLimitFormulae: null;
      ResultScoring: number;
      UseBoatIW: boolean;
      EnableA9: null;
      HeatState: null;
      DayNo: null;
    }>;
    filename?: string;
  }) => {
    const response = await api.post('/api/files', {
      template_path: "orcsc/template.orcsc",
      event_data: {
        EventTitle: data.title,
        StartDate: data.startDate,
        EndDate: data.endDate,
        Venue: data.location,
        Organizer: data.organizer,
        Classes: data.classes.map(cls => ({
          __elem_name: "ClsRow",
          ClassId: cls.ClassId,
          ClassName: cls.ClassName,
          _class_enum: cls._class_enum,
          Discards: cls.Discards,
          DivFromOverall: cls.DivFromOverall,
          TimeLimitFormulae: cls.TimeLimitFormulae,
          ResultScoring: cls.ResultScoring,
          UseBoatIW: cls.UseBoatIW,
          EnableA9: cls.EnableA9,
          HeatState: cls.HeatState,
          DayNo: cls.DayNo
        }))
      },
      filename: data.filename
    });
    return response.data;
  },

  getFile: async (filePath: string): Promise<OrcscFile> => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    const response = await api.get(`/api/files/get/${encodeURIComponent(filePath)}`);
    return {
      ...response.data,
      filePath: filePath
    };
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
    const response = await api.post(`/api/files/${fileId}/boats`, {
      boats: boats.map(boat => ({
        YachtName: boat.yachtName,
        SailNo: boat.sailNo,
        ClassId: boat.classId
      }))
    });
    return response.data;
  },

  addBoatFromOrcJson: async (filePath: string, orcJson: object, classId?: string) => {
    const response = await api.post(`/api/files/${encodeURIComponent(filePath)}/boats/orcjson`, orcJson, {
      params: classId ? { class_id: classId } : undefined
    });
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
  },

  getFileHistory: async (filePath: string): Promise<BackupInfo[]> => {
    const response = await fetch(`${API_BASE_URL}/api/files/${filePath}/history`);
    if (!response.ok) {
      throw new Error(`Failed to get file history: ${response.statusText}`);
    }
    const data = await response.json();
    return data.backups;
  },

  restoreFromBackup: async (filePath: string, backupPath: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/files/${filePath}/history/restore`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ backup_path: backupPath }),
    });
    if (!response.ok) {
      throw new Error(`Failed to restore from backup: ${response.statusText}`);
    }
  },

  updateBoat: async (filePath: string, boat: { YID: string; classId: string; yachtName: string; sailNo?: string }) => {
    const response = await api.post(`/api/files/${encodeURIComponent(filePath)}/boats/update`, {
      YID: boat.YID || '',
      ClassId: boat.classId,
      YachtName: boat.yachtName,
      SailNo: boat.sailNo || ''
    });
    return response.data;
  }
}; 