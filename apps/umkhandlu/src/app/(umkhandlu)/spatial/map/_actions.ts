'use server';

import { buildAreaReport } from '@/lib/gis/area-report';
import type { AreaReport, AreaType } from '@/lib/gis/area-report';

export async function fetchAreaReportAction(
  areaName: string,
  areaType: AreaType,
): Promise<AreaReport> {
  return buildAreaReport(areaName, areaType);
}
