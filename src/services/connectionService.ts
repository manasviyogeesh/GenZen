import { ConnectionRecord } from '../types';
import { apiClient } from './apiClient';

const nowIso = (): string => new Date().toISOString();

export const connectionService = {
  async getConnections(studentId?: string): Promise<ConnectionRecord[]> {
    const query = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
    return apiClient.get<ConnectionRecord[]>(`/api/connections${query}`);
  },

  getConnectionStatusFromRecords(
    currentStudentId: string,
    otherStudentId: string,
    records: ConnectionRecord[]
  ): 'connect' | 'pass' | 'pending' | 'connected' | 'incoming_pending' {
    const record = records.find((item) => (
      (item.student_id === currentStudentId && item.connected_student_id === otherStudentId)
      || (item.student_id === otherStudentId && item.connected_student_id === currentStudentId)
    ));

    if (!record) {
      return 'connect';
    }

    if (record.status === 'connected') {
      return 'connected';
    }

    if (record.status === 'pending') {
      return record.requested_by === currentStudentId ? 'pending' : 'incoming_pending';
    }

    if (record.status === 'passed' && record.requested_by === currentStudentId) {
      return 'pass';
    }

    return 'connect';
  },

  async sendRequest(currentStudentId: string, targetStudentId: string): Promise<ConnectionRecord> {
    return apiClient.post<ConnectionRecord>('/api/connections', {
      student_id: currentStudentId,
      connected_student_id: targetStudentId,
      action: 'send'
    });
  },

  async acceptRequest(currentStudentId: string, fromStudentId: string): Promise<ConnectionRecord> {
    return apiClient.post<ConnectionRecord>('/api/connections', {
      student_id: currentStudentId,
      connected_student_id: fromStudentId,
      action: 'accept'
    });
  },

  async pass(currentStudentId: string, targetStudentId: string): Promise<ConnectionRecord> {
    return apiClient.post<ConnectionRecord>('/api/connections', {
      student_id: currentStudentId,
      connected_student_id: targetStudentId,
      action: 'pass'
    });
  },

  getConnectedStudentIds(studentId: string, connections: ConnectionRecord[]): string[] {
    return connections
      .filter((record) => record.status === 'connected' && (record.student_id === studentId || record.connected_student_id === studentId))
      .map((record) => (record.student_id === studentId ? record.connected_student_id : record.student_id));
  },

  getIncomingPendingStudentIds(studentId: string, connections: ConnectionRecord[]): string[] {
    return connections
      .filter((record) => record.status === 'pending' && record.connected_student_id === studentId)
      .map((record) => record.student_id);
  }
};
