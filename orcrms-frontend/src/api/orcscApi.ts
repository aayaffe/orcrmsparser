import axios from 'axios';
import { FleetRow, OrcscFile } from '../types/orcsc';

const DEFAULT_API_BASE_URL = `${window.location.protocol}//${window.location.hostname}:8000`;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;

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
    timezoneOffsetSeconds?: number;
  }) => {
    const response = await api.post('/api/files', {
      template_path: "orcsc/templates/template.orcsc",
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
      filename: data.filename,
      timezone_offset_seconds: data.timezoneOffsetSeconds
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
    // Validate file type - only allow .orcsc files
    const allowedExtensions = ['.orcsc'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`);
    }

    // Validate file size (e.g., max 50MB)
    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum limit of 50MB.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  updateFileVersion: async (filePath: string, file: File): Promise<{ filename: string; path: string }> => {
    if (!filePath) {
      throw new Error('File path is required');
    }

    // Validate file type - only allow .orcsc files
    const allowedExtensions = ['.orcsc'];
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new Error(`Invalid file type. Only ${allowedExtensions.join(', ')} files are allowed.`);
    }

    // Validate file size (e.g., max 50MB)
    const maxFileSize = 50 * 1024 * 1024;
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds maximum limit of 50MB.`);
    }

    const formData = new FormData();
    formData.append('file', file);
    const normalizedPath = filePath.replace(/\\/g, '/');
    const response = await api.post(`/api/files/update?file_path=${encodeURIComponent(normalizedPath)}`, formData, {
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

  deleteFile: async (filePath: string): Promise<void> => {
    if (!filePath) {
      throw new Error('File path is required');
    }
    await api.delete(`/api/files/${encodeURIComponent(filePath)}`);
  },

  getTemplates: async (): Promise<string[]> => {
    const response = await api.get('/api/templates');
    return response.data;
  },

  createFromTemplate: async (templatePath: string, newFileName: string): Promise<void> => {
    // Sanitize filename - remove path traversal attempts and special characters
    const sanitizedFileName = newFileName.replace(/\.\./g, '').replace(/[\/\\]/g, '').trim();
    if (!sanitizedFileName) {
      throw new Error('Invalid filename provided.');
    }

    // Ensure the new file name has .orcsc extension
    const finalFileName = sanitizedFileName.endsWith('.orcsc') ? sanitizedFileName : sanitizedFileName + '.orcsc';

    // Validate template path - must not contain path traversal
    if (templatePath.includes('..') || templatePath.includes('\\')) {
      throw new Error('Invalid template path.');
    }

    // Construct the full path in the output directory
    const newFilePath = `orcsc/output/${finalFileName}`;

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
    if (!filePath) {
      throw new Error('File path is required');
    }
    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(filePath)}/history`);
    if (!response.ok) {
      throw new Error(`Failed to get file history: ${response.statusText}`);
    }
    const data = await response.json();
    return data.backups;
  },

  restoreFromBackup: async (filePath: string, backupPath: string): Promise<void> => {
    if (!filePath || !backupPath) {
      throw new Error('File path and backup path are required');
    }
    const response = await fetch(`${API_BASE_URL}/api/files/${encodeURIComponent(filePath)}/history/restore`, {
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
  },

  deleteClass: async (filePath: string, classId: string): Promise<void> => {
    if (!filePath || !classId) {
      throw new Error('File path and class ID are required');
    }
    const normalizedPath = filePath.replace(/\\/g, '/');
    await api.delete(`/api/classes?file_path=${encodeURIComponent(normalizedPath)}&class_id=${encodeURIComponent(classId)}`);
  },

  deleteRace: async (filePath: string, raceId: string): Promise<void> => {
    if (!filePath || !raceId) {
      throw new Error('File path and race ID are required');
    }
    const normalizedPath = filePath.replace(/\\/g, '/');
    await api.delete(`/api/races?file_path=${encodeURIComponent(normalizedPath)}&race_id=${encodeURIComponent(raceId)}`);
  },

  deleteBoat: async (filePath: string, boatId: string): Promise<void> => {
    if (!filePath || !boatId) {
      throw new Error('File path and boat ID are required');
    }
    const normalizedPath = filePath.replace(/\\/g, '/');
    await api.delete(`/api/boats?file_path=${encodeURIComponent(normalizedPath)}&boat_id=${encodeURIComponent(boatId)}`);
  }
}; 