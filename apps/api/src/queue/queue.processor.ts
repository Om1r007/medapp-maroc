import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
import { CONSULTATION_TIMEOUT_QUEUE, QueueService } from "./queue.service";

@Processor(CONSULTATION_TIMEOUT_QUEUE)
export class QueueProcessor extends WorkerHost {
  private readonly logger = new Logger(QueueProcessor.name);

  constructor(private readonly queueService: QueueService) {
    super();
  }

  async process(job: Job<{ consultationId: string }>): Promise<void> {
    const { consultationId } = job.data;
    this.logger.log(`Timeout job fired for consultation ${consultationId}`);
    await this.queueService.refundAndClose(consultationId);
  }
}
