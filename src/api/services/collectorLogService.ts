import { axiosInstance } from '../config/axiosConfig';
import { API_ENDPOINTS } from '../config/apiEndpoints';
import type { ApiResponse } from '../types/common.types';
import type { CreateCollectorLogRequest } from '../types/collectorLog.types';

export const collectorLogService = {
  create: async (body: CreateCollectorLogRequest): Promise<void> => {
    await axiosInstance.post<ApiResponse<unknown>>(API_ENDPOINTS.COLLECTOR_LOGS, body);
  },
};
