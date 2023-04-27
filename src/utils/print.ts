import chalk from 'chalk';

export const print = {
    error: (message: string) => console.log(chalk.red(`Error: ${message}`)),
    info: (message: string) => console.log(chalk.blue(message)),
    log: (message: string) => console.log(message),
    success:  (message: string) => console.log(chalk.green(message)),
    warn:  (message: string) => console.log(chalk.yellow(message)),
}