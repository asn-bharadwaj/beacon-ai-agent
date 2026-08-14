import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const ESCALATIONS_PATH = path.join(process.cwd(), '../backend/src/escalations.json');

export async function GET() {
  try {
    if (!fs.existsSync(ESCALATIONS_PATH)) {
      return NextResponse.json([]);
    }
    const data = fs.readFileSync(ESCALATIONS_PATH, 'utf8');
    const tickets = JSON.parse(data);
    return NextResponse.json(tickets);
  } catch (error) {
    console.error('Failed to read escalations:', error);
    return NextResponse.json({ error: 'Failed to read tickets' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { ticket_id, status } = await req.json();
    if (!ticket_id || !status) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }
    if (!fs.existsSync(ESCALATIONS_PATH)) {
      return NextResponse.json({ error: 'No tickets found' }, { status: 404 });
    }
    const data = fs.readFileSync(ESCALATIONS_PATH, 'utf8');
    const tickets = JSON.parse(data);

    const ticketIndex = tickets.findIndex((t: any) => t.ticket_id === ticket_id);
    if (ticketIndex === -1) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    tickets[ticketIndex].status = status;
    fs.writeFileSync(ESCALATIONS_PATH, JSON.stringify(tickets, null, 2), 'utf8');
    return NextResponse.json(tickets[ticketIndex]);
  } catch (error) {
    console.error('Failed to update ticket status:', error);
    return NextResponse.json({ error: 'Failed to update ticket' }, { status: 500 });
  }
}
