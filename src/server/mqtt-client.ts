import { EventEmitter } from 'events';
import * as mqtt from 'mqtt';
import type {
  MqttClient as MQTT,
  IClientPublishOptions,
} from 'mqtt';
import type { MqttConfiguration } from 'server/config';

export interface ClientPublishOptions {
  qos?: 0 | 1 | 2;
  retain?: boolean;
  dup?: boolean;
  cbStorePut?: () => void;
}

export default class MqttClient extends EventEmitter {
  options: MqttConfiguration;

  client: MQTT | undefined;

  topicHandlers: { [topic: string]: Array<(message: string) => void> } = {};

  constructor(options: MqttConfiguration) {
    super();

    this.options = options;
  }

  handleMessage = (topic: string, payload: Buffer): void => {
    const handlers = this.topicHandlers[topic] || [];
    handlers.forEach((handler) => {
      handler(payload.toString());
    });
  };

  addTopicHandler(topic: string, handler: (message: string) => void): void {
    if (this.topicHandlers[topic]) {
      this.topicHandlers[topic].push(handler);
    } else {
      this.topicHandlers[topic] = [handler];
    }
  }

  removeTopicHandler(topic: string, handler: (message: string) => void): void {
    const handlers = this.topicHandlers[topic];
    if (handlers) {
      this.topicHandlers[topic] = handlers.filter((h) => h !== handler);
    }
  }

  connect(): Promise<void> {
    const {
      broker,
      username,
      password,
    } = this.options;

    return new Promise((resolve) => {
      this.client = mqtt.connect(broker, {
        username,
        password,
      });

      this.client.on('connect', () => {
        resolve();
      });

      this.client.on('message', this.handleMessage);
    });
  }

  disconnect(): void {
    if (!this.client) {
      throw new Error('Unexpected code reached');
    }
    this.client.end();
  }

  publish(topic: string, payload: string | Buffer, options: ClientPublishOptions = {}): Promise<void> {
    const opts: IClientPublishOptions = {
      qos: 0,
      retain: false,
      ...options,
    };

    return new Promise((resolve) => {
      if (!this.client || this.client.reconnecting) {
        resolve();
        return;
      }

      this.client.publish(topic, payload, opts, () => {
        resolve();
      });
    });
  }

  subscribe(topic: string, handler: (message: string) => void): () => void {
    if (!this.client) {
      throw new Error('Unexpected code reached');
    }
    this.addTopicHandler(topic, handler);
    this.client.subscribe(topic);
    return (): void => {
      this.removeTopicHandler(topic, handler);
    };
  }
}
