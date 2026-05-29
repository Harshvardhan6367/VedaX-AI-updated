import path from 'path';
import { setup_logger } from './utils.js';

const logger = setup_logger('IngestionManager');

export class IngestionManager {
    static loadFile(filePath) {
        const ext = path.extname(filePath).toLowerCase();
        
        if (['.jpg', '.jpeg', '.png'].includes(ext)) {
            return filePath;
        } else if (ext === '.pdf') {
            return filePath;
        } else {
            throw new Error(`Unsupported file type: ${ext}`);
        }
    }
}
