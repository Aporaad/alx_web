import type { JobApplicationInput, JobApplicationSubmission } from '../contracts/jobApplication.contract';
import { portalGatewayConfig } from './portalGateway';

interface ApiResponse {
  success?: unknown;
  data?: unknown;
  error?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function submitJobApplication(input: JobApplicationInput): Promise<JobApplicationSubmission> {
  const { apiBaseUrl } = portalGatewayConfig();
  if (!apiBaseUrl) throw new Error('PORTAL_API_NOT_CONFIGURED');

  const response = await fetch(`${apiBaseUrl}/api/v1/portal/job-applications`, {
    method: 'POST',
    credentials: 'omit',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const error = isRecord(payload) && isRecord(payload.error) ? payload.error : null;
    throw new Error(typeof error?.message === 'string' ? error.message : 'JOB_APPLICATION_SUBMISSION_FAILED');
  }
  if (!isRecord(payload) || payload.success !== true || !isRecord(payload.data)
    || typeof payload.data.refCode !== 'string' || payload.data.refCode.length === 0) {
    throw new Error('PORTAL_API_INVALID_RESPONSE');
  }
  return { refCode: payload.data.refCode };
}
