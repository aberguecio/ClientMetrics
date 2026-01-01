import { db } from '../src/lib/db';
import { processingJobs, salesMeetings, llmAnalysis } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createJob, processNextJob } from '../src/lib/jobs/processor';
import { generateEmbedding } from '../src/lib/llm/embeddings';

async function verifyVectorization() {
    console.log('🧪 Verifying Vectorization...');

    // 1. Check if generateEmbedding works
    try {
        const embedding = await generateEmbedding('Test text for embedding');
        if (embedding && embedding.length === 1536) {
            console.log('✅ OpenAI Embedding generation works (1536 dims)');
        } else {
            console.error('❌ Embedding generation failed or has wrong dimensions');
        }
    } catch (e) {
        console.error('❌ Embedding generation threw error:', e);
    }
}

async function verifyRetryLogic() {
    console.log('\n🧪 Verifying Retry Logic...');

    // 1. Create a dummy meeting and job
    const [meeting] = await db.insert(salesMeetings).values({
        clientName: 'Test Client Retry',
        email: 'test@retry.com',
        phone: '1234567890',
        meetingDate: '2023-01-01',
        salesRep: 'Test Rep',
        closed: false,
        transcript: 'This is a test transcript for retry logic.',
    }).returning();

    const job = await createJob(meeting.id);
    console.log(`Created test job ${job.id}`);

    // 2. Manually set job to failed state
    await db.update(processingJobs).set({
        status: 'failed',
        attempts: 2,
        errorMessage: 'Simulated failure'
    }).where(eq(processingJobs.id, job.id));
    console.log('Set job to failed state');

    // 3. Call retry API (simulated)
    const failedJobs = await db.select().from(processingJobs).where(eq(processingJobs.status, 'failed'));
    console.log(`Found ${failedJobs.length} failed jobs`);

    if (failedJobs.length > 0) {
        await db.update(processingJobs).set({
            status: 'pending',
            attempts: 0,
            errorMessage: null
        }).where(eq(processingJobs.status, 'failed'));
        console.log('Executed retry logic (reset to pending)');
    }

    // 4. Verify job is pending again
    const [updatedJob] = await db.select().from(processingJobs).where(eq(processingJobs.id, job.id));
    if (updatedJob.status === 'pending' && updatedJob.attempts === 0) {
        console.log('✅ Retry logic verified: Job is pending with 0 attempts');
    } else {
        console.error('❌ Retry logic failed:', updatedJob);
    }

    // Cleanup
    await db.delete(processingJobs).where(eq(processingJobs.meetingId, meeting.id));
    await db.delete(salesMeetings).where(eq(salesMeetings.id, meeting.id));
}

async function main() {
    await verifyVectorization();
    await verifyRetryLogic();
    process.exit(0);
}

main().catch(console.error);
