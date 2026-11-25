<?php

namespace App\Modules\Activity\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class ActivityAttachmentService
{
    private const BASE_DIR = 'images/activities';

    public function store(string $activityId, UploadedFile $file): ?string
    {
        $relativeDir = self::BASE_DIR . '/' . $activityId;
        $targetDir   = public_path($relativeDir);

        if (! File::isDirectory($targetDir)) {
            File::makeDirectory($targetDir, 0775, true, true);
        }

        try {
            $ext      = $file->getClientOriginalExtension() ?: $file->guessExtension() ?: 'jpg';
            $filename = "image.{$ext}";

            $this->deleteMatchingFile($targetDir, 'image');

            $file->move($targetDir, $filename);

            return $relativeDir . '/' . $filename;
        } catch (\Throwable $e) {
            Log::warning('Activity image upload failed', [
                'activity_id' => $activityId,
                'error'       => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function deleteDirectory(string $activityId): void
    {
        try {
            $dirPath = public_path(self::BASE_DIR . '/' . $activityId);
            if (File::isDirectory($dirPath)) {
                File::deleteDirectory($dirPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Activity directory cleanup failed', [
                'activity_id' => $activityId,
                'error'       => $e->getMessage(),
            ]);
        }
    }

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
