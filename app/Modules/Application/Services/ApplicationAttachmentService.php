<?php

namespace App\Modules\Application\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class ApplicationAttachmentService
{
    /** Directory relative to Laravel root public folder: <root>/public/application */
    private const BASE_DIR = 'application';

    /**
     * Store uploaded application files directly into public/application/{applicationId}
     *
     * @param  string                                           $applicationId
     * @param  array<string, UploadedFile|array<UploadedFile>>  $uploads
     * @return array<string, string|array<string>>             map: uploadKey => path or list of paths
     */
    public function storeAll(string $applicationId, array $uploads): array
    {
        $stored = [];
        $relativeDir = self::BASE_DIR . '/' . $applicationId;
        $targetDir   = public_path($relativeDir);

        if (! File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0775, true, true);
        }

        foreach ($uploads as $key => $fileOrFiles) {
            if (empty($fileOrFiles)) {
                continue;
            }

            try {
                // Delete existing files matching this key before writing new ones
                $this->deleteMatchingFiles($targetDir, $key);

                if (is_array($fileOrFiles)) {
                    $storedList = [];
                    foreach ($fileOrFiles as $idx => $file) {
                        if (! $file instanceof UploadedFile) {
                            continue;
                        }

                        $ext = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'bin';
                        $safeOrig = Str::slug(pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME));
                        $filename = "{$key}_{$idx}_{$safeOrig}.{$ext}";

                        $file->move($targetDir, $filename);
                        $storedList[] = $relativeDir . '/' . $filename;
                    }

                    if (! empty($storedList)) {
                        $stored[$key] = count($storedList) === 1 ? $storedList[0] : $storedList;
                    }
                } elseif ($fileOrFiles instanceof UploadedFile) {
                    $ext = $fileOrFiles->getClientOriginalExtension() ?: $fileOrFiles->guessExtension() ?: 'bin';
                    $filename = "{$key}.{$ext}";

                    $fileOrFiles->move($targetDir, $filename);
                    $stored[$key] = $relativeDir . '/' . $filename;
                }
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

    private function deleteMatchingFiles(string $targetDir, string $key): void
    {
        $matches = glob($targetDir . '/' . $key . '.*');
        $matchesMulti = glob($targetDir . '/' . $key . '_*');
        $all = array_unique(array_merge($matches ?: [], $matchesMulti ?: []));

        foreach ($all as $match) {
            if (File::exists($match)) {
                File::delete($match);
            }
        }
    }
}
