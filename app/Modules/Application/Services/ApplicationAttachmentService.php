<?php

namespace App\Modules\Application\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ApplicationAttachmentService
{
    /** Directory relative to Laravel root public folder: <root>/public/application */
    private const BASE_DIR = 'application';

    /**
     * Store uploaded application files directly into public/application/{applicationId}
     *
     * @param  string                       $applicationId
     * @param  array<string, UploadedFile>  $uploads
     * @return array<string, string>        map: uploadKey => relative path (e.g. application/{id}/registrationEvidence.pdf)
     */
    public function storeAll(string $applicationId, array $uploads): array
    {
        $stored = [];
        $relativeDir = self::BASE_DIR . '/' . $applicationId;
        $targetDir   = public_path($relativeDir);

        // Ensure the directory exists with proper write permissions
        if (! File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0775, true, true);
        }

        foreach ($uploads as $key => $file) {
            if (! $file instanceof UploadedFile) {
                continue;
            }

            try {
                $ext = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
                $filename = "{$key}.{$ext}";

                // Delete any existing file with this key before moving the new one
                $this->deleteMatchingFile($targetDir, $key);

                // Move file directly into public/application/{applicationId}/
                $file->move($targetDir, $filename);

                $stored[$key] = $relativeDir . '/' . $filename;
            } catch (\Throwable $e) {
                Log::warning('Application attachment upload failed', [
                    'application_id' => $applicationId,
                    'key'            => $key,
                    'error'          => $e->getMessage(),
                ]);
            }
        }

        return $stored;
    }

    /**
     * Delete the entire application directory and all its files in public/application/{applicationId}
     */
    public function deleteDirectory(string $applicationId): void
    {
        try {
            $dirPath = public_path(self::BASE_DIR . '/' . $applicationId);
            if (File::isDirectory($dirPath)) {
                File::deleteDirectory($dirPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Application attachment directory cleanup failed', [
                'application_id' => $applicationId,
                'error'          => $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete an individual attachment file by relative or full path
     */
    public function deleteFile(?string $path): void
    {
        if (! $path) return;

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $needle = '/' . self::BASE_DIR . '/';
            $pos = strpos($path, $needle);
            if ($pos === false) return;
            $relative = ltrim(substr($path, $pos), '/');
        } else {
            $relative = ltrim($path, '/');
        }

        $fullPath = public_path($relative);
        if (File::exists($fullPath)) {
            File::delete($fullPath);
        }
    }

    /**
     * Deletes any previous file matching key regardless of extension (e.g. key.pdf, key.png)
     */
    private function deleteMatchingFile(string $targetDir, string $key): void
    {
        $matches = glob($targetDir . '/' . $key . '.*');
        if (! empty($matches)) {
            foreach ($matches as $match) {
                if (File::exists($match)) {
                    File::delete($match);
                }
            }
        }
    }
}
