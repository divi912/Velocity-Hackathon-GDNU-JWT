export interface SessionUser {
  id: string;
  role: string;
  email: string;
  name?: string;
}

export interface SessionRecord {
  userId: string;
  role: string;
  email: string;
  createdAt: number; // Unix seconds
  expiresAt: number; // Unix seconds
  lastAccessedAt: number; // Unix seconds
  ip?: string;
  userAgent?: string;
}

export interface SessionLookupResult {
  status: 'found' | 'expired' | 'not-found' | 'redis-unavailable';
  session?: SessionRecord;
  ttlRemaining?: number;
  reason?: string;
}

export interface SessionEventLog {
  id: string;
  time: string;
  action: string;
  detail: string;
}

export class SessionSimulator {
  private store = new Map<string, SessionRecord>();
  private simulatedTime: number; // Unix seconds
  private redisOnline = true;
  private logs: SessionEventLog[] = [];
  public defaultTtl = 1800; // 30 minutes in seconds

  constructor(initialTime?: number) {
    this.simulatedTime = initialTime ?? Math.floor(Date.now() / 1000);
  }

  public getNow(): number {
    return this.simulatedTime;
  }

  public setNow(now: number): void {
    this.simulatedTime = now;
  }

  public advanceTime(seconds: number): void {
    this.simulatedTime += seconds;
    this.addLog('CLOCK_ADVANCE', `Clock advanced by ${seconds}s (Current: ${new Date(this.simulatedTime * 1000).toISOString().slice(11, 19)})`);
  }

  public setRedisOnline(online: boolean): void {
    this.redisOnline = online;
    this.addLog('REDIS_STATE', online ? 'Redis server reconnected (Online)' : 'Redis server unreachable (Offline)');
  }

  public isRedisOnline(): boolean {
    return this.redisOnline;
  }

  public generateId(): string {
    const chars = '0123456789abcdef';
    let rand = '';
    for (let i = 0; i < 24; i++) {
      rand += chars[Math.floor(Math.random() * chars.length)];
    }
    return `session:${rand}`;
  }

  public formatCookie(sid: string, maxAge: number = this.defaultTtl): string {
    return `sid=${sid}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
  }

  public parseCookie(cookieString: string): string | null {
    const match = cookieString.match(/(?:^|;\s*)sid=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  public login(user: SessionUser, ttl: number = this.defaultTtl): { sid: string; cookie: string; record: SessionRecord } {
    const sid = this.generateId();
    const now = this.simulatedTime;
    const record: SessionRecord = {
      userId: user.id,
      role: user.role,
      email: user.email,
      createdAt: now,
      expiresAt: now + ttl,
      lastAccessedAt: now,
    };

    if (this.redisOnline) {
      this.store.set(sid, record);
    }

    const cookie = this.formatCookie(sid, ttl);
    this.addLog('POST /login', `Authenticated ${user.email} -> SET ${sid} (TTL ${Math.round(ttl / 60)}m)`);
    this.addLog('Set-Cookie', `Placed opaque ${sid} in HttpOnly cookie`);

    return { sid, cookie, record };
  }

  public getSession(sid: string, options?: { touch?: boolean; touchTtl?: number }): SessionLookupResult {
    if (!this.redisOnline) {
      this.addLog('GET /session', `GET ${sid} -> ERROR: Redis connection refused`);
      return { status: 'redis-unavailable', reason: 'Redis server is unavailable or connection timed out.' };
    }

    const record = this.store.get(sid);
    if (!record) {
      this.addLog('GET /session', `GET ${sid} -> NOT FOUND (Key does not exist)`);
      return { status: 'not-found', reason: 'Session ID not found in Redis store.' };
    }

    const now = this.simulatedTime;
    const ttlRemaining = record.expiresAt - now;

    if (ttlRemaining <= 0) {
      // Lazy eviction like real Redis
      this.store.delete(sid);
      this.addLog('GET /session', `GET ${sid} -> EXPIRED (TTL ${ttlRemaining}s <= 0). Key evicted.`);
      return { status: 'expired', ttlRemaining: 0, reason: 'Session expired and has been removed from Redis.' };
    }

    if (options?.touch) {
      const extension = options.touchTtl ?? this.defaultTtl;
      record.expiresAt = now + extension;
      record.lastAccessedAt = now;
      this.addLog('TOUCH_TTL', `Extended ${sid} TTL to +${Math.round(extension / 60)}m`);
    }

    this.addLog('GET /session', `GET ${sid} -> FOUND (User: ${record.userId}, Role: ${record.role}, TTL: ${Math.max(0, record.expiresAt - now)}s)`);

    return {
      status: 'found',
      session: { ...record },
      ttlRemaining: Math.max(0, record.expiresAt - now),
    };
  }

  public logout(sid: string): boolean {
    if (!this.redisOnline) {
      this.addLog('POST /logout', `DEL ${sid} -> ERROR: Redis unreachable`);
      return false;
    }
    const existed = this.store.delete(sid);
    this.addLog('POST /logout', existed ? `DEL ${sid} -> Success (Record destroyed immediately)` : `DEL ${sid} -> Key was not present`);
    return existed;
  }

  public getAllSessions(): Array<{ sid: string; record: SessionRecord; ttlRemaining: number }> {
    const now = this.simulatedTime;
    const list: Array<{ sid: string; record: SessionRecord; ttlRemaining: number }> = [];

    for (const [sid, record] of this.store.entries()) {
      const ttl = record.expiresAt - now;
      if (ttl > 0) {
        list.push({ sid, record: { ...record }, ttlRemaining: ttl });
      }
    }
    return list;
  }

  public clearAll(): void {
    this.store.clear();
    this.logs = [];
  }

  public getLogs(): SessionEventLog[] {
    return [...this.logs];
  }

  private addLog(action: string, detail: string): void {
    const d = new Date(this.simulatedTime * 1000);
    const timeStr = d.toISOString().slice(11, 19);
    this.logs.unshift({
      id: Math.random().toString(36).slice(2, 9),
      time: timeStr,
      action,
      detail,
    });
    if (this.logs.length > 50) this.logs.pop();
  }
}
