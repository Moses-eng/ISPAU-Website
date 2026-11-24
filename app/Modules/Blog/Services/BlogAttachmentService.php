<?php

namespace App\Modules\Blog\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;

class BlogAttachmentService
{
    /** Directory relative to <root>/public: images/blogs */
    private const BASE_DIR = 'images/blogs';

    /**
     * Store a cover image into public/images/blogs/{articleId}/image.{ext}
     *
     * @return string|null relative path (e.g. images/blogs/{id}/image.jpg) or null
     */
    public function store(string $articleId, UploadedFile $file): ?string
    {
        $relativeDir = self::BASE_DIR . '/' . $articleId;
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
            Log::warning('Blog image upload failed', [
                'article_id' => $articleId,
                'error'      => $e->getMessage(),
            ]);
            return null;
        }
    }

    public function deleteDirectory(string $articleId): void
    {
        try {
            $dirPath = public_path(self::BASE_DIR . '/' . $articleId);
            if (File::isDirectory($dirPath)) {
                File::deleteDirectory($dirPath);
            }
        } catch (\Throwable $e) {
            Log::warning('Blog directory cleanup failed', [
                'article_id' => $articleId,
                'error'      => $e->getMessage(),
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

