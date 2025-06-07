export class PomodoroTimer {
  private timeLeft: number;
  private isRunning: boolean;
  private mode: 'focus' | 'break';
  private interval: NodeJS.Timeout | null = null;
  private onTick?: (timeLeft: number) => void;
  private onComplete?: (mode: 'focus' | 'break') => void;

  constructor(
    private focusDuration: number = 1500, // 25 minutes
    private breakDuration: number = 300    // 5 minutes
  ) {
    this.timeLeft = focusDuration;
    this.isRunning = false;
    this.mode = 'focus';
  }

  start(onTick?: (timeLeft: number) => void, onComplete?: (mode: 'focus' | 'break') => void) {
    if (this.isRunning) return;
    
    this.onTick = onTick;
    this.onComplete = onComplete;
    this.isRunning = true;
    
    this.interval = setInterval(() => {
      this.timeLeft--;
      this.onTick?.(this.timeLeft);
      
      if (this.timeLeft <= 0) {
        this.complete();
      }
    }, 1000);
  }

  pause() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  reset() {
    this.pause();
    this.timeLeft = this.mode === 'focus' ? this.focusDuration : this.breakDuration;
  }

  switchMode(mode: 'focus' | 'break') {
    this.pause();
    this.mode = mode;
    this.timeLeft = mode === 'focus' ? this.focusDuration : this.breakDuration;
  }

  private complete() {
    this.pause();
    this.onComplete?.(this.mode);
    
    // Auto-switch to opposite mode
    const newMode = this.mode === 'focus' ? 'break' : 'focus';
    this.switchMode(newMode);
  }

  getTimeLeft() {
    return this.timeLeft;
  }

  getMode() {
    return this.mode;
  }

  getIsRunning() {
    return this.isRunning;
  }

  updateDurations(focusDuration: number, breakDuration: number) {
    this.focusDuration = focusDuration;
    this.breakDuration = breakDuration;
    
    if (!this.isRunning) {
      this.timeLeft = this.mode === 'focus' ? focusDuration : breakDuration;
    }
  }

  static formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}
