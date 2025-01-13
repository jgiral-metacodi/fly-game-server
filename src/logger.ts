const colors = {
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  reset: "\x1b[0m",
};

export class Logger {
  //
  topic: string;
  color: string;

  constructor(topic) {
    this.topic = topic;
    // Generate a consistent color based on the topic string
    this.color = this.getColorForTopic(topic);
  }

  getColorForTopic(topic) {
    // Simple hash function to consistently map topics to colors
    const colorKeys = Object.keys(colors).filter((key) => key !== "reset");
    const hash = topic.split("").reduce((acc, char) => {
      return char.charCodeAt(0) + ((acc << 5) - acc);
    }, 0);
    return colors[colorKeys[Math.abs(hash) % colorKeys.length]];
  }

  getPrefix(level) {
    return `${this.color}[${this.topic}] ${colors.reset} `;
  }

  info(...args: any[]) {
    console.info(this.getPrefix("INFO"), ...args);
  }

  log(...args: any[]) {
    console.log(this.getPrefix("LOG"), ...args);
  }

  error(...args: any[]) {
    console.error(this.getPrefix("ERROR"), ...args);
  }

  warn(...args: any[]) {
    console.warn(this.getPrefix("WARN"), ...args);
  }
}
