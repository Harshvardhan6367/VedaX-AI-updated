import fs from 'fs';
import winston from 'winston';

export function setup_logger(name) {
    const logger = winston.createLogger({
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss,SSS' }),
            winston.format.printf(({ timestamp, level, message }) => {
                return `${timestamp} - ${name} - ${level.toUpperCase()} - ${message}`;
            })
        ),
        transports: [
            new winston.transports.Console()
        ]
    });
    return logger;
}

export function ensure_directory(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
}

export function remove_stopwords(text) {
    const stop_words = new Set([
        "a", "an", "the", "and", "but", "or", "for", "nor", "on", "at", "to", "from", "by", "with", "of",
        "in", "out", "as", "if", "when", "while", "then", "than", "is", "are", "was", "were", "be", "been",
        "being", "have", "has", "had", "do", "does", "did", "can", "could", "will", "would", "shall", "should",
        "may", "might", "must", "it", "its", "this", "that", "these", "those", "i", "you", "he", "she", "we",
        "they", "me", "him", "her", "us", "them", "my", "your", "his", "their", "our", "mine", "yours", "hers",
        "theirs", "ours", "myself", "yourself", "himself", "herself", "itself", "ourselves", "themselves"
    ]);

    const words = text.split(/\s+/);
    const filtered_words = words.filter(word => !stop_words.has(word.toLowerCase()));
    return filtered_words.join(" ");
}
