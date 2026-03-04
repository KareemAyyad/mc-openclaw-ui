import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        const [
            icpFound, sequencesSent, pqlDetected, investorUpdates,
            postsPublished, serpMovements, contentBriefs,
            costAlerts, competitorAlerts, invoicesProcessed,
            deployEvents, cronJobsRun, selfAssessments, promptsImproved
        ] = await Promise.all([
            prisma.telemetryEvent.count({ where: { eventType: 'ICP_FOUND' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'SEQUENCE_SENT' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'PQL_DETECTED' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'INVESTOR_UPDATE_SENT' } }),

            prisma.telemetryEvent.count({ where: { eventType: 'POST_PUBLISHED' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'SERP_MOVEMENT' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'CONTENT_BRIEF_RECEIVED' } }),

            prisma.telemetryEvent.count({ where: { eventType: 'COST_ALERT' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'COMPETITOR_ALERT' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'INVOICE_PROCESSED' } }),

            prisma.telemetryEvent.count({ where: { eventType: 'DEPLOY_EVENT' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'CRON_JOB_RUN' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'SELF_ASSESSMENT_SUBMITTED' } }),
            prisma.telemetryEvent.count({ where: { eventType: 'PROMPT_IMPROVEMENT' } })
        ]);

        const recentActivity = await prisma.telemetryEvent.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            select: { id: true, agentId: true, eventType: true, createdAt: true, payload: true }
        });

        return NextResponse.json({
            success: true,
            sales: { icpFound, sequencesSent, pqlDetected, investorUpdates, activeTrials: Math.floor(sequencesSent * 0.12) },
            marketing: { postsPublished, serpMovements, contentBriefs, engagementRate: '4.2%' },
            operations: { costAlerts, competitorAlerts, invoicesProcessed, activeThreats: competitorAlerts > 0 ? 1 : 0 },
            engineering: { deployEvents, cronJobsRun, selfAssessments, promptsImproved },
            recentActivity
        });

    } catch (error: any) {
        console.error('[Telemetry Stats Error]', error);

        // Graceful degradation
        return NextResponse.json({
            success: false,
            error: 'Database unreachable',
            sales: { icpFound: 0, sequencesSent: 0, activeTrials: 0, pqlDetected: 0, investorUpdates: 0 },
            marketing: { postsPublished: 0, serpMovements: 0, contentBriefs: 0, engagementRate: '0%' },
            operations: { costAlerts: 0, competitorAlerts: 0, invoicesProcessed: 0, activeThreats: 0 },
            engineering: { deployEvents: 0, cronJobsRun: 0, selfAssessments: 0, promptsImproved: 0 },
            recentActivity: []
        }, { status: 200 });
    }
}
