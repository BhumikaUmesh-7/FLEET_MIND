import { MessageType, PeerMessage } from '../../types';

export interface MessageBusConfig {
  simulatedLatencyMs: number;
  packetLossRate: number; // 0.0 - 1.0
  communicationRange: number; // Max distance in grid units (0 = infinite)
  networkPartitionActive: boolean;
}

export type MessageHandler = (message: PeerMessage) => void;

export class MessageBus {
  private handlers: Map<string, MessageHandler[]> = new Map();
  private messageHistory: PeerMessage[] = [];
  private maxHistory: number = 200;
  private config: MessageBusConfig = {
    simulatedLatencyMs: 15,
    packetLossRate: 0.0,
    communicationRange: 0, // infinite by default
    networkPartitionActive: false,
  };
  private nextMsgId = 1;

  public setConfig(partial: Partial<MessageBusConfig>) {
    this.config = { ...this.config, ...partial };
  }

  public getConfig(): MessageBusConfig {
    return { ...this.config };
  }

  public subscribe(robotId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(robotId)) {
      this.handlers.set(robotId, []);
    }
    this.handlers.get(robotId)!.push(handler);

    return () => {
      const list = this.handlers.get(robotId) || [];
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    };
  }

  public broadcast(
    fromRobotId: string,
    type: MessageType,
    payload: any,
    simTime: number,
    senderGroup: number = 1
  ): PeerMessage[] {
    const results: PeerMessage[] = [];
    for (const [targetId] of this.handlers.entries()) {
      if (targetId !== fromRobotId) {
        const msg = this.sendDirect(fromRobotId, targetId, type, payload, simTime, senderGroup);
        results.push(msg);
      }
    }
    return results;
  }

  public sendDirect(
    fromRobotId: string,
    toRobotId: string,
    type: MessageType,
    payload: any,
    simTime: number,
    senderGroup: number = 1,
    targetGroup: number = 1
  ): PeerMessage {
    const id = `msg-${this.nextMsgId++}`;
    const timestamp = Date.now();

    // Check network partition
    let status: 'DELIVERED' | 'DROPPED' | 'DELAYED' = 'DELIVERED';
    if (this.config.networkPartitionActive && senderGroup !== targetGroup) {
      status = 'DROPPED';
    } else if (Math.random() < this.config.packetLossRate) {
      status = 'DROPPED';
    } else if (this.config.simulatedLatencyMs > 50) {
      status = 'DELAYED';
    }

    const message: PeerMessage = {
      id,
      timestamp,
      simTime,
      fromRobotId,
      toRobotId,
      type,
      payload,
      latencyMs: this.config.simulatedLatencyMs,
      status,
    };

    // Store in history
    this.messageHistory.unshift(message);
    if (this.messageHistory.length > this.maxHistory) {
      this.messageHistory.pop();
    }

    // Deliver if not dropped
    if (status !== 'DROPPED') {
      const targetHandlers = this.handlers.get(toRobotId) || [];
      for (const handler of targetHandlers) {
        try {
          handler(message);
        } catch (e) {
          console.error(`Error in message handler for ${toRobotId}:`, e);
        }
      }
    }

    return message;
  }

  public getHistory(): PeerMessage[] {
    return [...this.messageHistory];
  }

  public clear() {
    this.messageHistory = [];
    this.handlers.clear();
  }
}
