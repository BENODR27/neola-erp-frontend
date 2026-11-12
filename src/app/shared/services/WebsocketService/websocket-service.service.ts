import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WebsocketServiceService {
  private ws!: WebSocket;
  private relaxWs?: WebSocket;
  private relaxReconnectTimer?: ReturnType<typeof setTimeout>;
  private relaxDisconnectRequested = false;
  public messages$ = new Subject<any>();
  public relaxConnection$ = new BehaviorSubject<'connecting' | 'connected' | 'disconnected'>('disconnected');

  connect() {
    const url = `wss://api.styx.classicfashion.com/api/inau`;
    this.ws = new WebSocket(url);

    this.ws.onmessage = (msg) => {
      const data = JSON.parse(msg.data);
      this.messages$.next(data);
    };
  }
  connectRelax() {
    this.relaxDisconnectRequested = false;
    if (
      this.relaxWs &&
      (this.relaxWs.readyState === WebSocket.CONNECTING ||
        this.relaxWs.readyState === WebSocket.OPEN)
    ) {
      return;
    }

    const url = new URL('/api/fr/', environment.FR_API_URL);
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:';
    this.relaxConnection$.next('connecting');
    const socket = new WebSocket(url.toString());
    this.relaxWs = socket;

    socket.onopen = () => {
      if (this.relaxWs === socket) {
        this.relaxConnection$.next('connected');
      }
    };
    socket.onclose = () => {
      if (this.relaxWs === socket) {
        this.relaxWs = undefined;
        this.relaxConnection$.next('disconnected');
        this.scheduleRelaxReconnect();
      }
    };
    socket.onerror = () => {
      if (this.relaxWs === socket) {
        this.relaxConnection$.next('disconnected');
      }
    };

    socket.onmessage = (msg) => {
      let data: any;
      try {
        data = JSON.parse(msg.data);
      } catch (error) {
        console.error('Unable to parse Fabric Relaxation WebSocket message:', error);
        return;
      }
      this.messages$.next(data);
    };
  }

  disconnectRelax(): void {
    this.relaxDisconnectRequested = true;
    if (this.relaxReconnectTimer) {
      clearTimeout(this.relaxReconnectTimer);
      this.relaxReconnectTimer = undefined;
    }
    if (this.relaxWs) {
      const socket = this.relaxWs;
      this.relaxWs = undefined;
      socket.close();
    }
    this.relaxConnection$.next('disconnected');
  }

  requestRelaxDashboardSnapshot(): boolean {
    if (!this.relaxWs || this.relaxWs.readyState !== WebSocket.OPEN) {
      return false;
    }

    this.relaxWs.send(
      JSON.stringify({ event: 'FabricRelaxationDashboardSnapshotRequest' }),
    );
    return true;
  }

  private scheduleRelaxReconnect(): void {
    if (this.relaxDisconnectRequested || this.relaxReconnectTimer) {
      return;
    }
    this.relaxReconnectTimer = setTimeout(() => {
      this.relaxReconnectTimer = undefined;
      this.connectRelax();
    }, 5000);
  }
}
