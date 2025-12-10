type CommandHandler = () => void

export interface Command {
  id: string
  label: string
  handler: CommandHandler
}

export class CommandRegistry {
  private commands = new Map<string, Command>()

  register(command: Command) {
    this.commands.set(command.id, command)
  }

  unregister(id: string) {
    this.commands.delete(id)
  }

  execute(id: string) {
    const command = this.commands.get(id)
    if (command) {
      command.handler()
    }
  }

  list(): Command[] {
    return Array.from(this.commands.values())
  }
}
