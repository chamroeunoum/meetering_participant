export interface ParticipantCode {
  /** Unique code like "M1-SOKHA-7X9K2" */
  code: string
  /** Participant ID */
  participantId: number
  /** Meeting ID */
  meetingId: string
  /** Name for display */
  name: string
}

/**
 * Per-meeting participant codes.
 * Each participant gets a unique code for each meeting they're invited to.
 */
export const participantCodes: ParticipantCode[] = [
  // Meeting m1
  { code: 'M1-P01-A7K2', participantId: 1, meetingId: 'm1', name: 'ឯកឧត្តម ហ៊ីង ថូរ៉ាក់ស៊ី' },
  { code: 'M1-P02-B3F8', participantId: 2, meetingId: 'm1', name: 'ឯកឧត្តម ឆាយ រៀន' },
  { code: 'M1-P03-C9D1', participantId: 3, meetingId: 'm1', name: 'ឯកឧត្តម អេង ទូច' },
  { code: 'M1-P04-E5G7', participantId: 4, meetingId: 'm1', name: 'ឯកឧត្តមបណ្ឌិត ស៊ា ម៉ៅ' },
  // Meeting m2
  { code: 'M2-P01-H2J4', participantId: 1, meetingId: 'm2', name: 'ឯកឧត្តម ហ៊ីង ថូរ៉ាក់ស៊ី' },
  { code: 'M2-P05-K6L9', participantId: 5, meetingId: 'm2', name: 'ឯកឧត្តម លី ច័ន្ទតុលា' },
  { code: 'M2-P06-M8N3', participantId: 6, meetingId: 'm2', name: 'ឯកឧត្តម អ៊ឹង សេរីវិសុទ្ធ' },
  // Meeting m3
  { code: 'M3-P02-P1Q5', participantId: 2, meetingId: 'm3', name: 'ឯកឧត្តម ឆាយ រៀន' },
  { code: 'M3-P07-R7S2', participantId: 7, meetingId: 'm3', name: 'ឯកឧត្តម លីវ សុវណ្ណ' },
  { code: 'M3-P08-T4U8', participantId: 8, meetingId: 'm3', name: 'ឯកឧត្តម ឃីម រស្មីដា' },
]

export function lookupByCode(code: string): ParticipantCode | undefined {
  return participantCodes.find((p) => p.code === code.trim().toUpperCase())
}
