<?php

namespace App\Modules\Blog\Controllers;

use App\Http\Controllers\Controller;
use App\Modules\Blog\DTOs\BlogRequestData;
use App\Modules\Blog\Interfaces\BlogServiceInterface;
use App\Modules\Blog\Models\BlogArticleModel;
use App\Modules\Blog\Rules\BlogRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BlogController extends Controller
{
    public function __construct(
        private readonly BlogServiceInterface $service,
    ) {}

    // GET /api/v1/auth/admin/blog/list
    public function index(Request $request): JsonResponse
    {
        $response = $this->service->listAll($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // GET /api/v1/auth/admin/blog/show/{id}
    public function show(string $id): JsonResponse
    {
        $response = $this->service->show($id);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }

    // POST /api/v1/auth/admin/blog/store
    public function store(Request $request): JsonResponse
    {
        $request->validate(BlogRule::createRules());

        $response = $this->service->create(
            BlogRequestData::fromRequest($request, 'draft'),
            $request->file('image'),             // <-- optional UploadedFile
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 201 : 400
        );
    }

    // POST /api/v1/auth/admin/blog/update
    // Body must include: updateId
    public function update(Request $request): JsonResponse
    {
        $request->validate(['updateId' => 'required|uuid']);

        $article = BlogArticleModel::find($request->input('updateId'));
        if (! $article) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Article not found.',
                'data'    => ['article' => null],
                'errors'  => [],
            ], 404);
        }

        $request->validate(BlogRule::updateRules($article->id));

        $response = $this->service->update(
            $article,
            BlogRequestData::fromRequest($request),
            $request->file('image'),
        );

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    // DELETE /api/v1/auth/admin/blog/delete
    // Body must include: deleteId
    public function destroy(Request $request): JsonResponse
    {
        $request->validate(['deleteId' => 'required|uuid']);

        $article = BlogArticleModel::find($request->input('deleteId'));
        if (! $article) {
            return response()->json([
                'status'  => 'error',
                'message' => 'Article not found.',
                'data'    => ['article' => null],
                'errors'  => [],
            ], 404);
        }

        $response = $this->service->delete($article);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }
    public function publicIndex(Request $request): JsonResponse
    {
        $response = $this->service->listPublic($request->all());

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 400
        );
    }

    public function publicShow(string $slug): JsonResponse
    {
        $response = $this->service->showBySlug($slug);

        return response()->json(
            $response->toArray(),
            $response->isSuccess() ? 200 : 404
        );
    }
}
