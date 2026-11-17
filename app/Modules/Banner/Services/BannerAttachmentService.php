<?php

namespace App\Modules\Banner\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class BannerAttachmentService
{
    /** Directory relative to Laravel root public folder: <root>/public/images/Banner */
    private const BASE_DIR = 'images/Banner';

    /**
     * Store a banner image into public/images/Banner/{bannerId}/
     *
     * @return string|null  relative path (e.g. images/Banner/{id}/image.jpg) or null on failure
     */
    public function store(string $bannerId, UploadedFile $file): ?string
    {
        $relativeDir = self::BASE_DIR . '/' . $bannerId;
        $targetDir   = public_path($relativeDir);

        if (! File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0775, true, true);
        }

        try {
            $ext      = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg';
            $filename = "image.{$ext}";

            // Remove any previous image (image.jpg, image.png, image.webp, …)
            $this->deleteMatchingFile($targetDir, 'image');

            $file->move($targetDir, $filename);

            return $relativeDir . '/' . $filename;
        } catch (\Throwable $e) {
            Log::warning('Banner image upload failed', [
                'banner_id' => $bannerId,
                'error'     => $e->getMessage(),
            ]);
            return null;
        }
    }

    /**
     * Delete the entire banner directory and all its files.
     */
    public function deleteDirectory(string $bannerId): void
    {
        try {
            $dirPath = public_path(self::BASE_DIR . '/' . $bannerId);
            if (File::isDirectory($dirPath)) {
                File::deleteDirectory($dirPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Banner directory cleanup failed', [
                'banner_id' => $bannerId,
                'error'     => $e->getMessage(),
            ]);
        }
    }

    /**
     * Delete a single image by relative or full path.
     */
    public function deleteFile(?string $path): void
    {
        if (! $path) return;

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            $needle = '/' . self::BASE_DIR . '/';
            $pos    = strpos($path, $needle);
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
     * Deletes any previous image with the same base name but different extension.
     */
    private function deleteMatchingFile(string $targetDir, string $baseName): void
    {
        $matches = glob($targetDir . '/' . $baseName . '.*');
        if (! empty($matches)) {
            foreach ($matches as $match) {
                if (File::exists($match)) {
                    File::delete($match);
                }
            }
        }
    }
}
