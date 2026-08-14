import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ANALYTICS_PATH = path.join(process.cwd(), '../backend/src/analytics.json');

export async function GET() {
  try {
    if (!fs.existsSync(ANALYTICS_PATH)) {
      return NextResponse.json({
        total: 0,
        success: 0,
        failed: 0,
        successRate: 0,
        history: [],
      });
    }

    const data = fs.readFileSync(ANALYTICS_PATH, 'utf8');
    const history = JSON.parse(data);

    if (!Array.isArray(history)) {
      throw new Error('Analytics file does not contain an array.');
    }

    const total = history.length;
    const success = history.filter((c: any) => c.success).length;
    const failed = total - success;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return NextResponse.json({
      total,
      success,
      failed,
      successRate,
      history,
    });
  } catch (error) {
    console.error('Failed to read analytics:', error);
    return NextResponse.json({ error: 'Failed to read analytics' }, { status: 500 });
  }
}
