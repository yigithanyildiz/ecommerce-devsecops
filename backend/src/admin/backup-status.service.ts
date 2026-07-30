import { Injectable } from '@nestjs/common';
import { readdir, stat } from 'node:fs/promises';
import { join } from 'node:path';

type BackupFile = {
  fileName: string;
  sizeBytes: number;
  createdAt: string;
};

@Injectable()
export class BackupStatusService {
  async getStatus() {
    const backupDir = process.env.BACKUP_DIR ?? 'backups/prod';
    const retentionDays = Number(process.env.RETENTION_DAYS ?? 14);

    try {
      const entries = await readdir(backupDir);
      const backupFiles = await Promise.all(
        entries
          .filter((entry) => entry.endsWith('.sql'))
          .map(async (entry): Promise<BackupFile> => {
            const filePath = join(backupDir, entry);
            const fileStat = await stat(filePath);

            return {
              fileName: entry,
              sizeBytes: fileStat.size,
              createdAt: fileStat.mtime.toISOString(),
            };
          }),
      );
      const sortedBackups = backupFiles.sort(
        (first, second) =>
          new Date(second.createdAt).getTime() -
          new Date(first.createdAt).getTime(),
      );
      const latestBackup = sortedBackups[0] ?? null;

      return {
        available: true,
        backupDir,
        retentionDays: Number.isFinite(retentionDays) ? retentionDays : null,
        backupCount: sortedBackups.length,
        totalSizeBytes: sortedBackups.reduce(
          (total, backup) => total + backup.sizeBytes,
          0,
        ),
        latestBackup,
        recentBackups: sortedBackups.slice(0, 5),
      };
    } catch (error) {
      return {
        available: false,
        backupDir,
        reason:
          error instanceof Error
            ? error.message
            : 'Backup status could not be read',
      };
    }
  }
}
