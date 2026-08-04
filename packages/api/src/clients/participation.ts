import { apiFetch, type ApiConfig } from '../http';

export type ParticipationResponseType = 'comment' | 'support' | 'concern' | 'question';
export type ParticipationRelationship = 'resident' | 'business' | 'community' | 'organisation' | 'other';

export interface SubmitParticipationInput {
  momentId: string;
  name: string;
  contact: string;
  responseType: ParticipationResponseType;
  relationship: ParticipationRelationship;
  comment: string;
  popiaConsent: true;
}

export interface ParticipationResult {
  success: true;
  logId: string;
}

export function createPublicParticipationClient(config: ApiConfig) {
  return {
    async submit(input: SubmitParticipationInput): Promise<ParticipationResult> {
      return apiFetch<ParticipationResult>(config, '/participation', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    },
  };
}
