export type QueueJob = {
  type: "contact" | "apply" | "webhook";
  payload: Record<string, unknown>;
};

export interface JobQueue {
  enqueue(job: QueueJob): Promise<void>;
}

class NoopQueue implements JobQueue {
  async enqueue(job: QueueJob): Promise<void> {
    console.log("[queue:noop]", job.type, job.payload);
  }
}

let queue: JobQueue | null = null;

export function getQueue(): JobQueue {
  if (!queue) {
    queue = new NoopQueue();
  }
  return queue;
}

export function setQueue(next: JobQueue): void {
  queue = next;
}
