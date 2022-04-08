import { yellow, green, red, bold, log } from '@deps'

const msgFormater = (log: log.LogRecord, msg: string) => {
  if (log.args.length != 0) {
    log.args.forEach(arg => {
      msg += `\n\t=> ${arg},`
    })
    msg = msg.slice(0, -1)
  }
  return msg.trim()
}

const fileFormatter = (log: log.LogRecord) => {
  const msg = `[${log.datetime.toJSON()}]:` + `[${log.levelName}]` + ` - ${log.msg}`
  return msgFormater(log, msg)
}

const consoleFormatter = (log: log.LogRecord) => {
  const msg = `${log.levelName} ${log.msg}`
  return msgFormater(log, msg)
}

class MyConsoleHandler extends log.handlers.BaseHandler {
  override format(logRecord: log.LogRecord): string {
    let msg = super.format(logRecord)
    switch (logRecord.level) {
      case log.LogLevels.INFO:
        msg = green(msg)
        break
      case log.LogLevels.WARNING:
        msg = yellow(msg)
        break
      case log.LogLevels.ERROR:
        msg = red(msg)
        break
      case log.LogLevels.CRITICAL:
        msg = bold(red(msg))
        break
      default:
        break
    }

    return msg
  }
  override log(msg: string): void {
    console.log(msg)
  }
}

class MyFileHandler extends log.handlers.FileHandler {
  override handle(logRecord: log.LogRecord) {
    if (this.level > logRecord.level) return
    const msg = this.format(logRecord)
    this.log(msg)
    this.flush()
  }
}

export const InitLogger = async (logMode: 'overwrite' | 'append' = 'append') => {
  const mode = logMode === 'overwrite' ? 'w' : 'a'
  log.info(`Initializing logger with mode ${mode}`)
  const handlers = {
    logFileHandler: new MyFileHandler('INFO', {
      formatter: fileFormatter,
      mode,
      filename: './logs/logs.log'
    }),
    logConsoleHandler: new MyConsoleHandler('DEBUG', {
      formatter: consoleFormatter
    })
  }
  await log.setup({
    handlers,
    loggers: {
      default: {
        level: 'DEBUG',
        handlers: ['logFileHandler', 'logConsoleHandler']
      }
    }
  })
}
